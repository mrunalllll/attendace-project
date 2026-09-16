// ─────────────────────────────────────────────
//  Voter routes
// ─────────────────────────────────────────────
const router = require('express').Router();
const db     = require('../config/db');
const { requireVoter, logActivity, STATUS } = require('../middleware/auth');

router.use(requireVoter);

// ── GET /api/voter/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.session.userId;

    const [users]   = await db.execute('SELECT * FROM users WHERE id=? LIMIT 1', [userId]);
    const user      = users[0];
    if (!user || user.status === STATUS.BLOCKED)
      return res.status(403).json({ success: false, message: 'Account blocked.' });

    const [elecRows] = await db.execute('SELECT * FROM election_settings LIMIT 1');
    const election   = elecRows[0];

    const [voteRows] = await db.execute(
      'SELECT v.*,c.name as cname,c.photo as cphoto,c.party FROM votes v JOIN candidates c ON v.candidate_id=c.id WHERE v.user_id=? LIMIT 1',
      [userId]
    );
    const voteRow = voteRows[0] || null;

    const [tvRows]     = await db.execute('SELECT COUNT(*) as total_votes FROM votes');
    const total_votes  = tvRows[0]?.total_votes ?? 0;

    const [candidates] = await db.execute(`
      SELECT c.*, (SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vote_count
      FROM candidates c WHERE c.status=1 ORDER BY vote_count DESC
    `);

    const [activities] = await db.execute(
      'SELECT action,description,created_at FROM activity_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    const totalCandVotes = candidates.reduce((s, c) => s + parseInt(c.vote_count), 0);
    candidates.forEach(c => {
      c.pct = totalCandVotes > 0 ? Math.round((c.vote_count / totalCandVotes) * 100) : 0;
    });

    res.json({
      success: true,
      user, election,
      hasVoted: !!voteRow,
      voteRow,
      total_votes,
      candidates,
      activities,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

// ── POST /api/voter/vote
router.post('/vote', async (req, res) => {
  try {
    const userId      = req.session.userId;
    const candidateId = parseInt(req.body.candidate_id);

    const [elecRows]  = await db.execute('SELECT * FROM election_settings LIMIT 1');
    const election    = elecRows[0];
    if (!election || election.election_status !== 'active')
      return res.status(400).json({ success: false, message: 'Election is not currently active.' });

    const [candRows]  = await db.execute(
      'SELECT id,name FROM candidates WHERE id=? AND status=1 LIMIT 1', [candidateId]
    );
    const candidate = candRows[0];
    if (!candidate)
      return res.status(400).json({ success: false, message: 'Invalid candidate.' });

    const [alreadyRows] = await db.execute('SELECT id FROM votes WHERE user_id=? LIMIT 1', [userId]);
    if (alreadyRows[0])
      return res.status(409).json({ success: false, message: 'You have already cast your vote.' });

    const [userRows] = await db.execute('SELECT status FROM users WHERE id=? LIMIT 1', [userId]);
    const userRec    = userRows[0];
    if (!userRec || userRec.status === STATUS.BLOCKED)
      return res.status(403).json({ success: false, message: 'Your account is blocked.' });

    // Transaction
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      await conn.execute('INSERT INTO votes (user_id,candidate_id,ip_address) VALUES (?,?,?)', [userId, candidateId, ip]);
      await conn.execute('UPDATE users SET status=? WHERE id=?',            [STATUS.VOTED, userId]);
      await conn.execute('UPDATE candidates SET votes=votes+1 WHERE id=?',  [candidateId]);
      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback(); conn.release(); throw err;
    }

    req.session.userStatus = STATUS.VOTED;
    await logActivity(userId, 'Vote Cast', `Voted for: ${candidate.name}`, req);
    res.json({ success: true, message: '✅ Your vote has been cast successfully!' });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Voting failed. Please try again.' });
  }
});

module.exports = router;
