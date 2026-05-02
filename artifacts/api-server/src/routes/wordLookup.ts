import { Router, type Request, type Response } from 'express';
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
  source?: 'classical' | 'ai';
}

// Strip tashkeel (Arabic diacritics) and tatweel for normalization
function normalize(word: string): string {
  return word
    .replace(/[\u0610-\u061A\u064B-\u0652\u0653-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0640]/g, '')
    .replace(/[﴿﴾۝۞۩\u06DD]/g, '')
    .trim();
}

// Classical data for Quranic vocabulary — sourced from Lisan al-Arab, Al-Mufradat, classical sarf
const CLASSICAL: Record<string, WordInfo> = {
  // Al-Fatiha
  'بسم':    { root: 'س م و', wazn: 'فِعْل + بِ', type: 'Noun', meaning: "In the name of — preposition بِ + اسم (name). Invoking Allah's name before beginning an act.", ar_meaning: 'باسم: استعانة بذكر اسم الله والتبرك به قبل الشروع في الأمر' },
  'اسم':    { root: 'س م و', wazn: 'فِعْل', type: 'Noun', meaning: "Ism (Name) — from root samaw (to elevate/distinguish). A label that identifies and distinguishes a thing.", ar_meaning: 'الاسم: اللفظ الدالّ على مسمّاه، وأصله من السمو' },
  'الله':   { root: 'أ ل ه', wazn: 'عَلَم', type: 'Noun', meaning: "Allah — the proper divine name of the one true God; the deity worthy of all worship. From ilāh (one deserving of worship).", ar_meaning: 'الله: علم على ذات الرب تبارك وتعالى، المستحق للعبادة وحده' },
  'لله':    { root: 'أ ل ه', wazn: 'عَلَم', type: 'Noun', meaning: "To/for Allah — lām (لِ) of ownership/dedication + the divine name.", ar_meaning: 'لله: اسم الجلالة مجروراً، المعبود بحق' },
  'الرحمن': { root: 'ر ح م', wazn: 'فَعْلَان', type: 'Adjective', meaning: "Al-Rahman (The Most Gracious) — intensive form فَعْلَان from raḥima; expresses vast, all-encompassing mercy encompassing all creation.", ar_meaning: 'الرحمن: صيغة مبالغة من الرحمة، ذو الرحمة الواسعة لجميع الخلق' },
  'الرحيم': { root: 'ر ح م', wazn: 'فَعِيل', type: 'Adjective', meaning: "Al-Raheem (The Most Merciful) — intensive form فَعِيل; continuous, specific mercy directed especially to the believers.", ar_meaning: 'الرحيم: صيغة مبالغة من الرحمة، كثير الرحمة لعباده المؤمنين' },
  'الحمد':  { root: 'ح م د', wazn: 'فَعْل', type: 'Noun', meaning: "Al-Hamd (All praise) — comprehensive praise for beautiful qualities willingly displayed; includes gratitude, glorification, and admiration.", ar_meaning: 'الحمد: الثناء على الجميل الاختياري، أعمّ من الشكر' },
  'حمد':    { root: 'ح م د', wazn: 'فَعْل', type: 'Noun', meaning: "Hamd (Praise) — verbal noun from ḥamida; to praise sincerely for beauty or virtue.", ar_meaning: 'الحمد: الثناء الجميل على المحمود بقلب وقالب' },
  'رب':     { root: 'ر ب ب', wazn: 'فَعْل', type: 'Noun', meaning: "Rabb (Lord/Master/Sustainer) — doubled root ر-ب-ب; the one who owns, nurtures, sustains, and governs. Exclusive to Allah in absolute usage.", ar_meaning: 'الرب: المالك والسيد والمربّي والمصلح، لا يُطلق مطلقاً إلا على الله' },
  'ربي':    { root: 'ر ب ب', wazn: 'فَعْل + ي', type: 'Noun', meaning: "Rabbi (My Lord) — Rabb + first person possessive ياء; my Lord, my Sustainer.", ar_meaning: 'ربي: ربّ مضاف إلى ياء المتكلم، مالكي وسيدي وخالقي' },
  'العالمين':{ root: 'ع ل م', wazn: 'فَاعَل + ين', type: 'Noun', meaning: "Al-'Alamin (The worlds/all creation) — plural of 'ālam; everything besides Allah, all of creation.", ar_meaning: 'العالمون: جمع عالَم، كل ما سوى الله تعالى من المخلوقات' },
  'مالك':   { root: 'م ل ك', wazn: 'فَاعِل', type: 'Noun', meaning: "Malik (Master/Owner/King) — active participle فَاعِل; one who has full possession and sovereignty.", ar_meaning: 'مالك: اسم فاعل من مَلَك، صاحب الملك والسلطان المطلق' },
  'ملك':    { root: 'م ل ك', wazn: 'فِعْل', type: 'Noun', meaning: "Malik (King) — ruler, sovereign; the one who issues commands and is obeyed.", ar_meaning: 'ملك: صاحب الملك، الآمر الناهي في رعيته' },
  'يوم':    { root: 'ي و م', wazn: 'فَعْل', type: 'Noun', meaning: "Yawm (Day) — a unit of time from dawn to dusk, or a period of time/era. In Quran often the Day of Judgement.", ar_meaning: 'يوم: اسم زمان من طلوع الفجر إلى غروب الشمس، ويُراد به يوم القيامة' },
  'الدين':  { root: 'د ي ن', wazn: 'فِعْل', type: 'Noun', meaning: "Al-Din (The Recompense/Religion) — the Day of Recompense (judgment); also religion, the complete way of life.", ar_meaning: 'الدين: الجزاء والحساب، وهو ما يُجازى به المرء على عمله' },
  'اياك':   { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: "Iyyaka (You alone) — emphatic direct-object pronoun. The fronting of the pronoun before the verb creates exclusive focus: You alone we worship.", ar_meaning: 'إياك: ضمير نصب منفصل يُفيد الاختصاص والحصر، لا نعبد إلا إياك' },
  'إياك':   { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: "Iyyaka (You alone) — emphatic direct-object pronoun implying exclusivity: worship belongs to Allah alone.", ar_meaning: 'إياك: ضمير نصب منفصل، يُقدَّم للاختصاص والحصر' },
  'نعبد':   { root: 'ع ب د', wazn: 'نَفْعُل', type: 'Verb', meaning: "Na'budu (We worship) — first person plural present tense from 'abada; to worship with complete submission, humility, and love.", ar_meaning: 'نعبد: فعل مضارع مرفوع، نتعبد ونتذلل لله وحده' },
  'نستعين': { root: 'ع و ن', wazn: 'نَسْتَفْعِل', type: 'Verb', meaning: "Nasta'een (We seek help) — Form X, first person plural from 'awana; to earnestly request and rely on assistance.", ar_meaning: 'نستعين: نطلب العون والمساعدة من الله وحده بخضوع' },
  'اهدنا':  { root: 'ه د ي', wazn: 'أَفْعِلْنَا', type: 'Verb', meaning: "Ihdina (Guide us) — imperative from hadaya (to guide); to show, lead, and keep firm on the correct path.", ar_meaning: 'اهدنا: دلّنا وأرشدنا وثبّتنا على الطريق المستقيم' },
  'الصراط': { root: 'ص ر ط', wazn: 'فِعَال', type: 'Noun', meaning: "Al-Sirat (The path) — the straight road, the correct way; in Quran the way of the prophets and righteous.", ar_meaning: 'الصراط: الطريق الواضح المستقيم الذي لا اعوجاج فيه' },
  'صراط':   { root: 'ص ر ط', wazn: 'فِعَال', type: 'Noun', meaning: "Sirat (Path/way) — road, route, the correct way.", ar_meaning: 'الصراط: الطريق القويم الواضح' },
  'المستقيم':{ root: 'ق و م', wazn: 'مُسْتَفْعِل', type: 'Adjective', meaning: "Al-Mustaqeem (The straight) — active participle of Form X (istaqama); perfectly straight, upright with no deviation.", ar_meaning: 'المستقيم: اسم فاعل على وزن مستفعِل، المعتدل الذي لا اعوجاج فيه' },
  'الذين':  { root: '—', wazn: 'موصول', type: 'Particle', meaning: "Alladheena (Those who) — masculine plural relative pronoun introducing a relative clause.", ar_meaning: 'الذين: اسم موصول لجمع المذكر، يربط الجملة الموصولة بما قبلها' },
  'انعمت':  { root: 'ن ع م', wazn: 'أَفْعَلْتَ', type: 'Verb', meaning: "An'amta (You bestowed blessing) — Form IV past tense, second person masculine singular; to grant blessings and favour.", ar_meaning: 'أنعمت: فعل ماضٍ من باب الإفعال، منحت النعمة والعطاء' },
  'عليهم':  { root: 'ع ل و', wazn: 'جار+مجرور', type: 'Particle', meaning: "'Alayhim (Upon them) — preposition 'alā + third person plural pronoun hum.", ar_meaning: 'عليهم: جار ومجرور، حرف الجر على متعلق بما قبله والضمير هم' },
  'غير':    { root: 'غ ي ر', wazn: 'فَعْل', type: 'Noun', meaning: "Ghayri (Other than) — used to indicate difference or exclusion: not, other than, different from.", ar_meaning: 'غير: اسم يدلّ على المغايرة والاختلاف، ويُستعمل للاستثناء' },
  'المغضوب':{ root: 'غ ض ب', wazn: 'مَفْعُول', type: 'Adjective', meaning: "Al-Maghdoob (Those who earned wrath) — passive participle مَفْعُول from ghadiba; those upon whom divine anger fell for rejecting known truth.", ar_meaning: 'المغضوب: اسم مفعول من غضب، من أنزل الله عليهم الغضب لتكذيبهم' },
  'الضالين':{ root: 'ض ل ل', wazn: 'فَاعِلِين', type: 'Adjective', meaning: "Al-Dhaalleen (Those who went astray) — active participle plural from dhalla; those who lost the way through ignorance or confusion.", ar_meaning: 'الضالون: جمع ضال اسم فاعل، من ضل عن الحق بجهل أو غفلة' },
  // Al-Ikhlas
  'قل':     { root: 'ق و ل', wazn: 'فَعْ (أمر)', type: 'Verb', meaning: "Qul (Say) — imperative singular from qāla; a divine command to the Prophet to proclaim or recite.", ar_meaning: 'قل: فعل أمر مبني على السكون، أمرٌ بالنطق والإبلاغ' },
  'هو':     { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: "Huwa (He) — third person masculine singular pronoun; refers to Allah.", ar_meaning: 'هو: ضمير منفصل مرفوع للغائب المذكر' },
  'احد':    { root: 'و ح د', wazn: 'فَعَل', type: 'Adjective', meaning: "Ahad (The One/Unique) — absolute oneness; excludes all multiplicity and partners. More emphatic than wāhid in Quranic usage.", ar_meaning: 'أحد: الفرد المنفرد الذي لا نظير له ولا مثيل في ذاته وصفاته' },
  'الاحد':  { root: 'و ح د', wazn: 'فَعَل', type: 'Adjective', meaning: "Al-Ahad (The Unique One) — exclusive divine oneness; nothing resembles or shares in Allah's essence.", ar_meaning: 'الأحد: المتفرد بالوحدانية المطلقة الذي لا شريك له' },
  'الصمد':  { root: 'ص م د', wazn: 'فَعَل', type: 'Adjective', meaning: "Al-Samad (The Eternal Refuge) — the one who is absolutely self-sufficient and to whom all creation turns in need.", ar_meaning: 'الصمد: السيد الكامل الذي يُقصده الخلق في حوائجهم وهو غني عن كل أحد' },
  'يلد':    { root: 'و ل د', wazn: 'يَفْعِل', type: 'Verb', meaning: "Yalid (He begets) — third person singular present tense; to father, to give birth to. Absolutely negated for Allah.", ar_meaning: 'يلد: فعل مضارع، أن يكون له ولد. ومنفيّ عن الله تعالى' },
  'يولد':   { root: 'و ل د', wazn: 'يُفْعَل', type: 'Verb', meaning: "Yoolad (He is begotten) — passive present tense; to be born of a parent. Absolutely negated for Allah.", ar_meaning: 'يولد: فعل مضارع مبني للمجهول، أن يكون له والد. ومنفيّ عن الله' },
  'كفوا':   { root: 'ك ف أ', wazn: 'فُعُل', type: 'Noun', meaning: "Kufuwan (Equal/Match) — a peer, equivalent, or match in status. Nothing is equivalent to Allah.", ar_meaning: 'كفؤ: المماثل والمساوي في الشرف والقدر' },
  // Common words
  'في':     { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Fi (In/within) — preposition indicating location, inclusion, or context.", ar_meaning: 'في: حرف جر يدل على الظرفية أو السببية' },
  'من':     { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Min (From/of) — preposition expressing origin, partitiveness, or causation.", ar_meaning: 'من: حرف جر يدل على ابتداء الغاية أو التبعيض أو البيان' },
  'الى':    { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Ila (To/towards) — preposition expressing direction, destination, or end point.", ar_meaning: 'إلى: حرف جر يدل على انتهاء الغاية' },
  'على':    { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Ala ('Upon/over) — preposition expressing elevation, obligation, or contact.", ar_meaning: 'على: حرف جر يدل على الاستعلاء والملابسة والتعليل' },
  'ان':     { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Anna/In (That/If) — conjunction expressing certainty (أنَّ) or condition (إن).", ar_meaning: 'أن/إن: حرف توكيد ونصب، أو حرف شرط جازم' },
  'ما':     { root: '—', wazn: 'حرف/اسم', type: 'Particle', meaning: "Ma (What/that which/not) — versatile particle: relative pronoun, negation, or interrogative.", ar_meaning: 'ما: اسم موصول أو حرف نفي أو اسم استفهام حسب السياق' },
  'لا':     { root: '—', wazn: 'حرف', type: 'Particle', meaning: "La (No/not) — negation particle; also used in oaths and for categorical denial.", ar_meaning: 'لا: حرف نفي أو نهي أو تبرئة حسب موضعها' },
  'كان':    { root: 'ك و ن', wazn: 'فَعَل', type: 'Verb', meaning: "Kana (Was/were) — past tense of the defective verb kāna; to be, to exist. Acts as an auxiliary verb.", ar_meaning: 'كان: فعل ماضٍ ناقص يرفع المبتدأ وينصب الخبر' },
  'قال':    { root: 'ق و ل', wazn: 'فَعَل', type: 'Verb', meaning: "Qala (He said) — past tense third person singular; to say, to speak.", ar_meaning: 'قال: فعل ماضٍ من القول، أخبر ونطق' },
  'الناس':  { root: 'ن و س', wazn: 'فَعَال', type: 'Noun', meaning: "Al-Nas (Mankind/People) — humanity as a whole; from uns meaning familiarity and sociability.", ar_meaning: 'الناس: بنو آدم جميعاً، مشتق من الأُنس والاجتماع' },
  'النبي':  { root: 'ن ب أ', wazn: 'فَعِيل', type: 'Noun', meaning: "Al-Nabi (The Prophet) — from naba'a (to bring news); one who receives and conveys divine revelation.", ar_meaning: 'النبي: المخبر عن الله، المُنبَّأ بالوحي ليُبلِّغه للناس' },
  'رسول':   { root: 'ر س ل', wazn: 'فَعُول', type: 'Noun', meaning: "Rasul (Messenger) — one sent with a mission; a messenger entrusted with divine revelation and a new law.", ar_meaning: 'الرسول: المبعوث بشريعة جديدة ليُبلّغها للبشر' },
  'كتاب':   { root: 'ك ت ب', wazn: 'فِعَال', type: 'Noun', meaning: "Kitab (Book/Scripture) — from kataba (to write); the written word; in Quran refers to divine scripture.", ar_meaning: 'الكتاب: المكتوب، ويُطلق على القرآن والكتب السماوية' },
  'صلاة':   { root: 'ص ل و', wazn: 'فَعَال', type: 'Noun', meaning: "Salah (Prayer) — ritual prayer; from salā meaning to connect. The prescribed Islamic prayer performed five times daily.", ar_meaning: 'الصلاة: العبادة المخصوصة بأركانها وشروطها، وأصلها الدعاء' },
  'زكاة':   { root: 'ز ك و', wazn: 'فَعَال', type: 'Noun', meaning: "Zakah (Almsgiving/purification) — obligatory charity; from zakā meaning to grow and purify.", ar_meaning: 'الزكاة: الطهارة والنماء، المقدار الواجب من المال للمستحقين' },
  'آمن':    { root: 'أ م ن', wazn: 'فَاعَل', type: 'Verb', meaning: "Amana (He believed) — to have faith, to believe sincerely and trust; from amn (safety/security).", ar_meaning: 'آمن: صدّق وأيقن واطمأن قلبه، من الأمن والتصديق' },
  'عمل':    { root: 'ع م ل', wazn: 'فَعَل', type: 'Noun', meaning: "Amal ('Amal/Deed) — work, deed, action; any purposeful act.", ar_meaning: 'عمل: الفعل الاختياري الصادر من الإنسان بقصد ونية' },
  'سبحان':  { root: 'س ب ح', wazn: 'فُعْلَان', type: 'Noun', meaning: "Subhana (Glory be to) — verbal noun used in exclamation; to declare Allah far above any defect or partner.", ar_meaning: 'سبحان: مصدر لتنزيه الله عن كل نقص وعيب' },
  'محمد':   { root: 'ح م د', wazn: 'مُفَعَّل', type: 'Noun', meaning: "Muhammad (The Praised One) — passive participle of Form II; the one who is repeatedly praised. The name of the Prophet ﷺ.", ar_meaning: 'محمد: اسم مفعول على فُعِّل، كثير المحامد والصفات الحميدة' },
};

const runtimeCache = new Map<string, WordInfo>();

async function handleWordLookup(req: Request, res: Response): Promise<void> {
  const { word } = req.body as { word?: string };
  if (!word?.trim()) {
    res.status(400).json({ error: 'word is required' });
    return;
  }

  const raw = word.trim();
  const key = normalize(raw);

  // 1. Check in-memory runtime cache
  if (runtimeCache.has(key)) {
    res.json(runtimeCache.get(key));
    return;
  }

  // 2. Check classical static dictionary (exact match)
  if (CLASSICAL[key]) {
    const result = { ...CLASSICAL[key], source: 'classical' as const };
    runtimeCache.set(key, result);
    res.json(result);
    return;
  }

  // 3. Try stripping common prefixes for secondary lookup
  const prefixes = ['ال', 'بال', 'وال', 'فال', 'كال', 'بِ', 'لِ', 'وَ', 'فَ', 'كَ'];
  for (const prefix of prefixes) {
    const stripped = key.startsWith(prefix) ? key.slice(prefix.length) : null;
    if (stripped && CLASSICAL[stripped]) {
      const result = { ...CLASSICAL[stripped], source: 'classical' as const };
      runtimeCache.set(key, result);
      res.json(result);
      return;
    }
  }

  // 4. Fall back to AI with improved prompt and strict few-shot examples
  const aiPrompt = `You are an expert in classical Arabic morphology (علم الصرف). Analyze the Arabic word.

EXAMPLES of correct answers (learn from these):
- رَبِّ → {"root":"ر ب ب","wazn":"فَعْل","type":"Noun","meaning":"Lord, Sustainer","ar_meaning":"الرب المالك المربي"}
- نَعْبُدُ → {"root":"ع ب د","wazn":"نَفْعُل","type":"Verb","meaning":"We worship","ar_meaning":"نتعبد لله وحده"}
- الْمُسْتَقِيمَ → {"root":"ق و م","wazn":"مُسْتَفْعِل","type":"Adjective","meaning":"The straight, upright","ar_meaning":"المعتدل الذي لا اعوجاج فيه"}
- مَالِكِ → {"root":"م ل ك","wazn":"فَاعِل","type":"Noun","meaning":"Master, King, Owner","ar_meaning":"صاحب الملك والسلطان"}
- كِتَابٌ → {"root":"ك ت ب","wazn":"فِعَال","type":"Noun","meaning":"Book, scripture","ar_meaning":"المكتوب، الكتاب المقروء"}
- يَقُولُ → {"root":"ق و ل","wazn":"يَفْعُل","type":"Verb","meaning":"He says, he speaks","ar_meaning":"يتكلم وينطق"}

Word to analyze: "${key}"

RULES:
1. Root must be only Arabic letters space-separated (e.g. "ر ب ب") — no diacritics in the root
2. For doubled/geminated roots (مضاعف) like رَبّ, write all 3 letters: ر ب ب
3. Wazn uses ف ع ل substitution with diacritics
4. Type: Noun / Verb / Adjective / Particle / Pronoun only
5. Return ONLY valid JSON, nothing else

{"root":"...","wazn":"...","type":"...","meaning":"...","ar_meaning":"..."}`;

  let llmRaw = '';
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert Arabic morphologist. Respond ONLY with a JSON object. No markdown, no explanation.' },
        { role: 'user', content: aiPrompt },
      ],
      max_tokens: 200,
      temperature: 0,
    });

    llmRaw = completion.choices[0]?.message?.content?.trim() ?? '{}';
    const jsonMatch = llmRaw.match(/\{[\s\S]*\}/);
    const parsed: WordInfo = jsonMatch ? { ...JSON.parse(jsonMatch[0]), source: 'ai' as const } : {};

    runtimeCache.set(key, parsed);
    res.json(parsed);
  } catch (err: unknown) {
    req.log.error({ err, word: key, llmRaw }, 'word-lookup AI failed');
    currentKeyIndex = (currentKeyIndex + 1) % Math.max(GROQ_KEYS.length, 1);
    res.status(500).json({ error: 'Lookup failed' });
  }
}

router.post('/word-lookup', (req, res) => { void handleWordLookup(req, res); });

export default router;
