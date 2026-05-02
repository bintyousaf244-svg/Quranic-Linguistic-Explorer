import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant';

router.post('/tasreef', async (req, res) => {
  const { verb } = req.body;

  if (!verb || typeof verb !== 'string' || verb.trim().length < 1) {
    res.status(400).json({ error: 'verb is required' });
    return;
  }

  const v = verb.trim();

  const systemPrompt = `You are an expert in Arabic morphology (علم الصرف). Return ONLY valid JSON — no markdown, no prose. All Arabic must have complete tashkeel (harakat).`;

  const PRONOUNS_MADI = [
    ['هُوَ', 'he'],
    ['هُمَا (مذ)', 'they two (m.)'],
    ['هُمْ', 'they (m.)'],
    ['هِيَ', 'she'],
    ['هُمَا (مؤ)', 'they two (f.)'],
    ['هُنَّ', 'they (f.)'],
    ['أَنْتَ', 'you (m.s.)'],
    ['أَنْتِ', 'you (f.s.)'],
    ['أَنْتُمَا', 'you two'],
    ['أَنْتُمْ', 'you (m.pl.)'],
    ['أَنْتُنَّ', 'you (f.pl.)'],
    ['أَنَا', 'I'],
    ['نَحْنُ', 'we'],
  ];

  const PRONOUNS_AMR = [
    ['أَنْتَ', 'you (m.s.)'],
    ['أَنْتِ', 'you (f.s.)'],
    ['أَنْتُمَا', 'you two'],
    ['أَنْتُمْ', 'you (m.pl.)'],
    ['أَنْتُنَّ', 'you (f.pl.)'],
  ];

  const madiTemplate = PRONOUNS_MADI.map(([p, e]) =>
    `{"pronoun":"${p}","pronounEn":"${e}","maloom":"?","maloomTranslit":"?","majhool":"?","majhoolTranslit":"?"}`
  ).join(',\n    ');

  const mudariTemplate = PRONOUNS_MADI.map(([p, e]) =>
    `{"pronoun":"${p}","pronounEn":"${e}","marfu":"?","marfuTranslit":"?","mansub":"?","mansubTranslit":"?","majzum":"?","majzumTranslit":"?","muakkad":"?","muakkadTranslit":"?","maloomMajhool":"?","maloomMajhoolTranslit":"?"}`
  ).join(',\n    ');

  const amrTemplate = PRONOUNS_AMR.map(([p, e]) =>
    `{"pronoun":"${p}","pronounEn":"${e}","form":"?","translit":"?"}`
  ).join(',\n    ');

  const userPrompt = `Conjugate the Arabic verb: "${v}"

Replace every "?" with the correct Arabic form (full tashkeel) or its romanized transliteration. Return ONLY the completed JSON:

{
  "root": "Arabic root letters e.g. ك ت ب",
  "verbForm": "wazn e.g. فَعَلَ – يَفْعَلُ",
  "chapter": "sarf chapter e.g. باب نَصَرَ",
  "type": "لازم or متعدٍّ",
  "masdar": "?",
  "ismFail": "?",
  "ismMaful": "? or null",
  "ismMakan": "?",
  "meaning": "English meaning",
  "madi": [
    ${madiTemplate}
  ],
  "mudari": [
    ${mudariTemplate}
  ],
  "amr": [
    ${amrTemplate}
  ],
  "ism": {
    "fail":"?","failTranslit":"?","maful":"? or null","mafulTranslit":"? or null","makan":"?","makanTranslit":"?","masdar":"?","masdarTranslit":"?"
  }
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.05,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.status(500).json({ error: 'Failed to parse conjugation data' });
      return;
    }

    res.json(parsed);
  } catch (err: any) {
    req.log.error({ err }, 'Tasreef error');
    const isRateLimit = err?.status === 429;
    res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit
        ? 'Groq daily token limit reached. Please try again tomorrow or try a shorter verb.'
        : 'Failed to generate conjugation',
    });
  }
});

export default router;
