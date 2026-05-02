export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
  translations?: {
    en?: string;
    ur?: string;
    ar?: string;
  };
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

export interface Note {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  content: string;
  updatedAt: string;
}
