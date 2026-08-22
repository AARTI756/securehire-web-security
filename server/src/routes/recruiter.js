const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/recruiter/applicants - View all applicants for jobs posted by this recruiter (RECRUITER only)
router.get('/applicants', authenticateToken, requireRole('RECRUITER'), async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: {
        job: {
          recruiterId: req.user.id // Enforced from backend token session
        }
      },
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
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
