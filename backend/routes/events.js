// ─────────────────────────────────────────────
//  routes/events.js
//  Public:  GET /api/events, GET /api/events/:slug
//  Admin:   CRUD under /api/admin/events
// ─────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const upload  = require('../middleware/upload');
const { requireAdmin, logActivity } = require('../middleware/auth');

const EVENT_CATEGORIES = ['Freshers','Farewell','Workshop','Seminar','Hackathon','Technical','Cultural','Sports','Fest','Other'];

function makeSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── PUBLIC ──────────────────────────────────────────────────────────

// GET /api/events?dept=&category=&status=&year=&search=&limit=&page=
router.get('/', async (req, res) => {
  try {
    const { dept, category, status, year, search, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['e.is_published = 1'];
    const params = [];

    if (dept)     { conditions.push('d.slug = ?'); params.push(dept); }
    if (category) { conditions.push('e.category = ?'); params.push(category); }
    if (status)   { conditions.push('e.status = ?'); params.push(status); }
    if (year)     { conditions.push("strftime('%Y', e.event_date) = ?"); params.push(year); }
    if (search)   {
      conditions.push('(e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.execute(
      `SELECT e.*, d.name AS dept_name, d.slug AS dept_slug,
              COUNT(ep.id) AS photo_count
       FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN event_photos ep ON ep.event_id = e.id
       ${where}
       GROUP BY e.id
       ORDER BY e.event_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countRow] = await db.execute(
      `SELECT COUNT(DISTINCT e.id) AS total
       FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       ${where}`,
      params
    );
    const total = countRow[0]?.total || 0;

    res.json({ success: true, events: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/upcoming — next 6 upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.*, d.name AS dept_name, d.slug AS dept_slug
       FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.is_published = 1 AND e.status = 'upcoming'
       ORDER BY e.event_date ASC LIMIT 6`
    );
    res.json({ success: true, events: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/recent — last 6 completed events
router.get('/recent', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.*, d.name AS dept_name, d.slug AS dept_slug
       FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.is_published = 1 AND e.status = 'completed'
       ORDER BY e.event_date DESC LIMIT 6`
    );
    res.json({ success: true, events: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/:slug — event detail with photos
router.get('/:slug', async (req, res) => {
  try {
    const [events] = await db.execute(
      `SELECT e.*, d.name AS dept_name, d.slug AS dept_slug, d.code AS dept_code
       FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.slug = ? AND e.is_published = 1`,
      [req.params.slug]
    );
    if (!events.length) return res.status(404).json({ success: false, message: 'Event not found' });
    const event = events[0];

    const [photos] = await db.execute(
      'SELECT * FROM event_photos WHERE event_id = ? ORDER BY sort_order, created_at',
      [event.id]
    );

    // related events (same dept, upcoming)
    const [related] = await db.execute(
      `SELECT e.*, d.name AS dept_name FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.department_id = ? AND e.id != ? AND e.is_published = 1
       ORDER BY e.event_date DESC LIMIT 4`,
      [event.department_id, event.id]
    );

    res.json({ success: true, event, photos, related });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── ADMIN ───────────────────────────────────────────────────────────
router.use('/admin', requireAdmin);

const posterUpload = upload.single('poster');

// GET /api/events/admin/all
router.get('/admin/all', async (req, res) => {
  try {
    const { search, dept, category, status } = req.query;
    let conditions = [];
    const params = [];

    if (search)   { conditions.push('(e.title LIKE ? OR e.organizer LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (dept)     { conditions.push('e.department_id = ?'); params.push(dept); }
    if (category) { conditions.push('e.category = ?'); params.push(category); }
    if (status)   { conditions.push('e.status = ?'); params.push(status); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.execute(
      `SELECT e.*, d.name AS dept_name,
              COUNT(ep.id) AS photo_count
       FROM events e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN event_photos ep ON ep.event_id = e.id
       ${where}
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      params
    );
    res.json({ success: true, events: rows, categories: EVENT_CATEGORIES });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/events/admin — create event
router.post('/admin', posterUpload, async (req, res) => {
  try {
    const { title, description, department_id, category, event_date, start_time, end_time,
            venue, organizer, registration_info, status, is_published } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Event title is required' });

    const slug   = makeSlug(title);
    const poster = req.file?.filename || null;

    const [result] = await db.execute(
      `INSERT INTO events (title, slug, description, department_id, category, event_date,
       start_time, end_time, venue, organizer, poster, registration_info, status, is_published)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [title, slug, description || null, department_id || null,
       category || 'Other', event_date || null, start_time || null, end_time || null,
       venue || null, organizer || null, poster, registration_info || null,
       status || 'upcoming', is_published !== undefined ? parseInt(is_published) : 1]
    );

    await logActivity(req.session.userId, 'Add Event', `Added event: ${title}`, req);
    res.json({ success: true, message: 'Event created', id: result.insertId, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/events/admin/:id
router.put('/admin/:id', posterUpload, async (req, res) => {
  try {
    const id = req.params.id;
    const [existing] = await db.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });

    const { title, description, department_id, category, event_date, start_time, end_time,
            venue, organizer, registration_info, status, is_published } = req.body;

    const slug   = title ? makeSlug(title) : existing[0].slug;
    const poster = req.file?.filename || existing[0].poster;

    await db.execute(
      `UPDATE events SET title=?, slug=?, description=?, department_id=?, category=?,
       event_date=?, start_time=?, end_time=?, venue=?, organizer=?, poster=?,
       registration_info=?, status=?, is_published=? WHERE id=?`,
      [title || existing[0].title, slug,
       description !== undefined ? description : existing[0].description,
       department_id || existing[0].department_id,
       category || existing[0].category,
       event_date || existing[0].event_date,
       start_time !== undefined ? start_time : existing[0].start_time,
       end_time !== undefined ? end_time : existing[0].end_time,
       venue || existing[0].venue, organizer || existing[0].organizer, poster,
       registration_info !== undefined ? registration_info : existing[0].registration_info,
       status || existing[0].status,
       is_published !== undefined ? parseInt(is_published) : existing[0].is_published,
       id]
    );

    await logActivity(req.session.userId, 'Edit Event', `Updated event: ${title || existing[0].title}`, req);
    res.json({ success: true, message: 'Event updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/events/admin/:id
router.delete('/admin/:id', async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT title FROM events WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    await db.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
    await logActivity(req.session.userId, 'Delete Event', `Deleted event: ${existing[0].title}`, req);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/events/admin/:id/toggle-publish
router.patch('/admin/:id/toggle-publish', async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT is_published, title FROM events WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    const newVal = existing[0].is_published === 1 ? 0 : 1;
    await db.execute('UPDATE events SET is_published = ? WHERE id = ?', [newVal, req.params.id]);
    await logActivity(req.session.userId, 'Toggle Event', `${newVal ? 'Published' : 'Unpublished'} event: ${existing[0].title}`, req);
    res.json({ success: true, is_published: newVal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── EVENT PHOTOS ────────────────────────────────────────────────────

const photosUpload = upload.array('photos', 20);

// GET /api/events/admin/:id/photos
router.get('/admin/:id/photos', async (req, res) => {
  try {
    const [photos] = await db.execute(
      'SELECT * FROM event_photos WHERE event_id = ? ORDER BY sort_order, created_at',
      [req.params.id]
    );
    res.json({ success: true, photos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/events/admin/:id/photos — upload multiple
router.post('/admin/:id/photos', photosUpload, async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const titles = Array.isArray(req.body.titles) ? req.body.titles : [];
    const inserted = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const title = titles[i] || null;
      const [result] = await db.execute(
        'INSERT INTO event_photos (event_id, photo, title, sort_order) VALUES (?,?,?,?)',
        [req.params.id, file.filename, title, i]
      );
      inserted.push({ id: result.insertId, photo: file.filename, title });
    }
    await logActivity(req.session.userId, 'Upload Event Photos', `Uploaded ${req.files.length} photos to event #${req.params.id}`, req);
    res.json({ success: true, message: `${req.files.length} photo(s) uploaded`, photos: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/events/admin/photos/:photoId
router.delete('/admin/photos/:photoId', async (req, res) => {
  try {
    await db.execute('DELETE FROM event_photos WHERE id = ?', [req.params.photoId]);
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/events/admin/photos/:photoId — update title
router.patch('/admin/photos/:photoId', async (req, res) => {
  try {
    await db.execute('UPDATE event_photos SET title = ? WHERE id = ?', [req.body.title || null, req.params.photoId]);
    res.json({ success: true, message: 'Photo updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
