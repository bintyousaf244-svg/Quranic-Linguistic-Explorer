import React, { createContext, useContext, useState, useEffect } from 'react';
import { strings, StringKey } from '../lib/i18n';

export type Lang = 'en' | 'ur';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('appLang');
      return stored === 'ur' ? 'ur' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('appLang', lang); } catch { /* ignore */ }
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: StringKey): string => {
    const row = strings[lang] as Record<string, string>;
    return row[key] ?? (strings.en as Record<string, string>)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
