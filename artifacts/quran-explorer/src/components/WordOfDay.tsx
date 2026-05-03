import React, { useMemo } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface WordEntry {
  arabic: string;
  translit: string;
  root: string;
  type: string;
  meaning: string;
  detail: string;
  surah: number;
  surahEn: string;
  ayah: number;
  verseAr: string;
}

const WORDS: WordEntry[] = [
  { arabic: 'الْحَمْدُ', translit: 'al-ḥamdu', root: 'ح م د', type: 'Noun (مصدر)', meaning: 'All praise', detail: 'Comprehensive praise that encompasses gratitude, admiration, and reverence — unique to Allah alone.', surah: 1, surahEn: 'Al-Faatiha', ayah: 2, verseAr: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
  { arabic: 'الرَّحْمَنُ', translit: 'ar-raḥmān', root: 'ر ح م', type: 'Adj. (صفة مشبهة)', meaning: 'The Entirely Merciful', detail: 'From رحم — womb. Denotes an overwhelming mercy that encompasses all creation in this life.', surah: 1, surahEn: 'Al-Faatiha', ayah: 3, verseAr: 'الرَّحْمَنِ الرَّحِيمِ' },
  { arabic: 'الصِّرَاطَ', translit: 'aṣ-ṣirāṭa', root: 'ص ر ط', type: 'Noun (اسم)', meaning: 'The straight path', detail: 'A wide, clearly visible road — used in the Quran exclusively for the divine path of guidance and righteousness.', surah: 1, surahEn: 'Al-Faatiha', ayah: 6, verseAr: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
  { arabic: 'خَلِيفَةً', translit: 'khalīfatan', root: 'خ ل ف', type: 'Noun (اسم فاعل)', meaning: 'Vicegerent / Steward', detail: 'One who comes after and takes the place of another. Used for mankind\'s role as Allah\'s trustee on earth.', surah: 2, surahEn: 'Al-Baqara', ayah: 30, verseAr: 'إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً' },
  { arabic: 'تَقْوَى', translit: 'taqwā', root: 'و ق ي', type: 'Noun (مصدر)', meaning: 'God-consciousness / Piety', detail: 'From وقاية (protection). To shield oneself from harm by obeying Allah. The highest virtue in the Quran.', surah: 2, surahEn: 'Al-Baqara', ayah: 197, verseAr: 'وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَى' },
  { arabic: 'الصَّبْرُ', translit: 'aṣ-ṣabru', root: 'ص ب ر', type: 'Noun (مصدر)', meaning: 'Patient perseverance', detail: 'To restrain the soul from panic, the tongue from complaint, and the limbs from disorder. Mentioned over 90 times in the Quran.', surah: 2, surahEn: 'Al-Baqara', ayah: 153, verseAr: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ' },
  { arabic: 'الْكِتَابُ', translit: 'al-kitābu', root: 'ك ت ب', type: 'Noun (اسم)', meaning: 'The Book / Scripture', detail: 'From كتب — to write, to decree. Refers both to the Quran and to the divine decree written for every soul.', surah: 2, surahEn: 'Al-Baqara', ayah: 2, verseAr: 'ذَلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ' },
  { arabic: 'رَحْمَةً', translit: 'raḥmatan', root: 'ر ح م', type: 'Noun (مصدر)', meaning: 'Mercy', detail: 'A tenderness of the heart that moves one to act with goodness. Allah\'s mercy precedes His wrath — mentioned 114 times.', surah: 7, surahEn: 'Al-A\'raf', ayah: 156, verseAr: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ' },
  { arabic: 'الْعَقْلُ', translit: 'al-ʿaqlu', root: 'ع ق ل', type: 'Noun (اسم)', meaning: 'Reason / Intellect', detail: 'From عقل — to bind or tether. The intellect that binds a person from foolish behaviour. The Quran repeatedly calls to use it.', surah: 2, surahEn: 'Al-Baqara', ayah: 76, verseAr: 'أَفَلَا تَعْقِلُونَ' },
  { arabic: 'النُّورُ', translit: 'an-nūru', root: 'ن و ر', type: 'Noun (اسم)', meaning: 'Light', detail: 'Divine light that illuminates the heart and reveals truth. Allah describes Himself as the Light of the heavens and earth.', surah: 24, surahEn: 'An-Nur', ayah: 35, verseAr: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ' },
  { arabic: 'إِخْلَاصٌ', translit: 'ikhlāṣ', root: 'خ ل ص', type: 'Noun (مصدر)', meaning: 'Sincerity / Purity', detail: 'To purify an action from any admixture of showing off, so it is done solely for Allah. The surah of Ikhlas is its epitome.', surah: 112, surahEn: 'Al-Ikhlaas', ayah: 1, verseAr: 'قُلْ هُوَ اللَّهُ أَحَدٌ' },
  { arabic: 'فِرْدَوْسَ', translit: 'firdaws', root: 'ف ر د', type: 'Noun (اسم)', meaning: 'The Highest Paradise', detail: 'The highest and most central level of Paradise. Scholars say its root is Persian/Greek in origin, meaning an enclosed garden.', surah: 18, surahEn: 'Al-Kahf', ayah: 107, verseAr: 'أُولَئِكَ لَهُمْ جَنَّاتُ الْفِرْدَوْسِ نُزُلًا' },
  { arabic: 'الْعِلْمُ', translit: 'al-ʿilmu', root: 'ع ل م', type: 'Noun (مصدر)', meaning: 'Knowledge', detail: 'The first word revealed was اقرأ (read). Knowledge in Islam is a form of worship. Allah is Al-ʿAlīm — the All-Knowing.', surah: 96, surahEn: 'Al-ʿAlaq', ayah: 5, verseAr: 'عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ' },
  { arabic: 'الْقَلْبُ', translit: 'al-qalbu', root: 'ق ل ب', type: 'Noun (اسم)', meaning: 'The heart', detail: 'From قلب — to turn over, to transform. The heart is the centre of faith because it constantly turns. Called فؤاد when the seat of consciousness.', surah: 26, surahEn: 'Ash-Shuʿara', ayah: 89, verseAr: 'إِلَّا مَنْ أَتَى اللَّهَ بِقَلْبٍ سَلِيمٍ' },
  { arabic: 'الْبِرُّ', translit: 'al-birru', root: 'ب ر ر', type: 'Noun (مصدر)', meaning: 'Righteousness / Goodness', detail: 'A vast term encompassing all virtuous acts — belief, charity, prayer, and good character. The opposite is إثم (sin).', surah: 2, surahEn: 'Al-Baqara', ayah: 177, verseAr: 'لَيْسَ الْبِرَّ أَن تُوَلُّوا وُجُوهَكُمْ' },
  { arabic: 'الْأَمَانَةُ', translit: 'al-amānatu', root: 'أ م ن', type: 'Noun (مصدر)', meaning: 'The Trust / Integrity', detail: 'The greatest trust ever offered — to the heavens, earth, and mountains, they declined. Mankind accepted it. A profound cosmic responsibility.', surah: 33, surahEn: 'Al-Ahzab', ayah: 72, verseAr: 'إِنَّا عَرَضْنَا الْأَمَانَةَ عَلَى السَّمَاوَاتِ وَالْأَرْضِ' },
  { arabic: 'الشُّكْرُ', translit: 'ash-shukru', root: 'ش ك ر', type: 'Noun (مصدر)', meaning: 'Gratitude / Thankfulness', detail: 'To acknowledge a blessing and use it in the way of its giver. Allah promises: "If you are grateful, I will give you more."', surah: 14, surahEn: 'Ibrahim', ayah: 7, verseAr: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ' },
  { arabic: 'الْجِهَادُ', translit: 'al-jihādu', root: 'ج ه د', type: 'Noun (مصدر)', meaning: 'Striving / Exertion', detail: 'To exert one\'s utmost effort. The greatest jihad, said the Prophet, is the jihad against one\'s own soul and desires.', surah: 29, surahEn: 'Al-ʿAnkabut', ayah: 69, verseAr: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا' },
  { arabic: 'الْعَدْلُ', translit: 'al-ʿadlu', root: 'ع د ل', type: 'Noun (مصدر)', meaning: 'Justice / Equity', detail: 'To place everything in its rightful place. Allah commands justice even against one\'s own self, parents, or loved ones.', surah: 4, surahEn: 'An-Nisa', ayah: 135, verseAr: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُونُوا قَوَّامِينَ بِالْقِسْطِ' },
  { arabic: 'الرُّوحُ', translit: 'ar-rūḥu', root: 'ر و ح', type: 'Noun (اسم)', meaning: 'The Soul / Spirit', detail: 'One of the greatest mysteries. When asked about it, Allah replied: "The soul is from the command of my Lord, and of knowledge you have been given only a little."', surah: 17, surahEn: 'Al-Isra', ayah: 85, verseAr: 'وَمَا أُوتِيتُم مِّنَ الْعِلْمِ إِلَّا قَلِيلًا' },
  { arabic: 'السَّكِينَةُ', translit: 'as-sakīnatu', root: 'س ك ن', type: 'Noun (اسم)', meaning: 'Tranquility / Serenity', detail: 'A divine peace that Allah sends down upon the heart in times of fear or hardship. Sent upon the Prophet in the cave of Thawr.', surah: 9, surahEn: 'At-Tawba', ayah: 40, verseAr: 'فَأَنزَلَ اللَّهُ سَكِينَتَهُ عَلَيْهِ' },
  { arabic: 'الذِّكْرُ', translit: 'adh-dhikru', root: 'ذ ك ر', type: 'Noun (مصدر)', meaning: 'Remembrance', detail: 'To keep Allah present in heart, tongue, and action. The Quran itself is called الذكر — the reminder. "In the remembrance of Allah do hearts find rest."', surah: 13, surahEn: 'Ar-Raʿd', ayah: 28, verseAr: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ' },
  { arabic: 'الْإِحْسَانُ', translit: 'al-iḥsānu', root: 'ح س ن', type: 'Noun (مصدر)', meaning: 'Excellence / Perfection', detail: 'The Prophet defined it: "To worship Allah as if you see Him; if you cannot see Him, know that He sees you." The highest station of faith.', surah: 55, surahEn: 'Ar-Raḥman', ayah: 60, verseAr: 'هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ' },
  { arabic: 'الْمِيثَاقُ', translit: 'al-mīthāqu', root: 'و ث ق', type: 'Noun (اسم)', meaning: 'The Covenant / Pledge', detail: 'The primordial covenant where all souls testified to Allah\'s Lordship before being sent to earth. "Am I not your Lord?" — "Yes!"', surah: 7, surahEn: 'Al-Aʿraf', ayah: 172, verseAr: 'أَلَسْتُ بِرَبِّكُمْ قَالُوا بَلَى' },
  { arabic: 'الْفُرْقَانُ', translit: 'al-furqānu', root: 'ف ر ق', type: 'Noun (اسم)', meaning: 'The Criterion', detail: 'That which distinguishes truth from falsehood, the lawful from the forbidden. One of the names of the Quran.', surah: 25, surahEn: 'Al-Furqan', ayah: 1, verseAr: 'تَبَارَكَ الَّذِي نَزَّلَ الْفُرْقَانَ عَلَى عَبْدِهِ' },
  { arabic: 'الْحِكْمَةُ', translit: 'al-ḥikmatu', root: 'ح ك م', type: 'Noun (اسم)', meaning: 'Wisdom', detail: 'The ability to place things in their right position at the right time. Given to whom Allah wills — "and whoever is given wisdom has been given much good."', surah: 2, surahEn: 'Al-Baqara', ayah: 269, verseAr: 'يُؤْتِي الْحِكْمَةَ مَن يَشَاءُ وَمَن يُؤْتَ الْحِكْمَةَ فَقَدْ أُوتِيَ خَيْرًا كَثِيرًا' },
  { arabic: 'الصَّلَاةُ', translit: 'aṣ-ṣalātu', root: 'ص ل و', type: 'Noun (اسم)', meaning: 'Prayer / Connection', detail: 'From صلة — connection. The five daily prayers are a direct line between the servant and the Lord. The first thing accounted for on the Day of Judgment.', surah: 2, surahEn: 'Al-Baqara', ayah: 238, verseAr: 'حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَى' },
  { arabic: 'الْأَرْضُ', translit: 'al-arḍu', root: 'أ ر ض', type: 'Noun (اسم)', meaning: 'The Earth', detail: 'Mentioned 461 times alongside السماء (heaven). The earth is spread out as a resting place and is a sign of Allah\'s power and provision.', surah: 2, surahEn: 'Al-Baqara', ayah: 22, verseAr: 'الَّذِي جَعَلَ لَكُمُ الْأَرْضَ فِرَاشًا' },
  { arabic: 'التَّوْبَةُ', translit: 'at-tawbatu', root: 'ت و ب', type: 'Noun (مصدر)', meaning: 'Repentance / Return', detail: 'Literally "to return". Allah\'s door of repentance is open until the sun rises from the west. Allah turns to those who turn to Him.', surah: 4, surahEn: 'An-Nisa', ayah: 17, verseAr: 'إِنَّمَا التَّوْبَةُ عَلَى اللَّهِ لِلَّذِينَ يَعْمَلُونَ السُّوءَ بِجَهَالَةٍ' },
  { arabic: 'الصِّدْقُ', translit: 'aṣ-ṣidqu', root: 'ص د ق', type: 'Noun (مصدر)', meaning: 'Truthfulness', detail: 'To align the inner with the outer — what one says matches what one believes and does. The Quran commands being with the truthful.', surah: 9, surahEn: 'At-Tawba', ayah: 119, verseAr: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ' },
  { arabic: 'الْخُشُوعُ', translit: 'al-khushūʿu', root: 'خ ش ع', type: 'Noun (مصدر)', meaning: 'Humble devotion', detail: 'Lowliness of heart before the majesty of Allah, expressed in the body\'s stillness. The Quran says the believers are those who have khushūʿ in their prayer.', surah: 23, surahEn: 'Al-Mu\'minun', ayah: 2, verseAr: 'الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ' },
];

function getDayIndex(): number {
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / 86_400_000);
  return daysSinceEpoch % WORDS.length;
}

interface WordOfDayProps {
  onNavigate?: (surah: number, ayah: number) => void;
}

export const WordOfDay: React.FC<WordOfDayProps> = ({ onNavigate }) => {
  const word = useMemo(() => WORDS[getDayIndex()], []);

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-gold) 20%, transparent)' }}>

      <div className="px-5 py-3 flex items-center gap-2"
        style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 8%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--grove-gold) 15%, transparent)' }}>
        <Sparkles size={13} style={{ color: 'var(--grove-gold)' }} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--grove-gold)' }}>
          Word of the Day
        </span>
        <span className="text-[10px] opacity-40 ml-auto" style={{ color: 'var(--grove-gold)' }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="p-5 flex flex-col sm:flex-row gap-5 items-start">
        <div className="flex flex-col items-center gap-1.5 shrink-0 w-full sm:w-auto sm:min-w-[140px] sm:border-r sm:pr-5"
          style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <span className="text-5xl leading-tight text-center" dir="rtl"
            style={{ fontFamily: 'var(--font-arabic-var)', color: 'var(--grove-purple)' }}>
            {word.arabic}
          </span>
          <span className="text-xs italic opacity-50" style={{ color: 'var(--grove-purple)' }}>
            {word.translit}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-1"
            style={{ backgroundColor: 'color-mix(in srgb, var(--grove-green) 12%, transparent)', color: 'var(--grove-green)' }}>
            {word.root}
          </span>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)' }}>
            {word.type}
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xl font-bold leading-tight" style={{ color: 'var(--grove-purple)' }}>
              {word.meaning}
            </p>
            <p className="text-xs leading-relaxed mt-1.5 opacity-65" style={{ color: 'var(--grove-purple)' }}>
              {word.detail}
            </p>
          </div>

          <div className="rounded-xl p-3"
            style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--grove-purple) 7%, transparent)' }}>
            <p className="text-base text-right leading-relaxed mb-1.5" dir="rtl"
              style={{ fontFamily: 'var(--font-arabic-var)', color: 'var(--grove-purple)' }}>
              {word.verseAr}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-40"
                style={{ color: 'var(--grove-purple)' }}>
                {word.surahEn} {word.surah}:{word.ayah}
              </span>
              {onNavigate && (
                <button
                  onClick={() => onNavigate(word.surah, word.ayah)}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-opacity hover:opacity-70"
                  style={{ color: 'var(--grove-gold)' }}>
                  Read in context
                  <ArrowLeft size={9} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
