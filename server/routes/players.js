const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /api/players — list all players (authenticated, read-only)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/players/:id/stats — zone breakdown for a player (authenticated, read-only)
router.get('/:id/stats', auth, async (req, res) => {
  const playerId = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `SELECT
        sh.zone_id,
        SUM(sh.attempts) AS total_attempts,
        SUM(sh.makes)    AS total_makes
       FROM shots sh
       JOIN sessions se ON se.id = sh.session_id
       WHERE se.user_id = $1
       GROUP BY sh.zone_id
       ORDER BY sh.zone_id`,
      [playerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/players/:id/sessions — all sessions for a player (authenticated, read-only)
router.get('/:id/sessions', auth, async (req, res) => {
  const playerId = parseInt(req.params.id);
  try {
    const sessions = await pool.query(
      `SELECT id, session_date, notes, created_at
       FROM sessions
       WHERE user_id = $1
       ORDER BY session_date DESC`,
      [playerId]
    );

    // Attach shots to each session
    const sessionIds = sessions.rows.map(s => s.id);
    let shotsMap = {};
    if (sessionIds.length > 0) {
      const shots = await pool.query(
        `SELECT session_id, zone_id, attempts, makes
         FROM shots
         WHERE session_id = ANY($1::int[])`,
        [sessionIds]
      );
      shots.rows.forEach(shot => {
        if (!shotsMap[shot.session_id]) shotsMap[shot.session_id] = [];
        shotsMap[shot.session_id].push(shot);
      });
    }

    const result = sessions.rows.map(s => ({
      ...s,
      shots: shotsMap[s.id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
