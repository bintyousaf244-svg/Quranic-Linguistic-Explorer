import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();

const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;
function getGroqClient(): Groq {
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex % GROQ_KEYS.length] });
}

interface WordInfo {
  root?: string;
  wazn?: string;
  type?: string;
  meaning?: string;
  ar_meaning?: string;
}

const cache = new Map<string, WordInfo>();

router.post('/word-lookup', async (req, res) => {
  const { word } = req.body as { word?: string };
  if (!word?.trim()) {
    res.status(400).json({ error: 'word is required' });
    return;
  }

  const normalized = word.trim();

  if (cache.has(normalized)) {
    res.json(cache.get(normalized));
    return;
  }

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a Quranic Arabic lexicographer. Respond ONLY with a valid JSON object. No markdown, no code blocks, no explanation whatsoever.',
        },
        {
          role: 'user',
          content: `For the Arabic word "${normalized}", return exactly this JSON:\n{"root":"trilateral root letters separated by spaces (e.g. ر ح م)","wazn":"morphological pattern with full diacritics (e.g. فَعِيل)","type":"one of: Noun / Verb / Adjective / Particle / Pronoun / Adverb","meaning":"brief English definition, 1-2 sentences max","ar_meaning":"المعنى في جملة واحدة قصيرة"}\nOnly JSON. No other text.`,
        },
      ],
      max_tokens: 280,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed: WordInfo = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    cache.set(normalized, parsed);
    res.json(parsed);
  } catch {
    currentKeyIndex = (currentKeyIndex + 1) % Math.max(GROQ_KEYS.length, 1);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

export default router;
