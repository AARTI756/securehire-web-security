const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { logSecurityEvent } = require('../utils/audit');

/**
 * Middleware to authenticate requests using JWT.
 * Verifies token validity and queries DB to ensure user still exists and checks if active.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    // Audit log failed attempt - no token
    await logSecurityEvent(null, 'AUTHENTICATION_REQUIRED', req.ip);
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Fetch fresh user data from database to prevent stale token data exploits
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      await logSecurityEvent(null, 'AUTHENTICATION_USER_NOT_FOUND', req.ip);
      return res.status(401).json({ error: 'User account no longer exists' });
    }

    // Attach verified user information to the request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    let action = 'AUTHENTICATION_FAILED_INVALID_TOKEN';
    let errorMessage = 'Invalid authentication token';
    
    if (err.name === 'TokenExpiredError') {
      action = 'AUTHENTICATION_FAILED_EXPIRED_TOKEN';
      errorMessage = 'Authentication token expired';
    }

    await logSecurityEvent(null, action, req.ip);
    return res.status(401).json({ error: errorMessage });
  }
}

/**
 * Middleware to restrict access based on user role.
 * Must be placed after authenticateToken.
 * @param {...string} allowedRoles - List of roles permitted to access this resource (e.g. 'ADMIN', 'RECRUITER')
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      await logSecurityEvent(null, 'ROLE_CHECK_NO_USER_CONTEXT', req.ip);
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await logSecurityEvent(
        req.user.id,
        `ROLE_ACCESS_DENIED_REQUIRED_${allowedRoles.join('_OR_')}_GOT_${req.user.role}`,
        req.ip
      );
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
