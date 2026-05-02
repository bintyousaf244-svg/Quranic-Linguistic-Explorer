import React, { useState } from 'react';
import { Loader2, X, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MadiRow {
  pronoun: string;
  pronounEn: string;
  maloom: string;
  maloomTranslit: string;
  majhool: string;
  majhoolTranslit: string;
}

interface MudariRow {
  pronoun: string;
  pronounEn: string;
  marfu: string;
  marfuTranslit: string;
  mansub: string;
  mansubTranslit: string;
  majzum: string;
  majzumTranslit: string;
  muakkad: string;
  muakkadTranslit: string;
  maloomMajhool: string;
  maloomMajhoolTranslit: string;
}

interface AmrRow {
  pronoun: string;
  pronounEn: string;
  form: string;
  translit: string;
}

interface IsmData {
  fail: string; failTranslit: string;
  maful: string | null; mafulTranslit: string | null;
  makan: string; makanTranslit: string;
  masdar: string; masdarTranslit: string;
}

interface TasreefResult {
  root: string;
  verbForm: string;
  chapter: string;
  type: string;
  masdar: string;
  ismFail: string;
  ismMaful: string | null;
  ismMakan: string;
  meaning: string;
  madi: MadiRow[];
  mudari: MudariRow[];
  amr: AmrRow[];
  ism: IsmData;
}

interface VerbConjugationProps {
  onClose: () => void;
}

const EXAMPLE_VERBS = ['حَمِدَ', 'كَتَبَ', 'قَرَأَ', 'نَصَرَ', 'عَلِمَ', 'ذَهَبَ', 'آمَنَ', 'أَكَلَ'];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

type TabId = 'maloom' | 'majhool' | 'amr' | 'ism';

const TAB_LABELS: Record<TabId, string> = {
  maloom: 'مَعْلُوم',
  majhool: 'مَجْهُول',
  amr: 'أَمْر',
  ism: 'اِسْم',
};

export const VerbConjugation: React.FC<VerbConjugationProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<TasreefResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedVerb, setSearchedVerb] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('maloom');

  const handleSearch = async (verb?: string) => {
    const v = (verb ?? query).trim();
    if (!v) return;
    setIsLoading(true);
    setResult(null);
    setError('');
    setSearchedVerb(v);
    try {
      const resp = await fetch(`${BASE}/api/tasreef`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verb: v }),
      });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data as TasreefResult);
      setActiveTab('maloom');
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('429') || msg.includes('rate') || msg.includes('limit')) {
        setError('Daily AI limit reached. Please try again in a few hours.');
      } else {
        setError('فشل في جلب التصريف. الرجاء المحاولة مجدداً.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleSearch(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: 'var(--grove-gold)', fontFamily: '"Amiri", serif' }}>ص</div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                {t('tasreefTitle')}
              </h2>
              <p className="text-[10px] opacity-50" style={{ color: 'var(--grove-purple)' }}>Verb Conjugation Table</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:opacity-70 transition-all" style={{ color: 'var(--grove-purple)' }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="px-5 py-4 border-b shrink-0"
          style={{ backgroundColor: 'var(--grove-cream)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <form onSubmit={handleSubmit} className="relative mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب الفعل (مثل: حَمِدَ، كَتَبَ، ذَهَبَ)..."
              dir="rtl"
              autoFocus
              className="w-full pl-24 pr-5 py-3 rounded-2xl text-lg focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--grove-paper)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 12%, transparent)',
                fontFamily: '"Amiri", serif',
                textAlign: 'right',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ backgroundColor: 'var(--grove-gold)' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
              صرِّف
            </button>
          </form>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mr-1" style={{ color: 'var(--grove-purple)' }}>أمثلة:</span>
            {EXAMPLE_VERBS.map((v) => (
              <button key={v} onClick={() => { setQuery(v); handleSearch(v); }}
                className="px-3 py-1 rounded-full text-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: searchedVerb === v ? 'var(--grove-gold)' : 'color-mix(in srgb, var(--grove-gold) 12%, transparent)',
                  color: searchedVerb === v ? 'white' : 'var(--grove-gold)',
                  fontFamily: '"Amiri", serif',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--grove-paper)' }}>
          {error && (
            <div className="p-8 text-center">
              <p className="text-sm font-arabic" style={{ color: 'var(--grove-pink)', fontFamily: '"Amiri", serif' }}>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin" size={36} style={{ color: 'var(--grove-gold)' }} />
              <p className="text-sm opacity-60" style={{ color: 'var(--grove-gold)', fontFamily: '"Amiri", serif' }}>جاري توليد جدول التصريف…</p>
            </div>
          )}

          {!isLoading && !result && !error && (
            <div className="flex flex-col items-center justify-center py-20 gap-5 px-8 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center opacity-10 text-5xl"
                style={{ backgroundColor: 'var(--grove-cream)', fontFamily: '"Amiri", serif', color: 'var(--grove-gold)' }}>ف</div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>تصريف الأفعال العربية</p>
                <p className="text-sm opacity-50 max-w-xs" style={{ color: 'var(--grove-purple)' }}>
                  Enter any Arabic verb to generate the full conjugation table with transliteration.
                </p>
              </div>
            </div>
          )}

          {!isLoading && result && (
            <div>
              {/* ── Verb info strip ── */}
              <div className="px-5 py-4 border-b"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--grove-gold) 8%, transparent), color-mix(in srgb, var(--grove-green) 5%, transparent))', borderColor: 'color-mix(in srgb, var(--grove-gold) 15%, transparent)' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Left: root + wazn */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
                        {result.root}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest opacity-50 mt-0.5" style={{ color: 'var(--grove-purple)' }}>ROOT</div>
                    </div>
                    <div className="w-px h-10 opacity-20" style={{ backgroundColor: 'var(--grove-purple)' }} />
                    <div>
                      <div className="text-lg font-bold" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-gold)' }}>
                        {result.verbForm}
                      </div>
                      <div className="text-[10px] opacity-60" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                        {result.chapter}
                      </div>
                    </div>
                  </div>
                  {/* Right: type + meaning */}
                  <div className="text-right">
                    <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold mb-1"
                      style={{
                        backgroundColor: result.type === 'لازم'
                          ? 'color-mix(in srgb, var(--grove-teal) 15%, transparent)'
                          : 'color-mix(in srgb, var(--grove-green) 15%, transparent)',
                        color: result.type === 'لازم' ? 'var(--grove-teal)' : 'var(--grove-green)',
                        fontFamily: '"Amiri", serif',
                      }}>
                      {result.type}
                    </div>
                    <div className="text-xs opacity-70 font-medium" style={{ color: 'var(--grove-purple)' }}>
                      {result.meaning}
                    </div>
                  </div>
                </div>

                {/* Derivatives row */}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ fontFamily: '"Amiri", serif' }}>
                  {[
                    { label: 'مصدر', value: result.masdar },
                    { label: 'اسم فاعل', value: result.ismFail },
                    ...(result.ismMaful ? [{ label: 'اسم مفعول', value: result.ismMaful }] : []),
                    { label: 'اسم مكان', value: result.ismMakan },
                  ].map(({ label, value }) => (
                    <span key={label} className="flex items-center gap-1">
                      <span className="text-[9px] uppercase tracking-wider opacity-40" style={{ color: 'var(--grove-purple)', fontFamily: 'sans-serif' }}>{label}</span>
                      <span className="font-bold" style={{ color: 'var(--grove-purple)' }}>{value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="flex border-b shrink-0"
                style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', backgroundColor: 'var(--grove-cream)' }}>
                {(Object.keys(TAB_LABELS) as TabId[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-3 text-sm font-bold transition-all border-b-2"
                    style={{
                      fontFamily: '"Amiri", serif',
                      fontSize: '15px',
                      color: activeTab === tab ? 'var(--grove-gold)' : 'color-mix(in srgb, var(--grove-purple) 40%, transparent)',
                      borderColor: activeTab === tab ? 'var(--grove-gold)' : 'transparent',
                      backgroundColor: activeTab === tab ? 'color-mix(in srgb, var(--grove-gold) 6%, transparent)' : 'transparent',
                    }}>
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              {/* ── Table Content ── */}
              {(activeTab === 'maloom' || activeTab === 'majhool') && (
                <ConjugationTable
                  tab={activeTab}
                  madi={result.madi}
                  mudari={result.mudari}
                />
              )}

              {activeTab === 'amr' && (
                <AmrTable rows={result.amr} />
              )}

              {activeTab === 'ism' && (
                <IsmPanel ism={result.ism} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ────────────────── Conjugation Table (maloom / majhool) ────────────────── */

function ConjugationTable({ tab, madi, mudari }: { tab: 'maloom' | 'majhool'; madi: MadiRow[]; mudari: MudariRow[] }) {
  const isMajhool = tab === 'majhool';

  const COL_HEADER_STYLE: React.CSSProperties = {
    fontFamily: '"Amiri", serif',
    fontSize: '13px',
    color: 'var(--grove-purple)',
    opacity: 0.65,
    padding: '6px 8px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    backgroundColor: 'color-mix(in srgb, var(--grove-purple) 4%, transparent)',
    fontWeight: 700,
  };

  const SUB_HEADER: React.CSSProperties = {
    ...COL_HEADER_STYLE,
    fontSize: '11px',
    opacity: 0.5,
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
            <th style={{ ...COL_HEADER_STYLE, textAlign: 'right', width: '90px' }} rowSpan={2}>الضمير</th>
            <th style={{ ...COL_HEADER_STYLE, color: 'var(--grove-teal)' }} colSpan={1}>ماضي</th>
            <th style={{ ...COL_HEADER_STYLE, color: 'var(--grove-green)', borderLeft: '1px solid color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}
              colSpan={isMajhool ? 1 : 4}>
              صيغة المضارع
            </th>
          </tr>
          {!isMajhool && (
            <tr style={{ borderBottom: '2px solid color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
              <th style={{ ...SUB_HEADER, color: 'var(--grove-teal)' }}>{isMajhool ? 'للمجهول' : 'للمعلوم'}</th>
              <th style={{ ...SUB_HEADER, color: 'var(--grove-green)', borderLeft: '1px solid color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>مرفوع</th>
              <th style={SUB_HEADER}>منصوب</th>
              <th style={SUB_HEADER}>مجزوم</th>
              <th style={{ ...SUB_HEADER, color: 'var(--grove-gold)' }}>مؤكَّد</th>
            </tr>
          )}
          {isMajhool && (
            <tr style={{ borderBottom: '2px solid color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
              <th style={{ ...SUB_HEADER, color: 'var(--grove-teal)' }}>للمجهول</th>
              <th style={{ ...SUB_HEADER, color: 'var(--grove-green)', borderLeft: '1px solid color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>للمجهول</th>
            </tr>
          )}
        </thead>
        <tbody>
          {madi.map((row, i) => {
            const mu = mudari[i];
            const isEven = i % 2 === 0;
            const rowBg = isEven
              ? 'color-mix(in srgb, var(--grove-teal) 4%, transparent)'
              : 'transparent';

            return (
              <tr key={row.pronoun}
                style={{ backgroundColor: rowBg, borderBottom: '1px solid color-mix(in srgb, var(--grove-purple) 5%, transparent)' }}>
                {/* Pronoun */}
                <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'top' }}>
                  <div className="font-bold text-base" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
                    {row.pronoun}
                  </div>
                  <div className="text-[10px] opacity-50 mt-0.5" style={{ color: 'var(--grove-purple)' }}>
                    {row.pronounEn}
                  </div>
                </td>

                {/* Madi */}
                <td style={{ padding: '8px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                  <ArabicCell
                    arabic={isMajhool ? row.majhool : row.maloom}
                    translit={isMajhool ? row.majhoolTranslit : row.maloomTranslit}
                    color="var(--grove-teal)"
                  />
                </td>

                {/* Mudari cols */}
                {mu && !isMajhool && (
                  <>
                    <td style={{ padding: '8px 8px', textAlign: 'center', verticalAlign: 'top', borderLeft: '1px solid color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
                      <ArabicCell arabic={mu.marfu} translit={mu.marfuTranslit} color="var(--grove-green)" />
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                      <ArabicCell arabic={mu.mansub} translit={mu.mansubTranslit} color="var(--grove-green)" />
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                      <ArabicCell arabic={mu.majzum} translit={mu.majzumTranslit} color="var(--grove-green)" />
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                      <ArabicCell arabic={mu.muakkad} translit={mu.muakkadTranslit} color="var(--grove-gold)" />
                    </td>
                  </>
                )}
                {mu && isMajhool && (
                  <td style={{ padding: '8px 8px', textAlign: 'center', verticalAlign: 'top', borderLeft: '1px solid color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
                    <ArabicCell arabic={mu.maloomMajhool} translit={mu.maloomMajhoolTranslit} color="var(--grove-green)" />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-5 py-4 text-[10px] italic opacity-40 text-right border-t"
        style={{ borderColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)', fontFamily: '"Amiri", serif', direction: 'rtl' }}>
        التصريف وفق منهج النحاة الكلاسيكيين — يُنصح بمراجعة كتب الصرف للتحقق.
      </div>
    </div>
  );
}

/* ────────────────── Amr Table ────────────────── */

function AmrTable({ rows }: { rows: AmrRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: '2px solid color-mix(in srgb, var(--grove-purple) 10%, transparent)', backgroundColor: 'color-mix(in srgb, var(--grove-purple) 4%, transparent)' }}>
            {['الضمير', 'صيغة الأمر', 'التحويل الصوتي'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', fontFamily: '"Amiri", serif', fontSize: '14px', color: 'var(--grove-purple)', opacity: 0.7, textAlign: 'center' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.pronoun}
              style={{ backgroundColor: i % 2 === 0 ? 'color-mix(in srgb, var(--grove-teal) 4%, transparent)' : 'transparent', borderBottom: '1px solid color-mix(in srgb, var(--grove-purple) 5%, transparent)' }}>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                <div className="font-bold text-base" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>{row.pronoun}</div>
                <div className="text-[10px] opacity-50 mt-0.5" style={{ color: 'var(--grove-purple)' }}>{row.pronounEn}</div>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                <div className="text-2xl font-bold" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-teal)' }}>{row.form}</div>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                <div className="text-sm italic opacity-80" style={{ color: 'var(--grove-gold)' }}>{row.translit}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────── Ism Panel ────────────────── */

function IsmPanel({ ism }: { ism: IsmData }) {
  const entries = [
    { labelAr: 'مَصْدَر', labelEn: 'Verbal noun', arabic: ism.masdar, translit: ism.masdarTranslit },
    { labelAr: 'اِسْم فَاعِل', labelEn: 'Active participle', arabic: ism.fail, translit: ism.failTranslit },
    ...(ism.maful ? [{ labelAr: 'اِسْم مَفْعُول', labelEn: 'Passive participle', arabic: ism.maful, translit: ism.mafulTranslit ?? '' }] : []),
    { labelAr: 'اِسْم مَكَان/زَمَان', labelEn: 'Noun of place/time', arabic: ism.makan, translit: ism.makanTranslit },
  ];

  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entries.map(({ labelAr, labelEn, arabic, translit }) => (
        <div key={labelAr} className="rounded-2xl p-4 border"
          style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--grove-gold) 15%, transparent)' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1" style={{ color: 'var(--grove-purple)' }}>{labelEn}</div>
          <div className="text-2xl font-bold mb-1" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-gold)', direction: 'rtl', textAlign: 'right' }}>{arabic}</div>
          <div className="text-xs italic opacity-60" style={{ color: 'var(--grove-purple)' }}>{translit}</div>
          <div className="mt-1 text-right text-sm font-bold" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>{labelAr}</div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────── Shared cell ────────────────── */

function ArabicCell({ arabic, translit, color }: { arabic: string; translit: string; color: string }) {
  return (
    <div>
      <div className="text-xl font-bold leading-snug" style={{ fontFamily: '"Amiri", serif', color, direction: 'rtl' }}>
        {arabic}
      </div>
      <div className="text-[10px] italic opacity-60 mt-0.5" style={{ color }}>
        {translit}
      </div>
    </div>
  );
}
