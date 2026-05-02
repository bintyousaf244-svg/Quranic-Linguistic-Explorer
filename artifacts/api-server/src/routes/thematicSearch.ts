import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface AlquranMatch {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
  };
  numberInSurah: number;
}

interface ThematicRoot {
  root: string;
  meaning: string;
  note: string;
}

interface GroqThematicData {
  arabicConcept?: string;
  transliteration?: string;
  summary?: string;
  roots?: ThematicRoot[];
}

router.get('/thematic-search', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  const theme = q.trim();
  const edition = typeof req.query.edition === 'string' ? req.query.edition : 'en.sahih';
  const lang = typeof req.query.lang === 'string' ? req.query.lang : 'en';
  const isUrdu = lang === 'ur';

  try {
    const [groqResult, searchResult] = await Promise.allSettled([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a Quranic scholar. Given an English theme or concept, identify the most relevant Arabic Quranic roots and provide a brief thematic overview. Respond ONLY with valid JSON — no prose, no markdown.',
          },
          {
            role: 'user',
            content: `${isUrdu ? 'Urdu/English' : 'English'} theme: "${theme}"

Respond with this exact JSON structure:
{
  "arabicConcept": "Arabic name of the concept (2-4 words)",
  "transliteration": "romanized transliteration of the Arabic concept",
  "summary": "${isUrdu ? '2-3 sentence overview in Urdu (اردو میں) of how this theme appears in the Quran' : '2-3 sentence overview of how this theme appears in the Quran — its importance, key verses, and Quranic perspective'}",
  "roots": [
    {"root": "رحم", "meaning": "mercy / compassion", "note": "Core root, appears ~114 times"},
    {"root": "غفر", "meaning": "forgiveness", "note": "Divine forgiveness as expression of mercy"}
  ]
}

Include 3-5 of the most relevant roots. Roots must be 3-letter Arabic roots (الجذور الثلاثية).`,
          },
        ],
      }),

      fetch(
        `https://api.alquran.cloud/v1/search/${encodeURIComponent(theme)}/all/${encodeURIComponent(edition)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ),
    ]);

    let thematic: GroqThematicData = {};
    if (groqResult.status === 'fulfilled') {
      try {
        thematic = JSON.parse(groqResult.value.choices[0].message.content ?? '{}') as GroqThematicData;
      } catch {
        req.log.warn('Failed to parse Groq JSON for thematic search');
      }
    } else {
      req.log.warn({ err: groqResult.reason }, 'Groq thematic search failed');
    }

    let verses: {
      surahNumber: number;
      surahName: string;
      surahEnglish: string;
      surahTranslation: string;
      ayahNumber: number;
      translation: string;
    }[] = [];
    let count = 0;

    if (searchResult.status === 'fulfilled' && searchResult.value.ok) {
      const json = (await searchResult.value.json()) as {
        status: string;
        data: { count: number; matches: AlquranMatch[] };
      };
      if (json.status === 'OK') {
        count = json.data.count;
        verses = (json.data.matches ?? []).slice(0, 50).map((m) => ({
          surahNumber: m.surah.number,
          surahName: m.surah.name,
          surahEnglish: m.surah.englishName,
          surahTranslation: m.surah.englishNameTranslation,
          ayahNumber: m.numberInSurah,
          translation: m.text,
        }));
      }
    } else {
      req.log.warn('alquran.cloud thematic search failed');
    }

    res.json({
      theme,
      arabicConcept: thematic.arabicConcept ?? '',
      transliteration: thematic.transliteration ?? '',
      summary: thematic.summary ?? '',
      roots: thematic.roots ?? [],
      count,
      verses,
    });
  } catch (err) {
    req.log.error({ err }, 'Thematic search error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
