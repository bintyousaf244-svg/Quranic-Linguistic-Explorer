import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

interface PromptMessages {
  system: string;
  user: string;
}

function getMessages(type: string, payload: { ayahText?: string; surahName?: string; ayahNumber?: number; word?: string }): PromptMessages {
  const { ayahText, surahName, ayahNumber, word } = payload;

  switch (type) {
    case 'grammar':
      return {
        system: `أنت خبير متخصص في النحو العربي وإعراب القرآن الكريم، تستند في تحليلاتك إلى كبار أئمة النحو والتفسير. تلتزم بالمنهج الكلاسيكي الدقيق في الإعراب، وتذكر الأوجه الإعرابية المتعددة عند وجودها، مستأنساً بآراء العلماء مثل الزجاج والنحاس والدرويش والسمين الحلبي وغيرهم.`,
        user: `قم بالتحليل النحوي الكامل والدقيق (الإعراب) للآية الكريمة التالية من سورة ${surahName}، الآية رقم ${ayahNumber}:

"${ayahText}"

يجب أن يشتمل تحليلك على الأقسام التالية تماماً:

### أولاً: إعراب المفردات والكلمات
لكل كلمة في الآية:
- اذكر إعرابها التفصيلي (نوعها: اسم/فعل/حرف، حكمها الإعرابي، علامة إعرابها، ومحلها من الإعراب إن وجد).
- إذا كان للكلمة أكثر من وجه إعرابي مشهور عند النحاة، فاذكر الأوجه جميعها مرقمةً مع تعليل كل وجه.
- اذكر تعلّق الجار والمجرور والظروف والضمائر بما يتعلق به.

### ثانياً: إعراب الجمل
- حلل كل جملة في الآية (الرئيسية والفرعية) وبيّن محلها من الإعراب أو عدم محلها، مع التعليل.

### ثالثاً: ملاحظات بيانية ونحوية
- أضف ملاحظات علمية دقيقة مستقاة من المصادر الكلاسيكية التالية بالذات: النحاس في "إعراب القرآن"، والزجاج في "معاني القرآن وإعرابه"، والدرويش في "إعراب القرآن وبيانه"، والسمين الحلبي في "الدر المصون".
- اذكر أثر وقف القراء على الإعراب إن كان له أثر.

### المصادر:
اختم بقائمة بالمصادر المعتمدة في هذا التحليل.

اكتب التحليل بالعربية الفصحى الكاملة، واجعله وافياً ومفصلاً على مستوى كتب الإعراب المتخصصة.`
      };

    case 'morphology':
      return {
        system: `أنت خبير متخصص في علم الصرف العربي الكلاسيكي، تسير على منهج أئمة هذا العلم كابن جني في "الخصائص" والهملاوي في "شذا العرف في فن الصرف". تُجيد تحليل الأوزان والمشتقات وظواهر الإعلال والإبدال والإدغام تحليلاً دقيقاً معمّقاً.`,
        user: `قم بالتحليل الصرفي الكامل والدقيق للكلمات المحورية في الآية الكريمة التالية من سورة ${surahName}، الآية رقم ${ayahNumber}:

"${ayahText}"

لكل كلمة أساسية في الآية (تجاوز حروف الجر والضمائر البسيطة وركّز على الأسماء والأفعال والمشتقات)، قدّم التحليل التالي بالتفصيل:

**الكلمة: [اكتب الكلمة]**
- **الجذر (الجذر اللغوي):** اذكر حروف الجذر الثلاثية أو الرباعية ومعناه الأصلي.
- **الوزن:** اذكر وزنه الصرفي الدقيق مع ضبط الشكل الكامل.
- **النوع:** (مصدر / اسم فاعل / اسم مفعول / صفة مشبهة / فعل ماضٍ / مضارع ...إلخ).
- **التحليل الصرفي والإعلال:** إذا وقع في الكلمة إعلال أو إبدال أو إدغام، فاشرحه خطوة بخطوة مع ذكر القاعدة الصرفية.
- **الصرف الصغير (للفعل المجرد أو المزيد):** اذكر الفعل الماضي والمضارع والمصدر واسم الفاعل واسم المفعول.
- **الصرف الكبير (للصيغة المستخدمة في الآية):** اذكر تصريف الكلمة للمفرد والمثنى والجمع والمذكر والمؤنث حسب ما ينطبق عليها.

افصل بين كل كلمة بخط فاصل (---).

اختم بـ**خاتمة صرفية** تُبرز أهم الظواهر الصرفية في الآية وبلاغتها اللغوية.

اكتب التحليل كاملاً بالعربية الفصحى على مستوى المتخصصين في علم الصرف.`
      };

    case 'dictionary':
      return {
        system: `You are a Quranic lexicographer with deep expertise in classical Arabic dictionaries including Lisan al-Arab, Mu'jam Maqayis al-Lugha, Al-Mufradat fi Gharib al-Quran by Al-Raghib al-Asfahani, and Lane's Lexicon.`,
        user: `Provide a comprehensive word-by-word lexical analysis for the following ayah from Surah ${surahName}, Ayah ${ayahNumber}:

"${ayahText}"

For each word (including particles where relevant):
1. **Arabic Word** with full tashkeel
2. **Root (Jidhr)** — the trilateral/quadrilateral root
3. **Core Meaning of Root** — the primary semantic field of the root
4. **Contextual Meaning** — exact meaning in this ayah
5. **Classical Definition** — cite from Lisan al-Arab, Maqayis al-Lugha, or Al-Mufradat
6. **Other Quranic Occurrences** — mention 1-2 other uses in the Quran if notable

Format as a clean structured list for each word (not a table, for better readability). Write Arabic words with full tashkeel. Keep definitions in English with Arabic technical terms where appropriate.`
      };

    case 'word':
      return {
        system: `You are a rigorous Arabic-English lexicographer specializing in Quranic vocabulary, cross-referencing Ibn Manzur's "Lisan al-Arab", Al-Fayruzabadi's "Al-Qamus al-Muhit", Al-Raghib's "Al-Mufradat fi Gharib al-Quran", and Lane's Lexicon.`,
        user: `Provide a detailed dictionary entry for the Arabic word: **"${word}"**

Include:
1. **Root & Wazn** — trilateral root and morphological pattern
2. **Core Semantic Field** — the primary meaning of the root
3. **English Meanings** — all relevant meanings, primary to extended
4. **Classical Arabic Definitions** — from Lisan al-Arab and/or Maqayis al-Lugha (quote in Arabic)
5. **Al-Raghib's Definition** — from Al-Mufradat if available (especially for Quranic terms)
6. **Quranic Usage** — key Quranic occurrences showing different usages
7. **Related Forms** — other words derived from the same root

Format with clear Markdown headings.`
      };

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

  let messages: PromptMessages;
  try {
    messages = getMessages(type, { ayahText, surahName, ayahNumber, word });
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
      messages: [
        { role: 'system', content: messages.system },
        { role: 'user', content: messages.user }
      ],
      temperature: 0.05,
      max_tokens: 4096,
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
