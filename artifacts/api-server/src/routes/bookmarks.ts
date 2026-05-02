import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { pool } from '@workspace/db';

const router = Router();

router.get('/bookmarks', async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, surah_number AS "surahNumber", ayah_number AS "ayahNumber",
              surah_name AS "surahName", surah_name_ar AS "surahNameAr",
              created_at AS "createdAt"
       FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } finally { client.release(); }
});

router.post('/bookmarks', async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { surahNumber, ayahNumber, surahName, surahNameAr } = req.body;
  if (!surahNumber || !ayahNumber || !surahName) {
    res.status(400).json({ error: 'surahNumber, ayahNumber, surahName required' });
    return;
  }

  const id = `${userId}_${surahNumber}_${ayahNumber}`;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO bookmarks (id, user_id, surah_number, ayah_number, surah_name, surah_name_ar, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, surah_number, ayah_number) DO NOTHING`,
      [id, userId, surahNumber, ayahNumber, surahName, surahNameAr || '']
    );
    res.json({ success: true });
  } finally { client.release(); }
});

router.delete('/bookmarks/:surahNumber/:ayahNumber', async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { surahNumber, ayahNumber } = req.params;
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND surah_number = $2 AND ayah_number = $3',
      [userId, surahNumber, ayahNumber]
    );
    res.json({ success: true });
  } finally { client.release(); }
});

export default router;
