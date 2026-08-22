const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody, jobSchema } = require('../middleware/validate');
const { logSecurityEvent } = require('../utils/audit');

const router = express.Router();

// GET /api/jobs - Publicly accessible job listings with safe search parameter
router.get('/', async (req, res, next) => {
  const { search } = req.query;

  try {
    let whereClause = {};

    if (search) {
      // Prisma uses parameterized queries automatically, protecting against SQL injection.
      whereClause = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id - Publicly check a single job's details
router.get('/:id', async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);

  if (isNaN(jobId)) {
    return res.status(400).json({ error: 'Invalid Job ID format' });
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs - Create a new job posting (RECRUITER only)
router.post('/', authenticateToken, requireRole('RECRUITER'), validateBody(jobSchema), async (req, res, next) => {
  const { title, company, description, location, salary } = req.body;

  try {
    const newJob = await prisma.job.create({
      data: {
        title,
        company,
        description,
        location,
        salary: parseFloat(salary),
        recruiterId: req.user.id // Taken securely from authenticated token, not from user-submitted request body
      }
    });

    await logSecurityEvent(req.user.id, `JOB_CREATION_SUCCESS: ID ${newJob.id}`, req.ip);

    res.status(201).json(newJob);
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id - Edit an existing job posting (RECRUITER only, ownership check required)
router.put('/:id', authenticateToken, requireRole('RECRUITER'), validateBody(jobSchema), async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);
  const { title, company, description, location, salary } = req.body;

  if (isNaN(jobId)) {
    return res.status(400).json({ error: 'Invalid Job ID format' });
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Ownership verification - Prevent IDOR / parameter tampering
    if (job.recruiterId !== req.user.id) {
      await logSecurityEvent(
        req.user.id,
        `UNAUTHORIZED_JOB_EDIT_ATTEMPT: Tried to edit job ${jobId} owned by recruiter ${job.recruiterId}`,
        req.ip
      );
      return res.status(403).json({ error: 'Access denied: You do not own this job posting' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        company,
        description,
        location,
        salary: parseFloat(salary)
      }
    });

    await logSecurityEvent(req.user.id, `JOB_UPDATE_SUCCESS: ID ${jobId}`, req.ip);

    res.json(updatedJob);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id - Delete a job posting (RECRUITER only, ownership check required)
router.delete('/:id', authenticateToken, requireRole('RECRUITER'), async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);

  if (isNaN(jobId)) {
    return res.status(400).json({ error: 'Invalid Job ID format' });
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Ownership verification - Prevent IDOR / parameter tampering
    if (job.recruiterId !== req.user.id) {
      await logSecurityEvent(
        req.user.id,
        `UNAUTHORIZED_JOB_DELETE_ATTEMPT: Tried to delete job ${jobId} owned by recruiter ${job.recruiterId}`,
        req.ip
      );
      return res.status(403).json({ error: 'Access denied: You do not own this job posting' });
    }

    await prisma.job.delete({
      where: { id: jobId }
    });

    await logSecurityEvent(req.user.id, `JOB_DELETION_SUCCESS: ID ${jobId}`, req.ip);

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
