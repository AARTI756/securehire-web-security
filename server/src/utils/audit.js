const prisma = require('../db');

/**
 * Logs a security-relevant event to the database AuditLog table.
 * @param {number|null} userId - ID of the user performing the action, or null if unauthenticated.
 * @param {string} action - Description of the action (e.g. USER_LOGIN_SUCCESS, ACCESS_DENIED_IDOR).
 * @param {string} ipAddress - Client IP address.
 */
async function logSecurityEvent(userId, action, ipAddress) {
  try {
    const ip = ipAddress || 'unknown';
    // Ensure userId is integer or null
    const cleanedUserId = userId ? parseInt(userId, 10) : null;
    
    await prisma.auditLog.create({
      data: {
        userId: cleanedUserId,
        action,
        ipAddress: ip
      }
    });
    console.log(`[AUDIT LOG] User: ${cleanedUserId || 'Guest'} | Action: ${action} | IP: ${ip}`);
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logSecurityEvent };
