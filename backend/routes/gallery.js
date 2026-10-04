// ─────────────────────────────────────────────
//  routes/gallery.js
//  Public:  GET /api/gallery
//  Admin:   CRUD under /api/gallery/admin
// ─────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const upload  = require('../middleware/upload');
const { requireAdmin, logActivity } = require('../middleware/auth');

const GALLERY_CATEGORIES = [
  'Campus','Buildings','Classrooms','Labs','Library','Sports','Auditorium',
  'Events','Students','Faculty','Achievements','General'
];

// ── PUBLIC ──────────────────────────────────────────────────────────

// GET /api/gallery?category=&dept=&event_id=&featured=&limit=&page=
router.get('/', async (req, res) => {
  try {
    const { category, dept, event_id, featured, limit = 24, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    const params = [];

    if (category)  { conditions.push('g.category = ?'); params.push(category); }
    if (dept)      { conditions.push('d.slug = ?'); params.push(dept); }
    if (event_id)  { conditions.push('g.event_id = ?'); params.push(event_id); }
    if (featured)  { conditions.push('g.is_featured = 1'); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.execute(
      `SELECT g.*, d.name AS dept_name, d.slug AS dept_slug, e.title AS event_title
       FROM gallery g
       LEFT JOIN departments d ON d.id = g.department_id
       LEFT JOIN events e ON e.id = g.event_id
       ${where}
       ORDER BY g.is_featured DESC, g.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countRow] = await db.execute(
      `SELECT COUNT(*) AS total FROM gallery g
       LEFT JOIN departments d ON d.id = g.department_id
       ${where}`,
      params
    );

    // category counts
    const [cats] = await db.execute(
      'SELECT category, COUNT(*) AS count FROM gallery GROUP BY category ORDER BY count DESC'
    );

    res.json({
      success: true,
      images: rows,
      total: countRow[0]?.total || 0,
      categories: GALLERY_CATEGORIES,
      category_counts: cats,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/gallery/featured — featured photos for homepage
router.get('/featured', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT g.*, d.name AS dept_name FROM gallery g
       LEFT JOIN departments d ON d.id = g.department_id
       WHERE g.is_featured = 1
       ORDER BY g.created_at DESC LIMIT 12`
    );
    res.json({ success: true, images: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── ADMIN ───────────────────────────────────────────────────────────
router.use('/admin', requireAdmin);

const galleryUpload = upload.array('photos', 30);

// GET /api/gallery/admin/all
router.get('/admin/all', async (req, res) => {
  try {
    const { category, dept, search } = req.query;
    let conditions = [];
    const params = [];
    if (category) { conditions.push('g.category = ?'); params.push(category); }
    if (dept)     { conditions.push('g.department_id = ?'); params.push(dept); }
    if (search)   { conditions.push('g.title LIKE ?'); params.push(`%${search}%`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.execute(
      `SELECT g.*, d.name AS dept_name, e.title AS event_title
       FROM gallery g
       LEFT JOIN departments d ON d.id = g.department_id
       LEFT JOIN events e ON e.id = g.event_id
       ${where}
       ORDER BY g.created_at DESC`,
      params
    );
    res.json({ success: true, images: rows, categories: GALLERY_CATEGORIES });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/gallery/admin — upload one or more photos
router.post('/admin', galleryUpload, async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const { category, department_id, event_id, is_featured } = req.body;
    const titles = Array.isArray(req.body.titles) ? req.body.titles : [];
    const inserted = [];

    for (let i = 0; i < req.files.length; i++) {
      const [result] = await db.execute(
        `INSERT INTO gallery (photo, title, category, department_id, event_id, is_featured)
         VALUES (?,?,?,?,?,?)`,
        [req.files[i].filename, titles[i] || null,
         category || 'General', department_id || null, event_id || null,
         is_featured ? 1 : 0]
      );
      inserted.push({ id: result.insertId, photo: req.files[i].filename });
    }

    await logActivity(req.session.userId, 'Upload Gallery', `Uploaded ${req.files.length} gallery photo(s)`, req);
    res.json({ success: true, message: `${req.files.length} photo(s) uploaded`, images: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/gallery/admin/:id — edit metadata
router.put('/admin/:id', async (req, res) => {
  try {
    const { title, category, department_id, event_id, is_featured } = req.body;
    const [existing] = await db.execute('SELECT * FROM gallery WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });

    await db.execute(
      'UPDATE gallery SET title=?, category=?, department_id=?, event_id=?, is_featured=? WHERE id=?',
      [title !== undefined ? title : existing[0].title,
       category || existing[0].category,
       department_id !== undefined ? department_id || null : existing[0].department_id,
       event_id !== undefined ? event_id || null : existing[0].event_id,
       is_featured !== undefined ? parseInt(is_featured) : existing[0].is_featured,
       req.params.id]
    );
    res.json({ success: true, message: 'Image updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/gallery/admin/:id
router.delete('/admin/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    await logActivity(req.session.userId, 'Delete Gallery Image', `Deleted gallery image #${req.params.id}`, req);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/gallery/admin/bulk — delete multiple
router.delete('/admin/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(`DELETE FROM gallery WHERE id IN (${placeholders})`, ids);
    await logActivity(req.session.userId, 'Bulk Delete Gallery', `Deleted ${ids.length} gallery images`, req);
    res.json({ success: true, message: `${ids.length} image(s) deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
