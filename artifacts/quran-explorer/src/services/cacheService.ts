const CACHE_PREFIX = 'quran_analysis_v4_';

function purgeOldCache() {
  try {
    const oldPrefix = 'quran_analysis_';
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(oldPrefix) && !key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

purgeOldCache();

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
