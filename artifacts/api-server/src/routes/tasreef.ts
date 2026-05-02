import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

router.post('/tasreef', async (req, res) => {
  const { verb } = req.body;

  if (!verb || typeof verb !== 'string' || verb.trim().length < 1) {
    res.status(400).json({ error: 'verb is required' });
    return;
  }

  const v = verb.trim();

  const systemPrompt = `You are an expert in classical Arabic morphology (علم الصرف). Given any Arabic verb in any form, you return a complete structured conjugation table as a strict JSON object. You MUST include full tashkeel (harakat) on every Arabic word. Never omit any pronoun row. Be precise.`;

  const userPrompt = `Given the Arabic verb: "${v}"

Return ONLY valid JSON (no markdown, no prose) matching this exact schema:

{
  "root": "the trilateral root letters, e.g. ح م د",
  "verbForm": "the masdar wazn pattern, e.g. فَعَلَ – يَفْعَلُ",
  "chapter": "the sarf chapter name, e.g. نَصَرَ – يَنْصُرُ (باب نصر)",
  "type": "لازم or متعدٍّ",
  "masdar": "verbal noun(s) with full tashkeel",
  "ismFail": "اسم الفاعل with full tashkeel",
  "ismMaful": "اسم المفعول with full tashkeel, or null if intransitive",
  "ismMakan": "اسم المكان/الزمان with full tashkeel",
  "meaning": "core English meaning, e.g. to praise / to extol",
  "madi": [
    {
      "pronoun": "هُوَ",
      "pronounEn": "he",
      "maloom": "حَمِدَ",
      "maloomTranslit": "ḥamida",
      "majhool": "حُمِدَ",
      "majhoolTranslit": "ḥumida"
    }
  ],
  "mudari": [
    {
      "pronoun": "هُوَ",
      "pronounEn": "he",
      "marfu": "يَحْمَدُ",
      "marfuTranslit": "yaḥmadu",
      "mansub": "يَحْمَدَ",
      "mansubTranslit": "yaḥmada",
      "majzum": "يَحْمَدْ",
      "majzumTranslit": "yaḥmad",
      "muakkad": "يَحْمَدَنَّ",
      "muakkadTranslit": "yaḥmadanna",
      "maloomMajhool": "يُحْمَدُ",
      "maloomMajhoolTranslit": "yuḥmadu"
    }
  ],
  "amr": [
    {
      "pronoun": "أَنْتَ",
      "pronounEn": "you (m.s.)",
      "form": "اِحْمَدْ",
      "translit": "iḥmad"
    }
  ],
  "ism": {
    "fail": "حَامِدٌ",
    "failTranslit": "ḥāmidun",
    "maful": "مَحْمُودٌ",
    "mafulTranslit": "maḥmūdun",
    "makan": "مَحْمَدٌ",
    "makanTranslit": "maḥmadun",
    "masdar": "حَمْدٌ",
    "masdarTranslit": "ḥamdun"
  }
}

The madi array MUST have exactly 13 rows for these pronouns in order:
هُوَ، هُمَا (مذ)، هُمْ، هِيَ، هُمَا (مؤ)، هُنَّ، أَنْتَ، أَنْتِ، أَنْتُمَا، أَنْتُمْ، أَنْتُنَّ، أَنَا، نَحْنُ

The mudari array MUST have exactly 13 rows in the same pronoun order.

The amr array MUST have exactly 5 rows:
أَنْتَ، أَنْتِ، أَنْتُمَا، أَنْتُمْ، أَنْتُنَّ

For pronouns where amr does not apply (أنا، نحن، هو، هي، هم، هن، هما), do NOT include them in amr.

Make the pronounEn field the English translation for each pronoun row.
All Arabic MUST have complete tashkeel.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.05,
      max_tokens: 4096,
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
    res.status(500).json({ error: 'Failed to generate conjugation' });
  }
});

export default router;
