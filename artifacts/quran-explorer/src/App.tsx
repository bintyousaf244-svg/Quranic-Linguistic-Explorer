import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SurahList } from './components/SurahList';
import { SurahView } from './components/SurahView';
import { WordSearch } from './components/WordSearch';
import { getAllSurahs } from './services/quranService';
import { getAllNotes, saveNote } from './services/notesService';
import { Surah, Note } from './types';
import { Loader2, BookOpen, Star } from 'lucide-react';

export default function App() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
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
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode((d: boolean) => !d)}
    >
      {isDictionaryOpen && <WordSearch onClose={() => setIsDictionaryOpen(false)} />}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--grove-green)' }} />
          <p className="font-bold uppercase tracking-widest text-xs opacity-60" style={{ color: 'var(--grove-purple)' }}>
            Preparing the Quranic Library...
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
              Authentic Classical I'rab Sources
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ color: 'var(--grove-purple)' }}>
              Explore the Divine Word
            </h2>
            <p className="text-lg leading-relaxed font-medium opacity-70" style={{ color: 'var(--grove-purple)' }}>
              Deep dive into the linguistic miracles of the Quran — authentic I'rab from classical
              works (الدعاس، الدرويش، النحاس), AI morphology, and word-by-word dictionary analysis.
            </p>
          </div>

          <div className="rounded-[2rem] p-8 border" style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
            <div className="flex items-center gap-3 mb-8 border-b pb-6" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 12%, transparent)' }}>
                <BookOpen size={24} style={{ color: 'var(--grove-teal)' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--grove-purple)' }}>
                  114 Surahs
                </h3>
                <p className="text-xs opacity-50" style={{ color: 'var(--grove-purple)' }}>
                  English · Urdu · Arabic Tafsir
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
