export type TafseerEdition = 'en.kathir' | 'ur.maarifulquran';

export interface TafseerAyah {
  numberInSurah: number;
  text: string;
}

export const TAFSEER_META: Record<TafseerEdition, { labelEn: string; labelUr: string; sourceEn: string; sourceUr: string; rtl: boolean }> = {
  'en.kathir': {
    labelEn: 'Ibn Katheer (English)',
    labelUr: 'ابن کثیر (انگریزی)',
    sourceEn: 'Tafsir Ibn Kathir — Imam Ibn Kathir al-Dimashqi (774–1373 CE)',
    sourceUr: 'تفسیر ابن کثیر — امام ابن کثیر دمشقی',
    rtl: false,
  },
  'ur.maarifulquran': {
    labelEn: "Ma'ariful Quran (Urdu)",
    labelUr: 'معارف القرآن (اردو)',
    sourceEn: "Ma'ariful Quran — Mufti Muhammad Shafi Usmani",
    sourceUr: 'معارف القرآن — مفتی محمد شفیع عثمانی',
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
