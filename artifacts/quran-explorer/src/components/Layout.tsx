import React from 'react';
import { Book, Search, Moon, Sun, Languages } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  onOpenDictionary?: () => void;
  onOpenConjugation?: () => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onSearch,
  onOpenDictionary,
  onOpenConjugation,
  fontSize,
  onFontSizeChange,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-purple)' }}>
      <header className="sticky top-0 z-50 border-b backdrop-blur-md px-4 py-3"
        style={{ backgroundColor: 'color-mix(in srgb, var(--grove-paper) 85%, transparent)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-lg shadow-sm text-white" style={{ backgroundColor: 'var(--grove-green)' }}>
              <Book size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block" style={{ color: 'var(--grove-purple)' }}>
              Quranic Linguistic Explorer
            </h1>
            <h1 className="text-lg font-bold tracking-tight sm:hidden" style={{ color: 'var(--grove-purple)' }}>
              QLE
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onSearch && (
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} style={{ color: 'var(--grove-purple)' }} />
                <input
                  type="text"
                  placeholder="Search Surah..."
                  className="pl-9 pr-4 py-2 rounded-full text-sm w-56 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--grove-cream)',
                    color: 'var(--grove-purple)',
                    border: 'none',
                    boxShadow: '0 0 0 2px color-mix(in srgb, var(--grove-purple) 10%, transparent)'
                  }}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            )}

            {onOpenDictionary && (
              <button
                onClick={onOpenDictionary}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 12%, transparent)', color: 'var(--grove-teal)' }}
              >
                <Languages size={16} />
                <span className="hidden sm:inline">Dictionary</span>
              </button>
            )}

            {onOpenConjugation && (
              <button
                onClick={onOpenConjugation}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)', fontFamily: '"Amiri", serif' }}
              >
                <span className="text-base leading-none">ص</span>
                <span className="hidden sm:inline font-sans">Tasreef</span>
              </button>
            )}

            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-full transition-all hover:opacity-80"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', color: 'var(--grove-purple)' }}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {onFontSizeChange && fontSize !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--grove-gold)' }}>Font</span>
                <input
                  type="range"
                  min="20"
                  max="64"
                  value={fontSize}
                  onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                  className="w-20 h-1 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--grove-gold)' }}
                />
                <span className="text-xs font-mono w-6" style={{ color: 'var(--grove-gold)' }}>{fontSize}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t py-12 mt-20" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)', backgroundColor: 'var(--grove-paper)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium opacity-60" style={{ color: 'var(--grove-purple)' }}>
            © 2026 Quranic Linguistic Explorer · Powered by Groq AI &amp; AlQuran Cloud
          </p>
        </div>
      </footer>
    </div>
  );
};
