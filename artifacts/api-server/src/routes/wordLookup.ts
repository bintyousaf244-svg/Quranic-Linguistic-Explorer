import { Router, type Request, type Response } from 'express';

const router = Router();

interface WordInfo {
  root?: string;
  wazn?: string;
  type?: string;
  meaning?: string;
  ar_meaning?: string;
  transliteration?: string;
  source?: 'classical' | 'quran.com';
}

// Strip tashkeel (diacritics) and tatweel for dictionary key matching
function normalize(word: string): string {
  return word
    .replace(/[\u0610-\u061A\u064B-\u0652\u0653-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0640\u0671]/g, '')
    .replace(/[﴿﴾۝۞۩\u06DD]/g, '')
    .replace(/\u0622/g, '\u0627') // أ → ا
    .replace(/\u0623/g, '\u0627') // أ → ا
    .replace(/\u0625/g, '\u0627') // إ → ا
    .replace(/\u0624/g, '\u0648') // ؤ → و
    .replace(/\u0626/g, '\u064A') // ئ → ي
    .trim();
}

// Classical data sourced from Lisan al-Arab, Al-Mufradat fi Gharib al-Quran, and classical sarf
const CLASSICAL: Record<string, WordInfo> = {
  // Al-Fatiha
  'بسم':     { root: 'س م و', wazn: 'فِعْل + بِ', type: 'Noun', meaning: "In the name of — preposition بِ + اسم (name). Invoking Allah's name before beginning an act.", ar_meaning: 'باسم: استعانة بذكر اسم الله والتبرك به قبل الشروع في الأمر' },
  'اسم':     { root: 'س م و', wazn: 'فِعْل', type: 'Noun', meaning: "Ism (Name) — a label that identifies and distinguishes a thing. From root samaw (to elevate).", ar_meaning: 'الاسم: اللفظ الدالّ على مسمّاه، وأصله من السمو' },
  'الله':    { root: 'أ ل ه', wazn: 'عَلَم', type: 'Noun', meaning: "Allah — the proper divine name of the one true God; the deity alone worthy of worship.", ar_meaning: 'الله: علم على ذات الرب تبارك وتعالى، المستحق للعبادة وحده' },
  'لله':     { root: 'أ ل ه', wazn: 'عَلَم', type: 'Noun', meaning: "To/for Allah — lām (لِ) of dedication + the divine name.", ar_meaning: 'لله: اسم الجلالة مجروراً، المعبود بحق' },
  'الرحمن':  { root: 'ر ح م', wazn: 'فَعْلَان', type: 'Adjective', meaning: "Al-Rahman (The Most Gracious) — intensive form فَعْلَان from raḥima; vast, all-encompassing mercy embracing all creation.", ar_meaning: 'الرحمن: صيغة مبالغة من الرحمة، ذو الرحمة الواسعة لجميع الخلق' },
  'الرحيم':  { root: 'ر ح م', wazn: 'فَعِيل', type: 'Adjective', meaning: "Al-Raheem (The Most Merciful) — intensive form فَعِيل; continuous mercy directed especially to the believers.", ar_meaning: 'الرحيم: صيغة مبالغة من الرحمة، كثير الرحمة لعباده المؤمنين' },
  'الحمد':   { root: 'ح م د', wazn: 'فَعْل', type: 'Noun', meaning: "Al-Hamd (All praise) — comprehensive praise for beautiful qualities willingly displayed; includes gratitude, glorification, and admiration.", ar_meaning: 'الحمد: الثناء على الجميل الاختياري، أعمّ من الشكر' },
  'حمد':     { root: 'ح م د', wazn: 'فَعْل', type: 'Noun', meaning: "Hamd (Praise) — verbal noun from ḥamida; to praise sincerely for virtue.", ar_meaning: 'الحمد: الثناء الجميل على المحمود' },
  'رب':      { root: 'ر ب ب', wazn: 'فَعْل', type: 'Noun', meaning: "Rabb (Lord/Sustainer) — doubled root ر-ب-ب; the one who owns, nurtures, sustains, and governs. Used exclusively for Allah in absolute usage.", ar_meaning: 'الرب: المالك والسيد والمربّي والمصلح، لا يُطلق مطلقاً إلا على الله' },
  'ربي':     { root: 'ر ب ب', wazn: 'فَعْل + ي', type: 'Noun', meaning: "Rabbi (My Lord) — Rabb + first person possessive; my Lord, my Sustainer.", ar_meaning: 'ربي: ربّ مضاف إلى ياء المتكلم، مالكي وسيدي وخالقي' },
  'العالمين':{ root: 'ع ل م', wazn: 'فَاعَل + ين', type: 'Noun', meaning: "Al-'Alamin (The worlds) — plural of 'ālam; all of creation, everything besides Allah.", ar_meaning: 'العالمون: جمع عالَم، كل ما سوى الله تعالى من المخلوقات' },
  'مالك':    { root: 'م ل ك', wazn: 'فَاعِل', type: 'Noun', meaning: "Malik (Master/King) — active participle فَاعِل; one with full possession and sovereignty.", ar_meaning: 'مالك: اسم فاعل من مَلَك، صاحب الملك والسلطان المطلق' },
  'ملك':     { root: 'م ل ك', wazn: 'فِعْل', type: 'Noun', meaning: "Malik (King) — ruler, sovereign; the one who issues commands.", ar_meaning: 'ملك: صاحب الملك، الآمر الناهي في رعيته' },
  'يوم':     { root: 'ي و م', wazn: 'فَعْل', type: 'Noun', meaning: "Yawm (Day) — a period of time; in Quran often the Day of Judgement.", ar_meaning: 'يوم: اسم زمان، ويُراد به يوم القيامة في السياق القرآني' },
  'الدين':   { root: 'د ي ن', wazn: 'فِعْل', type: 'Noun', meaning: "Al-Din (The Recompense/Religion) — the Day of Recompense; also religion and complete way of life.", ar_meaning: 'الدين: الجزاء والحساب، وهو ما يُجازى به المرء على عمله' },
  'اياك':    { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: "Iyyaka (You alone) — emphatic direct-object pronoun. Fronting before the verb creates exclusive focus: You alone we worship.", ar_meaning: 'إياك: ضمير نصب منفصل يُفيد الاختصاص والحصر' },
  'اياكه':   { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: "Iyyaka (You alone) — emphatic pronoun implying exclusivity.", ar_meaning: 'إياك: ضمير نصب منفصل للاختصاص والحصر' },
  'نعبد':    { root: 'ع ب د', wazn: 'نَفْعُل', type: 'Verb', meaning: "Na'budu (We worship) — first person plural present from 'abada; to worship with complete submission, humility, and love.", ar_meaning: 'نعبد: فعل مضارع، نتعبد ونتذلل لله وحده' },
  'نستعين':  { root: 'ع و ن', wazn: 'نَسْتَفْعِل', type: 'Verb', meaning: "Nasta'een (We seek help) — Form X, first person plural from 'awana; to earnestly request and rely on assistance.", ar_meaning: 'نستعين: نطلب العون والمساعدة من الله وحده' },
  'اهدنا':   { root: 'ه د ي', wazn: 'أَفْعِلْنَا', type: 'Verb', meaning: "Ihdina (Guide us) — imperative from hadaya; to show, lead, and keep firm on the correct path.", ar_meaning: 'اهدنا: دلّنا وأرشدنا وثبّتنا على الطريق المستقيم' },
  'الصراط':  { root: 'ص ر ط', wazn: 'فِعَال', type: 'Noun', meaning: "Al-Sirat (The path) — the straight road; in Quran the way of the prophets and righteous.", ar_meaning: 'الصراط: الطريق الواضح المستقيم الذي لا اعوجاج فيه' },
  'صراط':    { root: 'ص ر ط', wazn: 'فِعَال', type: 'Noun', meaning: "Sirat (Path/way) — road, route, the correct way.", ar_meaning: 'الصراط: الطريق القويم الواضح' },
  'المستقيم':{ root: 'ق و م', wazn: 'مُسْتَفْعِل', type: 'Adjective', meaning: "Al-Mustaqeem (The straight) — active participle of Form X (istaqama); perfectly straight with no deviation.", ar_meaning: 'المستقيم: اسم فاعل، المعتدل الذي لا اعوجاج فيه' },
  'الذين':   { root: '—', wazn: 'موصول', type: 'Particle', meaning: "Alladheena (Those who) — masculine plural relative pronoun.", ar_meaning: 'الذين: اسم موصول لجمع المذكر' },
  'انعمت':   { root: 'ن ع م', wazn: 'أَفْعَلْتَ', type: 'Verb', meaning: "An'amta (You bestowed blessing) — Form IV past, second person masculine singular; to grant blessings.", ar_meaning: 'أنعمت: فعل ماضٍ من باب الإفعال، منحت النعمة والعطاء' },
  'عليهم':   { root: 'ع ل و', wazn: 'جار+مجرور', type: 'Particle', meaning: "'Alayhim (Upon them) — preposition 'alā + third person plural pronoun hum.", ar_meaning: 'عليهم: جار ومجرور، حرف الجر على والضمير هم' },
  'غير':     { root: 'غ ي ر', wazn: 'فَعْل', type: 'Noun', meaning: "Ghayri (Other than) — indicates difference or exclusion: not, other than.", ar_meaning: 'غير: اسم يدلّ على المغايرة والاختلاف' },
  'المغضوب': { root: 'غ ض ب', wazn: 'مَفْعُول', type: 'Adjective', meaning: "Al-Maghdoob (Those who earned wrath) — passive participle; those upon whom divine anger fell for rejecting known truth.", ar_meaning: 'المغضوب: اسم مفعول من غضب، من أنزل الله عليهم الغضب' },
  'الضالين': { root: 'ض ل ل', wazn: 'فَاعِلِين', type: 'Adjective', meaning: "Al-Dhaalleen (Those who went astray) — active participle plural; those who lost the way through ignorance.", ar_meaning: 'الضالون: جمع ضال، من ضل عن الحق بجهل أو غفلة' },
  // Al-Ikhlas
  'قل':      { root: 'ق و ل', wazn: 'فَعْ (أمر)', type: 'Verb', meaning: "Qul (Say) — imperative singular from qāla; divine command to the Prophet to proclaim.", ar_meaning: 'قل: فعل أمر، أمرٌ بالنطق والإبلاغ' },
  'هو':      { root: '—', wazn: 'ضمير', type: 'Pronoun', meaning: "Huwa (He) — third person masculine singular pronoun; refers to Allah.", ar_meaning: 'هو: ضمير منفصل مرفوع للغائب المذكر' },
  'احد':     { root: 'و ح د', wazn: 'فَعَل', type: 'Adjective', meaning: "Ahad (The One/Unique) — absolute oneness excluding all multiplicity. More emphatic than wāhid in Quranic usage.", ar_meaning: 'أحد: الفرد المنفرد الذي لا نظير له ولا مثيل' },
  'الاحد':   { root: 'و ح د', wazn: 'فَعَل', type: 'Adjective', meaning: "Al-Ahad (The Unique One) — exclusive divine oneness; nothing resembles or shares in Allah's essence.", ar_meaning: 'الأحد: المتفرد بالوحدانية المطلقة' },
  'الصمد':   { root: 'ص م د', wazn: 'فَعَل', type: 'Adjective', meaning: "Al-Samad (The Eternal Refuge) — the self-sufficient one to whom all creation turns in need.", ar_meaning: 'الصمد: السيد الكامل الذي يُقصده الخلق في حوائجهم' },
  'يلد':     { root: 'و ل د', wazn: 'يَفْعِل', type: 'Verb', meaning: "Yalid (He begets) — third person singular present; to father. Absolutely negated for Allah.", ar_meaning: 'يلد: فعل مضارع، أن يكون له ولد. ومنفيّ عن الله' },
  'يولد':    { root: 'و ل د', wazn: 'يُفْعَل', type: 'Verb', meaning: "Yoolad (He is begotten) — passive present; to be born of a parent. Absolutely negated for Allah.", ar_meaning: 'يولد: فعل مضارع مبني للمجهول، أن يكون له والد. ومنفيّ عن الله' },
  'كفوا':    { root: 'ك ف أ', wazn: 'فُعُل', type: 'Noun', meaning: "Kufuwan (Equal/Match) — peer, equivalent in status. Nothing is equivalent to Allah.", ar_meaning: 'كفؤ: المماثل والمساوي في الشرف والقدر' },
  // Common Quranic vocabulary
  'في':      { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Fi (In/within) — preposition indicating location or inclusion.", ar_meaning: 'في: حرف جر يدل على الظرفية' },
  'من':      { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Min (From/of) — preposition expressing origin or partitiveness.", ar_meaning: 'من: حرف جر يدل على ابتداء الغاية أو التبعيض' },
  'الى':     { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Ila (To/towards) — preposition of direction and destination.", ar_meaning: 'إلى: حرف جر يدل على انتهاء الغاية' },
  'على':     { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Ala (Upon/over) — preposition of elevation or contact.", ar_meaning: 'على: حرف جر يدل على الاستعلاء' },
  'ان':      { root: '—', wazn: 'حرف', type: 'Particle', meaning: "Anna/In (That/If) — conjunction of certainty (أنَّ) or condition (إن).", ar_meaning: 'أن/إن: حرف توكيد ونصب أو حرف شرط' },
  'ما':      { root: '—', wazn: 'حرف/اسم', type: 'Particle', meaning: "Ma (What/not) — relative pronoun, negation, or interrogative depending on context.", ar_meaning: 'ما: اسم موصول أو حرف نفي أو استفهام حسب السياق' },
  'لا':      { root: '—', wazn: 'حرف', type: 'Particle', meaning: "La (No/not) — negation particle; categorical denial.", ar_meaning: 'لا: حرف نفي أو نهي أو تبرئة' },
  'كان':     { root: 'ك و ن', wazn: 'فَعَل', type: 'Verb', meaning: "Kana (Was/were) — past tense of kāna; to be, to exist. Auxiliary verb.", ar_meaning: 'كان: فعل ماضٍ ناقص يرفع المبتدأ وينصب الخبر' },
  'قال':     { root: 'ق و ل', wazn: 'فَعَل', type: 'Verb', meaning: "Qala (He said) — past tense; to say, to speak.", ar_meaning: 'قال: فعل ماضٍ من القول' },
  'الناس':   { root: 'ن و س', wazn: 'فَعَال', type: 'Noun', meaning: "Al-Nas (Mankind) — humanity as a whole; from uns (familiarity).", ar_meaning: 'الناس: بنو آدم جميعاً' },
  'النبي':   { root: 'ن ب أ', wazn: 'فَعِيل', type: 'Noun', meaning: "Al-Nabi (The Prophet) — from naba'a (to bring news); one who receives and conveys divine revelation.", ar_meaning: 'النبي: المخبر عن الله، المُنبَّأ بالوحي' },
  'رسول':    { root: 'ر س ل', wazn: 'فَعُول', type: 'Noun', meaning: "Rasul (Messenger) — one sent with a mission; entrusted with divine revelation and a new law.", ar_meaning: 'الرسول: المبعوث بشريعة جديدة ليُبلّغها' },
  'كتاب':    { root: 'ك ت ب', wazn: 'فِعَال', type: 'Noun', meaning: "Kitab (Book/Scripture) — from kataba (to write); divine scripture.", ar_meaning: 'الكتاب: المكتوب، ويُطلق على القرآن والكتب السماوية' },
  'صلاة':    { root: 'ص ل و', wazn: 'فَعَال', type: 'Noun', meaning: "Salah (Prayer) — from salā (to connect); prescribed Islamic prayer performed five times daily.", ar_meaning: 'الصلاة: العبادة المخصوصة بأركانها، وأصلها الدعاء' },
  'زكاة':    { root: 'ز ك و', wazn: 'فَعَال', type: 'Noun', meaning: "Zakah (Almsgiving) — obligatory charity; from zakā (to grow and purify).", ar_meaning: 'الزكاة: المقدار الواجب من المال للمستحقين' },
  'امن':     { root: 'أ م ن', wazn: 'فَاعَل', type: 'Verb', meaning: "Amana (He believed) — to have faith and sincerely trust; from amn (safety/security).", ar_meaning: 'آمن: صدّق وأيقن واطمأن قلبه' },
  'عمل':     { root: 'ع م ل', wazn: 'فَعَل', type: 'Noun', meaning: "Amal (Deed/Work) — any purposeful act or action.", ar_meaning: 'عمل: الفعل الاختياري الصادر من الإنسان' },
  'سبحان':   { root: 'س ب ح', wazn: 'فُعْلَان', type: 'Noun', meaning: "Subhana (Glory be to) — verbal noun; to declare Allah far above any defect.", ar_meaning: 'سبحان: مصدر لتنزيه الله عن كل نقص' },
  'محمد':    { root: 'ح م د', wazn: 'مُفَعَّل', type: 'Noun', meaning: "Muhammad (The Praised One) — passive participle of Form II; the Prophet ﷺ whose name means 'repeatedly praised'.", ar_meaning: 'محمد: اسم مفعول، كثير المحامد والصفات الحميدة' },
  'قريش':    { root: 'ق ر ش', wazn: 'فُعَيل', type: 'Noun', meaning: "Quraysh — the ruling tribe of Mecca, guardians of the Ka'bah; the Prophet's tribe.", ar_meaning: 'قريش: أشرف قبائل العرب وسدنة الكعبة' },
  'الكعبة':  { root: 'ك ع ب', wazn: 'فَعْلَة', type: 'Noun', meaning: "Al-Ka'bah (The Cube) — the sacred cubic structure at the center of Masjid al-Haram in Mecca.", ar_meaning: 'الكعبة: البيت الحرام في مكة المكرمة، قبلة المسلمين' },
  'جنة':     { root: 'ج ن ن', wazn: 'فَعْلَة', type: 'Noun', meaning: "Jannah (Paradise/Garden) — from janna (to conceal); the Paradise promised to the believers.", ar_meaning: 'الجنة: دار النعيم الأبدية التي وعد الله بها المؤمنين' },
  'نار':     { root: 'ن و ر', wazn: 'فَعْل', type: 'Noun', meaning: "Nar (Fire/Hellfire) — fire; in Quran often refers to the hellfire.", ar_meaning: 'النار: اللهب والحرارة، وتُطلق على جهنم' },
  'صبر':     { root: 'ص ب ر', wazn: 'فَعْل', type: 'Noun', meaning: "Sabr (Patience/Steadfastness) — enduring hardship with resolve and trust in Allah.", ar_meaning: 'الصبر: حبس النفس عن الجزع والتسخط' },
  'شكر':     { root: 'ش ك ر', wazn: 'فَعْل', type: 'Noun', meaning: "Shukr (Gratitude/Thankfulness) — expressing gratitude for blessings through heart, tongue, and action.", ar_meaning: 'الشكر: الاعتراف بالنعمة والثناء على المنعم' },
  'توبة':    { root: 'ت و ب', wazn: 'فَعْلَة', type: 'Noun', meaning: "Tawbah (Repentance) — to turn back to Allah; sincere return from sin.", ar_meaning: 'التوبة: الرجوع إلى الله والندم على المعصية' },
  'تقوى':    { root: 'و ق ي', wazn: 'فَعْلَى', type: 'Noun', meaning: "Taqwa (God-consciousness/Piety) — guarding oneself from Allah's displeasure; fear coupled with love.", ar_meaning: 'التقوى: اتقاء غضب الله بفعل أوامره واجتناب نواهيه' },
  'ايمان':   { root: 'أ م ن', wazn: 'إِفْعَال', type: 'Noun', meaning: "Iman (Faith/Belief) — Form IV verbal noun from āmana; belief in Allah, His angels, books, messengers, last day, and decree.", ar_meaning: 'الإيمان: التصديق القلبي والإقرار اللساني والعمل بالجوارح' },
  'اسلام':   { root: 'س ل م', wazn: 'إِفْعَال', type: 'Noun', meaning: "Islam (Submission/Peace) — Form IV verbal noun from aslama; complete submission and surrender to Allah.", ar_meaning: 'الإسلام: الاستسلام لله والانقياد لأحكامه' },
  'قران':    { root: 'ق ر أ', wazn: 'فُعَال', type: 'Noun', meaning: "Quran (The Recitation) — from qara'a (to read/recite); the divine book revealed to the Prophet Muhammad ﷺ.", ar_meaning: 'القرآن: كلام الله المنزّل على النبي محمد ﷺ للإعجاز' },
};

// In-memory cache: key = `${surah}:${ayah}:${wordIndex}` or normalized word
const runtimeCache = new Map<string, WordInfo>();

// Ayah-level cache to avoid refetching same ayah for multiple word clicks
const ayahCache = new Map<string, unknown[]>();

async function fetchQuranComWords(surah: number, ayah: number): Promise<unknown[]> {
  const ayahKey = `${surah}:${ayah}`;
  if (ayahCache.has(ayahKey)) return ayahCache.get(ayahKey)!;

  const url = `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?words=true&word_fields=text_uthmani,location,char_type_name`;
  const resp = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) throw new Error(`quran.com returned ${resp.status}`);
  const data = await resp.json() as { verse: { words: unknown[] } };
  const words = data.verse?.words ?? [];
  ayahCache.set(ayahKey, words);
  return words;
}

async function handleWordLookup(req: Request, res: Response): Promise<void> {
  const { word, surah, ayah, wordIndex } = req.body as {
    word?: string;
    surah?: number;
    ayah?: number;
    wordIndex?: number;
  };

  if (!word?.trim()) {
    res.status(400).json({ error: 'word is required' });
    return;
  }

  const rawWord = word.trim();
  const dictKey = normalize(rawWord);
  const posKey = (surah != null && ayah != null && wordIndex != null)
    ? `${surah}:${ayah}:${wordIndex}`
    : null;

  // 1. Check in-memory cache by position (most specific)
  if (posKey && runtimeCache.has(posKey)) {
    res.json(runtimeCache.get(posKey));
    return;
  }

  // 2. Check classical static dictionary (exact match)
  const classicalHit = CLASSICAL[dictKey] ?? findWithPrefixStrip(dictKey);
  if (classicalHit) {
    const result: WordInfo = { ...classicalHit, source: 'classical' };
    // Enrich with quran.com transliteration if we have position
    if (posKey && surah != null && ayah != null && wordIndex != null) {
      try {
        const words = await fetchQuranComWords(surah, ayah);
        // quran.com word positions are 1-based; wordIndex from frontend is 0-based
        const wEntry = (words as Array<{ position: number; transliteration?: { text: string }; translation?: { text: string }; char_type_name?: string }>)
          .find(w => w.position === wordIndex + 1 && w.char_type_name === 'word');
        if (wEntry?.transliteration?.text) result.transliteration = wEntry.transliteration.text;
      } catch { /* transliteration enrichment is optional */ }
    }
    if (posKey) runtimeCache.set(posKey, result);
    res.json(result);
    return;
  }

  // 3. No classical match — fetch from quran.com, find word by text or position
  if (surah != null && ayah != null) {
    try {
      const words = await fetchQuranComWords(surah, ayah);
      type QWord = { position: number; text_uthmani?: string; text?: string; transliteration?: { text: string }; translation?: { text: string }; char_type_name?: string };
      const realWords = (words as QWord[]).filter(w => w.char_type_name === 'word');

      // Try text match first (normalize both sides) — most accurate
      const normReq = dictKey;
      let wEntry = realWords.find(w => {
        const wText = normalize(w.text_uthmani ?? w.text ?? '');
        return wText === normReq;
      });

      // Fall back to position if text match fails
      if (!wEntry && wordIndex != null) {
        wEntry = realWords.find(w => w.position === wordIndex + 1);
      }

      if (wEntry) {
        const result: WordInfo = {
          meaning: wEntry.translation?.text,
          transliteration: wEntry.transliteration?.text,
          source: 'quran.com',
        };
        if (posKey) runtimeCache.set(posKey, result);
        res.json(result);
        return;
      }
    } catch (err: unknown) {
      req.log.warn({ err, surah, ayah, wordIndex }, 'quran.com fetch failed');
    }
  }

  // 4. Nothing found — return empty so frontend shows "No data found"
  res.json({});
}

function findWithPrefixStrip(key: string): WordInfo | undefined {
  const prefixes = ['ال', 'بال', 'وال', 'فال', 'كال'];
  for (const prefix of prefixes) {
    if (key.startsWith(prefix)) {
      const stripped = key.slice(prefix.length);
      if (CLASSICAL[stripped]) return CLASSICAL[stripped];
    }
  }
  return undefined;
}

router.post('/word-lookup', (req, res) => { void handleWordLookup(req, res); });

export default router;
