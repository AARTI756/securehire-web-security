const { logSecurityEvent } = require('../utils/audit');

/**
 * Centralized error handler middleware.
 * Prevents stack traces, database queries, and internal system paths from leaking to users.
 */
async function errorHandler(err, req, res, next) {
  // Log full error internally for developer inspection
  console.error('[SERVER ERROR]:', err);

  const ip = req.ip || 'unknown';
  const userId = req.user ? req.user.id : null;

  // Audit log the error event
  await logSecurityEvent(
    userId,
    `SERVER_ERROR_OCCURRED_${err.name || 'UNKNOWN_ERROR'}: ${err.message || 'No message'}`,
    ip
  );

  // Return a generic, safe error message to the client
  res.status(500).json({
    error: 'An unexpected error occurred. Please try again later.'
  });
}

module.exports = errorHandler;
