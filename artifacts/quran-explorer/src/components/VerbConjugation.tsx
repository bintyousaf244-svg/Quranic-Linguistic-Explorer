import React, { useState } from 'react';
import { Loader2, X, RefreshCw, BookOpen } from 'lucide-react';

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

const EXAMPLE_VERBS = ['كتب', 'قرأ', 'ذهب', 'علم', 'نصر', 'سأل', 'جاء', 'قال'];

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

  const handleSearch = async (verb?: string) => {
    const v = (verb ?? query).trim();
    if (!v) return;

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const tabs = [
    { id: 'maloom' as const, label: 'المعلوم', labelEn: 'Active' },
    { id: 'majhool' as const, label: 'المجهول', labelEn: 'Passive' },
    { id: 'amr' as const, label: 'الأمر', labelEn: 'Imperative' },
  ];

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
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="أدخل الفعل الماضي (مثال: كتب، ذهب، قرأ، علم)..."
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
              style={{ backgroundColor: 'var(--grove-gold)' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              صرِّف
            </button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--grove-purple)' }}>
              Examples:
            </span>
            {EXAMPLE_VERBS.map((v) => (
              <button
                key={v}
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
                      backgroundColor: activeTab === tab.id
                        ? 'var(--grove-paper)'
                        : 'transparent',
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
                  Enter an Arabic verb in its past tense form to get the complete conjugation table — powered by the Qutrub morphological engine.
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
