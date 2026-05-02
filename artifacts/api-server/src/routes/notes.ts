import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { pool } from '@workspace/db';

const router = Router();

router.get('/notes', async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, surah_number AS "surahNumber", ayah_number AS "ayahNumber",
              content, updated_at AS "updatedAt"
       FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } finally { client.release(); }
});

router.post('/notes', async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { surahNumber, ayahNumber, content } = req.body;
  if (!surahNumber || !ayahNumber || content === undefined) {
    res.status(400).json({ error: 'surahNumber, ayahNumber, content required' });
    return;
  }

  const id = `${userId}_${surahNumber}_${ayahNumber}`;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO notes (id, user_id, surah_number, ayah_number, content, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, surah_number, ayah_number)
       DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
      [id, userId, surahNumber, ayahNumber, content]
    );
    res.json({ success: true });
  } finally { client.release(); }
});

router.delete('/notes/:surahNumber/:ayahNumber', async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { surahNumber, ayahNumber } = req.params;
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM notes WHERE user_id = $1 AND surah_number = $2 AND ayah_number = $3',
      [userId, surahNumber, ayahNumber]
    );
    res.json({ success: true });
  } finally { client.release(); }
});

export default router;
