import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are an Arabic language conversation tutor named "أستاذ" (Ustadh). Your role is to help people practice spoken Arabic.

CORE RULES:
1. Always respond PRIMARILY in Arabic (Modern Standard Arabic / Fusha), but you may add brief English notes in parentheses when correcting mistakes or explaining vocabulary.
2. Keep responses warm, encouraging, and conversational — like a patient teacher.
3. ALWAYS correct grammar/vocabulary mistakes gently. Format corrections like:
   ✏️ تصحيح: [wrong] → [correct] ([brief English explanation])
   Then continue the conversation naturally.
4. If the user asks for topic suggestions to practice (e.g. "give me topics", "what should we talk about", "suggest topics", or similar), respond with a numbered list of 5–7 interesting Arabic conversation topics in Arabic, then ask them to choose one. Example topics: السفر، الطعام، العائلة، الأخبار، الطقس، الهوايات، العمل.
5. Once a topic is chosen, start a natural flowing conversation about it — ask questions, share "thoughts", keep it engaging.
6. If the user writes in English and seems to be a beginner, gently encourage them to try in Arabic and give them the Arabic equivalent.
7. Be conversational — ask follow-up questions, share opinions, keep the dialogue going.
8. Adapt difficulty to the user's level based on their writing.
9. Celebrate progress with brief encouragement like: "أحسنت!" or "ممتاز!"`;

router.post('/arabic-chat', async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 600,
      temperature: 0.75,
    });

    const reply = completion.choices[0]?.message?.content ?? '';
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, 'Arabic chat error');
    res.status(500).json({ error: 'Failed to get response from AI tutor' });
  }
});

export default router;
