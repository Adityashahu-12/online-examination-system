const path = require('path');
const express = require('express');
const session = require('express-session');
const { pool } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import Route Handlers
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const scheduleRoutes = require('./routes/schedules');
const studentRoutes = require('./routes/student');
const examRoutes = require('./routes/exams');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
  name: 'examhub.sid',
  secret: process.env.SESSION_SECRET || 'examhub_super_secret_session_key_production_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Disconnected';
  let dbLatency = null;
  const start = Date.now();

  try {
    const result = await pool.query('SELECT NOW() AS server_time, version();');
    if (result.rows.length > 0) {
      dbStatus = 'Connected';
      dbLatency = `${Date.now() - start}ms`;
    }
  } catch (err) {
    dbStatus = `Error: ${err.message}`;
  }

  res.json({
    status: 'ONLINE',
    system: 'ExamHub Online Examination Management System',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latency: dbLatency
    }
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
