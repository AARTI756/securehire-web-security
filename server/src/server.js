require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const recruiterRoutes = require('./routes/recruiter');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);

// Set secure HTTP headers via Helmet
app.use(helmet());

// Configure CORS securely using environment variable
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply global rate limiting
app.use(globalLimiter);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Centralized error handling middleware (must be registered last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  console.log(`[SERVER] CORS allowed origin: ${clientUrl}`);
});

module.exports = server;
