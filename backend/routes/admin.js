// ─────────────────────────────────────────────
//  Admin routes
// ─────────────────────────────────────────────
const router = require('express').Router();
const db     = require('../config/db');
const upload = require('../middleware/upload');
const { requireAdmin, logActivity, ROLES, STATUS } = require('../middleware/auth');

router.use(requireAdmin);

// ════════════════════════════════
//  DASHBOARD STATS
// ════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const [tuRows] = await db.execute(`SELECT COUNT(*) as total_users FROM users WHERE role=${ROLES.VOTER}`);
    const [tcRows] = await db.execute('SELECT COUNT(*) as total_candidates FROM candidates');
    const [tvRows] = await db.execute('SELECT COUNT(*) as total_votes FROM votes');
    const [vuRows] = await db.execute(`SELECT COUNT(*) as voted_users FROM users WHERE role=${ROLES.VOTER} AND status=${STATUS.VOTED}`);
    const [buRows] = await db.execute(`SELECT COUNT(*) as blocked_users FROM users WHERE status=${STATUS.BLOCKED}`);
    const [elecRows] = await db.execute('SELECT * FROM election_settings LIMIT 1');

    const total_users      = tuRows[0]?.total_users      ?? 0;
    const total_candidates = tcRows[0]?.total_candidates ?? 0;
    const total_votes      = tvRows[0]?.total_votes      ?? 0;
    const voted_users      = vuRows[0]?.voted_users      ?? 0;
    const blocked_users    = buRows[0]?.blocked_users    ?? 0;
    const election         = elecRows[0] ?? null;

    const [cand_chart] = await db.execute(`
      SELECT c.name, (SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vc
      FROM candidates c WHERE c.status=1 ORDER BY vc DESC LIMIT 10
    `);
    const [daily] = await db.execute(`
      SELECT date(voted_at) as day, COUNT(*) as cnt FROM votes
      WHERE voted_at >= datetime('now','-7 days')
      GROUP BY date(voted_at) ORDER BY day ASC
    `);
    const [recent_logs] = await db.execute(`
      SELECT al.*, u.name as uname FROM activity_logs al
      LEFT JOIN users u ON al.user_id=u.id
      ORDER BY al.created_at DESC LIMIT 8
    `);
    const [topRows] = await db.execute(`
      SELECT c.name, c.party, c.photo,
        (SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vc
      FROM candidates c ORDER BY vc DESC LIMIT 1
    `);
    const top_cand = topRows[0] ?? null;

    // ── College management stats ──────────────────
    const [deptRows]    = await db.execute('SELECT COUNT(*) as cnt FROM departments WHERE status=1');
    const [evRows]      = await db.execute('SELECT COUNT(*) as cnt FROM events WHERE is_published=1');
    const [upEvRows]    = await db.execute("SELECT COUNT(*) as cnt FROM events WHERE is_published=1 AND status='upcoming'");
    const [gallRows]    = await db.execute('SELECT COUNT(*) as cnt FROM gallery');
    const [annRows]     = await db.execute('SELECT COUNT(*) as cnt FROM announcements WHERE is_published=1');

    res.json({
      success: true,
      stats: {
        total_users, total_candidates, total_votes, voted_users,
        pending_users: total_users - voted_users, blocked_users,
        turnout_pct: total_users > 0 ? Math.round((voted_users / total_users) * 100) : 0,
        // college stats
        total_departments:  deptRows[0]?.cnt   ?? 0,
        total_events:       evRows[0]?.cnt      ?? 0,
        upcoming_events:    upEvRows[0]?.cnt    ?? 0,
        total_gallery:      gallRows[0]?.cnt    ?? 0,
        total_announcements: annRows[0]?.cnt    ?? 0,
      },
      election, cand_chart, daily, recent_logs, top_cand,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

// ════════════════════════════════
//  CANDIDATES
// ════════════════════════════════
router.get('/candidates', async (req, res) => {
  try {
    const [candidates] = await db.execute(`
      SELECT c.*, (SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vote_count
      FROM candidates c ORDER BY c.id DESC
    `);
    const [tvRows]    = await db.execute('SELECT COUNT(*) as total_votes FROM votes');
    const total_votes = tvRows[0]?.total_votes ?? 0;
    candidates.forEach(c => {
      c.pct = total_votes > 0 ? Math.round((c.vote_count / total_votes) * 100) : 0;
    });
    res.json({ success: true, candidates, total_votes });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

router.post('/candidates', upload.single('photo'), async (req, res) => {
  try {
    const { name, party, mobile, email, manifesto, status: st } = req.body;
    if (!name?.trim() || !party?.trim())
      return res.status(400).json({ success: false, message: 'Name and party are required.' });
    const photo = req.file?.filename || 'default.png';
    const result = await db.execute(
      'INSERT INTO candidates (name,party,mobile,email,photo,manifesto,status) VALUES (?,?,?,?,?,?,?)',
      [name.trim(), party.trim(), mobile || null, email || null, photo, manifesto || '', parseInt(st ?? 1)]
    );
    const id = result[0].insertId;
    await logActivity(req.session.userId, 'Add Candidate', `Added: ${name}`, req);
    res.json({ success: true, message: `Candidate "${name}" added.`, id });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to add candidate.' }); }
});

router.put('/candidates/:id', upload.single('photo'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, party, mobile, email, manifesto, status: st } = req.body;
    if (!name?.trim() || !party?.trim())
      return res.status(400).json({ success: false, message: 'Name and party are required.' });
    if (req.file) {
      await db.execute(
        'UPDATE candidates SET name=?,party=?,mobile=?,email=?,photo=?,manifesto=?,status=? WHERE id=?',
        [name.trim(), party.trim(), mobile||null, email||null, req.file.filename, manifesto||'', parseInt(st??1), id]
      );
    } else {
      await db.execute(
        'UPDATE candidates SET name=?,party=?,mobile=?,email=?,manifesto=?,status=? WHERE id=?',
        [name.trim(), party.trim(), mobile||null, email||null, manifesto||'', parseInt(st??1), id]
      );
    }
    await logActivity(req.session.userId, 'Edit Candidate', `Edited ID: ${id}`, req);
    res.json({ success: true, message: 'Candidate updated.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to update.' }); }
});

router.delete('/candidates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute('DELETE FROM candidates WHERE id=?', [id]);
    await logActivity(req.session.userId, 'Delete Candidate', `Deleted ID: ${id}`, req);
    res.json({ success: true, message: 'Candidate deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to delete.' }); }
});

router.patch('/candidates/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute('UPDATE candidates SET status = 1-status WHERE id=?', [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false }); }
});

// ════════════════════════════════
//  USERS (voters)
// ════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    const { search = '', filter = 'all', page = 1 } = req.query;
    const perPage = 15;
    const offset  = (parseInt(page) - 1) * perPage;

    let where  = `WHERE u.role=${ROLES.VOTER}`;
    const vals = [];

    if (search) {
      where += ' AND (u.name LIKE ? OR u.mobile LIKE ? OR u.email LIKE ?)';
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (filter === 'voted')   where += ` AND u.status=${STATUS.VOTED}`;
    if (filter === 'pending') where += ` AND u.status=${STATUS.NOT_VOTED}`;
    if (filter === 'blocked') where += ` AND u.status=${STATUS.BLOCKED}`;

    const [totalRows] = await db.execute(`SELECT COUNT(*) as total FROM users u ${where}`, vals);
    const total       = totalRows[0]?.total ?? 0;

    const [users] = await db.execute(
      `SELECT u.*,
        (SELECT c.name FROM candidates c JOIN votes v ON v.candidate_id=c.id WHERE v.user_id=u.id LIMIT 1) as voted_for
       FROM users u ${where} ORDER BY u.id DESC LIMIT ${perPage} OFFSET ${offset}`,
      vals
    );
    res.json({ success: true, users, total, totalPages: Math.ceil(total / perPage), page: parseInt(page) });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

router.patch('/users/:id/block', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(`UPDATE users SET status=${STATUS.BLOCKED} WHERE id=? AND role=${ROLES.VOTER}`, [id]);
    await logActivity(req.session.userId, 'Block User', `Blocked ID: ${id}`, req);
    res.json({ success: true, message: 'User blocked.' });
  } catch (e) { res.status(500).json({ success: false }); }
});

router.patch('/users/:id/unblock', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(`UPDATE users SET status=${STATUS.NOT_VOTED} WHERE id=? AND role=${ROLES.VOTER}`, [id]);
    await logActivity(req.session.userId, 'Unblock User', `Unblocked ID: ${id}`, req);
    res.json({ success: true, message: 'User unblocked.' });
  } catch (e) { res.status(500).json({ success: false }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute(`DELETE FROM users WHERE id=? AND role=${ROLES.VOTER}`, [id]);
    await logActivity(req.session.userId, 'Delete User', `Deleted ID: ${id}`, req);
    res.json({ success: true, message: 'User deleted.' });
  } catch (e) { res.status(500).json({ success: false }); }
});

// ════════════════════════════════
//  ELECTION
// ════════════════════════════════
router.get('/election', async (req, res) => {
  try {
    const [elecRows]   = await db.execute('SELECT * FROM election_settings LIMIT 1');
    const election     = elecRows[0] ?? null;
    const [tvRows]     = await db.execute('SELECT COUNT(*) as total_votes FROM votes');
    const [tuRows]     = await db.execute(`SELECT COUNT(*) as total_users FROM users WHERE role=${ROLES.VOTER}`);
    const [vuRows]     = await db.execute(`SELECT COUNT(*) as voted_users FROM users WHERE role=${ROLES.VOTER} AND status=${STATUS.VOTED}`);
    const [candidates] = await db.execute(`
      SELECT c.*, (SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vc
      FROM candidates c ORDER BY vc DESC
    `);

    let winner = null;
    if (election?.winner_declared && election?.winner_candidate_id) {
      const [wRows] = await db.execute(
        `SELECT c.*, (SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vc FROM candidates c WHERE c.id=?`,
        [election.winner_candidate_id]
      );
      winner = wRows[0] ?? null;
    }

    res.json({
      success: true,
      election,
      total_votes:  tvRows[0]?.total_votes  ?? 0,
      total_users:  tuRows[0]?.total_users  ?? 0,
      voted_users:  vuRows[0]?.voted_users  ?? 0,
      candidates,
      winner,
    });
  } catch (e) { res.status(500).json({ success: false }); }
});

router.post('/election/action', async (req, res) => {
  try {
    const { action } = req.body;
    switch (action) {
      case 'update_settings': {
        const { election_name, start_date, end_date, allow_registration } = req.body;
        await db.execute(
          'UPDATE election_settings SET election_name=?,start_date=?,end_date=?,allow_registration=? WHERE id=1',
          [election_name, start_date || null, end_date || null, allow_registration ? 1 : 0]
        );
        await logActivity(req.session.userId, 'Election Settings', 'Updated', req);
        return res.json({ success: true, message: 'Settings updated.' });
      }
      case 'start':
        await db.execute("UPDATE election_settings SET election_status='active',start_date=datetime('now') WHERE id=1");
        await db.execute("INSERT INTO notifications (title,message,type) VALUES ('Election Started','The election is now live!','success')");
        await logActivity(req.session.userId, 'Start Election', '', req);
        return res.json({ success: true, message: 'Election started.' });
      case 'end':
        await db.execute("UPDATE election_settings SET election_status='ended',end_date=datetime('now') WHERE id=1");
        await db.execute("INSERT INTO notifications (title,message,type) VALUES ('Election Ended','Voting has closed.','warning')");
        await logActivity(req.session.userId, 'End Election', '', req);
        return res.json({ success: true, message: 'Election ended.' });
      case 'reset':
        await db.execute("UPDATE election_settings SET election_status='pending',winner_declared=0,winner_candidate_id=NULL WHERE id=1");
        await db.execute('DELETE FROM votes');
        await db.execute(`UPDATE users SET status=${STATUS.NOT_VOTED} WHERE role=${ROLES.VOTER} AND status=${STATUS.VOTED}`);
        await db.execute('UPDATE candidates SET votes=0');
        await logActivity(req.session.userId, 'Reset Election', 'All votes cleared', req);
        return res.json({ success: true, message: 'Election reset. All votes cleared.' });
      case 'declare_winner': {
        const [topRows] = await db.execute('SELECT candidate_id, COUNT(*) as c FROM votes GROUP BY candidate_id ORDER BY c DESC LIMIT 1');
        const top = topRows[0];
        if (!top) return res.status(400).json({ success: false, message: 'No votes found.' });
        await db.execute('UPDATE election_settings SET winner_declared=1,winner_candidate_id=? WHERE id=1', [top.candidate_id]);
        const [wcRows] = await db.execute('SELECT name FROM candidates WHERE id=?', [top.candidate_id]);
        const wc = wcRows[0];
        await db.execute(
          "INSERT INTO notifications (title,message,type) VALUES ('Winner Declared',?,'success')",
          [`${wc?.name} has been declared the winner!`]
        );
        await logActivity(req.session.userId, 'Declare Winner', `Winner: ${wc?.name}`, req);
        return res.json({ success: true, message: `Winner declared: ${wc?.name}` });
      }
      default:
        return res.status(400).json({ success: false, message: 'Unknown action.' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Action failed.' });
  }
});

// ════════════════════════════════
//  ANALYTICS
// ════════════════════════════════
router.get('/analytics', async (req, res) => {
  try {
    const [tuRows]  = await db.execute(`SELECT COUNT(*) as total_users FROM users WHERE role=${ROLES.VOTER}`);
    const [vRows]   = await db.execute(`SELECT COUNT(*) as voted FROM users WHERE role=${ROLES.VOTER} AND status=${STATUS.VOTED}`);
    const [blRows]  = await db.execute(`SELECT COUNT(*) as blocked FROM users WHERE status=${STATUS.BLOCKED}`);
    const [tcRows]  = await db.execute('SELECT COUNT(*) as total_candidates FROM candidates');
    const [tvRows]  = await db.execute('SELECT COUNT(*) as total_votes FROM votes');

    const total_users      = tuRows[0]?.total_users      ?? 0;
    const voted            = vRows[0]?.voted             ?? 0;
    const blocked          = blRows[0]?.blocked          ?? 0;
    const total_candidates = tcRows[0]?.total_candidates ?? 0;
    const total_votes      = tvRows[0]?.total_votes      ?? 0;

    const [cand_data] = await db.execute(`
      SELECT c.name,c.party,c.photo,(SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vc
      FROM candidates c ORDER BY vc DESC
    `);
    const [hourly] = await db.execute(`
      SELECT strftime('%H', voted_at) as hr, COUNT(*) as cnt
      FROM votes WHERE date(voted_at)=date('now')
      GROUP BY strftime('%H', voted_at) ORDER BY hr
    `);
    const [daily] = await db.execute(`
      SELECT date(voted_at) as day, COUNT(*) as cnt FROM votes
      WHERE voted_at >= datetime('now','-14 days')
      GROUP BY date(voted_at) ORDER BY day
    `);

    cand_data.forEach(c => {
      c.pct = total_votes > 0 ? Math.round((c.vc / total_votes) * 100) : 0;
    });

    res.json({
      success: true,
      stats: {
        total_users, voted, not_voted: total_users - voted,
        blocked, total_candidates, total_votes,
        turnout_pct: total_users > 0 ? Math.round((voted / total_users) * 100) : 0,
      },
      cand_data, hourly, daily,
    });
  } catch (e) { res.status(500).json({ success: false }); }
});

// ════════════════════════════════
//  ACTIVITY LOGS
// ════════════════════════════════
router.get('/logs', async (req, res) => {
  try {
    const { search = '', action_filter = '', page = 1 } = req.query;
    const perPage = 20;
    const offset  = (parseInt(page) - 1) * perPage;
    let where     = 'WHERE 1=1';
    const vals    = [];
    if (search) {
      where += ' AND (u.name LIKE ? OR al.description LIKE ? OR al.ip_address LIKE ?)';
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (action_filter) { where += ' AND al.action=?'; vals.push(action_filter); }

    const [totalRows] = await db.execute(
      `SELECT COUNT(*) as total FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id ${where}`, vals
    );
    const total = totalRows[0]?.total ?? 0;

    const [logs] = await db.execute(
      `SELECT al.*,u.name as uname,u.photo as uphoto FROM activity_logs al
       LEFT JOIN users u ON al.user_id=u.id ${where}
       ORDER BY al.created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      vals
    );
    const [atRows] = await db.execute('SELECT DISTINCT action FROM activity_logs ORDER BY action');
    res.json({
      success: true, logs, total,
      totalPages: Math.ceil(total / perPage),
      page: parseInt(page),
      action_types: atRows,
    });
  } catch (e) { res.status(500).json({ success: false }); }
});

router.delete('/logs', async (req, res) => {
  try {
    await db.execute('DELETE FROM activity_logs');
    await logActivity(req.session.userId, 'Clear Logs', 'All logs cleared', req);
    res.json({ success: true, message: 'All logs cleared.' });
  } catch (e) { res.status(500).json({ success: false }); }
});

module.exports = router;
