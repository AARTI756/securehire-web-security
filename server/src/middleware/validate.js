const { z } = require('zod');
const { logSecurityEvent } = require('../utils/audit');

/**
 * Validates request body using a Zod schema.
 * Returns structured 400 Bad Request if validation fails.
 */
function validateBody(schema) {
  return async (req, res, next) => {
    try {
      // Parse and strip unknown properties to prevent parameter pollution/mass assignment
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Collect validation issues
        const errors = err.errors.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        // Audit log failed input validation
        await logSecurityEvent(
          req.user ? req.user.id : null,
          `INPUT_VALIDATION_FAILURE_${req.originalUrl}`,
          req.ip
        );

        return res.status(400).json({
          error: 'Input validation failed',
          details: errors
        });
      }
      next(err);
    }
  };
}

// ----------------- ZOD SCHEMAS -----------------

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters').trim(),
  email: z.string().email('Invalid email address').max(150, 'Email must not exceed 150 characters').toLowerCase().trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['CANDIDATE', 'RECRUITER'], {
    errorMap: () => ({ message: 'Role must be either CANDIDATE or RECRUITER' })
  })
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must not exceed 100 characters').trim(),
  company: z.string().min(2, 'Company must be at least 2 characters').max(100, 'Company must not exceed 100 characters').trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must not exceed 2000 characters').trim(),
  location: z.string().min(2, 'Location must be at least 2 characters').max(100, 'Location must not exceed 100 characters').trim(),
  // Support numeric salary. If it comes as a string, coerce it.
  salary: z.coerce.number().positive('Salary must be a positive number').max(10000000, 'Salary must be reasonable')
});

const applicationSchema = z.object({
  jobId: z.coerce.number().int().positive('Invalid Job ID'),
  resumeText: z.string().min(20, 'Resume text must be at least 20 characters').max(5000, 'Resume text must not exceed 5000 characters').trim()
});

const applicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be PENDING, ACCEPTED, or REJECTED' })
  })
});

module.exports = {
  validateBody,
  registerSchema,
  loginSchema,
  jobSchema,
  applicationSchema,
  applicationStatusSchema
};
