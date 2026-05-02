import { Router } from 'express';

const router = Router();

const SOURCES = [
  { id: 'iraab-daas', label: 'إعراب القرآن — الدعاس وحميدان وقاسم' },
  { id: 'iraab-aldarweesh', label: 'إعراب القرآن وبيانه — محيي الدين الدرويش' },
  { id: 'iraab-alnahas', label: 'إعراب القرآن — النحاس' },
];

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept': 'application/json, */*',
  'Origin': 'https://tafsir.app',
};

router.get('/grammar', async (req, res) => {
  const { surah, ayah } = req.query;

  if (!surah || !ayah) {
    res.status(400).json({ error: 'Missing surah or ayah parameters' });
    return;
  }

  const s = Number(surah);
  const a = Number(ayah);

  if (!Number.isInteger(s) || !Number.isInteger(a) || s < 1 || s > 114 || a < 1) {
    res.status(400).json({ error: 'Invalid surah or ayah parameters' });
    return;
  }

  for (const source of SOURCES) {
    try {
      const url = `https://tafsir.app/get.php?s=${s}&a=${a}&src=${source.id}&ver=1`;
      const response = await fetch(url, { headers: FETCH_HEADERS });

      if (!response.ok) {
        req.log.warn({ status: response.status, src: source.id }, 'tafsir.app returned non-200');
        continue;
      }

      const json = (await response.json()) as { data?: string; ayahs_start?: number; count?: number };

      if (json.data && json.data.trim().length > 10) {
        res.json({
          data: json.data.trim(),
          source: source.id,
          sourceLabel: source.label,
          ayahsStart: json.ayahs_start ?? a,
          count: json.count ?? 1,
        });
        return;
      }
    } catch (err) {
      req.log.warn({ err, src: source.id }, 'Failed fetching from tafsir.app source');
    }
  }

  res.json({ data: null });
});

export default router;
