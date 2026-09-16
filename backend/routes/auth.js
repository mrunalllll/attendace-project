// ─────────────────────────────────────────────
//  Auth routes: login, register, logout, me
// ─────────────────────────────────────────────
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const upload  = require('../middleware/upload');
const { logActivity, ROLES, STATUS } = require('../middleware/auth');

// ── GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session?.userId) return res.json({ user: null });
  res.json({
    user: {
      id:     req.session.userId,
      name:   req.session.userName,
      role:   req.session.userRole,
      photo:  req.session.userPhoto,
      status: req.session.userStatus,
    },
  });
});

// ── POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { mob, pass, role } = req.body;
    const roleInt = parseInt(role) || ROLES.VOTER;

    if (!/^\d{10}$/.test(mob))
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    if (!pass?.length)
      return res.status(400).json({ success: false, message: 'Password is required.' });
    if (![ROLES.VOTER, ROLES.ADMIN].includes(roleInt))
      return res.status(400).json({ success: false, message: 'Invalid role.' });

    const [users] = await db.execute(
      'SELECT * FROM users WHERE mobile=? AND role=? LIMIT 1', [mob, roleInt]
    );
    const user = users[0];

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      await logActivity(null, 'Login Failed', `Mobile: ${mob}`, req);
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password.' });
    }

    if (user.status === STATUS.BLOCKED)
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact admin.' });

    req.session.regenerate(err => {
      if (err) return res.status(500).json({ success: false, message: 'Session error.' });
      req.session.userId     = user.id;
      req.session.userName   = user.name;
      req.session.userRole   = user.role;
      req.session.userPhoto  = user.photo || 'default.png';
      req.session.userStatus = user.status;

      logActivity(user.id, 'Login', 'Successful login', req);

      res.json({
        success: true,
        user: {
          id: user.id, name: user.name,
          role: user.role, photo: user.photo || 'default.png',
        },
      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── POST /api/auth/register
router.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { name, mob, email, pass, cpass, address } = req.body;
    const errors = [];

    if (!name?.trim() || name.trim().length < 2)      errors.push('Name must be at least 2 characters.');
    if (!/^\d{10}$/.test(mob))                         errors.push('Mobile must be a valid 10-digit number.');
    if (email && !/^\S+@\S+\.\S+$/.test(email))        errors.push('Invalid email address.');
    if (!pass || pass.length < 8)                      errors.push('Password must be at least 8 characters.');
    if (pass !== cpass)                                errors.push('Passwords do not match.');
    if (!address?.trim() || address.trim().length < 3) errors.push('Please enter a valid address.');

    if (errors.length)
      return res.status(400).json({ success: false, message: errors.join(' ') });

    const [existing] = await db.execute('SELECT id FROM users WHERE mobile=?', [mob]);
    if (existing[0])
      return res.status(409).json({ success: false, message: 'This mobile number is already registered.' });

    const [elecRows] = await db.execute('SELECT allow_registration FROM election_settings LIMIT 1');
    const elec = elecRows[0];
    if (elec && !elec.allow_registration)
      return res.status(403).json({ success: false, message: 'Voter registration is currently closed.' });

    const photo  = req.file?.filename || 'default.png';
    const hashed = await bcrypt.hash(pass, 12);

    const result = await db.execute(
      'INSERT INTO users (name,mobile,email,password,address,photo,role,status,is_verified) VALUES (?,?,?,?,?,?,?,0,0)',
      [name.trim(), mob, email || null, hashed, address.trim(), photo, ROLES.VOTER]
    );
    const insertId = result[0].insertId;

    await logActivity(insertId, 'Registration', `New voter: ${name}`, req);
    res.json({ success: true, message: 'Registration successful! You can now log in.' });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/logout
router.post('/logout', async (req, res) => {
  if (req.session?.userId) await logActivity(req.session.userId, 'Logout', '', req);
  req.session.destroy(() => res.json({ success: true }));
});

module.exports = router;
