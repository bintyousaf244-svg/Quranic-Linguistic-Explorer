import React from 'react';
import { Surah } from '../types';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';
import { surahUrduMeanings } from '../lib/surahUrduNames';

interface SurahListProps {
  surahs: Surah[];
  onSelect: (surah: Surah) => void;
  selectedSurahNumber?: number;
}

export const SurahList: React.FC<SurahListProps> = ({ surahs, onSelect, selectedSurahNumber }) => {
  const { lang, t } = useLanguage();
  const isUrdu = lang === 'ur';

  const revelationLabel = (type: string) => {
    if (type === 'Meccan') return t('meccan');
    if (type === 'Medinan') return t('medinan');
    return type;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {surahs.map((surah) => {
        const isSelected = selectedSurahNumber === surah.number;
        const meaning = isUrdu
          ? surahUrduMeanings[surah.number] ?? surah.englishNameTranslation
          : surah.englishNameTranslation;

        return (
          <button
            key={surah.number}
            onClick={() => onSelect(surah)}
            className="flex items-center justify-between p-5 rounded-2xl border transition-all text-left group"
            style={{
              backgroundColor: isSelected ? 'var(--grove-purple)' : 'var(--grove-paper)',
              borderColor: isSelected ? 'var(--grove-purple)' : 'color-mix(in srgb, var(--grove-purple) 10%, transparent)',
              color: isSelected ? 'white' : 'var(--grove-purple)',
              boxShadow: isSelected ? '0 4px 12px color-mix(in srgb, var(--grove-purple) 25%, transparent)' : 'none'
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm font-bold"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : 'var(--grove-cream)',
                  color: isSelected ? 'white' : 'var(--grove-green)'
                }}>
                {surah.number}
              </div>
              <div>
                <h3 className="font-bold transition-colors" style={{ color: isSelected ? 'white' : 'var(--grove-purple)' }}>
                  {surah.englishName}
                </h3>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider opacity-60"
                  style={{ fontFamily: isUrdu ? '"Amiri", serif' : undefined, fontSize: isUrdu ? '12px' : undefined }}
                >
                  {surah.numberOfAyahs} {t('ayahs')} · {revelationLabel(surah.revelationType)}
                </p>
                {isUrdu && meaning && (
                  <p className="text-xs mt-0.5 opacity-70" style={{ fontFamily: '"Amiri", serif', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--grove-green)' }}>
                    {meaning}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-2xl font-arabic leading-none" style={{ fontFamily: '"Amiri", serif' }}>
                {surah.name}
              </span>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1 opacity-50" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
