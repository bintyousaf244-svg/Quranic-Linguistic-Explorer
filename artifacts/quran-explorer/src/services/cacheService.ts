const CACHE_PREFIX = 'quran_analysis_';

export const AnalysisCache = {
  get: (type: string, surahName: string, ayahNumber: number): string | null => {
    try {
      const key = `${CACHE_PREFIX}${type}_${surahName}_${ayahNumber}`;
      return localStorage.getItem(key);
    } catch { return null; }
  },

  set: (type: string, surahName: string, ayahNumber: number, content: string): void => {
    try {
      const key = `${CACHE_PREFIX}${type}_${surahName}_${ayahNumber}`;
      localStorage.setItem(key, content);
    } catch { /* ignore */ }
  },

  getWord: (word: string): string | null => {
    try {
      const key = `${CACHE_PREFIX}word_${word}`;
      return localStorage.getItem(key);
    } catch { return null; }
  },

  setWord: (word: string, content: string): void => {
    try {
      const key = `${CACHE_PREFIX}word_${word}`;
      localStorage.setItem(key, content);
    } catch { /* ignore */ }
  }
};
