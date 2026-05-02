import { Surah, SurahDetail } from '../types';

const BASE_URL = 'https://api.alquran.cloud/v1';

export async function getAllSurahs(): Promise<Surah[]> {
  const cached = localStorage.getItem('quran_surahs_list');
  if (cached) return JSON.parse(cached);

  const response = await fetch(`${BASE_URL}/surah`);
  const data = await response.json();
  localStorage.setItem('quran_surahs_list', JSON.stringify(data.data));
  return data.data;
}

export async function getSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const cacheKey = `quran_surah_${surahNumber}_v2`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await fetch(
    `${BASE_URL}/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ur.jalandhry,ar.jalalayn`
  );
  const data = await response.json();

  if (!data.data || data.data.length < 4) {
    throw new Error('Failed to fetch all translations');
  }

  const [uthmani, english, urdu, tafsir] = data.data;

  const mergedAyahs = uthmani.ayahs.map((ayah: any, index: number) => ({
    ...ayah,
    translations: {
      en: english.ayahs[index].text,
      ur: urdu.ayahs[index].text,
      ar: tafsir.ayahs[index].text
    }
  }));

  const result: SurahDetail = { ...uthmani, ayahs: mergedAyahs };
  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}
