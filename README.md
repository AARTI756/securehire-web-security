# SecureHire – Secure Job Recruitment Portal

> **Web Application Security College Assignment** — A fully functional secure web application demonstrating OWASP security best practices.

## Project Objective

SecureHire is a secure job recruitment portal built to demonstrate how modern web applications can implement and enforce security controls including:

- **JWT Authentication** with server-side verification
- **Role-Based Access Control (RBAC)** enforced on every backend endpoint
- **SQL Injection protection** via Prisma parameterized queries
- **XSS Protection** via React's safe rendering model
- **IDOR / Parameter Tampering protection** via backend ownership checks
- **Input Validation** using Zod schema validation
- **Rate Limiting** for brute-force attack prevention
- **Security Audit Logging** for all security-relevant events
- **Secure Headers** via Helmet middleware
- **bcrypt Password Hashing** — passwords never stored in plaintext

---

## Architecture

```
React Frontend (Vite + Tailwind CSS)
         |
         | (HTTPS / JSON REST API + JWT Bearer Token)
         v
Express.js Backend
  ├── Helmet (Secure HTTP Headers)
  ├── CORS (Allowed Origin via CLIENT_URL)
  ├── Rate Limiting (global + stricter auth limits)
  ├── authenticateToken (JWT verification middleware)
  ├── requireRole (RBAC middleware)
  ├── Zod Input Validation
  ├── Centralized Error Handler (no leaking of internals)
  └── Audit Logger (security event logging)
         |
         | (Prisma ORM — parameterized queries only)
         v
PostgreSQL Database
  ├── User (id, name, email, passwordHash, role, createdAt)
  ├── Job (id, title, company, description, location, salary, recruiterId)
  ├── Application (id, jobId, candidateId, resumeText, status)
  └── AuditLog (id, userId, action, ipAddress, createdAt)
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **CANDIDATE** | Register, login, browse jobs, apply, view own applications |
| **RECRUITER** | Login, create/edit/delete own jobs, view applicants, update status |
| **ADMIN** | View all users, jobs, applications, and security audit logs |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Node.js, Express.js |
| ORM | Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | Zod |
| Security | Helmet, express-rate-limit, CORS |
| Config | dotenv |

---

## Project Structure

```
secure-job-portal/
├── client/                       # React frontend
│   ├── src/
│   │   ├── api/axios.js          # Axios + JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx, Login.jsx, Register.jsx, Jobs.jsx, JobDetails.jsx
│   │   │   ├── candidate/Dashboard.jsx, MyApplications.jsx, ApplyJob.jsx, Profile.jsx
│   │   │   ├── recruiter/Dashboard.jsx, CreateJob.jsx, EditJob.jsx, Applicants.jsx
│   │   │   ├── admin/Dashboard.jsx, Users.jsx, Jobs.jsx, Applications.jsx, AuditLogs.jsx
│   │   │   └── error/Unauthorized.jsx, Forbidden.jsx
│   │   ├── App.jsx               # Route definitions
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                       # Express backend
│   ├── src/
│   │   ├── server.js             # Express entry point
│   │   ├── db.js                 # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.js           # authenticateToken, requireRole
│   │   │   ├── validate.js       # Zod schemas + validateBody
│   │   │   ├── rateLimiter.js    # Global + auth rate limiters
│   │   │   └── errorHandler.js   # Centralized safe error responses
│   │   ├── routes/
│   │   │   ├── auth.js           # Register, login, logout, profile
│   │   │   ├── jobs.js           # CRUD job routes
│   │   │   ├── applications.js   # Apply, view, update status
│   │   │   ├── recruiter.js      # Recruiter-specific endpoints
│   │   │   └── admin.js          # Admin-only endpoints
│   │   └── utils/audit.js        # Security event logger
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── .env.example
│   └── package.json
├── README.md
├── SECURITY_TESTING.md
└── .gitignore
```

---

## Installation & Setup

### Prerequisites
- Node.js v18+
- PostgreSQL (running locally or hosted)

### 1. Clone / Download the project

### 2. Configure backend environment

```bash
cd server
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a secure JWT_SECRET
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Run Prisma database migration

```bash
cd server
npx prisma db push
```

### 5. Run the database seed

```bash
cd server
node prisma/seed.js
```

### 6. Start the backend server

```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

### 7. Install frontend dependencies

```bash
cd client
npm install
```

### 8. Start the frontend

```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

---

## Environment Variables

### server/.env

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing (use a strong random string) |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `PORT` | Express server port (default: 5000) |

### client/.env (optional)

No client .env is required — the Vite proxy forwards `/api` to `http://localhost:5000` automatically.

---


## Security Features Implemented

| Feature | Implementation |
|---------|--------------|
| Password Hashing | bcryptjs with salt rounds = 10 |
| Authentication | JWT with 24h expiry, server-side verification |
| Authorization | requireRole middleware on all protected routes |
| IDOR Protection | Ownership checks before every resource access |
| SQL Injection | Prisma ORM parameterized queries (no raw SQL) |
| XSS Prevention | React's default safe text rendering |
| Input Validation | Zod schemas on every POST/PUT endpoint |
| Rate Limiting | Global (200 req/15min) + auth (10 req/15min) |
| Security Headers | Helmet middleware |
| CORS | Restricted to CLIENT_URL environment variable |
| Error Handling | Centralized — no stack traces or internals exposed |
| Audit Logging | All security events stored in AuditLog table |
| No Plaintext Passwords | passwordHash stored, never returned in API |
| Parameter Tampering | role/userId always from JWT, never from body |
| Session Management | JWT discarded on logout, expired tokens rejected |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login, returns JWT
- `POST /api/auth/logout` — Logout (logs event)
- `GET /api/auth/profile` — Get own profile (authenticated)

### Jobs (public read)
- `GET /api/jobs` — List jobs (optional `?search=` query)
- `GET /api/jobs/:id` — Job details
- `POST /api/jobs` — Create job (RECRUITER only)
- `PUT /api/jobs/:id` — Edit job (RECRUITER + owner only)
- `DELETE /api/jobs/:id` — Delete job (RECRUITER + owner only)

### Applications
- `POST /api/applications` — Apply for a job (CANDIDATE)
- `GET /api/applications/my` — Own applications (CANDIDATE)
- `GET /api/applications/:id` — Single application (own candidate / owning recruiter / admin)
- `PUT /api/applications/:id/status` — Update status (RECRUITER + owner only)

### Recruiter
- `GET /api/recruiter/applicants` — All applicants for own jobs (RECRUITER)

### Admin
- `GET /api/admin/users` — All users (ADMIN)
- `GET /api/admin/jobs` — All jobs (ADMIN)
- `GET /api/admin/applications` — All applications (ADMIN)
- `GET /api/admin/logs` — Security audit logs (ADMIN)

---

## Security Testing

See [SECURITY_TESTING.md](./SECURITY_TESTING.md) for detailed instructions.

---

## Deployment

### Frontend → Vercel

1. Push the `client/` folder to a GitHub repository
2. Create a new Vercel project, set root to `client/`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
6. Update `client/src/api/axios.js` baseURL to use `import.meta.env.VITE_API_URL`

### Backend → Render

1. Push the `server/` folder to GitHub
2. Create a Render Web Service, set root to `server/`
3. Set build command: `npm install && npx prisma generate`
4. Set start command: `node src/server.js`
5. Add environment variables:
   - `DATABASE_URL` — your hosted PostgreSQL URL
   - `JWT_SECRET` — a long secure random string
   - `CLIENT_URL` — your Vercel frontend URL

### Database → Supabase / Railway / Render PostgreSQL

1. Create a hosted PostgreSQL database
2. Copy the connection string
3. Set it as `DATABASE_URL` in Render environment variables
4. Run `npx prisma db push` once to create tables
5. Run the seed script (or create an npm script for it)

---

## Security Tradeoffs & Notes

- **JWT in localStorage**: This demo stores the JWT in `localStorage` for simplicity. In a production application, consider using `httpOnly` cookies to prevent JavaScript access (XSS mitigation). This is documented as a known tradeoff.
- **Registration allows RECRUITER role**: In a real system, recruiter accounts should be approved by admin before granting the role.
- **Admin accounts**: In production, admin accounts should only be created through a secure server-side process, never via the registration form.

---

## Limitations

- No file upload for resumes (text only for simplicity)
- No email verification workflow
- JWT refresh tokens not implemented (token expires after 24h)
- Admin cannot modify or delete records (read-only view)
