import React, { useState } from 'react';
import { Search, Loader2, X, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamAnalysis } from '../services/analysisService';
import { AnalysisCache } from '../services/cacheService';

interface WordSearchProps {
  onClose: () => void;
}

export const WordSearch: React.FC<WordSearchProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const cached = AnalysisCache.getWord(query.trim());
    if (cached) {
      setResult(cached);
      return;
    }

    setIsLoading(true);
    setResult('');
    setError('');
    try {
      let fullText = '';
      await streamAnalysis('word', { word: query.trim() }, (text) => {
        fullText = text;
        setResult(text);
      });
      if (fullText) AnalysisCache.setWord(query.trim(), fullText);
    } catch {
      setError('Failed to fetch definition. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>

        <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10"
          style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: 'var(--grove-purple)' }}>
              <Languages size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--grove-purple)' }}>Global Dictionary</h2>
              <p className="text-xs opacity-60" style={{ color: 'var(--grove-purple)' }}>Search any Arabic word</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-all hover:opacity-70"
            style={{ color: 'var(--grove-purple)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6" style={{ backgroundColor: 'var(--grove-cream)' }}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type an Arabic word (e.g., رحمن)..."
              className="w-full pl-12 pr-28 py-4 rounded-2xl text-lg focus:outline-none focus:ring-2 transition-all dir-rtl font-arabic shadow-sm"
              style={{
                backgroundColor: 'var(--grove-paper)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 10%, transparent)',
                fontFamily: '"Amiri", serif',
                direction: 'rtl'
              }}
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} style={{ color: 'var(--grove-purple)' }} />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 shadow-md"
              style={{ backgroundColor: 'var(--grove-green)' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ backgroundColor: 'var(--grove-paper)' }}>
          {error ? (
            <p className="text-center text-sm opacity-60" style={{ color: 'var(--grove-pink)' }}>{error}</p>
          ) : result ? (
            <>
              <div className="markdown-body prose prose-sm max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              <div className="mt-8 pt-4 border-t text-[10px] italic opacity-40"
                style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)', color: 'var(--grove-purple)' }}>
                Definitions cross-referenced with Lisan al-Arab, Al-Qamus al-Muhit, and Lane's Lexicon.
              </div>
            </>
          ) : !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center opacity-20"
                style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-purple)' }}>
                <Search size={32} />
              </div>
              <p className="text-sm opacity-50 max-w-xs" style={{ color: 'var(--grove-purple)' }}>
                Enter an Arabic word above to see its detailed definitions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--grove-purple)' }} />
              <p className="text-sm opacity-60" style={{ color: 'var(--grove-purple)' }}>Searching dictionary...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
