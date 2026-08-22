const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody, applicationSchema, applicationStatusSchema } = require('../middleware/validate');
const { logSecurityEvent } = require('../utils/audit');

const router = express.Router();

// POST /api/applications - Apply for a job (CANDIDATE only)
router.post('/', authenticateToken, requireRole('CANDIDATE'), validateBody(applicationSchema), async (req, res, next) => {
  const { jobId, resumeText } = req.body;
  const candidateId = req.user.id;

  try {
    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    // Check if application already exists (prevent duplicate applications)
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId
        }
      }
    });

    if (existingApplication) {
      await logSecurityEvent(candidateId, `DUPLICATE_APPLICATION_ATTEMPT: Job ID ${jobId}`, req.ip);
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Create the application
    const newApplication = await prisma.application.create({
      data: {
        jobId,
        candidateId,
        resumeText,
        status: 'PENDING'
      }
    });

    await logSecurityEvent(candidateId, `APPLICATION_SUBMITTED: App ID ${newApplication.id} for Job ID ${jobId}`, req.ip);

    res.status(201).json(newApplication);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/my - View own applications (CANDIDATE only)
router.get('/my', authenticateToken, requireRole('CANDIDATE'), async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: { candidateId: req.user.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true
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

// GET /api/applications/:id - View application details (Protected, ownership checks required)
router.get('/:id', authenticateToken, async (req, res, next) => {
  const applicationId = parseInt(req.params.id, 10);

  if (isNaN(applicationId)) {
    return res.status(400).json({ error: 'Invalid Application ID format' });
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Role-based access control and IDOR checks
    const { role, id: userId } = req.user;

    if (role === 'CANDIDATE') {
      // Candidates can only view their own applications
      if (application.candidateId !== userId) {
        await logSecurityEvent(
          userId,
          `UNAUTHORIZED_APPLICATION_VIEW_ATTEMPT: Candidate tried to access application ID ${applicationId} (owned by user ${application.candidateId})`,
          req.ip
        );
        return res.status(403).json({ error: 'Access denied: You do not own this application' });
      }
    } else if (role === 'RECRUITER') {
      // Recruiters can only view applications for jobs they posted
      if (application.job.recruiterId !== userId) {
        await logSecurityEvent(
          userId,
          `UNAUTHORIZED_APPLICATION_VIEW_ATTEMPT: Recruiter tried to access application ID ${applicationId} for job ID ${application.job.id} (posted by recruiter ${application.job.recruiterId})`,
          req.ip
        );
        return res.status(403).json({ error: 'Access denied: You did not post this job opening' });
      }
    } else if (role !== 'ADMIN') {
      // Any other role (just in case)
      return res.status(403).json({ error: 'Access denied: Unauthorized role' });
    }

    // If it reaches here, the user is authorized (Admin, matching Candidate, or matching Recruiter)
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// PUT /api/applications/:id/status - Update application status (RECRUITER only, ownership check required)
router.put('/:id/status', authenticateToken, requireRole('RECRUITER'), validateBody(applicationStatusSchema), async (req, res, next) => {
  const applicationId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(applicationId)) {
    return res.status(400).json({ error: 'Invalid Application ID format' });
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify ownership: Recruiter must have posted the job associated with this application
    if (application.job.recruiterId !== req.user.id) {
      await logSecurityEvent(
        req.user.id,
        `UNAUTHORIZED_STATUS_UPDATE_ATTEMPT: Recruiter tried to update status on app ID ${applicationId} for job ID ${application.job.id} (posted by recruiter ${application.job.recruiterId})`,
        req.ip
      );
      return res.status(403).json({ error: 'Access denied: You do not own the job posting for this application' });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        job: true,
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await logSecurityEvent(
      req.user.id,
      `APPLICATION_STATUS_UPDATED: App ID ${applicationId} set to ${status}`,
      req.ip
    );

    res.json(updatedApplication);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
