import { Router } from 'express';
import Groq from 'groq-sdk';
import { getVerseMorphology } from "../services/morphologyService";

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

function rotateKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
}

const MODEL = 'llama-3.1-8b-instant';

interface PromptMessages {
  system: string;
  user: string;
}

function getMessages(
  type: string,
  payload: {
    ayahText?: string;
    surahName?: string;
    ayahNumber?: number;
    surahNumber?: number;
    word?: string;
  }
): PromptMessages {

  const {
    ayahText,
    surahName,
    ayahNumber,
    surahNumber,
    word
  } = payload;

  switch (type) {

    case 'grammar':
      return {
        system: `أنت نظام إعراب قرآني يعمل وفق منهج كتاب "الإعراب الميسر" (شركة الدار العربية للموسوعات). هذا الكتاب يتميز بالإيجاز الشديد: كل كلمة تُعرب في عبارة واحدة قصيرة جداً، أحياناً كلمة واحدة فقط مثل "مبتدأ." أو "خبر." أو "صفة لله." — دون ذكر علامة الإعراب إلا إذا كانت غير قياسية أو تستدعي التنبيه. الكلمات تُكتب داخل أقواس قرآنية ﴿ ﴾.`,

        user: `أعرِب الآية الكريمة التالية من سورة ${surahName}، الآية رقم ${ayahNumber}، وفق أسلوب "الإعراب الميسر" الموجز جداً:

﴿${ayahText}﴾

**النمط الواجب اتباعه بدقة:**

لكل كلمة، اكتب سطراً واحداً بهذا الشكل الحرفي:
﴿كلمة﴾ : [إعراب موجز].

**قواعد الإيجاز:**
- للكلمة ذات الإعراب البسيط: كلمة واحدة أو اثنتان فقط.
- للجار والمجرور: ﴿لله﴾ : جار ومجرور متعلقان بمحذوف خبر.
- لا تذكر علامات الإعراب للكلمات العادية.
- اكتب بأسلوب مختصر جداً.

بعد الانتهاء:
**إعراب الجمل:** [شرح مختصر جداً].`
      };

    case 'morphology':

      const authenticMorphology = getVerseMorphology(
        Number(surahNumber),
        Number(ayahNumber)
      );

      const morphologyText = authenticMorphology
        .map(
          (m) =>
            `${m.word} → POS:${m.pos} → ${m.features.join(", ")}`
        )
        .join("\n");

      return {
        system: `أنت باحث أكاديمي متخصص في الصرف القرآني الكلاسيكي.

مهمتك الأساسية:
- استخدام بيانات الصرف الموثوقة فقط.
- ممنوع اختراع الجذور أو الأوزان أو المعلومات الصرفية.
- إذا كانت البيانات غير موجودة فلا تخمّن.
- استخدم فقط البيانات المقدمة لك.
- دورك هو الشرح والتوضيح وليس اختراع التحليل.`,

        user: `الآية:
﴿${ayahText}﴾

بيانات صرفية موثوقة من قاعدة بيانات Quranic Arabic Corpus:

${morphologyText}

المطلوب:

- اشرح الكلمات صرفياً اعتماداً فقط على البيانات أعلاه.
- وضّح معنى POS إن وجد.
- اشرح السمات الصرفية بطريقة تعليمية واضحة.
- إذا كانت هناك ظاهرة صرفية مهمة فاشرحها.
- لا تخترع أي معلومة غير موجودة في البيانات.
- اكتب بالعربية الفصحى الأكاديمية الواضحة.

افصل بين الكلمات بخط:
---`
      };

    case 'dictionary':
      return {
        system: `You are a Quranic lexicographer with deep expertise in classical Arabic dictionaries including Lisan al-Arab, Mu'jam Maqayis al-Lugha, Al-Mufradat fi Gharib al-Quran by Al-Raghib al-Asfahani, and Lane's Lexicon.`,

        user: `Provide a comprehensive word-by-word lexical analysis for the following ayah from Surah ${surahName}, Ayah ${ayahNumber}:

"${ayahText}"

For each word:
1. Arabic Word
2. Root
3. Core Meaning
4. Contextual Meaning
5. Classical Definition
6. Other Quranic usages`
      };

    case 'word':
      return {
        system: `You are a rigorous Arabic-English lexicographer specializing in Quranic vocabulary.`,

        user: `Provide a detailed dictionary entry for the Arabic word: "${word}"

Include:
1. Root & Wazn
2. Semantic field
3. English meanings
4. Classical definitions
5. Quranic usages`
      };

    case 'conjugation':
      return {
        system: `أنت متخصص في التصريف العربي الكلاسيكي.`,

        user: `صرّف الفعل التالي تصريفاً كاملاً:

${word}`
      };

    default:
      throw new Error(`Unknown analysis type: ${type}`);
  }
}

const VALID_TYPES = new Set([
  'grammar',
  'morphology',
  'dictionary',
  'word',
  'conjugation'
]);

router.post('/analysis/stream', async (req, res) => {

  const {
    type,
    ayahText,
    surahName,
    ayahNumber,
    surahNumber,
    word
  } = req.body;

  if (!type || !VALID_TYPES.has(type)) {
    res.status(400).json({ error: 'Missing or invalid type' });
    return;
  }

  let messages: PromptMessages;

  try {

    messages = getMessages(type, {
      ayahText,
      surahName,
      ayahNumber,
      surahNumber,
      word
    });

  } catch (err: any) {

    res.status(400).json({
      error: err.message
    });

    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.flushHeaders();

  const groq = getGroqClient();

  try {

    const stream = await groq.chat.completions.create({
      model: MODEL,

      messages: [
        {
          role: 'system',
          content: messages.system
        },
        {
          role: 'user',
          content: messages.user
        }
      ],

      temperature: 0,
      max_tokens: 4096,
      stream: true
    });

    for await (const chunk of stream) {

      const text =
        chunk.choices[0]?.delta?.content ?? '';

      if (text) {

        res.write(
          `data: ${JSON.stringify({ text })}\n\n`
        );
      }
    }

    res.write('data: [DONE]\n\n');

    res.end();

  } catch (err: any) {

    req.log.error({ err }, 'Groq streaming error');

    const is429 = err?.status === 429;

    if (is429 && GROQ_KEYS.length > 1) {
      rotateKey();
    }

    const msg = is429
      ? 'Daily token limit reached. Please try again later.'
      : 'Analysis failed. Please try again.';

    res.write(
      `data: ${JSON.stringify({ error: msg })}\n\n`
    );

    res.end();
  }
});

export default router;