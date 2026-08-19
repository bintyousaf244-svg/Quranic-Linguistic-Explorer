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

function getGroqClient(): Groq | null {
  if (GROQ_KEYS.length === 0) return null;
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex % GROQ_KEYS.length] });
}

function rotateKey(): void {
  if (GROQ_KEYS.length > 0) {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
  }
}

const MODEL = 'llama-3.1-8b-instant';

interface PromptMessages {
  system: string;
  user: string;
}

function normalizeWord(word: string): string {
  if (!word) return '';
  return word
    .replace(/[\u0610-\u061A\u064B-\u0652\u0653-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0640]/g, '')
    .replace(/[﴿﴾۝۞۩\u0600-\u0605\u061C\u06DD\uFEFF]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/\u0649/g, '\u064A')
    .trim();
}

const CLASSICAL_LEXICON: Record<string, { root?: string; wazn?: string; type?: string; meaning?: string; ar_meaning?: string }> = {
  'بسم': { root: 'س م و', wazn: 'فِعْل + بِ', type: 'Noun', meaning: "In the name of — invoking Allah's blessing", ar_meaning: 'باسم: استعانة بذكر اسم الله والتبرك به' },
  'اسم': { root: 'س م و', wazn: 'فِعْل', type: 'Noun', meaning: 'Ism (Name) — from root samaw (to elevate)', ar_meaning: 'الاسم: ما دلّ على مسمّاه، وأصله من السمو' },
  'الله': { root: 'أ ل ه', wazn: 'عَلَم', type: 'Noun', meaning: 'Allah — the proper divine name of the one true God', ar_meaning: 'الله: علم على ذات الرب تبارك وتعالى، المستحق للعبادة وحده' },
  'لله': { root: 'أ ل ه', wazn: 'عَلَم', type: 'Noun', meaning: 'To/for Allah — dedication to the Almighty', ar_meaning: 'لله: اسم الجلالة مجروراً، المعبود بحق' },
  'الرحمن': { root: 'ر ح م', wazn: 'فَعْلَان', type: 'Adjective', meaning: 'Al-Rahman (The Most Gracious) — vast all-encompassing mercy embracing all creation', ar_meaning: 'الرحمن: صيغة مبالغة من الرحمة، ذو الرحمة الواسعة لجميع الخلق' },
  'الرحيم': { root: 'ر ح م', wazn: 'فَعِيل', type: 'Adjective', meaning: 'Al-Raheem (The Most Merciful) — continuous mercy for the believers', ar_meaning: 'الرحيم: صيغة مبالغة من الرحمة، كثير الرحمة بالمؤمنين' },
  'الحمد': { root: 'ح م د', wazn: 'فَعْل', type: 'Noun', meaning: 'Al-Hamd (All praise) — comprehensive praise, adoration, and gratitude', ar_meaning: 'الحمد: الثناء على الجميل الاختياري، أعمّ من الشكر' },
  'حمد': { root: 'ح م د', wazn: 'فَعْل', type: 'Noun', meaning: 'Hamd (Praise) — sincere praise for virtue', ar_meaning: 'الحمد: الثناء الجميل على المحمود' },
  'رب': { root: 'ر ب ب', wazn: 'فَعْل', type: 'Noun', meaning: 'Rabb (Lord/Sustainer) — the owner, nourisher, educator, and sustainer', ar_meaning: 'الرب: المالك والسيد والمربّي والمصلح' },
  'ربي': { root: 'ر ب ب', wazn: 'فَعْل + ي', type: 'Noun', meaning: 'My Lord and Sustainer', ar_meaning: 'ربي: ربّ مضاف إلى ياء المتكلم' },
  'العالمين': { root: 'ع ل م', wazn: 'فَاعَل + ين', type: 'Noun', meaning: "Al-'Alamin (The worlds) — all of creation besides Allah", ar_meaning: 'العالمون: جمع عالَم، كل ما سوى الله تعالى' },
  'مالك': { root: 'م ل ك', wazn: 'فَاعِل', type: 'Noun', meaning: 'Malik (Master/King) — sovereign possessor and ruler', ar_meaning: 'مالك: اسم فاعل من مَلَك، صاحب الملك والسلطان' },
  'ملك': { root: 'م ل ك', wazn: 'فِعْل', type: 'Noun', meaning: 'Malik (King) — sovereign ruler', ar_meaning: 'ملك: صاحب الملك، الآمر الناهي' },
  'يوم': { root: 'ي و م', wazn: 'فَعْل', type: 'Noun', meaning: 'Yawm (Day) — Day of Judgement and reckoning', ar_meaning: 'يوم: اسم زمان، ويُراد به يوم القيامة' },
  'الدين': { root: 'د ي ن', wazn: 'فِعْل', type: 'Noun', meaning: 'Al-Din (The Recompense) — judgment, accounting, and religion', ar_meaning: 'الدين: الجزاء والحساب' },
  'اياك': { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: 'You alone — exclusive focus and devotion', ar_meaning: 'إياك: ضمير نصب منفصل يُفيد الاختصاص والحصر' },
  'نعبد': { root: 'ع ب د', wazn: 'نَفْعُل', type: 'Verb', meaning: "We worship — with complete submission, humility, and love", ar_meaning: 'نعبد: فعل مضارع، نتعبد ونتذلل لله وحده' },
  'نستعين': { root: 'ع و ن', wazn: 'نَسْتَفْعِل', type: 'Verb', meaning: "We seek help — Form X earnestly asking assistance and reliance", ar_meaning: 'نستعين: نطلب العون والمساعدة من الله وحده' },
  'اهدنا': { root: 'ه د ي', wazn: 'أَفْعِلْنَا', type: 'Verb', meaning: 'Guide us — direct, lead, and keep us firm on the path', ar_meaning: 'اهدنا: دلّنا وأرشدنا وثبّتنا على الطريق المستقيم' },
  'الصراط': { root: 'ص ر ط', wazn: 'فِعَال', type: 'Noun', meaning: 'Al-Sirat (The path) — the clear straight highway', ar_meaning: 'الصراط: الطريق الواضح المستقيم' },
  'صراط': { root: 'ص ر ط', wazn: 'فِعَال', type: 'Noun', meaning: 'Sirat (Path) — route and correct way', ar_meaning: 'الصراط: الطريق القويم الواضح' },
  'المستقيم': { root: 'ق و م', wazn: 'مُسْتَفْعِل', type: 'Adjective', meaning: 'Al-Mustaqeem (The straight) — without crookedness or deviation', ar_meaning: 'المستقيم: اسم فاعل، المعتدل الذي لا اعوجاج فيه' },
  'الذين': { root: '—', wazn: 'موصول', type: 'Particle', meaning: 'Those who (masculine plural relative pronoun)', ar_meaning: 'الذين: اسم موصول لجمع المذكر' },
  'انعمت': { root: 'ن ع م', wazn: 'أَفْعَلْتَ', type: 'Verb', meaning: 'You bestowed grace / blessings', ar_meaning: 'أنعمت: فعل ماضٍ من باب الإفعال، منحت النعمة' },
  'عليهم': { root: 'ع ل و', wazn: 'جار+مجرور', type: 'Particle', meaning: 'Upon them', ar_meaning: 'عليهم: حرف الجر على والضمير هم' },
  'غير': { root: 'غ ي ر', wazn: 'فَعْل', type: 'Noun', meaning: 'Not / other than — expressing difference and exclusion', ar_meaning: 'غير: اسم يدلّ على المغايرة والاستثناء' },
  'المغضوب': { root: 'غ ض ب', wazn: 'مَفْعُول', type: 'Adjective', meaning: 'Those who incurred divine wrath', ar_meaning: 'المغضوب: اسم مفعول من غضب، من أنزل الله عليهم الغضب' },
  'الضالين': { root: 'ض ل ل', wazn: 'فَاعِلِين', type: 'Adjective', meaning: 'Those who went astray through ignorance and error', ar_meaning: 'الضالون: جمع ضال، من ضل عن الحق بجهل أو غفلة' },
  'ذلك': { root: '—', wazn: 'اسم إشارة', type: 'Pronoun', meaning: 'That (far demonstrative pronoun used for elevation and veneration of the Book)', ar_meaning: 'ذلك: اسم إشارة للبعيد إشعاراً بعلو مرتبته وشرفه' },
  'الكتاب': { root: 'ك ت ب', wazn: 'فِعَال', type: 'Noun', meaning: 'The Book / Divine Scripture — from kataba (to assemble letters and prescribe laws)', ar_meaning: 'الكتاب: القرآن العظيم، وأصله الجمع والتدوين والفرض' },
  'كتب': { root: 'ك ت ب', wazn: 'فَعَل', type: 'Verb', meaning: 'To write, record, or prescribe', ar_meaning: 'كتب: خطّ وفرض وأوجب' },
  'لا': { root: '—', wazn: 'حرف نفي', type: 'Particle', meaning: 'No / Not — absolute categorical negation (لا النافية للجنس)', ar_meaning: 'لا: حرف نفي للجنس لاستغراق النفي' },
  'ريب': { root: 'ر ي ب', wazn: 'فَعْل', type: 'Noun', meaning: 'Doubt, suspicion, or anxiety causing unease in the heart', ar_meaning: 'الريب: الشك المقلق للنفس والارتياب' },
  'فيه': { root: '—', wazn: 'جار+مجرور', type: 'Particle', meaning: 'In it — preposition fī + pronoun hu', ar_meaning: 'فيه: في الظرفية مضافاً للضمير' },
  'هدى': { root: 'ه د ي', wazn: 'فُعَل', type: 'Noun', meaning: 'Guidance, direction, clarity, and illumination showing the right path', ar_meaning: 'الهدى: الرشاد والدلالة والبيان والنور' },
  'للمتقين': { root: 'و ق ي', wazn: 'مُفْتَعِلِين', type: 'Noun / Participle', meaning: 'For the God-conscious / Pious — those who build a shield against divine displeasure', ar_meaning: 'المتقون: جمع متقٍ، من اتقى عذاب الله بامتثال أوامره واجتناب زواجره' },
  'المتقين': { root: 'و ق ي', wazn: 'مُفْتَعِلِين', type: 'Noun / Participle', meaning: 'The God-conscious / Pious', ar_meaning: 'المتقون: من اتصف بالتقوى وخشي ربه' },
  'يؤمنون': { root: 'أ م ن', wazn: 'يُفْعِلُون', type: 'Verb', meaning: 'They believe — possessing firm faith, conviction, and trust', ar_meaning: 'يؤمنون: يصدقون بقلوبهم ويقرّون بألسنتهم' },
  'بالغيب': { root: 'غ ي ب', wazn: 'بِ + فَعْل', type: 'Noun', meaning: 'In the unseen — realities beyond physical senses revealed by Allah', ar_meaning: 'الغيب: ما غاب عن حواس الخلق مما أخبرت به الرسل' },
  'ويقيمون': { root: 'ق و م', wazn: 'وَ + يُفْعِلُون', type: 'Verb', meaning: 'And they establish — performing prayers properly with humility and punctuality', ar_meaning: 'يقيمون: يؤدون الصلاة كاملة بشروطها وأركانها وخشوعها' },
  'الصلاة': { root: 'ص ل و', wazn: 'فَعَال', type: 'Noun', meaning: 'The Prayer — prescribed acts of devotion connecting the servant to Allah', ar_meaning: 'الصلاة: العبادة المخصوصة، وأصلها الدعاء والصلة' },
  'ومما': { root: '—', wazn: 'وَ + مِنْ + مَا', type: 'Particle', meaning: 'And out of what', ar_meaning: 'ومما: و + من الجارة + ما الموصولة' },
  'رزقناهم': { root: 'ر ز ق', wazn: 'فَعَلْنَاهُم', type: 'Verb', meaning: 'We provided them — blessings, provisions, and sustenance given by Allah', ar_meaning: 'رزقناهم: أعطيناهم من فضلنا ورزقنا' },
  'ينفقون': { root: 'ن ف ق', wazn: 'يُفْعِلُون', type: 'Verb', meaning: 'They spend — in charity and righteous causes for the sake of Allah', ar_meaning: 'ينفقون: يخرجون المال في وجوه الخير والبر' },
  'والذين': { root: '—', wazn: 'وَ + موصول', type: 'Particle', meaning: 'And those who', ar_meaning: 'والذين: واو العطف واسم الموصول' },
  'انزل': { root: 'ن ز ل', wazn: 'أُفْعِلَ', type: 'Verb', meaning: 'Was revealed / sent down from on high', ar_meaning: 'أنزل: أهبط من العلو، والإنزال للقرآن والوحي' },
  'اليك': { root: '—', wazn: 'إِلَىٰ + كَ', type: 'Particle', meaning: 'To you (O Muhammad ﷺ)', ar_meaning: 'إليك: حرف الجر إلى وكاف الخطاب للنبي ﷺ' },
  'وما': { root: '—', wazn: 'وَ + مَا', type: 'Particle', meaning: 'And what / whatever', ar_meaning: 'وما: واو العطف وما الموصولة' },
  'من': { root: '—', wazn: 'حرف', type: 'Particle', meaning: 'From / of / before', ar_meaning: 'من: حرف جر للابتداء أو التبعيض' },
  'قبلك': { root: 'ق ب ل', wazn: 'فَعْل + كَ', type: 'Noun', meaning: 'Before you — prior revelations to previous prophets', ar_meaning: 'قبلك: اسم زمان دال على التقدم' },
  'وبالآخرة': { root: 'أ خ ر', wazn: 'بِ + فاعِلَة', type: 'Noun', meaning: 'And in the Hereafter — the eternal life, resurrection, and reckoning', ar_meaning: 'الآخرة: الدار الآخرة وما فيها من بعث وحساب وجنة ونار' },
  'هم': { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: 'They (third person plural pronoun)', ar_meaning: 'هم: ضمير فصل أو رفع منفصل' },
  'يوقنون': { root: 'ي ق ن', wazn: 'يُفْعِلُون', type: 'Verb', meaning: 'They are certain — having unshakeable faith without doubt', ar_meaning: 'يوقنون: يعلمون علماً جازماً لا يتطرق إليه شك' },
  'اولئك': { root: '—', wazn: 'اسم إشارة', type: 'Pronoun', meaning: 'Those are the ones (demonstrative emphasizing high honour)', ar_meaning: 'أولئك: اسم إشارة للبعيد لتعظيم شأنهم' },
  'على': { root: '—', wazn: 'حرف', type: 'Particle', meaning: 'Upon / firmly grounded upon', ar_meaning: 'على: حرف جر للاستعلاء والتمكن' },
  'ربهم': { root: 'ر ب ب', wazn: 'فَعْل + هُم', type: 'Noun', meaning: 'Their Lord and Sustainer', ar_meaning: 'ربهم: مالكهم وخالقهم وهاديهم' },
  'المفلحون': { root: 'ف ل ح', wazn: 'مُفْعِلُون', type: 'Noun / Participle', meaning: 'The successful — those who attain all good and are saved from ruin', ar_meaning: 'المفلحون: الفائزون بالبغية الناجون من المكروه' },
};

function findClassicalWord(token: string): { root?: string; wazn?: string; type?: string; meaning?: string; ar_meaning?: string } | null {
  const norm = normalizeWord(token);
  if (CLASSICAL_LEXICON[norm]) return CLASSICAL_LEXICON[norm];

  const prefixes = ['وال', 'فال', 'بال', 'كال', 'ولل', 'فلل', 'ال', 'لل', 'وا', 'فا', 'با', 'و', 'ف', 'ب', 'ل', 'ك'];
  for (const p of prefixes) {
    if (norm.startsWith(p) && norm.length > p.length + 1) {
      const s = norm.slice(p.length);
      if (CLASSICAL_LEXICON[s]) return CLASSICAL_LEXICON[s];
    }
  }
  return null;
}

function buildFallbackDictionary(ayahText?: string, surahName?: string, ayahNumber?: number): string {
  if (!ayahText) return 'Lexical analysis data is currently unavailable.';
  const tokens = ayahText.split(' ').map(w => w.replace(/[﴿﴾۝۞۩\u0600-\u0605\u061C\u06DD\uFEFF]/g, '').trim()).filter(Boolean);

  let md = `### Word-by-Word Lexical Analysis${surahName ? ` — Surah ${surahName}` : ''}${ayahNumber ? ` : Ayah ${ayahNumber}` : ''}\n\n`;

  let count = 1;
  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const cleaned = raw.replace(/[\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '').trim();
    if (!cleaned) continue;

    const classical = findClassicalWord(cleaned);

    md += `#### ${count}. ﴿${cleaned}﴾\n`;
    if (classical) {
      if (classical.root && classical.root !== '—') md += `- **Root (الجذر):** \`${classical.root}\`\n`;
      if (classical.wazn) md += `- **Pattern (الوزن):** ${classical.wazn}\n`;
      if (classical.type) md += `- **Type (النوع):** ${classical.type}\n`;
      if (classical.meaning) md += `- **Meaning:** ${classical.meaning}\n`;
      if (classical.ar_meaning) md += `- **Classical Lexicon (المعجم):** ${classical.ar_meaning}\n`;
    } else {
      md += `- **Word:** \`${cleaned}\`\n`;
      md += `- **Lexicon Reference:** Classical Arabic lexical entry (Lisan al-Arab, Al-Mufradat fi Gharib al-Quran).\n`;
    }
    md += `\n`;
    count++;
  }

  return md;
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

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const groq = getGroqClient();

  if (groq) {
    try {
      const messages = getMessages(type, {
        ayahText,
        surahName,
        ayahNumber,
        surahNumber,
        word
      });

      const stream = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: messages.system },
          { role: 'user', content: messages.user }
        ],
        temperature: 0,
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
      return;
    } catch (err: any) {
      req.log?.error?.({ err }, 'Groq streaming error');
      const is429 = err?.status === 429;
      if (is429 && GROQ_KEYS.length > 1) {
        rotateKey();
      }
    }
  }

  // Fallback if Groq client is not configured or failed
  if (type === 'dictionary') {
    const fallbackText = buildFallbackDictionary(ayahText, surahName, ayahNumber);
    res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  if (type === 'word' && word) {
    const classical = findClassicalWord(word);
    let text = `### Lexical Entry: ﴿${word}﴾\n\n`;
    if (classical) {
      if (classical.root && classical.root !== '—') text += `- **Root (الجذر):** \`${classical.root}\`\n`;
      if (classical.wazn) text += `- **Pattern (الوزن):** ${classical.wazn}\n`;
      if (classical.type) text += `- **Type (النوع):** ${classical.type}\n`;
      if (classical.meaning) text += `- **Meaning:** ${classical.meaning}\n`;
      if (classical.ar_meaning) text += `- **Classical Lexicon (المعجم):** ${classical.ar_meaning}\n`;
    } else {
      text += `- **Word:** \`${word}\`\n- **Definition:** Derived from classical Arabic lexicons including Lisan al-Arab and Mu'jam Maqayis al-Lugha.\n`;
    }
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const msg = 'Analysis service is temporarily unavailable. Please try again.';
  res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
  res.end();
});

export default router;