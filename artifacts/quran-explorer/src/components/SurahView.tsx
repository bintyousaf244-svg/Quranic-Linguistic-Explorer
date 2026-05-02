import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Surah, SurahDetail, Note } from '../types';
import { getSurahDetail } from '../services/quranService';
import { fetchSurahTafseer, TafseerEdition, TAFSEER_META } from '../services/tafseerService';
import { ReciterId, RECITERS, getAyahAudioUrl, playAyahAudio, stopAyahAudio } from '../services/audioService';
import { AyahCard } from './AyahCard';
import { Loader2, ArrowLeft, ArrowUp, BookMarked, Headphones, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';
import { surahUrduMeanings } from '../lib/surahUrduNames';

interface SurahViewProps {
  surah: Surah;
  onBack: () => void;
  notes: Note[];
  onSaveNote: (surahNumber: number, ayahNumber: number, content: string) => void;
  fontSize: number;
  scrollToAyah?: number;
}

export const SurahView: React.FC<SurahViewProps> = ({ surah, onBack, notes, onSaveNote, fontSize, scrollToAyah }) => {
  const { lang, t } = useLanguage();
  const isUrdu = lang === 'ur';

  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Tafseer state
  const [selectedTafseer, setSelectedTafseer] = useState<TafseerEdition | null>(null);
  const [tafseerMap, setTafseerMap] = useState<Map<number, string>>(new Map());
  const [isTafseerLoading, setIsTafseerLoading] = useState(false);
  const [tafseerError, setTafseerError] = useState<string | null>(null);

  // Audio state (all managed here — AyahCard only receives callbacks)
  const [reciterId, setReciterId] = useState<ReciterId | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);

  // Stable refs so callbacks don't go stale
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;
  const detailRef = useRef(detail);
  detailRef.current = detail;
  const reciterIdRef = useRef(reciterId);
  reciterIdRef.current = reciterId;
  const surahRef = useRef(surah);
  surahRef.current = surah;

  // Core play function — safe to call from anywhere
  const playAyah = useCallback((ayahNumber: number) => {
    const rid = reciterIdRef.current;
    if (!rid) return;
    const url = getAyahAudioUrl(surahRef.current.number, ayahNumber, rid);
    setPlayingAyah(ayahNumber);

    playAyahAudio(url, () => {
      setPlayingAyah(null);
      if (!autoPlayRef.current) return;

      const ayahs = detailRef.current?.ayahs ?? [];
      const idx = ayahs.findIndex(a => a.numberInSurah === ayahNumber);
      if (idx !== -1 && idx < ayahs.length - 1) {
        const next = ayahs[idx + 1];
        // Small gap then scroll and play
        setTimeout(() => {
          const el = document.getElementById(`ayah-${surahRef.current.number}-${next.numberInSurah}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Wait for scroll then play
          setTimeout(() => playAyah(next.numberInSurah), 400);
        }, 300);
      }
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset on surah change
  useEffect(() => {
    setIsLoading(true);
    getSurahDetail(surah.number)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setIsLoading(false));
    setSelectedTafseer(null);
    setTafseerMap(new Map());
    stopAyahAudio();
    setPlayingAyah(null);
  }, [surah.number]);

  // Stop audio on unmount
  useEffect(() => () => stopAyahAudio(), []);

  // Scroll to a specific ayah once content loads
  useEffect(() => {
    if (!scrollToAyah || isLoading) return;
    const el = document.getElementById(`ayah-${surah.number}-${scrollToAyah}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  }, [scrollToAyah, isLoading, surah.number]);

  // Fetch tafseer when selection changes
  useEffect(() => {
    if (!selectedTafseer) { setTafseerMap(new Map()); return; }
    setIsTafseerLoading(true);
    setTafseerError(null);
    fetchSurahTafseer(surah.number, selectedTafseer)
      .then(ayahs => {
        const m = new Map<number, string>();
        ayahs.forEach(a => m.set(a.numberInSurah, a.text));
        setTafseerMap(m);
      })
      .catch(() => setTafseerError('Failed to load tafseer. Please try again.'))
      .finally(() => setIsTafseerLoading(false));
  }, [selectedTafseer, surah.number]);

  const revelationLabel = (type: string) => {
    if (type === 'Meccan') return t('meccan');
    if (type === 'Medinan') return t('medinan');
    return type;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--grove-purple)' }} />
        <p className="font-medium opacity-60" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
          {t('loadingSurah')} {surah.englishName}...
        </p>
      </div>
    );
  }

  if (!detail) return null;

  const nameTranslation = isUrdu
    ? surahUrduMeanings[surah.number] ?? surah.englishNameTranslation
    : surah.englishNameTranslation;

  const tafseerOptions: { value: TafseerEdition | null; label: string }[] = [
    { value: null, label: t('tafseerOff') },
    { value: 'en.kathir', label: t('tafseerIbnKathir') },
    { value: 'ur.maarifulquran', label: t('tafseerMaarif') },
  ];

  const reciterOptions: { value: ReciterId | null; label: string }[] = [
    { value: null, label: t('reciterOff') },
    ...Object.entries(RECITERS).map(([id, meta]) => ({
      value: id as ReciterId,
      label: isUrdu ? meta.nameAr : meta.nameEn,
    })),
  ];

  const btnStyle = (active: boolean, color: string) => ({
    backgroundColor: active ? color : `color-mix(in srgb, ${color} 10%, transparent)`,
    color: active ? 'white' : color,
    fontFamily: isUrdu ? '"Amiri", serif' : undefined,
    fontSize: isUrdu ? '13px' : undefined,
  });

  return (
    <div>
      {/* Surah header */}
      <div className="mb-8 text-center relative rounded-[2rem] p-10 md:p-14 border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
        <button onClick={onBack} className="absolute left-6 top-10 p-3 rounded-full transition-all hover:opacity-70"
          style={{ color: 'var(--grove-purple)', backgroundColor: 'var(--grove-cream)' }}>
          <ArrowLeft size={24} />
        </button>
        <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-6"
          style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)', fontFamily: isUrdu ? '"Amiri", serif' : undefined, fontSize: isUrdu ? '12px' : undefined }}>
          {t('surahLabel')} {surah.number} · {revelationLabel(surah.revelationType)}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3" style={{ color: 'var(--grove-purple)' }}>
          {surah.englishName}
        </h2>
        <p className="text-xl mb-8 font-medium opacity-50" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
          {nameTranslation}
        </p>
        <div className="text-6xl mb-10" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
          {surah.name}
        </div>
        {surah.number !== 1 && surah.number !== 9 && (
          <div className="text-4xl py-10 border-y" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-green)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </div>
        )}
      </div>

      {/* Tafseer selector */}
      <div className="mb-4 rounded-2xl border p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 12%, transparent)' }}>
            <BookMarked size={15} style={{ color: 'var(--grove-teal)' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--grove-teal)', fontFamily: isUrdu ? '"Amiri", serif' : undefined, fontSize: isUrdu ? '13px' : undefined }}>
            {t('tafseerLabel')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {tafseerOptions.map(opt => (
            <button key={opt.value ?? 'off'} onClick={() => setSelectedTafseer(opt.value)}
              className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              style={btnStyle(selectedTafseer === opt.value, 'var(--grove-teal)')}>
              {opt.label}
            </button>
          ))}
        </div>
        {isTafseerLoading && (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--grove-teal)' }}>
            <Loader2 className="animate-spin" size={13} /> {t('tafseerLoading')}
          </div>
        )}
        {tafseerError && <span className="text-[10px] text-red-500 font-medium">{tafseerError}</span>}
        {selectedTafseer && !isTafseerLoading && tafseerMap.size > 0 && (
          <span className="text-[10px] opacity-35 italic" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
            {isUrdu ? TAFSEER_META[selectedTafseer].sourceUr : TAFSEER_META[selectedTafseer].sourceEn}
          </span>
        )}
      </div>

      {/* Reciter + Auto-play selector */}
      <div className="mb-8 rounded-2xl border p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-green) 12%, transparent)' }}>
            <Headphones size={15} style={{ color: 'var(--grove-green)' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--grove-green)', fontFamily: isUrdu ? '"Amiri", serif' : undefined, fontSize: isUrdu ? '13px' : undefined }}>
            {t('reciterLabel')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 flex-1">
          {reciterOptions.map(opt => (
            <button key={opt.value ?? 'off'}
              onClick={() => {
                if (reciterId !== opt.value) { stopAyahAudio(); setPlayingAyah(null); }
                setReciterId(opt.value);
              }}
              className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              style={btnStyle(reciterId === opt.value, 'var(--grove-green)')}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Auto-play toggle — only when a reciter is active */}
        {reciterId && (
          <button
            onClick={() => {
              const next = !autoPlay;
              setAutoPlay(next);
              // If turning off while playing, just let current ayah finish
              if (!next && playingAyah !== null) {
                stopAyahAudio();
                setPlayingAyah(null);
              }
              // If turning on and nothing is playing, start from ayah 1
              if (next && playingAyah === null && detail.ayahs.length > 0) {
                const first = detail.ayahs[0];
                const el = document.getElementById(`ayah-${surah.number}-${first.numberInSurah}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => playAyah(first.numberInSurah), 400);
              }
            }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            style={{
              backgroundColor: autoPlay ? 'var(--grove-purple)' : 'color-mix(in srgb, var(--grove-purple) 10%, transparent)',
              color: autoPlay ? 'white' : 'var(--grove-purple)',
              fontFamily: isUrdu ? '"Amiri", serif' : undefined,
              fontSize: isUrdu ? '13px' : undefined,
            }}
          >
            <RefreshCw size={12} className={autoPlay ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
            {autoPlay ? t('autoPlayOn') : t('autoPlay')}
          </button>
        )}

        {playingAyah !== null && (
          <span className="text-[10px] font-bold opacity-60 flex items-center gap-1" style={{ color: 'var(--grove-green)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
            ▶ {isUrdu ? `آیت ${playingAyah}` : `Ayah ${playingAyah}`}
          </span>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {detail.ayahs.map((ayah) => (
          <div key={ayah.number} id={`ayah-${surah.number}-${ayah.numberInSurah}`}>
            <AyahCard
              ayah={ayah}
              surahName={surah.englishName}
              surahNumber={surah.number}
              note={notes.find(n => n.surahNumber === surah.number && n.ayahNumber === ayah.numberInSurah)}
              onSaveNote={(content) => onSaveNote(surah.number, ayah.numberInSurah, content)}
              fontSize={fontSize}
              highlighted={scrollToAyah === ayah.numberInSurah}
              tafseerText={tafseerMap.get(ayah.numberInSurah)}
              tafseerEdition={selectedTafseer ?? undefined}
              hasReciter={!!reciterId}
              isPlaying={playingAyah === ayah.numberInSurah}
              onPlay={() => {
                stopAyahAudio();
                playAyah(ayah.numberInSurah);
              }}
              onPause={() => {
                stopAyahAudio();
                setPlayingAyah(null);
              }}
            />
          </div>
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
