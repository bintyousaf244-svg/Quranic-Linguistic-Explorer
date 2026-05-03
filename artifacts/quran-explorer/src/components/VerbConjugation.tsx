import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, X, RefreshCw, BookOpen, Search } from 'lucide-react';

interface VerbConjugationProps {
  onClose: () => void;
}

interface TasreefRow {
  pronoun: string;
  madiMaloom: string;
  mudariMaloom: string;
  mudariMajzum: string;
  mudariMansub: string;
  mudariMuakkad: string;
  amr: string;
  amrMuakkad: string;
  madiMajhool: string;
  mudariMajhool: string;
  mudariMajhoolMajzum: string;
  mudariMajhoolMansub: string;
}

interface TasreefResult {
  verb: string;
  rows: TasreefRow[];
  source: 'qutrub';
}

interface VerbEntry {
  ar: string;
  root: string;
  en: string;
}

const VERB_LIST: VerbEntry[] = [
  { ar: 'كتب', root: 'ك ت ب', en: 'to write' },
  { ar: 'قرأ', root: 'ق ر أ', en: 'to read, to recite' },
  { ar: 'ذهب', root: 'ذ ه ب', en: 'to go' },
  { ar: 'جاء', root: 'ج ي أ', en: 'to come' },
  { ar: 'قال', root: 'ق و ل', en: 'to say, to speak' },
  { ar: 'علم', root: 'ع ل م', en: 'to know, to learn' },
  { ar: 'نصر', root: 'ن ص ر', en: 'to help, to support' },
  { ar: 'سأل', root: 'س أ ل', en: 'to ask' },
  { ar: 'عمل', root: 'ع م ل', en: 'to do, to work' },
  { ar: 'آمن', root: 'أ م ن', en: 'to believe, to have faith' },
  { ar: 'أكل', root: 'أ ك ل', en: 'to eat' },
  { ar: 'شرب', root: 'ش ر ب', en: 'to drink' },
  { ar: 'دخل', root: 'د خ ل', en: 'to enter' },
  { ar: 'خرج', root: 'خ ر ج', en: 'to exit, to go out' },
  { ar: 'فتح', root: 'ف ت ح', en: 'to open, to conquer' },
  { ar: 'أرسل', root: 'ر س ل', en: 'to send' },
  { ar: 'نزل', root: 'ن ز ل', en: 'to descend, to reveal' },
  { ar: 'رجع', root: 'ر ج ع', en: 'to return' },
  { ar: 'جلس', root: 'ج ل س', en: 'to sit' },
  { ar: 'قام', root: 'ق و م', en: 'to stand, to rise' },
  { ar: 'نظر', root: 'ن ظ ر', en: 'to look, to see' },
  { ar: 'سمع', root: 'س م ع', en: 'to hear, to listen' },
  { ar: 'فعل', root: 'ف ع ل', en: 'to do, to act' },
  { ar: 'أخذ', root: 'أ خ ذ', en: 'to take' },
  { ar: 'أعطى', root: 'ع ط و', en: 'to give' },
  { ar: 'وجد', root: 'و ج د', en: 'to find, to feel' },
  { ar: 'حمد', root: 'ح م د', en: 'to praise, to thank' },
  { ar: 'شكر', root: 'ش ك ر', en: 'to be grateful, to thank' },
  { ar: 'صبر', root: 'ص ب ر', en: 'to be patient, to endure' },
  { ar: 'تاب', root: 'ت و ب', en: 'to repent, to return' },
  { ar: 'دعا', root: 'د ع و', en: 'to call, to supplicate, to pray' },
  { ar: 'صلى', root: 'ص ل و', en: 'to pray, to bless' },
  { ar: 'صام', root: 'ص و م', en: 'to fast' },
  { ar: 'حج', root: 'ح ج ج', en: 'to perform pilgrimage' },
  { ar: 'زكى', root: 'ز ك و', en: 'to purify, to give alms' },
  { ar: 'هدى', root: 'ه د ي', en: 'to guide' },
  { ar: 'ضل', root: 'ض ل ل', en: 'to go astray, to be lost' },
  { ar: 'غفر', root: 'غ ف ر', en: 'to forgive' },
  { ar: 'رحم', root: 'ر ح م', en: 'to show mercy' },
  { ar: 'عبد', root: 'ع ب د', en: 'to worship, to serve' },
  { ar: 'خلق', root: 'خ ل ق', en: 'to create' },
  { ar: 'أمر', root: 'أ م ر', en: 'to command, to order' },
  { ar: 'نهى', root: 'ن ه ي', en: 'to forbid, to prohibit' },
  { ar: 'حكم', root: 'ح ك م', en: 'to judge, to rule' },
  { ar: 'ظلم', root: 'ظ ل م', en: 'to oppress, to wrong' },
  { ar: 'عدل', root: 'ع د ل', en: 'to be just, to act fairly' },
  { ar: 'كفر', root: 'ك ف ر', en: 'to disbelieve, to be ungrateful' },
  { ar: 'ذكر', root: 'ذ ك ر', en: 'to remember, to mention' },
  { ar: 'فكر', root: 'ف ك ر', en: 'to think, to reflect' },
  { ar: 'عقل', root: 'ع ق ل', en: 'to reason, to understand' },
  { ar: 'رزق', root: 'ر ز ق', en: 'to provide sustenance' },
  { ar: 'مات', root: 'م و ت', en: 'to die' },
  { ar: 'عاش', root: 'ع ي ش', en: 'to live' },
  { ar: 'بعث', root: 'ب ع ث', en: 'to resurrect, to send' },
  { ar: 'حشر', root: 'ح ش ر', en: 'to gather, to assemble' },
  { ar: 'حاسب', root: 'ح س ب', en: 'to hold accountable' },
  { ar: 'جاهد', root: 'ج ه د', en: 'to strive, to struggle' },
  { ar: 'صدق', root: 'ص د ق', en: 'to speak truth, to confirm' },
  { ar: 'كذب', root: 'ك ذ ب', en: 'to lie, to deny' },
  { ar: 'نفق', root: 'ن ف ق', en: 'to spend (in charity)' },
  { ar: 'وعد', root: 'و ع د', en: 'to promise' },
  { ar: 'رأى', root: 'ر أ ي', en: 'to see, to perceive' },
  { ar: 'فهم', root: 'ف ه م', en: 'to understand' },
  { ar: 'حفظ', root: 'ح ف ظ', en: 'to memorise, to protect' },
  { ar: 'حمل', root: 'ح م ل', en: 'to carry, to bear' },
  { ar: 'ولد', root: 'و ل د', en: 'to give birth, to be born' },
  { ar: 'مشى', root: 'م ش ي', en: 'to walk' },
  { ar: 'أحب', root: 'ح ب ب', en: 'to love' },
  { ar: 'خاف', root: 'خ و ف', en: 'to fear' },
  { ar: 'رجا', root: 'ر ج و', en: 'to hope' },
  { ar: 'شاء', root: 'ش ي أ', en: 'to will, to wish' },
  { ar: 'قدر', root: 'ق د ر', en: 'to be able, to decree' },
];

function stripDiacritics(s: string) {
  return s.replace(/[\u064B-\u065F\u0670]/g, '');
}

function getSuggestions(q: string): VerbEntry[] {
  if (!q.trim()) return [];
  const lower = q.toLowerCase().trim();
  const stripped = stripDiacritics(q.trim());

  return VERB_LIST.filter(v => {
    const arStripped = stripDiacritics(v.ar);
    return (
      arStripped.includes(stripped) ||
      v.ar.includes(q.trim()) ||
      v.root.replace(/\s/g, '').includes(stripped) ||
      v.root.includes(stripped) ||
      v.en.toLowerCase().includes(lower)
    );
  }).slice(0, 8);
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const AR = (s: string) => (
  <span dir="rtl" style={{ fontFamily: 'var(--font-arabic-var)', fontSize: '1.05em' }}>{s || '—'}</span>
);

function SectionTable({
  title,
  columns,
  rows,
  rowFilter,
}: {
  title: string;
  columns: { label: string; key: keyof TasreefRow }[];
  rows: TasreefRow[];
  rowFilter?: (r: TasreefRow) => boolean;
}) {
  const filtered = rowFilter ? rows.filter(rowFilter) : rows;
  const hasAny = filtered.some(r => columns.some(c => r[c.key]));
  if (!hasAny) return null;

  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-black uppercase tracking-[0.18em] mb-2 opacity-60"
        style={{ color: 'var(--grove-purple)' }}>{title}</h3>
      <div className="rounded-xl overflow-hidden border"
        style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 12%, transparent)' }}>
        <table className="w-full text-sm border-collapse" dir="rtl">
          <thead>
            <tr style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
              <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider opacity-50 border-b"
                style={{ color: 'var(--grove-purple)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)', minWidth: '70px' }}>
                الضمير
              </th>
              {columns.map(col => (
                <th key={col.key} className="text-center px-3 py-2 text-[9px] font-bold uppercase tracking-wider opacity-50 border-b border-r"
                  style={{ color: 'var(--grove-purple)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}
                style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--grove-purple) 2%, transparent)' }}>
                <td className="text-right px-3 py-2 border-b"
                  style={{ color: 'var(--grove-purple)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)', fontFamily: 'var(--font-arabic-var)', opacity: 0.7, fontSize: '0.95em', whiteSpace: 'nowrap' }}>
                  {row.pronoun}
                </td>
                {columns.map(col => (
                  <td key={col.key} className="text-center px-3 py-2 border-b border-r"
                    style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)', color: 'var(--grove-purple)' }}>
                    {row[col.key] ? AR(row[col.key] as string) : <span className="opacity-20 text-xs">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const VerbConjugation: React.FC<VerbConjugationProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<TasreefResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedVerb, setSearchedVerb] = useState('');
  const [activeTab, setActiveTab] = useState<'maloom' | 'majhool' | 'amr'>('maloom');
  const [suggestions, setSuggestions] = useState<VerbEntry[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async (verb?: string) => {
    const v = (verb ?? query).trim();
    if (!v) return;
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);
    setResult(null);
    setError('');
    setSearchedVerb(v);

    try {
      const res = await fetch(`${BASE}/api/tasreef`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verb: v }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to conjugate verb. Please try again.');
        return;
      }
      setResult(data as TasreefResult);
    } catch {
      setError('Could not reach conjugation service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setHighlightedIdx(-1);
    if (val.trim().length >= 1) {
      const s = getSuggestions(val);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (v: VerbEntry) => {
    setQuery(v.ar);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIdx(-1);
    handleSearch(v.ar);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIdx(-1);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIdx >= 0 && suggestions[highlightedIdx]) {
      selectSuggestion(suggestions[highlightedIdx]);
    } else {
      handleSearch();
    }
  };

  const tabs = [
    { id: 'maloom' as const, label: 'المعلوم', labelEn: 'Active' },
    { id: 'majhool' as const, label: 'المجهول', labelEn: 'Passive' },
    { id: 'amr' as const, label: 'الأمر', labelEn: 'Imperative' },
  ];

  const EXAMPLE_VERBS = ['كتب', 'قرأ', 'ذهب', 'علم', 'نصر', 'سأل', 'جاء', 'قال'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>

        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10"
          style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg text-lg"
              style={{ backgroundColor: 'var(--grove-gold)', fontFamily: '"Amiri", serif' }}>
              ص
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--grove-purple)' }}>تصريف الأفعال</h2>
              <p className="text-xs opacity-60" style={{ color: 'var(--grove-purple)' }}>Verb Conjugation · Qutrub Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-all hover:opacity-70"
            style={{ color: 'var(--grove-purple)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b" style={{ backgroundColor: 'var(--grove-cream)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <form onSubmit={handleSubmit} className="relative mb-4">
            {/* Search icon */}
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none"
              style={{ color: 'var(--grove-purple)' }} />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Type a verb in Arabic or English — e.g. كتب or 'write'..."
              className="w-full pl-4 pr-12 py-4 rounded-2xl text-lg focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{
                backgroundColor: 'var(--grove-paper)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 12%, transparent)',
                fontFamily: '"Amiri", serif',
                direction: query && /[\u0600-\u06FF]/.test(query) ? 'rtl' : 'ltr',
              }}
              autoFocus
            />

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md"
              style={{ backgroundColor: 'var(--grove-gold)' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              صرِّف
            </button>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 rounded-2xl border shadow-xl overflow-hidden z-50"
                style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 12%, transparent)' }}
              >
                {suggestions.map((v, i) => (
                  <button
                    key={v.ar}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(v); }}
                    onMouseEnter={() => setHighlightedIdx(i)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0"
                    style={{
                      backgroundColor: i === highlightedIdx
                        ? 'color-mix(in srgb, var(--grove-gold) 8%, transparent)'
                        : 'transparent',
                      borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)',
                    }}
                  >
                    <span className="text-xl leading-none shrink-0 w-16 text-right" dir="rtl"
                      style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
                      {v.ar}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--grove-green) 10%, transparent)', color: 'var(--grove-green)' }}>
                      {v.root}
                    </span>
                    <span className="text-xs opacity-55 truncate" style={{ color: 'var(--grove-purple)' }}>
                      {v.en}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--grove-purple)' }}>
              Examples:
            </span>
            {EXAMPLE_VERBS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setQuery(v); handleSearch(v); }}
                className="px-3 py-1 rounded-full text-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: searchedVerb === v
                    ? 'var(--grove-gold)'
                    : 'color-mix(in srgb, var(--grove-gold) 12%, transparent)',
                  color: searchedVerb === v ? 'white' : 'var(--grove-gold)',
                  fontFamily: '"Amiri", serif',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--grove-paper)' }}>
          {error ? (
            <div className="p-8 text-center">
              <p className="text-sm opacity-70 mb-2" style={{ color: 'var(--grove-purple)' }}>{error}</p>
              <p className="text-xs opacity-40" style={{ color: 'var(--grove-purple)' }}>
                Tip: Enter the verb in its past tense form (ماضي) — e.g. كَتَبَ, ذَهَبَ, عَلِمَ
              </p>
            </div>
          ) : result ? (
            <div>
              {/* Tabs */}
              <div className="flex border-b px-6 pt-4 gap-1" dir="rtl"
                style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-2 rounded-t-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: activeTab === tab.id ? 'var(--grove-paper)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--grove-purple)' : 'color-mix(in srgb, var(--grove-purple) 45%, transparent)',
                      borderBottom: activeTab === tab.id ? '2px solid var(--grove-gold)' : '2px solid transparent',
                      fontFamily: '"Amiri", serif',
                      fontSize: '1rem',
                    }}
                  >
                    {tab.label}
                    <span className="text-[9px] font-normal ms-1 opacity-60" style={{ fontFamily: 'inherit' }}>
                      {tab.labelEn}
                    </span>
                  </button>
                ))}
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 pb-2 opacity-40">
                  <BookOpen size={11} style={{ color: 'var(--grove-purple)' }} />
                  <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'var(--grove-purple)' }}>
                    Qutrub · Arabeyes
                  </span>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'maloom' && (
                  <>
                    <SectionTable
                      title="الفعل الماضي المعلوم"
                      columns={[{ label: 'الماضي', key: 'madiMaloom' }]}
                      rows={result.rows}
                    />
                    <SectionTable
                      title="الفعل المضارع المعلوم"
                      columns={[
                        { label: 'مرفوع', key: 'mudariMaloom' },
                        { label: 'منصوب', key: 'mudariMansub' },
                        { label: 'مجزوم', key: 'mudariMajzum' },
                      ]}
                      rows={result.rows}
                    />
                  </>
                )}
                {activeTab === 'majhool' && (
                  <>
                    <SectionTable
                      title="الفعل الماضي المجهول"
                      columns={[{ label: 'الماضي المجهول', key: 'madiMajhool' }]}
                      rows={result.rows}
                    />
                    <SectionTable
                      title="الفعل المضارع المجهول"
                      columns={[
                        { label: 'مرفوع', key: 'mudariMajhool' },
                        { label: 'منصوب', key: 'mudariMajhoolMansub' },
                        { label: 'مجزوم', key: 'mudariMajhoolMajzum' },
                      ]}
                      rows={result.rows}
                    />
                  </>
                )}
                {activeTab === 'amr' && (
                  <SectionTable
                    title="فعل الأمر"
                    columns={[
                      { label: 'الأمر', key: 'amr' },
                      { label: 'المؤكد', key: 'amrMuakkad' },
                    ]}
                    rows={result.rows}
                    rowFilter={(r) => !!r.amr}
                  />
                )}
              </div>
            </div>
          ) : !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-6">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl opacity-15"
                style={{ backgroundColor: 'var(--grove-cream)', fontFamily: '"Amiri", serif', color: 'var(--grove-gold)' }}>
                ف
              </div>
              <div>
                <p className="text-base font-bold mb-2" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                  تصريف الأفعال العربية
                </p>
                <p className="text-sm opacity-50 max-w-sm" style={{ color: 'var(--grove-purple)' }}>
                  Type any Arabic verb or its English meaning to get the full conjugation table — powered by the Qutrub morphological engine.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="animate-spin" size={36} style={{ color: 'var(--grove-gold)' }} />
              <p className="text-sm opacity-60" style={{ color: 'var(--grove-gold)', fontFamily: '"Amiri", serif' }}>
                جاري توليد جدول التصريف...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
