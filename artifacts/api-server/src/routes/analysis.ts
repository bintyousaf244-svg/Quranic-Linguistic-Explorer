import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

function getPrompt(type: string, payload: any): string {
  const { ayahText, surahName, ayahNumber, word } = payload;

  switch (type) {
    case 'grammar':
      return `Act as an expert in Quranic Arabic Grammar (I'rab). 
Analyze the following ayah from Surah ${surahName}, Ayah ${ayahNumber}:

"${ayahText}"

Your analysis MUST be based on authentic classical sources such as:
- "I'rab al-Quran wa Bayanuhu" by Muhyi al-Din al-Darwish
- "Al-Tableel al-Nahwi" by Al-Zajjaj
- "I'rab al-Quran" by Al-Nahhas

Provide the analysis in Arabic. Include the I'rab of each word/phrase.
At the end, briefly mention the scholarly works this analysis aligns with.`;

    case 'morphology':
      return `Act as an expert in Arabic Morphology (Sarf). 
Analyze the following ayah from Surah ${surahName}, Ayah ${ayahNumber}:

"${ayahText}"

Your analysis MUST follow the methodology of classical Sarf scholars (e.g., Ibn Jinni, Al-Hamalawy).

For each major word, provide:
1. Root (Jidhr)
2. Verb Form (Wazn) / Noun Type
3. Sarf Saghir (صرف صغير)
4. Sarf Kabir (صرف كبير) for the specific form used.

Provide the analysis in Arabic. Mention the linguistic weight (Wazn) clearly.`;

    case 'dictionary':
      return `Act as a Quranic Lexicographer. For the following ayah from Surah ${surahName}, Ayah ${ayahNumber}:

"${ayahText}"

Provide a word-by-word breakdown based on authentic linguistic sources like "Lisan al-Arab", "Mu'jam Maqayis al-Lugha", and "Al-Mufradat fi Gharib al-Quran" by Al-Raghib al-Asfahani.

For each word:
1. Arabic Word
2. English Meaning (Contextual)
3. Arabic Meaning (Scholarly definition)
4. Root (Jidhr) and its core meaning

Format as a clean table.`;

    case 'word':
      return `Act as a rigorous Arabic-English Dictionary. 
Provide a detailed definition for the word: "${word}"

Your data MUST be cross-referenced with:
- "Lisan al-Arab" by Ibn Manzur
- "Al-Qamus al-Muhit" by Al-Fayruzabadi
- "Lane's Lexicon" (for English accuracy)

Include:
1. English meanings
2. Arabic synonyms and classical definitions
3. Root word and its primary semantic field
4. Quranic usage examples (if applicable)

Format with Markdown.`;

    default:
      throw new Error(`Unknown analysis type: ${type}`);
  }
}

router.post('/analysis/stream', async (req, res) => {
  const { type, ayahText, surahName, ayahNumber, word } = req.body;

  if (!type) {
    res.status(400).json({ error: 'Missing type' });
    return;
  }

  let prompt: string;
  try {
    prompt = getPrompt(type, { ayahText, surahName, ayahNumber, word });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      stream: true
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    req.log.error({ err }, 'Groq streaming error');
    res.write(`data: ${JSON.stringify({ error: 'Analysis failed. Please try again.' })}\n\n`);
    res.end();
  }
});

export default router;
