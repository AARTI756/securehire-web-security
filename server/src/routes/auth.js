const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { validateBody, registerSchema, loginSchema } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const { logSecurityEvent } = require('../utils/audit');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Register a new user
router.post('/register', authLimiter, validateBody(registerSchema), async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      await logSecurityEvent(null, `REGISTRATION_ATTEMPT_DUPLICATE_EMAIL: ${email}`, req.ip);
      // Return 400 Bad Request to indicate user exists
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash the password with bcrypt (strength factor 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user to the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });

    await logSecurityEvent(newUser.id, 'USER_REGISTRATION_SUCCESS', req.ip);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Use generic error for security to prevent user enumeration
    const invalidCredentialsResponse = () => {
      return res.status(401).json({ error: 'Invalid email or password' });
    };

    if (!user) {
      await logSecurityEvent(null, `LOGIN_FAILED_USER_NOT_FOUND: ${email}`, req.ip);
      return invalidCredentialsResponse();
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      await logSecurityEvent(user.id, 'LOGIN_FAILED_WRONG_PASSWORD', req.ip);
      return invalidCredentialsResponse();
    }

    // Generate JWT token containing the user identity (never trust role/id sent from client)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    await logSecurityEvent(user.id, 'LOGIN_SUCCESS', req.ip);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get current user profile details
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Logout (logs the event and returns success; client discards token)
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    await logSecurityEvent(req.user.id, 'USER_LOGOUT', req.ip);
    res.json({ message: 'Logout successful' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
