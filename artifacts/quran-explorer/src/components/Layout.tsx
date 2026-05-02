import React, { useRef, useEffect } from 'react';
import { Book, Search, Moon, Sun, LogIn, LogOut, User, Type } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';
import { useUser, useClerk } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface FontSettings {
  arabic: string;
  urdu: string;
  english: string;
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  arabic: 'Amiri',
  urdu: 'Amiri',
  english: 'Inter',
};

const ARABIC_FONTS = [
  { id: 'Amiri', label: 'Amiri', preview: 'بِسْمِ' },
  { id: 'Amiri Quran', label: 'Amiri Quran', preview: 'بِسْمِ' },
  { id: 'Scheherazade New', label: 'Scheherazade', preview: 'بِسْمِ' },
  { id: 'Noto Naskh Arabic', label: 'Noto Naskh', preview: 'بِسْمِ' },
  { id: 'Reem Kufi', label: 'Reem Kufi', preview: 'بسم' },
];

const URDU_FONTS = [
  { id: 'Amiri', label: 'Amiri', preview: 'اللہ' },
  { id: 'Noto Nastaliq Urdu', label: 'Nastaliq', preview: 'اللہ' },
  { id: 'Lateef', label: 'Lateef', preview: 'اللہ' },
];

const ENGLISH_FONTS = [
  { id: 'Inter', label: 'Inter', preview: 'Explore' },
  { id: 'Merriweather', label: 'Merriweather', preview: 'Explore' },
  { id: 'Lora', label: 'Lora', preview: 'Explore' },
  { id: 'Crimson Pro', label: 'Crimson', preview: 'Explore' },
];

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  fontSettings?: FontSettings;
  onFontChange?: (type: 'arabic' | 'urdu' | 'english', font: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onSearch,
  fontSize,
  onFontSizeChange,
  isDarkMode,
  onToggleDarkMode,
  fontSettings,
  onFontChange,
}) => {
  const { lang, setLang, t } = useLanguage();
  const { user, isSignedIn, isLoaded } = useUser();
  const { openSignIn, signOut } = useClerk();
  const isUrdu = lang === 'ur';
  const [isFontPanelOpen, setIsFontPanelOpen] = React.useState(false);
  const fontPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFontPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (fontPanelRef.current && !fontPanelRef.current.contains(e.target as Node)) {
        setIsFontPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isFontPanelOpen]);

  const currentFonts = fontSettings ?? DEFAULT_FONT_SETTINGS;

  const FontRow = ({
    label,
    labelUr,
    fonts,
    current,
    type,
    rtl,
  }: {
    label: string;
    labelUr: string;
    fonts: { id: string; label: string; preview: string }[];
    current: string;
    type: 'arabic' | 'urdu' | 'english';
    rtl?: boolean;
  }) => (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-50" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? 'var(--font-urdu-var)' : undefined }}>
        {isUrdu ? labelUr : label}
      </p>
      <div className="flex flex-wrap gap-2">
        {fonts.map(f => (
          <button
            key={f.id}
            onClick={() => onFontChange?.(type, f.id)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all"
            style={{
              backgroundColor: current === f.id ? 'color-mix(in srgb, var(--grove-purple) 12%, transparent)' : 'var(--grove-cream)',
              borderColor: current === f.id ? 'var(--grove-purple)' : 'color-mix(in srgb, var(--grove-purple) 15%, transparent)',
              color: 'var(--grove-purple)',
              minWidth: '72px',
            }}
          >
            <span
              style={{
                fontFamily: `"${f.id}", ${rtl ? 'serif' : 'sans-serif'}`,
                fontSize: rtl ? '18px' : '16px',
                direction: rtl ? 'rtl' : 'ltr',
                lineHeight: 1.4,
              }}
            >
              {f.preview}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-purple)' }}>
      <header className="sticky top-0 z-50 border-b backdrop-blur-md px-4 py-3"
        style={{ backgroundColor: 'color-mix(in srgb, var(--grove-paper) 85%, transparent)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-lg shadow-sm text-white" style={{ backgroundColor: 'var(--grove-green)' }}>
              <Book size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? 'var(--font-urdu-var)' : undefined }}>
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

            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)',
                color: 'var(--grove-purple)',
                borderColor: 'color-mix(in srgb, var(--grove-purple) 15%, transparent)',
                fontFamily: lang === 'en' ? 'var(--font-urdu-var)' : undefined,
              }}
              title={lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}
            >
              <span style={{ fontFamily: lang === 'ur' ? undefined : 'var(--font-urdu-var)', fontSize: lang === 'en' ? '14px' : undefined }}>
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

            {(onFontSizeChange || onFontChange) && (
              <div className="relative" ref={fontPanelRef}>
                <button
                  onClick={() => setIsFontPanelOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:opacity-80 border"
                  style={{
                    backgroundColor: isFontPanelOpen
                      ? 'color-mix(in srgb, var(--grove-gold) 18%, transparent)'
                      : 'color-mix(in srgb, var(--grove-gold) 10%, transparent)',
                    borderColor: isFontPanelOpen ? 'var(--grove-gold)' : 'color-mix(in srgb, var(--grove-gold) 25%, transparent)',
                    color: 'var(--grove-gold)',
                  }}
                >
                  <Type size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">FONT</span>
                  {fontSize !== undefined && (
                    <span className="text-xs font-mono">{fontSize}</span>
                  )}
                </button>

                {isFontPanelOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 rounded-2xl border shadow-2xl p-5 space-y-5 z-[100]"
                    style={{
                      backgroundColor: 'var(--grove-paper)',
                      borderColor: 'color-mix(in srgb, var(--grove-purple) 12%, transparent)',
                      width: '340px',
                      maxHeight: '80vh',
                      overflowY: 'auto',
                    }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--grove-gold)' }}>
                      {isUrdu ? 'ٹائپوگرافی' : 'Typography Settings'}
                    </p>

                    {onFontSizeChange && fontSize !== undefined && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-50" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? 'var(--font-urdu-var)' : undefined }}>
                          {isUrdu ? 'قرآنی متن کا سائز' : 'Quran Text Size'}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-arabic opacity-50" style={{ fontFamily: 'var(--font-arabic-var)', color: 'var(--grove-purple)' }}>ب</span>
                          <input
                            type="range"
                            min="20"
                            max="64"
                            value={fontSize}
                            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: 'var(--grove-gold)' }}
                          />
                          <span className="text-lg font-arabic" style={{ fontFamily: 'var(--font-arabic-var)', color: 'var(--grove-gold)', fontSize: `${Math.min(fontSize, 32)}px` }}>ب</span>
                          <span className="text-xs font-mono w-6" style={{ color: 'var(--grove-gold)' }}>{fontSize}</span>
                        </div>
                      </div>
                    )}

                    {onFontChange && (
                      <>
                        <FontRow
                          label="Arabic (Quran)"
                          labelUr="عربی (قرآن)"
                          fonts={ARABIC_FONTS}
                          current={currentFonts.arabic}
                          type="arabic"
                          rtl
                        />
                        <FontRow
                          label="Urdu"
                          labelUr="اردو"
                          fonts={URDU_FONTS}
                          current={currentFonts.urdu}
                          type="urdu"
                          rtl
                        />
                        <FontRow
                          label="English"
                          labelUr="انگریزی"
                          fonts={ENGLISH_FONTS}
                          current={currentFonts.english}
                          type="english"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {isLoaded && (
              isSignedIn ? (
                <div className="flex items-center gap-2">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-offset-1"
                      style={{ outline: '2px solid var(--grove-purple)', outlineOffset: '1px' }} />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: 'var(--grove-purple)' }}>
                      <User size={14} />
                    </div>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded-full transition-all hover:opacity-80 hidden sm:flex"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', color: 'var(--grove-purple)' }}
                    title="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openSignIn()}
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
