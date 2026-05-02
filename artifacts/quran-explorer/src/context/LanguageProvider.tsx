import React, { useState, useEffect } from 'react';
import { LanguageContext, type Lang } from './langCtx';
import { strings, StringKey } from '../lib/i18n';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
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
}
