export type TafseerEdition = 'ar.jalalayn' | 'ar.muyassar';

export interface TafseerAyah {
  numberInSurah: number;
  text: string;
}

export const TAFSEER_META: Record<TafseerEdition, { labelEn: string; labelUr: string; sourceEn: string; sourceUr: string; rtl: boolean }> = {
  'ar.jalalayn': {
    labelEn: 'Tafseer Al-Jalalayn (Arabic)',
    labelUr: 'تفسیر الجلالین (عربی)',
    sourceEn: 'Tafsir al-Jalalayn — Imam Jalal al-Din al-Mahalli & Jalal al-Din al-Suyuti',
    sourceUr: 'تفسیر الجلالین — امام جلال الدین المحلی و جلال الدین السیوطی',
    rtl: true,
  },
  'ar.muyassar': {
    labelEn: 'Al-Muyassar (Arabic)',
    labelUr: 'المیسر (عربی)',
    sourceEn: "Al-Muyassar — King Fahd Quran Printing Complex, Madinah",
    sourceUr: 'المیسر — مجمع الملک فہد لطباعۃ المصحف الشریف',
    rtl: true,
  },
};

const cache = new Map<string, TafseerAyah[]>();

export async function fetchSurahTafseer(surahNumber: number, edition: TafseerEdition): Promise<TafseerAyah[]> {
  const key = `${surahNumber}:${edition}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition}`);
  if (!res.ok) throw new Error(`Tafseer fetch failed: ${res.status}`);

  const json = await res.json();
  const ayahs: TafseerAyah[] = (json.data.ayahs as Array<{ numberInSurah: number; text: string }>).map(a => ({
    numberInSurah: a.numberInSurah,
    text: a.text,
  }));

  cache.set(key, ayahs);
  return ayahs;
}
