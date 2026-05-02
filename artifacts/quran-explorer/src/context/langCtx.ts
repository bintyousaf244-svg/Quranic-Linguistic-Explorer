import { createContext } from 'react';
import { strings, StringKey } from '../lib/i18n';

export type Lang = 'en' | 'ur';

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
}

export const LanguageContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => (strings.en as Record<string, string>)[k] ?? k,
});
