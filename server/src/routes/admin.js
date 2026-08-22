const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Enforce admin role globally for this router
router.use(authenticateToken, requireRole('ADMIN'));

// GET /api/admin/users - Get all registered users (passwords excluded)
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/jobs - Get all job listings
router.get('/jobs', async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/applications - Get all job applications
router.get('/applications', async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/logs - Get all security audit logs
router.get('/logs', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
