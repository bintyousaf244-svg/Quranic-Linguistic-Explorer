export type TafseerEdition = 'en.kathir' | 'ur.maarifulquran';

export interface TafseerAyah {
  numberInSurah: number;
  text: string;
}

export const TAFSEER_META: Record<TafseerEdition, { labelEn: string; labelUr: string; sourceEn: string; sourceUr: string; rtl: boolean }> = {
  'en.kathir': {
    labelEn: 'Ibn Katheer (English)',
    labelUr: 'ابن کثیر (انگریزی)',
    sourceEn: 'Tafsir Ibn Kathir — Imam Ibn Kathir al-Dimashqi (774 H)',
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const cache = new Map<string, TafseerAyah[]>();

export async function fetchSurahTafseer(surahNumber: number, edition: TafseerEdition): Promise<TafseerAyah[]> {
  const key = `${surahNumber}:${edition}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(`${basePath}/api/tafseer/${surahNumber}/${edition}`);
  if (!res.ok) throw new Error(`Tafseer fetch failed: ${res.status}`);

  const json = await res.json() as { ayahs: TafseerAyah[] };
  const ayahs = json.ayahs;

  cache.set(key, ayahs);
  return ayahs;
}
