const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Automated Security Verification Tests...\n');
  let passedCount = 0;
  let failedCount = 0;

  function printResult(testName, success, message = '') {
    if (success) {
      console.log(`✅ PASSED: ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ FAILED: ${testName} - ${message}`);
      failedCount++;
    }
  }

  // Generate random emails for test runs to avoid unique constraint conflicts
  const randomId = Math.floor(Math.random() * 100000);
  const candEmail = `cand_${randomId}@test.com`;
  const recEmail = `rec_${randomId}@test.com`;
  const rec2Email = `rec2_${randomId}@test.com`;

  let candToken, recToken, rec2Token, adminToken;
  let candUserId, recUserId, rec2UserId;
  let createdJobId;
  let createdAppId;

  // --- TEST 1: INPUT VALIDATION & REGISTRATION ---
  try {
    // 1a. Attempt registering with weak password
    const resWeak = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass',
        email: candEmail,
        password: '123',
        role: 'CANDIDATE'
      })
    });
    const dataWeak = await resWeak.json();
    assert.strictEqual(resWeak.status, 400);
    assert.strictEqual(dataWeak.error, 'Input validation failed');
    printResult('Input Validation - Reject Weak Password', true);
  } catch (err) {
    printResult('Input Validation - Reject Weak Password', false, err.message);
  }

  try {
    // 1b. Attempt registering with invalid email
    const resMail = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Mail',
        email: 'invalid-email',
        password: 'Password123!',
        role: 'CANDIDATE'
      })
    });
    assert.strictEqual(resMail.status, 400);
    printResult('Input Validation - Reject Malformed Email', true);
  } catch (err) {
    printResult('Input Validation - Reject Malformed Email', false, err.message);
  }

  // --- TEST 2: PARAMETER TAMPERING (ROLE ESCALATION) ---
  try {
    const resEsc = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker',
        email: `hacker_${randomId}@test.com`,
        password: 'Password123!',
        role: 'ADMIN' // Tampered role
      })
    });
    assert.strictEqual(resEsc.status, 400);
    const dataEsc = await resEsc.json();
    assert.ok(JSON.stringify(dataEsc).includes('Role must be either'));
    printResult('Parameter Tampering - Block Registration Role Escalation (ADMIN)', true);
  } catch (err) {
    printResult('Parameter Tampering - Block Registration Role Escalation (ADMIN)', false, err.message);
  }

  // --- TEST 3: SUCCESSFUL REGISTRATION ---
  try {
    // Register candidate
    const resCandReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Candidate',
        email: candEmail,
        password: 'Password123!',
        role: 'CANDIDATE'
      })
    });
    assert.strictEqual(resCandReg.status, 201);
    const dataCandReg = await resCandReg.json();
    candUserId = dataCandReg.user.id;

    // Register Recruiter 1
    const resRecReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Recruiter 1',
        email: recEmail,
        password: 'Password123!',
        role: 'RECRUITER'
      })
    });
    assert.strictEqual(resRecReg.status, 201);
    const dataRecReg = await resRecReg.json();
    recUserId = dataRecReg.user.id;

    // Register Recruiter 2
    const resRec2Reg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Recruiter 2',
        email: rec2Email,
        password: 'Password123!',
        role: 'RECRUITER'
      })
    });
    assert.strictEqual(resRec2Reg.status, 201);
    const dataRec2Reg = await resRec2Reg.json();
    rec2UserId = dataRec2Reg.user.id;

    printResult('User Registration (Candidate and Recruiters)', true);
  } catch (err) {
    printResult('User Registration (Candidate and Recruiters)', false, err.message);
  }

  // --- TEST 4: SQL INJECTION PROTECTION (LOGIN) ---
  try {
    const resSqli = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "' OR '1'='1' --",
        password: 'anything_wrong'
      })
    });
    // Can be 400 (Zod rejects bad email format) or 401 (Auth rejected)
    assert.ok(resSqli.status === 400 || resSqli.status === 401, `Expected 400 or 401, got ${resSqli.status}`);
    printResult('SQL Injection - Authentication Bypass Attempt Rejected', true);
  } catch (err) {
    printResult('SQL Injection - Authentication Bypass Attempt Rejected', false, err.message);
  }

  // --- TEST 5: LOGIN & JWT VERIFICATION ---
  try {
    // Login Candidate
    const resCandLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candEmail, password: 'Password123!' })
    });
    assert.strictEqual(resCandLogin.status, 200);
    const dataCandLogin = await resCandLogin.json();
    candToken = dataCandLogin.token;

    // Login Recruiter 1
    const resRecLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recEmail, password: 'Password123!' })
    });
    assert.strictEqual(resRecLogin.status, 200);
    const dataRecLogin = await resRecLogin.json();
    recToken = dataRecLogin.token;

    // Login Recruiter 2
    const resRec2Login = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: rec2Email, password: 'Password123!' })
    });
    assert.strictEqual(resRec2Login.status, 200);
    const dataRec2Login = await resRec2Login.json();
    rec2Token = dataRec2Login.token;

    // Login Seeded Admin
    const resAdminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin123!' })
    });
    assert.strictEqual(resAdminLogin.status, 200);
    const dataAdminLogin = await resAdminLogin.json();
    adminToken = dataAdminLogin.token;

    printResult('Authentication & Session Generation (JWT)', true);
  } catch (err) {
    printResult('Authentication & Session Generation (JWT)', false, err.message);
  }

  // --- TEST 6: AUTHENTICATION BYPASS ATTEMPTS (PROTECTED ENDPOINTS) ---
  try {
    const resBypass = await fetch(`${BASE_URL}/admin/users`);
    assert.strictEqual(resBypass.status, 401);
    const dataBypass = await resBypass.json();
    assert.strictEqual(dataBypass.error, 'Authentication token required');
    printResult('Authentication Bypass - Rejected Protected Access without JWT', true);
  } catch (err) {
    printResult('Authentication Bypass - Rejected Protected Access without JWT', false, err.message);
  }

  // --- TEST 7: ROLE-BASED ACCESS CONTROL (RBAC) ---
  try {
    // Candidate attempting to access Admin endpoint
    const resRbac = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${candToken}` }
    });
    assert.strictEqual(resRbac.status, 403);
    const dataRbac = await resRbac.json();
    assert.strictEqual(dataRbac.error, 'Access denied: insufficient permissions');
    printResult('RBAC Enforced - Candidate Forbidden from Admin Endpoints', true);
  } catch (err) {
    printResult('RBAC Enforced - Candidate Forbidden from Admin Endpoints', false, err.message);
  }

  // --- TEST 8: JOB CREATION & PARAMETER TAMPERING AVOIDANCE ---
  try {
    const resJob = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recToken}`
      },
      body: JSON.stringify({
        title: 'Cybersecurity Engineer',
        company: 'SecureHire Corp',
        description: 'Design and test secure systems, perform vulnerability assessments.',
        location: 'Remote',
        salary: 120000,
        recruiterId: 9999 // Tampering attempt: should be ignored, server uses ID from JWT token
      })
    });
    assert.strictEqual(resJob.status, 201);
    const dataJob = await resJob.json();
    assert.strictEqual(dataJob.recruiterId, recUserId); // Server-side session ID enforced
    createdJobId = dataJob.id;
    printResult('RBAC / Parameter Tampering - Job Creation & Session Identity Enforcement', true);
  } catch (err) {
    printResult('RBAC / Parameter Tampering - Job Creation & Session Identity Enforcement', false, err.message);
  }

  // --- TEST 9: IDOR / PARAMETER TAMPERING (EDITING ANOTHER RECRUITER\'S JOB) ---
  try {
    const resIdorJob = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rec2Token}` // Recruiter 2 trying to edit Recruiter 1's job
      },
      body: JSON.stringify({
        title: 'Tampered Job Title',
        company: 'SecureHire Corp',
        description: 'This description was injected via IDOR.',
        location: 'Remote',
        salary: 1
      })
    });
    assert.strictEqual(resIdorJob.status, 403);
    const dataIdorJob = await resIdorJob.json();
    assert.strictEqual(dataIdorJob.error, 'Access denied: You do not own this job posting');
    printResult('IDOR Protection - Block Unauthorized Job Modification', true);
  } catch (err) {
    printResult('IDOR Protection - Block Unauthorized Job Modification', false, err.message);
  }

  // --- TEST 10: XSS PROTECTION (SAFE STORAGE & REACT CONTEXT ESCAPING) ---
  let xssJobId;
  try {
    const xssPayload = "<script>alert('XSS')</script>";
    const resXss = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recToken}`
      },
      body: JSON.stringify({
        title: xssPayload, // Injection payload
        company: 'Vulnerable Corp Test',
        description: 'Vulnerability test case',
        location: 'Nowhere',
        salary: 80000
      })
    });
    assert.strictEqual(resXss.status, 201);
    const dataXss = await resXss.json();
    xssJobId = dataXss.id;
    
    // Read the job details back to verify it was stored raw/unaltered, which is correct (React will escape it on output)
    const resGetXss = await fetch(`${BASE_URL}/jobs/${xssJobId}`);
    const dataGetXss = await resGetXss.json();
    assert.strictEqual(dataGetXss.title, xssPayload);
    printResult('XSS Protection - Script Payload Handled Securely as Raw Text', true);
  } catch (err) {
    printResult('XSS Protection - Script Payload Handled Securely as Raw Text', false, err.message);
  } finally {
    // Clean up XSS job posting
    if (xssJobId) {
      await fetch(`${BASE_URL}/jobs/${xssJobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${recToken}` }
      });
    }
  }

  // --- TEST 11: CANDIDATE APPLYING & UNIQUE APPLICATION POLICY (NO DUPLICATES) ---
  try {
    const applyData = {
      jobId: createdJobId,
      resumeText: 'Detailed application letter from candidate with 10 years experience.'
    };

    // Apply first time
    const resApply1 = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candToken}`
      },
      body: JSON.stringify(applyData)
    });
    assert.strictEqual(resApply1.status, 201);
    const dataApply1 = await resApply1.json();
    createdAppId = dataApply1.id;

    // Apply second time (should be rejected)
    const resApply2 = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candToken}`
      },
      body: JSON.stringify(applyData)
    });
    assert.strictEqual(resApply2.status, 400);
    const dataApply2 = await resApply2.json();
    assert.strictEqual(dataApply2.error, 'You have already applied for this job');
    printResult('Prevent Duplicate Applications Enforcement', true);
  } catch (err) {
    printResult('Prevent Duplicate Applications Enforcement', false, err.message);
  }

  // --- TEST 12: IDOR - CANDIDATE A ATTEMPTING TO ACCESS CANDIDATE B\'S APPLICATION ---
  try {
    // Register candidate B
    const candBEmail = `candB_${randomId}@test.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate B',
        email: candBEmail,
        password: 'Password123!',
        role: 'CANDIDATE'
      })
    });
    const resCandBLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candBEmail, password: 'Password123!' })
    });
    const dataCandB = await resCandBLogin.json();
    const candBToken = dataCandB.token;

    // Candidate B tries to view Candidate A's application
    const resIdorApp = await fetch(`${BASE_URL}/applications/${createdAppId}`, {
      headers: { 'Authorization': `Bearer ${candBToken}` }
    });
    assert.strictEqual(resIdorApp.status, 403);
    const dataIdorApp = await resIdorApp.json();
    assert.strictEqual(dataIdorApp.error, 'Access denied: You do not own this application');
    printResult('IDOR Protection - Block Cross-Candidate Application View', true);
  } catch (err) {
    printResult('IDOR Protection - Block Cross-Candidate Application View', false, err.message);
  }

  // --- TEST 13: RECRUITER STATUS UPDATE OWNERSHIP VERIFICATION ---
  try {
    // Recruiter 2 tries to update status on Recruiter 1's job application
    const resIdorStatus = await fetch(`${BASE_URL}/applications/${createdAppId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rec2Token}`
      },
      body: JSON.stringify({ status: 'ACCEPTED' })
    });
    assert.strictEqual(resIdorStatus.status, 403);
    const dataIdorStatus = await resIdorStatus.json();
    assert.strictEqual(dataIdorStatus.error, 'Access denied: You do not own the job posting for this application');

    // Recruiter 1 updates status (should succeed)
    const resOkStatus = await fetch(`${BASE_URL}/applications/${createdAppId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recToken}`
      },
      body: JSON.stringify({ status: 'ACCEPTED' })
    });
    assert.strictEqual(resOkStatus.status, 200);
    const dataOkStatus = await resOkStatus.json();
    assert.strictEqual(dataOkStatus.status, 'ACCEPTED');

    printResult('IDOR Protection - Application Status Modification Checks', true);
  } catch (err) {
    printResult('IDOR Protection - Application Status Modification Checks', false, err.message);
  }

  // --- TEST 14: SECURITY AUDITING LOG VERIFICATION ---
  try {
    const resLogs = await fetch(`${BASE_URL}/admin/logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(resLogs.status, 200);
    const logs = await resLogs.json();
    
    // Verify specific actions are logged
    const actions = logs.map(l => l.action);
    
    assert.ok(actions.includes('USER_REGISTRATION_SUCCESS'));
    assert.ok(actions.includes('LOGIN_SUCCESS'));
    assert.ok(actions.some(a => a.startsWith('UNAUTHORIZED_JOB_EDIT_ATTEMPT')));
    assert.ok(actions.some(a => a.startsWith('UNAUTHORIZED_STATUS_UPDATE_ATTEMPT')));
    
    // Verify no password/secrets logged
    const serializedLogs = JSON.stringify(logs);
    assert.strictEqual(serializedLogs.includes('Password123!'), false);
    assert.strictEqual(serializedLogs.includes('Admin123!'), false);
    
    printResult('Auditing & Logging - Correct Events Logs Captured and Secrets Excluded', true);
  } catch (err) {
    printResult('Auditing & Logging - Correct Events Logs Captured and Secrets Excluded', false, err.message);
  }

  // --- TEST 15: RATE LIMITING DEMONSTRATION ---
  try {
    console.log('⏳ Running Rate Limiting Demo (making 110 concurrent requests to trigger limit of 100)...');
    
    const requests = Array.from({ length: 110 }).map(() =>
      fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rate_test@test.com', password: 'bad' })
      })
    );

    const responses = await Promise.all(requests);
    const rateLimitTriggered = responses.some(res => res.status === 429);
    
    assert.ok(rateLimitTriggered, 'Expected at least one 429 Too Many Requests response');
    printResult('Rate Limiting - Authentication Throttling Triggered on 429', true);
  } catch (err) {
    printResult('Rate Limiting - Authentication Throttling Triggered on 429', false, err.message);
  }

  // Clean up test job posting
  try {
    if (createdJobId) {
      await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${recToken}` }
      });
    }
  } catch {}

  console.log('\n--- SECURITY VERIFICATION RUN COMPLETE ---');
  console.log(`Passed: ${passedCount} | Failed: ${failedCount}`);
  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
