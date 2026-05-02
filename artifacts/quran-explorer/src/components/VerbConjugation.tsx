import React, { useState } from 'react';
import { Loader2, X, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamAnalysis } from '../services/analysisService';
import { AnalysisCache } from '../services/cacheService';

interface VerbConjugationProps {
  onClose: () => void;
}

const EXAMPLE_VERBS = ['كَتَبَ', 'قَرَأَ', 'ذَهَبَ', 'آمَنَ', 'أَكَلَ', 'عَلِمَ', 'نَصَرَ', 'سَأَلَ'];

export const VerbConjugation: React.FC<VerbConjugationProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedVerb, setSearchedVerb] = useState('');

  const handleSearch = async (verb?: string) => {
    const v = (verb ?? query).trim();
    if (!v) return;

    const cacheKey = `conj_${v}`;
    const cached = AnalysisCache.getWord(cacheKey);
    if (cached) {
      setResult(cached);
      setSearchedVerb(v);
      return;
    }

    setIsLoading(true);
    setResult('');
    setError('');
    setSearchedVerb(v);
    try {
      let fullText = '';
      await streamAnalysis('conjugation', { word: v }, (text) => {
        fullText = text;
        setResult(text);
      });
      if (fullText) AnalysisCache.setWord(cacheKey, fullText);
    } catch {
      setError('فشل في جلب التصريف. الرجاء المحاولة مجدداً.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>

        <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10"
          style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg text-lg font-arabic"
              style={{ backgroundColor: 'var(--grove-gold)', fontFamily: '"Amiri", serif' }}>
              ص
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--grove-purple)' }}>تصريف الأفعال</h2>
              <p className="text-xs opacity-60" style={{ color: 'var(--grove-purple)' }}>Verb Conjugation Table</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-all hover:opacity-70"
            style={{ color: 'var(--grove-purple)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b" style={{ backgroundColor: 'var(--grove-cream)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <form onSubmit={handleSubmit} className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب الفعل بأي صيغة (مثل: كتب، يكتب، مضى، نصر)..."
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
                  fontFamily: '"Amiri", serif'
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ backgroundColor: 'var(--grove-paper)' }}>
          {error ? (
            <p className="text-center text-sm opacity-60 font-arabic" style={{ color: 'var(--grove-pink)', fontFamily: '"Amiri", serif' }}>{error}</p>
          ) : result ? (
            <>
              <div
                className="markdown-body prose prose-sm max-w-none markdown-rtl conjugation-table"
                style={{
                  direction: 'rtl',
                  textAlign: 'right',
                  fontFamily: '"Amiri", serif',
                  fontSize: '17px',
                }}
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              <div className="mt-8 pt-4 border-t text-[10px] italic opacity-40 text-right"
                style={{ borderColor: 'color-mix(in srgb, var(--grove-gold) 15%, transparent)', color: 'var(--grove-gold)', fontFamily: '"Amiri", serif', direction: 'rtl' }}>
                التصريف وفق منهج النحاة الكلاسيكيين — يُنصح بمراجعة كتب الصرف للتحقق.
              </div>
            </>
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
                  Enter any Arabic verb in any form — past, present, imperative, or root — to generate the complete conjugation table.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="animate-spin" size={36} style={{ color: 'var(--grove-gold)' }} />
              <p className="text-sm opacity-60 font-arabic" style={{ color: 'var(--grove-gold)', fontFamily: '"Amiri", serif' }}>
                جاري توليد جدول التصريف...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
