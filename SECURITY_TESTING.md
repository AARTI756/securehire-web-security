# SECURITY_TESTING.md – SecureHire Security Test Documentation

> All tests below are **controlled tests against the secured application**. The application is NOT intentionally vulnerable. Each test demonstrates that the security control correctly prevents the attack.

---

## Security Test Summary Table

| # | Security Test | Attack / Input | Expected Result | Actual Result | Status |
|---|--------------|---------------|----------------|---------------|--------|
| 1 | SQL Injection | `' OR '1'='1` in login email | Authentication not bypassed | Returns 401 Invalid credentials | ✅ Protected |
| 2 | XSS | `<script>alert('XSS')</script>` in job title / resume | Script does not execute | Rendered safely as text | ✅ Protected |
| 3 | IDOR – Application | Access another candidate's application ID | 403 Forbidden | Access denied | ✅ Protected |
| 4 | IDOR – Job Edit | Edit another recruiter's job | 403 Forbidden | Access denied | ✅ Protected |
| 5 | Auth Bypass | Access `/api/admin/users` without JWT | 401 Unauthorized | Authentication required error | ✅ Protected |
| 6 | Parameter Tampering | Send `role: "ADMIN"` in register body | Role not applied | Zod rejects ADMIN role | ✅ Protected |
| 7 | Input Validation | Weak password / invalid email | 400 Validation error | Returns field-level errors | ✅ Protected |
| 8 | Rate Limiting | 11+ login requests in 15 minutes | 429 Too Many Requests | Rate limit triggered | ✅ Protected |
| 9 | Expired JWT | Use expired/invalid JWT token | 401 Unauthorized | Token rejected | ✅ Protected |
| 10 | Duplicate Application | Apply to same job twice | 400 Duplicate | Unique constraint error | ✅ Protected |

---

## Test 1: SQL Injection

### What is SQL Injection?
SQL injection is an attack where malicious SQL code is inserted into input fields to manipulate database queries — for example, bypassing authentication by making a condition always evaluate to true.

### Classic Attack Payload
```
Email:    ' OR '1'='1' --
Password: anything
```
In a raw SQL system, this would construct:
```sql
SELECT * FROM users WHERE email = '' OR '1'='1' --' AND password = '...'
```
The `OR '1'='1'` always evaluates to true, bypassing authentication entirely.

### How to Test (Local)
1. Open `http://localhost:5173/login`
2. Enter email: `' OR '1'='1' --`
3. Enter password: `anything`
4. Click Sign In

**Expected Result:** `Invalid email or password` — 401 response. Login fails.

**Why it's Protected:**
Prisma ORM uses **parameterized queries** exclusively. The input `' OR '1'='1' --` is treated as a literal string value, not SQL code. Prisma never constructs raw SQL by string concatenation.

The backend Zod validation also rejects the malformed email format before it even reaches the database query.

### Also test in Job Search
- Navigate to `http://localhost:5173/jobs`
- Search for: `'; DROP TABLE "Job"; --`
- **Expected:** Jobs list returns empty or normal results. The table is not dropped.

---

## Test 2: Cross-Site Scripting (XSS)

### What is XSS?
Cross-Site Scripting is an attack where malicious JavaScript code is injected into user-controlled fields. If the application renders user content as raw HTML, the script executes in the victim's browser.

### Attack Payload
```html
<script>alert('XSS')</script>
```

### How to Test (Local)

**Test A — Job Application Resume:**
1. Login as `candidate@example.com`
2. Navigate to any job and click "Apply Now"
3. In the "Cover Letter / Resume Text" field, enter:
   ```
   <script>alert('XSS')</script>
   ```
4. Submit the application
5. Login as `recruiter@example.com`
6. Navigate to Applicants
7. **Expected:** The text `<script>alert('XSS')</script>` is rendered as visible text. **No alert box appears.**

**Test B — Job Title (via API test):**
1. Login as `recruiter@example.com`
2. Create a job with title: `<img src=x onerror=alert('XSS')>`
3. **Expected:** The text is displayed safely as a literal string, not rendered as an HTML tag.

**Why it's Protected:**
React's JSX rendering **escapes all dynamic content by default**. Content rendered as `{variable}` is always treated as a text node, not HTML. The application never uses `dangerouslySetInnerHTML`.

---

## Test 3: IDOR – Accessing Another Candidate's Application

### What is IDOR?
Insecure Direct Object Reference (IDOR) is when an attacker changes a resource ID in a URL or request to access another user's data.

### Attack Scenario
Candidate A has application ID `1`. Candidate B has application ID `2`. Candidate A attempts to access `GET /api/applications/2`.

### How to Test (Local)
1. Login as `candidate@example.com`
2. Get your JWT token from DevTools → Application → localStorage → `token`
3. Open a terminal or use a REST client:
   ```bash
   curl -H "Authorization: Bearer <candidate_token>" http://localhost:5000/api/applications/2
   ```
   (Try an application ID that belongs to a different candidate)
4. **Expected:** `403 Forbidden — Access denied: You do not own this application`

**Why it's Protected:**
The `GET /api/applications/:id` route fetches the application from the database and checks that `application.candidateId === req.user.id`. The `req.user.id` comes from the **verified JWT**, not from the URL or request body.

---

## Test 4: IDOR – Editing Another Recruiter's Job

### Attack Scenario
Recruiter 1 tries to edit or delete a job owned by Recruiter 2.

### How to Test (Local)
1. Login as `recruiter@example.com`
2. Get a JWT token
3. Check which job ID belongs to `recruiter2@example.com` (from the jobs list)
4. Try to edit that job:
   ```bash
   curl -X PUT http://localhost:5000/api/jobs/<recruiter2_job_id> \
     -H "Authorization: Bearer <recruiter1_token>" \
     -H "Content-Type: application/json" \
     -d '{"title":"HACKED","company":"Evil","description":"tampered description here","location":"Hacker","salary":1}'
   ```
5. **Expected:** `403 Forbidden — Access denied: You do not own this job posting`

**Why it's Protected:**
The `PUT /api/jobs/:id` route verifies `job.recruiterId === req.user.id` before allowing the update. The recruiter ID is always taken from the JWT, never from the request body.

---

## Test 5: Authentication Bypass

### Attack Scenario
An attacker attempts to access protected admin endpoints without a valid JWT.

### How to Test (Local)
```bash
# No Authorization header
curl http://localhost:5000/api/admin/users

# Invalid token
curl -H "Authorization: Bearer invalid_token_here" http://localhost:5000/api/admin/users

# Malformed header
curl -H "Authorization: InvalidFormat" http://localhost:5000/api/admin/users
```

**Expected Result for all:** `401 Unauthorized — Authentication token required / Invalid authentication token`

**Why it's Protected:**
The `authenticateToken` middleware runs before every protected route handler. It calls `jwt.verify(token, JWT_SECRET)`. If the token is missing, malformed, or has an invalid signature, it rejects the request immediately with 401.

---

## Test 6: Parameter Tampering – Role Escalation

### Attack Scenario
An attacker registers as a CANDIDATE but sends `role: "ADMIN"` in the request body to escalate privileges.

### How to Test (Local)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Attacker","email":"attacker@test.com","password":"Attack123!","role":"ADMIN"}'
```

**Expected Result:** `400 Bad Request — Role must be either CANDIDATE or RECRUITER`

**Why it's Protected:**
The Zod `registerSchema` defines:
```js
role: z.enum(['CANDIDATE', 'RECRUITER'])
```
The value `ADMIN` is not in the allowed enum, so Zod rejects the request before it reaches the database. Even if the validation were bypassed, the JWT is signed with the role stored in the database, which was validated at registration time.

### Also test sending role in other requests:
```bash
# Candidate tries to post a job with role override in body
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer <candidate_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Fake Job","company":"Evil","description":"test description here","location":"Nowhere","salary":1,"role":"RECRUITER","recruiterId":1}'
```
**Expected:** `403 Forbidden — Access denied: insufficient permissions`
The `role` and `recruiterId` fields in the body are completely ignored. Authorization is based solely on the JWT.

---

## Test 7: Input Validation

### How to Test (Local)

**Weak password:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"weak","role":"CANDIDATE"}'
```
**Expected:** `400 — Password must be at least 8 characters / must contain uppercase / lowercase / number / special character`

**Invalid email:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"notanemail","password":"Strong123!","role":"CANDIDATE"}'
```
**Expected:** `400 — Invalid email address`

**Very short resume text:**
```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Authorization: Bearer <candidate_token>" \
  -H "Content-Type: application/json" \
  -d '{"jobId":1,"resumeText":"short"}'
```
**Expected:** `400 — Resume text must be at least 20 characters`

---

## Test 8: Rate Limiting

### How to Test (Local)
Run 11 rapid login attempts:
```bash
for i in $(seq 1 11); do \
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'; \
done
```
**Expected:** First 10 responses return `401`, the 11th returns `429 Too Many Requests`

**Why it's Protected:**
`express-rate-limit` is configured with `max: 10` requests per 15-minute window on auth routes.

---

## Test 9: Expired / Tampered JWT

### How to Test (Local)
Modify a character in a valid JWT and attempt to use it:
```bash
# Take a valid token and replace one character
curl -H "Authorization: Bearer eyJ0eXAi...TAMPERED..." http://localhost:5000/api/auth/profile
```
**Expected:** `401 — Invalid authentication token`

A JWT with a bad signature is rejected by `jwt.verify()` which performs HMAC signature validation.

---

## Test 10: Duplicate Application

### How to Test (Local)
1. Login as candidate and apply for a job successfully
2. Try to apply for the same job again (same candidate, same job)
3. **Expected:** `400 — You have already applied for this job`

The database enforces a `@@unique([jobId, candidateId])` constraint, and the backend checks for existing applications before inserting.

---

## Security Mechanisms Summary

| Mechanism | Library / Approach |
|-----------|-------------------|
| Password Hashing | `bcryptjs` — saltRounds=10 |
| JWT Generation | `jsonwebtoken` — 24h expiry, HS256 |
| Input Validation | `zod` — strict schema parsing |
| SQL Injection Prevention | Prisma ORM parameterized queries |
| XSS Prevention | React JSX safe rendering (no dangerouslySetInnerHTML) |
| IDOR Prevention | Backend ownership checks on every resource access |
| RBAC | `requireRole()` middleware |
| Rate Limiting | `express-rate-limit` |
| Security Headers | `helmet` |
| CORS | `cors` with `CLIENT_URL` environment variable |
| Error Handling | Centralized — no internals exposed |
| Audit Logging | All events written to AuditLog table in PostgreSQL |
