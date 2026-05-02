import React, { useState, useRef } from 'react';
import { Search, Loader2, X, BookOpen, ChevronRight } from 'lucide-react';

interface RootMatch {
  surahNumber: number;
  surahName: string;
  surahEnglish: string;
  surahTranslation: string;
  ayahNumber: number;
  text: string;
}

interface RootSearchProps {
  onClose: () => void;
  onNavigate: (surahNumber: number) => void;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const COMMON_ROOTS = [
  'كتب', 'علم', 'رحم', 'ذكر', 'قرأ', 'عبد', 'صلى', 'هدى',
  'قول', 'فعل', 'أمن', 'نصر', 'سبح', 'حمد', 'تقو', 'عقل',
];

function highlightRoot(text: string, root: string): string {
  if (!root || !text) return text;
  try {
    // Build a pattern that matches any sequence of the root consonants in order,
    // allowing Arabic diacritics and other letters in between
    const escaped = root.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = escaped.join('[\\u064B-\\u065F]*');
    const regex = new RegExp(`(${pattern})`, 'g');
    return text.replace(regex, '<mark>$1</mark>');
  } catch {
    return text;
  }
}

export const RootSearch: React.FC<RootSearchProps> = ({ onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<RootMatch[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (root?: string) => {
    const q = (root ?? query).trim();
    if (!q) return;

    setIsLoading(true);
    setMatches([]);
    setError('');
    setSearched(q);

    try {
      const response = await fetch(`${BASE}/api/root-search?q=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMatches(data.matches ?? []);
      setCount(data.count ?? 0);
    } catch (err: any) {
      setError('Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleNavigate = (surahNumber: number) => {
    onNavigate(surahNumber);
    onClose();
  };

  const groupedBySurah = matches.reduce<Record<number, RootMatch[]>>((acc, m) => {
    if (!acc[m.surahNumber]) acc[m.surahNumber] = [];
    acc[m.surahNumber].push(m);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>

        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10"
          style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: 'var(--grove-green)' }}>
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--grove-purple)' }}>Quranic Root Search</h2>
              <p className="text-xs opacity-60" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                بحث بالجذر في القرآن الكريم
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-all hover:opacity-70"
            style={{ color: 'var(--grove-purple)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b" style={{ backgroundColor: 'var(--grove-cream)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <form onSubmit={handleSubmit} className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب الجذر الثلاثي (مثل: كتب، علم، رحم)..."
              className="w-full pl-4 pr-32 py-4 rounded-2xl text-xl focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{
                backgroundColor: 'var(--grove-paper)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 12%, transparent)',
                fontFamily: '"Amiri", serif',
                direction: 'rtl',
                textAlign: 'right',
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md"
              style={{ backgroundColor: 'var(--grove-green)' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              بحث
            </button>
          </form>

          {/* Common roots */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--grove-purple)' }}>
              Common:
            </span>
            {COMMON_ROOTS.map((r) => (
              <button
                key={r}
                onClick={() => { setQuery(r); handleSearch(r); }}
                className="px-3 py-1 rounded-full text-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: searched === r
                    ? 'var(--grove-green)'
                    : 'color-mix(in srgb, var(--grove-green) 10%, transparent)',
                  color: searched === r ? 'white' : 'var(--grove-green)',
                  fontFamily: '"Amiri", serif',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--grove-paper)' }}>
          {error ? (
            <div className="p-8 text-center">
              <p className="text-sm opacity-60" style={{ color: 'var(--grove-pink)' }}>{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="animate-spin" size={36} style={{ color: 'var(--grove-green)' }} />
              <p className="text-sm opacity-60 font-arabic" style={{ color: 'var(--grove-green)', fontFamily: '"Amiri", serif' }}>
                يجري البحث في القرآن الكريم...
              </p>
            </div>
          ) : matches.length > 0 ? (
            <div>
              {/* Result count */}
              <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-green) 6%, var(--grove-paper))', borderColor: 'color-mix(in srgb, var(--grove-green) 12%, transparent)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--grove-green)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--grove-green)' }}>
                    {count} occurrences across {Object.keys(groupedBySurah).length} surahs
                  </span>
                </div>
                <span className="text-xs font-bold opacity-50 font-arabic" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                  الجذر: {searched}
                </span>
              </div>

              {/* Grouped by surah */}
              {Object.entries(groupedBySurah).map(([surahNum, surahMatches]) => {
                const first = surahMatches[0];
                return (
                  <div key={surahNum} className="border-b"
                    style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
                    {/* Surah header */}
                    <button
                      onClick={() => handleNavigate(Number(surahNum))}
                      className="w-full px-6 py-3 flex items-center justify-between group transition-all hover:opacity-90"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 4%, transparent)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 12%, transparent)', color: 'var(--grove-purple)' }}>
                          {surahNum}
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-sm block" style={{ color: 'var(--grove-purple)' }}>
                            {first.surahEnglish}
                          </span>
                          <span className="text-[10px] opacity-50 uppercase tracking-wider" style={{ color: 'var(--grove-purple)' }}>
                            {surahMatches.length} {surahMatches.length === 1 ? 'verse' : 'verses'} · {first.surahTranslation}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-arabic" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
                          {first.surahName}
                        </span>
                        <ChevronRight size={14} className="opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all"
                          style={{ color: 'var(--grove-purple)' }} />
                      </div>
                    </button>

                    {/* Ayah matches */}
                    {surahMatches.map((m) => (
                      <div key={`${m.surahNumber}-${m.ayahNumber}`}
                        className="px-6 py-3 border-t flex items-start gap-4"
                        style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 4%, transparent)' }}>
                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold mt-1"
                          style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-green)' }}>
                          {m.ayahNumber}
                        </div>
                        <p
                          className="text-right flex-1 leading-loose root-search-highlight"
                          dir="rtl"
                          style={{ fontFamily: '"Amiri", serif', fontSize: '18px', color: 'var(--grove-purple)' }}
                          dangerouslySetInnerHTML={{ __html: highlightRoot(m.text, searched) }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}

              <div className="px-6 py-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30" style={{ color: 'var(--grove-purple)' }}>
                  Click any surah header to open it · Source: AlQuran Cloud (quran-simple-clean)
                </p>
              </div>
            </div>
          ) : searched && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <BookOpen size={48} className="opacity-10" style={{ color: 'var(--grove-purple)' }} />
              <p className="text-sm opacity-50 font-arabic" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                لم يُعثر على نتائج للجذر «{searched}»
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-6 px-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center opacity-10"
                style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-green)' }}>
                <Search size={40} />
              </div>
              <div className="text-center">
                <p className="text-base font-bold mb-2" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                  بحث الجذور القرآنية
                </p>
                <p className="text-sm opacity-50 max-w-sm" style={{ color: 'var(--grove-purple)' }}>
                  Enter a 3-letter Arabic root to find every verse in the Quran containing that root — grouped by surah with direct navigation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
