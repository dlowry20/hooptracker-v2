const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /api/sessions — get own sessions
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await pool.query(
      `SELECT id, session_date, notes, created_at
       FROM sessions
       WHERE user_id = $1
       ORDER BY session_date DESC`,
      [req.user.id]
    );

    const sessionIds = sessions.rows.map(s => s.id);
    let shotsMap = {};
    if (sessionIds.length > 0) {
      const shots = await pool.query(
        `SELECT session_id, zone_id, attempts, makes
         FROM shots WHERE session_id = ANY($1::int[])`,
        [sessionIds]
      );
      shots.rows.forEach(shot => {
        if (!shotsMap[shot.session_id]) shotsMap[shot.session_id] = [];
        shotsMap[shot.session_id].push(shot);
      });
    }

    res.json(sessions.rows.map(s => ({ ...s, shots: shotsMap[s.id] || [] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sessions — create session with shots
router.post('/', auth, async (req, res) => {
  const { session_date, notes, shots } = req.body;
  if (!session_date) return res.status(400).json({ error: 'session_date is required' });
  if (!shots || !Array.isArray(shots) || shots.length === 0)
    return res.status(400).json({ error: 'At least one zone with shots is required' });

  // Validate shots
  for (const shot of shots) {
    if (shot.zone_id < 1 || shot.zone_id > 10)
      return res.status(400).json({ error: `Invalid zone_id: ${shot.zone_id}` });
    if (shot.attempts < 0 || shot.makes < 0)
      return res.status(400).json({ error: 'Attempts and makes must be non-negative' });
    if (shot.makes > shot.attempts)
      return res.status(400).json({ error: `Makes cannot exceed attempts for zone ${shot.zone_id}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      'INSERT INTO sessions (user_id, session_date, notes) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, session_date, notes || null]
    );
    const session = sessionResult.rows[0];

    const insertedShots = [];
    for (const shot of shots) {
      const shotResult = await client.query(
        'INSERT INTO shots (session_id, zone_id, attempts, makes) VALUES ($1, $2, $3, $4) RETURNING *',
        [session.id, shot.zone_id, shot.attempts, shot.makes]
      );
      insertedShots.push(shotResult.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...session, shots: insertedShots });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/sessions/:id — update own session
router.put('/:id', auth, async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { session_date, notes, shots } = req.body;

  const client = await pool.connect();
  try {
    // Verify ownership
    const check = await client.query('SELECT user_id FROM sessions WHERE id = $1', [sessionId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE sessions SET session_date = COALESCE($1, session_date), notes = $2
       WHERE id = $3 RETURNING *`,
      [session_date, notes ?? null, sessionId]
    );

    if (shots && Array.isArray(shots)) {
      // Validate
      for (const shot of shots) {
        if (shot.makes > shot.attempts)
          throw new Error(`Makes cannot exceed attempts for zone ${shot.zone_id}`);
      }
      await client.query('DELETE FROM shots WHERE session_id = $1', [sessionId]);
      for (const shot of shots) {
        await client.query(
          'INSERT INTO shots (session_id, zone_id, attempts, makes) VALUES ($1, $2, $3, $4)',
          [sessionId, shot.zone_id, shot.attempts, shot.makes]
        );
      }
    }

    const shotsResult = await client.query('SELECT * FROM shots WHERE session_id = $1', [sessionId]);
    await client.query('COMMIT');
    res.json({ ...updated.rows[0], shots: shotsResult.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/sessions/:id — delete own session
router.delete('/:id', auth, async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const check = await pool.query('SELECT user_id FROM sessions WHERE id = $1', [sessionId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
