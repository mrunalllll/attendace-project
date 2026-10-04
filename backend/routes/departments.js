// ─────────────────────────────────────────────
//  routes/departments.js
//  Public:  GET /api/departments
//           GET /api/departments/:slug
//  Admin:   GET/POST/PUT/DELETE /api/departments/admin/*
// ─────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const upload   = require('../middleware/upload');
const { requireAdmin, logActivity } = require('../middleware/auth');

function makeSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ═══════════════════════════════════════════
//  PUBLIC ROUTES
// ═══════════════════════════════════════════

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT d.*,
              COUNT(DISTINCT e.id) AS event_count,
              COUNT(DISTINCT f.id) AS faculty_count
       FROM departments d
       LEFT JOIN events e ON e.department_id = d.id AND e.is_published = 1
       LEFT JOIN department_faculty f ON f.department_id = d.id
       WHERE d.status = 1
       GROUP BY d.id
       ORDER BY d.sort_order, d.name`
    );
    res.json({ success: true, departments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════
//  ADMIN ROUTES  (must come before /:slug)
// ═══════════════════════════════════════════

const deptUpload = upload.fields([
  { name: 'image',     maxCount: 1 },
  { name: 'banner',    maxCount: 1 },
  { name: 'hod_photo', maxCount: 1 },
]);

// GET /api/departments/admin/all
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT d.*,
              COUNT(DISTINCT e.id)  AS event_count,
              COUNT(DISTINCT f.id)  AS faculty_count,
              COUNT(DISTINCT g.id)  AS gallery_count
       FROM departments d
       LEFT JOIN events e ON e.department_id = d.id
       LEFT JOIN department_faculty f ON f.department_id = d.id
       LEFT JOIN gallery g ON g.department_id = d.id
       GROUP BY d.id
       ORDER BY d.sort_order, d.name`
    );
    res.json({ success: true, departments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/departments/admin
router.post('/admin', requireAdmin, deptUpload, async (req, res) => {
  try {
    const { name, code, description, hod_name, established, seats, status, sort_order } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });

    const slug      = makeSlug(name);
    const image     = req.files?.image?.[0]?.filename     || null;
    const banner    = req.files?.banner?.[0]?.filename    || null;
    const hod_photo = req.files?.hod_photo?.[0]?.filename || null;

    const [result] = await db.execute(
      `INSERT INTO departments (name, code, slug, description, hod_name, hod_photo, banner, image,
       established, seats, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, code || '', slug, description || null, hod_name || null, hod_photo, banner, image,
       established || null, seats ? parseInt(seats) : null,
       status !== undefined ? parseInt(status) : 1,
       sort_order ? parseInt(sort_order) : 0]
    );

    await logActivity(req.session.userId, 'Add Department', `Added: ${name}`, req);
    res.json({ success: true, message: 'Department added', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/departments/admin/:id
router.put('/admin/:id', requireAdmin, deptUpload, async (req, res) => {
  try {
    const id = req.params.id;
    const [existing] = await db.execute('SELECT * FROM departments WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });

    const { name, code, description, hod_name, established, seats, status, sort_order } = req.body;
    const slug      = name ? makeSlug(name) : existing[0].slug;
    const image     = req.files?.image?.[0]?.filename     || existing[0].image;
    const banner    = req.files?.banner?.[0]?.filename    || existing[0].banner;
    const hod_photo = req.files?.hod_photo?.[0]?.filename || existing[0].hod_photo;

    await db.execute(
      `UPDATE departments SET name=?, code=?, slug=?, description=?, hod_name=?, hod_photo=?,
       banner=?, image=?, established=?, seats=?, status=?, sort_order=? WHERE id=?`,
      [name || existing[0].name, code || existing[0].code, slug,
       description !== undefined ? description : existing[0].description,
       hod_name || existing[0].hod_name, hod_photo, banner, image,
       established || existing[0].established,
       seats ? parseInt(seats) : existing[0].seats,
       status !== undefined ? parseInt(status) : existing[0].status,
       sort_order !== undefined ? parseInt(sort_order) : existing[0].sort_order,
       id]
    );

    await logActivity(req.session.userId, 'Edit Department', `Updated: ${name || existing[0].name}`, req);
    res.json({ success: true, message: 'Department updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/departments/admin/:id
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT name FROM departments WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    await db.execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
    await logActivity(req.session.userId, 'Delete Department', `Deleted: ${existing[0].name}`, req);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Faculty sub-resource ────────────────────────────────────────────

// GET /api/departments/admin/:id/faculty
router.get('/admin/:id/faculty', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM department_faculty WHERE department_id = ? ORDER BY sort_order, name',
      [req.params.id]
    );
    res.json({ success: true, faculty: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/departments/admin/:id/faculty
router.post('/admin/:id/faculty', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, designation, email, sort_order } = req.body;
    const photo = req.file?.filename || null;
    await db.execute(
      'INSERT INTO department_faculty (department_id, name, designation, email, photo, sort_order) VALUES (?,?,?,?,?,?)',
      [req.params.id, name, designation || null, email || null, photo, sort_order ? parseInt(sort_order) : 0]
    );
    res.json({ success: true, message: 'Faculty added' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/departments/admin/faculty/:fid
// NOTE: must be defined before /admin/:id to avoid ambiguity — Express matches top-down
router.delete('/admin/faculty/:fid', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM department_faculty WHERE id = ?', [req.params.fid]);
    res.json({ success: true, message: 'Faculty deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════
//  PUBLIC /:slug  — MUST be last (wildcard)
// ═══════════════════════════════════════════

// GET /api/departments/:slug
router.get('/:slug', async (req, res) => {
  try {
    const [depts] = await db.execute(
      'SELECT * FROM departments WHERE slug = ? AND status = 1',
      [req.params.slug]
    );
    if (!depts.length) return res.status(404).json({ success: false, message: 'Department not found' });
    const dept = depts[0];

    const [faculty] = await db.execute(
      'SELECT * FROM department_faculty WHERE department_id = ? ORDER BY sort_order, name',
      [dept.id]
    );
    const [events] = await db.execute(
      `SELECT e.*, d.name AS dept_name
       FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.department_id = ? AND e.is_published = 1
       ORDER BY e.event_date DESC LIMIT 10`,
      [dept.id]
    );
    const [gallery] = await db.execute(
      'SELECT * FROM gallery WHERE department_id = ? ORDER BY created_at DESC LIMIT 12',
      [dept.id]
    );
    const [announcements] = await db.execute(
      `SELECT * FROM announcements
       WHERE department_id = ? AND is_published = 1
       ORDER BY is_pinned DESC, created_at DESC LIMIT 10`,
      [dept.id]
    );

    res.json({ success: true, department: dept, faculty, events, gallery, announcements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
