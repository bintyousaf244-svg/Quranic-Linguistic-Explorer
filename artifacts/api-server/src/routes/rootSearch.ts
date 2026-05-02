import { Router } from 'express';

const router = Router();

interface AlquranMatch {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
  numberInSurah: number;
}

router.get('/root-search', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 Arabic characters' });
    return;
  }

  const root = q.trim();

  try {
    const encoded = encodeURIComponent(root);
    const url = `https://api.alquran.cloud/v1/search/${encoded}/all/quran-simple-clean`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      req.log.warn({ status: response.status }, 'alquran.cloud search failed');
      res.status(502).json({ error: 'Search service unavailable' });
      return;
    }

    const json = (await response.json()) as {
      status: string;
      data: { count: number; matches: AlquranMatch[] };
    };

    if (json.status !== 'OK') {
      res.status(502).json({ error: 'Search returned non-OK status' });
      return;
    }

    const matches = json.data.matches ?? [];

    res.json({
      count: json.data.count,
      root,
      matches: matches.map((m) => ({
        surahNumber: m.surah.number,
        surahName: m.surah.name,
        surahEnglish: m.surah.englishName,
        surahTranslation: m.surah.englishNameTranslation,
        ayahNumber: m.numberInSurah,
        text: m.text,
      })),
    });
  } catch (err) {
    req.log.error({ err }, 'Root search error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
