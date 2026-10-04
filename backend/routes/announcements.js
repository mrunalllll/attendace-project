// ─────────────────────────────────────────────
//  routes/announcements.js
//  Public:  GET /api/announcements
//  Admin:   CRUD under /api/announcements/admin
// ─────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAdmin, logActivity } = require('../middleware/auth');

// ── PUBLIC ──────────────────────────────────────────────────────────

// GET /api/announcements?dept=&type=&limit=&page=
router.get('/', async (req, res) => {
  try {
    const { dept, type, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ['a.is_published = 1', "(a.expires_at IS NULL OR a.expires_at > datetime('now'))"];
    const params = [];

    if (dept) { conditions.push('d.slug = ?'); params.push(dept); }
    if (type) { conditions.push('a.type = ?'); params.push(type); }

    const where = 'WHERE ' + conditions.join(' AND ');
    const [rows] = await db.execute(
      `SELECT a.*, d.name AS dept_name, d.slug AS dept_slug
       FROM announcements a
       LEFT JOIN departments d ON d.id = a.department_id
       ${where}
       ORDER BY a.is_pinned DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [countRow] = await db.execute(
      `SELECT COUNT(*) AS total FROM announcements a
       LEFT JOIN departments d ON d.id = a.department_id ${where}`,
      params
    );
    res.json({ success: true, announcements: rows, total: countRow[0]?.total || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/announcements/latest — latest 5 for homepage
router.get('/latest', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.*, d.name AS dept_name FROM announcements a
       LEFT JOIN departments d ON d.id = a.department_id
       WHERE a.is_published = 1 AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
       ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT 5`
    );
    res.json({ success: true, announcements: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── ADMIN ───────────────────────────────────────────────────────────
router.use('/admin', requireAdmin);

// GET /api/announcements/admin/all
router.get('/admin/all', async (req, res) => {
  try {
    const { search, type, dept } = req.query;
    let conditions = [];
    const params = [];
    if (search) { conditions.push('(a.title LIKE ? OR a.body LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (type)   { conditions.push('a.type = ?'); params.push(type); }
    if (dept)   { conditions.push('a.department_id = ?'); params.push(dept); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.execute(
      `SELECT a.*, d.name AS dept_name FROM announcements a
       LEFT JOIN departments d ON d.id = a.department_id
       ${where}
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
      params
    );
    res.json({ success: true, announcements: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/announcements/admin
router.post('/admin', async (req, res) => {
  try {
    const { title, body, type, department_id, is_published, is_pinned, expires_at } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const [result] = await db.execute(
      `INSERT INTO announcements (title, body, type, department_id, is_published, is_pinned, expires_at)
       VALUES (?,?,?,?,?,?,?)`,
      [title, body || null, type || 'info', department_id || null,
       is_published !== undefined ? parseInt(is_published) : 1,
       is_pinned ? 1 : 0,
       expires_at || null]
    );
    await logActivity(req.session.userId, 'Add Announcement', `Added announcement: ${title}`, req);
    res.json({ success: true, message: 'Announcement created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/announcements/admin/:id
router.put('/admin/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [existing] = await db.execute('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });

    const { title, body, type, department_id, is_published, is_pinned, expires_at } = req.body;
    await db.execute(
      `UPDATE announcements SET title=?, body=?, type=?, department_id=?,
       is_published=?, is_pinned=?, expires_at=? WHERE id=?`,
      [title || existing[0].title,
       body !== undefined ? body : existing[0].body,
       type || existing[0].type,
       department_id !== undefined ? department_id || null : existing[0].department_id,
       is_published !== undefined ? parseInt(is_published) : existing[0].is_published,
       is_pinned !== undefined ? parseInt(is_pinned) : existing[0].is_pinned,
       expires_at !== undefined ? expires_at || null : existing[0].expires_at,
       id]
    );
    await logActivity(req.session.userId, 'Edit Announcement', `Updated: ${title || existing[0].title}`, req);
    res.json({ success: true, message: 'Announcement updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/announcements/admin/:id
router.delete('/admin/:id', async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT title FROM announcements WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    await db.execute('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    await logActivity(req.session.userId, 'Delete Announcement', `Deleted: ${existing[0].title}`, req);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/announcements/admin/:id/toggle-publish
router.patch('/admin/:id/toggle-publish', async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT is_published FROM announcements WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    const newVal = existing[0].is_published === 1 ? 0 : 1;
    await db.execute('UPDATE announcements SET is_published = ? WHERE id = ?', [newVal, req.params.id]);
    res.json({ success: true, is_published: newVal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/announcements/admin/:id/toggle-pin
router.patch('/admin/:id/toggle-pin', async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT is_pinned FROM announcements WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    const newVal = existing[0].is_pinned === 1 ? 0 : 1;
    await db.execute('UPDATE announcements SET is_pinned = ? WHERE id = ?', [newVal, req.params.id]);
    res.json({ success: true, is_pinned: newVal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
