// ─────────────────────────────────────────────
//  Public results API (requires login only)
// ─────────────────────────────────────────────
const router = require('express').Router();
const db     = require('../config/db');
const { requireLogin } = require('../middleware/auth');

router.use(requireLogin);

router.get('/', async (req, res) => {
  try {
    const [candidates] = await db.execute(`
      SELECT c.id,c.name,c.party,c.photo,
        (SELECT COUNT(*) FROM votes WHERE candidate_id=c.id) as vote_count
      FROM candidates c WHERE c.status=1 ORDER BY vote_count DESC
    `);
    const [tvRows]  = await db.execute('SELECT COUNT(*) as total_votes FROM votes');
    const total_votes = tvRows[0]?.total_votes ?? 0;

    const [elecRows] = await db.execute('SELECT * FROM election_settings LIMIT 1');
    const election   = elecRows[0];

    candidates.forEach(c => {
      c.vote_count = parseInt(c.vote_count);
      c.pct = total_votes > 0 ? Math.round((c.vote_count / total_votes) * 100) : 0;
    });

    res.json({ success: true, candidates, total_votes, election, timestamp: new Date() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
