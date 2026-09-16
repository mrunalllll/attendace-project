// ─────────────────────────────────────────────
//  Auth middleware + helpers
// ─────────────────────────────────────────────
const db = require('../config/db');

const ROLES   = { VOTER: 1, ADMIN: 2 };
const STATUS  = { NOT_VOTED: 0, VOTED: 1, BLOCKED: 2 };

// Require any logged-in user
function requireLogin(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Please log in first.' });
  }
  next();
}

// Require admin role
function requireAdmin(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  if (req.session.userRole !== ROLES.ADMIN) return res.status(403).json({ success: false, message: 'Admin access required.' });
  next();
}

// Require voter role
function requireVoter(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  if (req.session.userRole !== ROLES.VOTER) return res.status(403).json({ success: false, message: 'Voter access required.' });
  next();
}

// Log an activity to DB (non-fatal)
async function logActivity(userId, action, description = '', req = null) {
  try {
    const ip = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
      : 'system';
    const ua = req?.headers?.['user-agent'] || '';
    await db.execute(
      'INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent) VALUES (?,?,?,?,?)',
      [userId || null, action, description, ip, ua]
    );
  } catch (_) { /* non-fatal */ }
}

module.exports = { requireLogin, requireAdmin, requireVoter, logActivity, ROLES, STATUS };
