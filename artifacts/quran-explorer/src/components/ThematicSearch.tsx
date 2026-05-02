import React, { useState } from 'react';
import { Search, Loader2, X, Sparkles, BookOpen, ChevronRight, Lightbulb } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ThematicRoot {
  root: string;
  meaning: string;
  note: string;
}

interface ThematicVerse {
  surahNumber: number;
  surahName: string;
  surahEnglish: string;
  surahTranslation: string;
  ayahNumber: number;
  translation: string;
}

interface ThematicSearchProps {
  onClose: () => void;
  onNavigate: (surahNumber: number) => void;
  onOpenRootSearch?: (root: string) => void;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const THEMES_EN = ['mercy', 'creation', 'prayer', 'justice', 'patience', 'gratitude', 'forgiveness', 'paradise', 'knowledge', 'light'];
const THEMES_UR = ['رحمت', 'تخلیق', 'نماز', 'عدل', 'صبر', 'شکر', 'مغفرت', 'جنت', 'علم', 'نور'];

function highlightKeyword(text: string, keyword: string): string {
  if (!keyword || !text) return text;
  try {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  } catch {
    return text;
  }
}

export const ThematicSearch: React.FC<ThematicSearchProps> = ({
  onClose,
  onNavigate,
  onOpenRootSearch,
}) => {
  const { lang, t } = useLanguage();
  const isUrdu = lang === 'ur';
  const THEMES = isUrdu ? THEMES_UR : THEMES_EN;
  const edition = isUrdu ? 'ur.jalandhry' : 'en.sahih';

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    theme: string;
    arabicConcept: string;
    transliteration: string;
    summary: string;
    roots: ThematicRoot[];
    count: number;
    verses: ThematicVerse[];
  } | null>(null);

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const resp = await fetch(
        `${BASE}/api/thematic-search?q=${encodeURIComponent(q)}&edition=${encodeURIComponent(edition)}&lang=${lang}`
      );
      if (!resp.ok) throw new Error('Search failed');
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch {
      setError('Search failed. Please try again.');
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border"
        style={{
          backgroundColor: 'var(--grove-paper)',
          borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)',
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b flex items-center justify-between"
          style={{
            backgroundColor: 'var(--grove-paper)',
            borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: 'var(--grove-teal)' }}
            >
              <Lightbulb size={18} />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}
              >
                {t('thematicTitle')}
              </h2>
              <p className="text-xs opacity-60" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                {t('thematicSub')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all hover:opacity-70"
            style={{ color: 'var(--grove-purple)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search input */}
        <div
          className="p-6 border-b"
          style={{
            backgroundColor: 'var(--grove-cream)',
            borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)',
          }}
        >
          <form onSubmit={handleSubmit} className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('thematicPlaceholder')}
              dir={isUrdu ? 'rtl' : 'ltr'}
              className="w-full pl-4 pr-32 py-4 rounded-2xl text-base focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{
                backgroundColor: 'var(--grove-paper)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 12%, transparent)',
                fontFamily: isUrdu ? '"Amiri", serif' : undefined,
                textAlign: isUrdu ? 'right' : 'left',
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md"
              style={{ backgroundColor: 'var(--grove-teal)' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            </button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-widest opacity-40"
              style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}
            >
              {t('thematicTry')}
            </span>
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => { setQuery(theme); handleSearch(theme); }}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                style={{
                  backgroundColor:
                    result?.theme === theme
                      ? 'var(--grove-teal)'
                      : 'color-mix(in srgb, var(--grove-teal) 10%, transparent)',
                  color: result?.theme === theme ? 'white' : 'var(--grove-teal)',
                  fontFamily: isUrdu ? '"Amiri", serif' : undefined,
                  fontSize: isUrdu ? '14px' : undefined,
                }}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--grove-paper)' }}>
          {error ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--grove-pink)' }}>{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="animate-spin" size={40} style={{ color: 'var(--grove-teal)' }} />
              <p className="text-sm opacity-60" style={{ color: 'var(--grove-teal)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                {t('thematicSearching')}
              </p>
            </div>
          ) : result ? (
            <div>
              {/* AI Thematic Overview */}
              {(result.arabicConcept || result.summary) && (
                <div
                  className="p-6 border-b"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, var(--grove-teal) 6%, transparent), color-mix(in srgb, var(--grove-purple) 4%, transparent))`,
                    borderColor: 'color-mix(in srgb, var(--grove-teal) 15%, transparent)',
                  }}
                >
                  {result.arabicConcept && (
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 12%, transparent)' }}
                      >
                        <Sparkles size={14} style={{ color: 'var(--grove-teal)' }} />
                        <span className="text-xl font-bold" style={{ color: 'var(--grove-teal)', fontFamily: '"Amiri", serif' }}>
                          {result.arabicConcept}
                        </span>
                        {result.transliteration && (
                          <span className="text-xs font-semibold italic opacity-70" style={{ color: 'var(--grove-teal)' }}>
                            ({result.transliteration})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {result.summary && (
                    <p
                      className="text-sm leading-relaxed mb-5 font-medium"
                      style={{ color: 'var(--grove-purple)', opacity: 0.85, fontFamily: isUrdu ? '"Amiri", serif' : undefined, direction: isUrdu ? 'rtl' : 'ltr' }}
                    >
                      {result.summary}
                    </p>
                  )}

                  {result.roots.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                        {t('thematicRootsLabel')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.roots.map((r) => (
                          <button
                            key={r.root}
                            onClick={() => onOpenRootSearch?.(r.root)}
                            title={r.note}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all hover:opacity-80 group border"
                            style={{
                              backgroundColor: 'var(--grove-paper)',
                              borderColor: 'color-mix(in srgb, var(--grove-green) 20%, transparent)',
                              color: 'var(--grove-purple)',
                            }}
                          >
                            <span className="text-base font-bold" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-green)' }}>
                              {r.root}
                            </span>
                            <span className="text-[11px] opacity-70">{r.meaning}</span>
                            <ChevronRight size={11} className="opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Count bar */}
              <div
                className="px-6 py-3 border-b flex items-center justify-between"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--grove-teal) 5%, var(--grove-paper))',
                  borderColor: 'color-mix(in srgb, var(--grove-teal) 10%, transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--grove-teal)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--grove-teal)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                    {result.count} {t('thematicVerses')}
                    {result.verses.length < result.count && ` · ${t('thematicShowing')} ${result.verses.length}`}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                  {t('thematicSrcNote')}
                </span>
              </div>

              {/* Verse list */}
              {result.verses.map((v) => (
                <div
                  key={`${v.surahNumber}-${v.ayahNumber}`}
                  className="px-6 py-4 border-b flex gap-4 group transition-all"
                  style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}
                >
                  <div className="shrink-0 mt-1">
                    <div className="text-center rounded-xl px-2 py-1 min-w-[48px]"
                      style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-teal)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {v.surahNumber}:{v.ayahNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-relaxed mb-2 thematic-highlight"
                      dir={isUrdu ? 'rtl' : 'ltr'}
                      style={{
                        color: 'var(--grove-purple)',
                        opacity: 0.9,
                        fontFamily: isUrdu ? '"Amiri", serif' : undefined,
                        fontSize: isUrdu ? '18px' : undefined,
                        textAlign: isUrdu ? 'right' : 'left',
                      }}
                      dangerouslySetInnerHTML={{ __html: highlightKeyword(v.translation, result.theme) }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-50"
                        style={{ color: 'var(--grove-purple)' }}>
                        {v.surahEnglish} · {v.surahTranslation}
                      </span>
                      <button
                        onClick={() => handleNavigate(v.surahNumber)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all"
                        style={{ color: 'var(--grove-teal)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}
                      >
                        <BookOpen size={11} />
                        {t('thematicOpenSurah')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="px-6 py-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30" style={{ color: 'var(--grove-purple)' }}>
                  {t('thematicSrcNote')} · Click a root chip to explore all occurrences
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-6 px-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center opacity-10"
                style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-teal)' }}>
                <Lightbulb size={40} />
              </div>
              <div className="text-center">
                <p className="text-base font-bold mb-2" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                  {t('thematicEmptyTitle')}
                </p>
                <p className="text-sm opacity-50 max-w-sm" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                  {t('thematicEmpty')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
