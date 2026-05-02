import { Router } from 'express';
import { logger } from '../lib/logger';

const router = Router();

const TAFSIR_IDS: Record<string, number> = {
  'en.kathir': 169,
  'ur.maarifulquran': 818,
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const cache = new Map<string, { numberInSurah: number; text: string }[]>();

router.get('/tafseer/:surahNumber/:edition', async (req, res) => {
  const { surahNumber, edition } = req.params;
  const surahNum = Number(surahNumber);

  if (!surahNum || surahNum < 1 || surahNum > 114) {
    res.status(400).json({ error: 'Invalid surah number' });
    return;
  }

  const tafsirId = TAFSIR_IDS[edition];
  if (!tafsirId) {
    res.status(400).json({ error: `Unknown edition: ${edition}` });
    return;
  }

  const cacheKey = `${surahNum}:${edition}`;
  if (cache.has(cacheKey)) {
    res.json({ ayahs: cache.get(cacheKey) });
    return;
  }

  try {
    const url = `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_chapter/${surahNum}?fields=text`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`quran.com returned ${response.status}`);
    }

    const json = await response.json() as { tafsirs: Array<{ verse_key: string; text: string }> };
    const ayahs = (json.tafsirs ?? []).map((t) => {
      const parts = t.verse_key.split(':');
      const numberInSurah = parseInt(parts[1] ?? '0', 10);
      return { numberInSurah, text: stripHtml(t.text ?? '') };
    }).filter(a => a.numberInSurah > 0 && a.text.length > 0);

    cache.set(cacheKey, ayahs);
    res.json({ ayahs });
  } catch (err) {
    logger.error({ err }, 'Tafseer proxy error');
    res.status(502).json({ error: 'Failed to fetch tafseer' });
  }
});

export default router;
