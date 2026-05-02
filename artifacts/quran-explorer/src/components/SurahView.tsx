import React, { useEffect, useState } from 'react';
import { Surah, SurahDetail, Note } from '../types';
import { getSurahDetail } from '../services/quranService';
import { AyahCard } from './AyahCard';
import { Loader2, ArrowLeft, ArrowUp } from 'lucide-react';

interface SurahViewProps {
  surah: Surah;
  onBack: () => void;
  notes: Note[];
  onSaveNote: (surahNumber: number, ayahNumber: number, content: string) => void;
  fontSize: number;
}

export const SurahView: React.FC<SurahViewProps> = ({ surah, onBack, notes, onSaveNote, fontSize }) => {
  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getSurahDetail(surah.number)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [surah.number]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--grove-purple)' }} />
        <p className="font-medium opacity-60" style={{ color: 'var(--grove-purple)' }}>Loading Surah {surah.englishName}...</p>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div>
      <div className="mb-12 text-center relative rounded-[2rem] p-10 md:p-14 border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
        <button
          onClick={onBack}
          className="absolute left-6 top-10 p-3 rounded-full transition-all hover:opacity-70"
          style={{ color: 'var(--grove-purple)', backgroundColor: 'var(--grove-cream)' }}
        >
          <ArrowLeft size={24} />
        </button>

        <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-6"
          style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)' }}>
          Surah {surah.number} · {surah.revelationType}
        </div>

        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3" style={{ color: 'var(--grove-purple)' }}>
          {surah.englishName}
        </h2>
        <p className="text-xl mb-8 font-medium opacity-50" style={{ color: 'var(--grove-purple)' }}>
          {surah.englishNameTranslation}
        </p>

        <div className="text-6xl mb-10" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
          {surah.name}
        </div>

        {surah.number !== 1 && surah.number !== 9 && (
          <div className="text-4xl py-10 border-y" style={{
            fontFamily: '"Amiri", serif',
            color: 'var(--grove-green)',
            borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)'
          }}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {detail.ayahs.map((ayah) => (
          <AyahCard
            key={ayah.number}
            ayah={ayah}
            surahName={surah.englishName}
            note={notes.find(n => n.surahNumber === surah.number && n.ayahNumber === ayah.numberInSurah)}
            onSaveNote={(content) => onSaveNote(surah.number, ayah.numberInSurah, content)}
            fontSize={fontSize}
          />
        ))}
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-4 text-white rounded-full shadow-2xl transition-all active:scale-95 z-50"
          style={{ backgroundColor: 'var(--grove-purple)' }}
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};
