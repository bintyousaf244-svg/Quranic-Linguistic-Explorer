import { Router } from 'express';

const router = Router();

interface TasreefRow {
  pronoun: string;
  madiMaloom: string;
  mudariMaloom: string;
  mudariMajzum: string;
  mudariMansub: string;
  mudariMuakkad: string;
  amr: string;
  amrMuakkad: string;
  madiMajhool: string;
  mudariMajhool: string;
  mudariMajhoolMajzum: string;
  mudariMajhoolMansub: string;
}

function stripDiacritics(s: string): string {
  return s.replace(/[\u064B-\u065F\u0670]/g, '');
}

function parseQutrubResult(result: Record<string, Record<string, string>>): TasreefRow[] {
  const rows: TasreefRow[] = [];
  const keys = Object.keys(result)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((k) => k > 0);

  for (const k of keys) {
    const row = result[String(k)];
    rows.push({
      pronoun: row['0'] ?? '',
      madiMaloom: row['1'] ?? '',
      mudariMaloom: row['2'] ?? '',
      mudariMajzum: row['3'] ?? '',
      mudariMansub: row['4'] ?? '',
      mudariMuakkad: row['5'] ?? '',
      amr: row['6'] ?? '',
      amrMuakkad: row['7'] ?? '',
      madiMajhool: row['8'] ?? '',
      mudariMajhool: row['9'] ?? '',
      mudariMajhoolMajzum: row['10'] ?? '',
      mudariMajhoolMansub: row['11'] ?? '',
    });
  }
  return rows;
}

router.post('/tasreef', async (req, res) => {
  const { verb } = req.body;

  if (!verb || typeof verb !== 'string' || verb.trim().length < 1) {
    res.status(400).json({ error: 'verb is required' });
    return;
  }

  const bare = stripDiacritics(verb.trim());

  try {
    const url = `https://qutrub.arabeyes.org/api?verb=${encodeURIComponent(bare)}&output=json`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      req.log.warn({ status: response.status }, 'Qutrub API error');
      res.status(502).json({ error: 'Conjugation service unavailable' });
      return;
    }

    const data = await response.json() as { result?: Record<string, Record<string, string>> };

    if (!data.result || Object.keys(data.result).length <= 1) {
      res.status(404).json({
        error: 'Verb not found. Please enter the verb in its past tense (ماضي) form, e.g. كَتَبَ, ذَهَبَ, قَرَأَ',
      });
      return;
    }

    const rows = parseQutrubResult(data.result);

    res.json({
      verb: bare,
      rows,
      source: 'qutrub',
    });
  } catch (err: any) {
    req.log.error({ err }, 'Tasreef fetch error');
    res.status(502).json({ error: 'Conjugation service unavailable. Please try again.' });
  }
});

export default router;
