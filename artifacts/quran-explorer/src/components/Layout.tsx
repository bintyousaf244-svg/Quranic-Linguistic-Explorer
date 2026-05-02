import React from 'react';
import { Book, Search, Moon, Sun, LogIn, LogOut, User } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';
import { useUser, useClerk } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  onOpenDictionary?: () => void;
  onOpenConjugation?: () => void;
  onOpenRootSearch?: () => void;
  onOpenThematicSearch?: () => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onSearch,
  fontSize,
  onFontSizeChange,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { lang, setLang, t } = useLanguage();
  const { user, isSignedIn, isLoaded } = useUser();
  const { openSignIn, signOut } = useClerk();
  const isUrdu = lang === 'ur';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-purple)' }}>
      <header className="sticky top-0 z-50 border-b backdrop-blur-md px-4 py-3"
        style={{ backgroundColor: 'color-mix(in srgb, var(--grove-paper) 85%, transparent)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-lg shadow-sm text-white" style={{ backgroundColor: 'var(--grove-green)' }}>
              <Book size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
              {t('appName')}
            </h1>
            <h1 className="text-lg font-bold tracking-tight sm:hidden" style={{ color: 'var(--grove-purple)' }}>
              {isUrdu ? 'ق ل ت' : 'QLE'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onSearch && (
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} style={{ color: 'var(--grove-purple)' }} />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  className="pl-9 pr-4 py-2 rounded-full text-sm w-56 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--grove-cream)',
                    color: 'var(--grove-purple)',
                    border: 'none',
                    boxShadow: '0 0 0 2px color-mix(in srgb, var(--grove-purple) 10%, transparent)',
                  }}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)',
                color: 'var(--grove-purple)',
                borderColor: 'color-mix(in srgb, var(--grove-purple) 15%, transparent)',
                fontFamily: lang === 'en' ? '"Amiri", serif' : undefined,
              }}
              title={lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}
            >
              <span style={{ fontFamily: lang === 'ur' ? undefined : '"Amiri", serif', fontSize: lang === 'en' ? '14px' : undefined }}>
                {t('langToggle')}
              </span>
            </button>

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
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--grove-gold)' }}>FONT</span>
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

            {/* Auth button */}
            {isLoaded && (
              isSignedIn ? (
                <div className="flex items-center gap-2">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-offset-1"
                      style={{ ringColor: 'var(--grove-purple)' }} />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: 'var(--grove-purple)' }}>
                      <User size={14} />
                    </div>
                  )}
                  <button
                    onClick={() => signOut({ redirectUrl: `${basePath}/` })}
                    className="p-2 rounded-full transition-all hover:opacity-80 hidden sm:flex"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', color: 'var(--grove-purple)' }}
                    title="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openSignIn({ redirectUrl: `${basePath}/` })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-90 text-white"
                  style={{ backgroundColor: 'var(--grove-purple)' }}
                >
                  <LogIn size={14} />
                  <span className="hidden sm:inline">Sign in</span>
                </button>
              )
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
            © 2026 {t('appName')} · Powered by Groq AI &amp; AlQuran Cloud
          </p>
        </div>
      </footer>
    </div>
  );
};
