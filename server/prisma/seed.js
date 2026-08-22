const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database entries...');
  await prisma.auditLog.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Hashing passwords...');
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
  const recruiterPasswordHash = await bcrypt.hash('Recruiter123!', saltRounds);
  const candidatePasswordHash = await bcrypt.hash('Candidate123!', saltRounds);

  console.log('Creating demo users...');
  
  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // 2. Recruiter
  const recruiter = await prisma.user.create({
    data: {
      name: 'Jane Doe (Hiring Manager)',
      email: 'recruiter@example.com',
      passwordHash: recruiterPasswordHash,
      role: 'RECRUITER',
    },
  });
  console.log('Recruiter user created:', recruiter.email);

  // 3. Candidate
  const candidate = await prisma.user.create({
    data: {
      name: 'John Smith',
      email: 'candidate@example.com',
      passwordHash: candidatePasswordHash,
      role: 'CANDIDATE',
    },
  });
  console.log('Candidate user created:', candidate.email);

  // 4. Recruiter 2 (for multi-user testing)
  const recruiter2 = await prisma.user.create({
    data: {
      name: 'Bob Johnson (Tech Recruiter)',
      email: 'recruiter2@example.com',
      passwordHash: recruiterPasswordHash,
      role: 'RECRUITER',
    },
  });
  console.log('Second Recruiter user created:', recruiter2.email);

  console.log('Creating jobs...');
  // Job 1 created by recruiter 1
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior Software Engineer (Secure Systems)',
      company: 'SecureHire Corp',
      description: 'We are seeking a senior engineer to design and construct secure microservices. Experience with Node.js, OWASP Top 10, and cryptography is required.',
      location: 'Remote (US/Canada)',
      salary: 135000,
      recruiterId: recruiter.id,
    },
  });

  // Job 2 created by recruiter 1
  const job2 = await prisma.job.create({
    data: {
      title: 'Security Analyst / Incident Responder',
      company: 'Defensive Tech Solutions',
      description: 'Monitor, analyze, and mitigate security threats across our infrastructure. Experience with SIEM tools, networking, and vulnerability scanning is a major plus.',
      location: 'New York, NY',
      salary: 110000,
      recruiterId: recruiter.id,
    },
  });

  // Job 3 created by recruiter 2
  const job3 = await prisma.job.create({
    data: {
      title: 'DevSecOps Architect',
      company: 'CloudArmor Inc',
      description: 'Build CI/CD pipelines incorporating automated security tests, SAST/DAST tools, and container vulnerability scanning.',
      location: 'San Francisco, CA',
      salary: 160000,
      recruiterId: recruiter2.id,
    },
  });
  console.log('Jobs created.');

  console.log('Creating applications...');
  const app1 = await prisma.application.create({
    data: {
      jobId: job1.id,
      candidateId: candidate.id,
      resumeText: 'Experienced full stack software engineer with 5+ years of building secure web applications. Proficient in Node.js, React, and PostgreSQL.',
      status: 'PENDING',
    },
  });

  const app2 = await prisma.application.create({
    data: {
      jobId: job2.id,
      candidateId: candidate.id,
      resumeText: 'Certified Security Analyst (CompTIA Security+). Strong foundations in threat detection and web app vulnerability assessment.',
      status: 'ACCEPTED',
    },
  });
  console.log('Applications created.');

  console.log('Creating initial audit logs...');
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'ADMIN_SEEDED_SYSTEM', ipAddress: '127.0.0.1' },
      { userId: recruiter.id, action: 'RECRUITER_SEEDED_PROFILE', ipAddress: '127.0.0.1' },
      { userId: candidate.id, action: 'CANDIDATE_SEEDED_PROFILE', ipAddress: '127.0.0.1' },
    ],
  });
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
