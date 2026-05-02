import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageProvider';
import { useLanguage } from './context/useLanguage';
import { Layout } from './components/Layout';
import { SurahList } from './components/SurahList';
import { SurahView } from './components/SurahView';
import { WordSearch } from './components/WordSearch';
import { VerbConjugation } from './components/VerbConjugation';
import { RootSearch } from './components/RootSearch';
import { ThematicSearch } from './components/ThematicSearch';
import { getAllSurahs } from './services/quranService';
import { getAllNotes, saveNote } from './services/notesService';
import { Surah, Note } from './types';
import { Loader2, BookOpen, Star, Languages, GitBranch, Sparkles } from 'lucide-react';

function AppContent() {
  const { t } = useLanguage();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isConjugationOpen, setIsConjugationOpen] = useState(false);
  const [isRootSearchOpen, setIsRootSearchOpen] = useState(false);
  const [isThematicOpen, setIsThematicOpen] = useState(false);
  const [rootSearchPreload, setRootSearchPreload] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(32);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('darkMode') || 'false'); } catch { return false; }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); } catch { /* ignore */ }
  }, [isDarkMode]);

  useEffect(() => {
    getAllSurahs()
      .then((data) => {
        setSurahs(data);
        setFilteredSurahs(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setNotes(getAllNotes());
  }, []);

  const handleSearch = (query: string) => {
    const q = query.toLowerCase();
    setFilteredSurahs(surahs.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(query) ||
      s.number.toString() === query
    ));
  };

  const handleSaveNote = (surahNumber: number, ayahNumber: number, content: string) => {
    saveNote(surahNumber, ayahNumber, content);
    setNotes(getAllNotes());
  };

  const selectedSurahNumber = selectedSurah?.number;

  return (
    <Layout
      onSearch={handleSearch}
      onOpenDictionary={() => setIsDictionaryOpen(true)}
      onOpenConjugation={() => setIsConjugationOpen(true)}
      onOpenRootSearch={() => setIsRootSearchOpen(true)}
      onOpenThematicSearch={() => setIsThematicOpen(true)}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode((d: boolean) => !d)}
    >
      {isDictionaryOpen && <WordSearch onClose={() => setIsDictionaryOpen(false)} />}
      {isConjugationOpen && <VerbConjugation onClose={() => setIsConjugationOpen(false)} />}
      {isRootSearchOpen && (
        <RootSearch
          onClose={() => { setIsRootSearchOpen(false); setRootSearchPreload(null); }}
          onNavigate={(num) => {
            const s = surahs.find(x => x.number === num);
            if (s) setSelectedSurah(s);
          }}
          preloadRoot={rootSearchPreload ?? undefined}
        />
      )}
      {isThematicOpen && (
        <ThematicSearch
          onClose={() => setIsThematicOpen(false)}
          onNavigate={(num) => {
            const s = surahs.find(x => x.number === num);
            if (s) setSelectedSurah(s);
          }}
          onOpenRootSearch={(root) => {
            setIsThematicOpen(false);
            setRootSearchPreload(root);
            setIsRootSearchOpen(true);
          }}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--grove-green)' }} />
          <p className="font-bold uppercase tracking-widest text-xs opacity-60" style={{ color: 'var(--grove-purple)' }}>
            {t('loadingLib')}
          </p>
        </div>
      ) : selectedSurah ? (
        <SurahView
          surah={selectedSurah}
          onBack={() => setSelectedSurah(null)}
          notes={notes}
          onSaveNote={handleSaveNote}
          fontSize={fontSize}
        />
      ) : (
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto py-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)' }}>
              <Star size={14} />
              {t('heroBadge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ color: 'var(--grove-purple)' }}>
              {t('heroTitle')}
            </h2>
            <p className="text-lg leading-relaxed font-medium opacity-70" style={{ color: 'var(--grove-purple)' }}>
              {t('heroDesc')}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                key: 'dict',
                icon: <Languages size={22} />,
                label: t('dict'),
                descEn: 'Word-by-word analysis',
                descUr: 'لفظ بلفظ تجزیہ',
                color: 'var(--grove-teal)',
                bg: 'color-mix(in srgb, var(--grove-teal) 10%, transparent)',
                onClick: () => setIsDictionaryOpen(true),
              },
              {
                key: 'tasreef',
                icon: <span style={{ fontFamily: '"Amiri", serif', fontSize: '22px', lineHeight: 1 }}>ص</span>,
                label: t('tasreef'),
                descEn: 'Verb conjugation table',
                descUr: 'فعل کی گردان',
                color: 'var(--grove-gold)',
                bg: 'color-mix(in srgb, var(--grove-gold) 10%, transparent)',
                onClick: () => setIsConjugationOpen(true),
              },
              {
                key: 'roots',
                icon: <GitBranch size={22} />,
                label: t('roots'),
                descEn: 'Search by Arabic root',
                descUr: 'عربی جذر سے تلاش',
                color: 'var(--grove-green)',
                bg: 'color-mix(in srgb, var(--grove-green) 10%, transparent)',
                onClick: () => setIsRootSearchOpen(true),
              },
              {
                key: 'themes',
                icon: <Sparkles size={22} />,
                label: t('themes'),
                descEn: 'AI thematic verse search',
                descUr: 'موضوعی آیات تلاش',
                color: 'var(--grove-purple)',
                bg: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)',
                onClick: () => setIsThematicOpen(true),
              },
            ].map(({ key, icon, label, descEn, descUr, color, bg, onClick }) => (
              <button
                key={key}
                onClick={onClick}
                className="flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-md"
                style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg, color }}>
                  {icon}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--grove-purple)' }}>{label}</div>
                  <div className="text-[11px] opacity-55 mt-0.5 leading-snug" style={{ color: 'var(--grove-purple)' }}>
                    {t('langToggle') === 'English' ? descUr : descEn}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-[2rem] p-8 border" style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
            <div className="flex items-center gap-3 mb-8 border-b pb-6" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 12%, transparent)' }}>
                <BookOpen size={24} style={{ color: 'var(--grove-teal)' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--grove-purple)' }}>
                  {t('sectionTitle')}
                </h3>
                <p className="text-xs opacity-50" style={{ color: 'var(--grove-purple)' }}>
                  {t('sectionSub')}
                </p>
              </div>
            </div>
            <SurahList
              surahs={filteredSurahs}
              onSelect={(s) => setSelectedSurah(s)}
              selectedSurahNumber={selectedSurahNumber}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
