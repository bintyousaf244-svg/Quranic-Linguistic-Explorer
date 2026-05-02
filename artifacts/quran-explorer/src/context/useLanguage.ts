import { useContext } from 'react';
import { LanguageContext } from './langCtx';

export function useLanguage() {
  return useContext(LanguageContext);
}
