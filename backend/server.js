// ─────────────────────────────────────────────
//  VoteSecure - Express Backend Server
//  Database: SQLite via sql.js (no MySQL needed)
// ─────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── CORS — allow React frontend
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session
app.use(session({
  secret:            process.env.SESSION_SECRET || 'votesecure_secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge:   60 * 60 * 1000, // 1 hour
    sameSite: 'lax',
  },
}));

// ── Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/voter',   require('./routes/voter'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/results', require('./routes/results'));

// ── Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Start server (SQLite initialises itself on first require of db.js)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 VoteSecure API  →  http://localhost:${PORT}`);
  console.log(`📦 Database        →  SQLite (voting.db) — no MySQL needed`);
  console.log(`👤 Admin login     →  mobile: 9999999999  /  password: Admin@123`);
});
