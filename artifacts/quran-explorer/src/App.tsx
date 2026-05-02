import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignIn, SignUp, useUser } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { Router as WouterRouter, Switch, Route, useLocation } from 'wouter';
import { LanguageProvider } from './context/LanguageProvider';
import { useLanguage } from './context/useLanguage';
import { Layout, FontSettings, DEFAULT_FONT_SETTINGS } from './components/Layout';
import { SurahList } from './components/SurahList';
import { SurahView } from './components/SurahView';
import { WordSearch } from './components/WordSearch';
import { VerbConjugation } from './components/VerbConjugation';
import { RootSearch } from './components/RootSearch';
import { ThematicSearch } from './components/ThematicSearch';
import { getAllSurahs } from './services/quranService';
import { getAllNotes, saveNote, deleteNote } from './services/notesService';
import { getAllBookmarks, addBookmark, removeBookmark, isBookmarked, replaceAllBookmarks } from './services/bookmarkService';
import { NotesPanel } from './components/NotesPanel';
import { BookmarksPanel } from './components/BookmarksPanel';
import { Surah, Note, Bookmark } from './types';
import { Loader2, BookOpen, Star, Languages, GitBranch, Sparkles, Clock, FileText, Bookmark as BookmarkIcon } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined || undefined;

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: 'clerk' as const,
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#582C6F',
    colorForeground: '#582C6F',
    colorMutedForeground: '#7B5C94',
    colorDanger: '#B91C1C',
    colorBackground: '#FFFFFF',
    colorInput: '#FDF9F3',
    colorInputForeground: '#582C6F',
    colorNeutral: '#D5C5DE',
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !rounded-none',
    footer: '!shadow-none !border-0 !rounded-none',
    headerTitle: 'text-[#582C6F] font-bold',
    headerSubtitle: 'text-[#7B5C94]',
    socialButtonsBlockButtonText: 'text-[#582C6F] font-medium',
    formFieldLabel: 'text-[#582C6F] font-medium',
    footerActionLink: 'text-[#582C6F] font-bold hover:text-[#416D53]',
    footerActionText: 'text-[#7B5C94]',
    dividerText: 'text-[#7B5C94]',
    identityPreviewEditButton: 'text-[#582C6F]',
    formFieldSuccessText: 'text-[#416D53]',
    alertText: 'text-[#582C6F]',
    logoBox: 'mb-2',
    logoImage: 'h-12 w-12',
    socialButtonsBlockButton: 'border border-[#D5C5DE] hover:border-[#582C6F] transition-colors',
    formButtonPrimary: 'bg-[#582C6F] hover:bg-[#416D53] transition-colors font-bold',
    formFieldInput: 'bg-[#FDF9F3] border-[#D5C5DE] text-[#582C6F] focus:border-[#582C6F] focus:ring-[#582C6F]',
    footerAction: 'bg-[#FDF9F3]',
    dividerLine: 'bg-[#D5C5DE]',
    alert: 'bg-[#FDF9F3] border-[#D5C5DE]',
    otpCodeFieldInput: 'border-[#D5C5DE] text-[#582C6F]',
    formFieldRow: 'gap-3',
    main: 'gap-5',
  },
};

// ── Recently viewed helpers ───────────────────────────────────────────────
const RECENT_KEY = 'quran_recent_v1';
function getRecentNums(): number[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(num: number): void {
  const list = getRecentNums().filter(n => n !== num);
  list.unshift(num);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
}

// ── Main app content ──────────────────────────────────────────────────────
function AppContent() {
  const { t } = useLanguage();
  const { user, isSignedIn, isLoaded: authLoaded } = useUser();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getAllBookmarks());
  const [recentNums, setRecentNums] = useState<number[]>(getRecentNums());
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isBookmarksPanelOpen, setIsBookmarksPanelOpen] = useState(false);
  const [targetAyah, setTargetAyah] = useState<number | undefined>(undefined);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [wordSearchInitial, setWordSearchInitial] = useState<string | undefined>(undefined);
  const [isConjugationOpen, setIsConjugationOpen] = useState(false);
  const [isRootSearchOpen, setIsRootSearchOpen] = useState(false);
  const [isThematicOpen, setIsThematicOpen] = useState(false);
  const [rootSearchPreload, setRootSearchPreload] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(32);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('darkMode') || 'false'); } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try { localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); } catch {}
  }, [isDarkMode]);

  const [fontSettings, setFontSettings] = useState<FontSettings>(() => {
    try { return JSON.parse(localStorage.getItem('fontSettings') || 'null') ?? DEFAULT_FONT_SETTINGS; } catch { return DEFAULT_FONT_SETTINGS; }
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--font-arabic-var', `"${fontSettings.arabic}", serif`);
    document.documentElement.style.setProperty('--font-urdu-var', `"${fontSettings.urdu}", serif`);
    document.documentElement.style.setProperty('--font-english-var', `"${fontSettings.english}", ui-sans-serif, system-ui, sans-serif`);
    try { localStorage.setItem('fontSettings', JSON.stringify(fontSettings)); } catch {}
  }, [fontSettings]);

  useEffect(() => {
    getAllSurahs()
      .then((data) => { setSurahs(data); setFilteredSurahs(data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Load notes: from API when signed in, else localStorage
  useEffect(() => {
    if (!authLoaded) return;
    if (isSignedIn) {
      fetch(`${basePath}/api/notes`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then((data: Note[]) => {
          setNotes(data);
          data.forEach(n => saveNote(n.surahNumber, n.ayahNumber, n.content));
        })
        .catch(() => setNotes(getAllNotes()));
    } else {
      setNotes(getAllNotes());
    }
  }, [authLoaded, isSignedIn, user?.id]);

  // Load bookmarks: from API when signed in, else localStorage
  useEffect(() => {
    if (!authLoaded) return;
    if (isSignedIn) {
      fetch(`${basePath}/api/bookmarks`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then((data: Bookmark[] | null) => {
          if (data && Array.isArray(data)) {
            replaceAllBookmarks(data);
            setBookmarks(data);
          }
        })
        .catch(() => setBookmarks(getAllBookmarks()));
    } else {
      setBookmarks(getAllBookmarks());
    }
  }, [authLoaded, isSignedIn, user?.id]);

  const handleSearch = (query: string) => {
    const q = query.toLowerCase();
    setFilteredSurahs(surahs.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(query) ||
      s.number.toString() === query
    ));
  };

  const handleSaveNote = (surahNumber: number, ayahNumber: number, content: string) => {
    saveNote(surahNumber, ayahNumber, content);
    setNotes(getAllNotes());
    if (isSignedIn) {
      fetch(`${basePath}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ surahNumber, ayahNumber, content }),
      }).catch(() => {});
    }
  };

  const handleDeleteNote = (surahNumber: number, ayahNumber: number) => {
    deleteNote(surahNumber, ayahNumber);
    setNotes(getAllNotes());
    if (isSignedIn) {
      fetch(`${basePath}/api/notes/${surahNumber}/${ayahNumber}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => {});
    }
  };

  const handleToggleBookmark = (surahNumber: number, ayahNumber: number) => {
    const surah = surahs.find(s => s.number === surahNumber);
    if (!surah) return;

    if (isBookmarked(surahNumber, ayahNumber)) {
      removeBookmark(surahNumber, ayahNumber);
      setBookmarks(getAllBookmarks());
      if (isSignedIn) {
        fetch(`${basePath}/api/bookmarks/${surahNumber}/${ayahNumber}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(() => {});
      }
    } else {
      addBookmark(surahNumber, ayahNumber, surah.englishName, surah.name);
      setBookmarks(getAllBookmarks());
      if (isSignedIn) {
        fetch(`${basePath}/api/bookmarks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ surahNumber, ayahNumber, surahName: surah.englishName, surahNameAr: surah.name }),
        }).catch(() => {});
      }
    }
  };

  const handleDeleteBookmark = (surahNumber: number, ayahNumber: number) => {
    removeBookmark(surahNumber, ayahNumber);
    setBookmarks(getAllBookmarks());
    if (isSignedIn) {
      fetch(`${basePath}/api/bookmarks/${surahNumber}/${ayahNumber}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => {});
    }
  };

  const handleNavigateToNote = (surahNumber: number, ayahNumber: number) => {
    const s = surahs.find(x => x.number === surahNumber);
    if (!s) return;
    setIsNotesPanelOpen(false);
    setTargetAyah(ayahNumber);
    pushRecent(s.number);
    setRecentNums(getRecentNums());
    setSelectedSurah(s);
  };

  const handleNavigateToBookmark = (surahNumber: number, ayahNumber: number) => {
    const s = surahs.find(x => x.number === surahNumber);
    if (!s) return;
    setIsBookmarksPanelOpen(false);
    setTargetAyah(ayahNumber);
    pushRecent(s.number);
    setRecentNums(getRecentNums());
    setSelectedSurah(s);
  };

  const handleSelectSurah = (s: Surah) => {
    pushRecent(s.number);
    setRecentNums(getRecentNums());
    setTargetAyah(undefined);
    setSelectedSurah(s);
  };

  const recentSurahs = recentNums
    .map(n => surahs.find(s => s.number === n))
    .filter(Boolean) as Surah[];

  const isUrdu = t('langToggle') === 'English';

  return (
    <Layout
      onSearch={handleSearch}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode((d: boolean) => !d)}
      fontSettings={fontSettings}
      onFontChange={(type, font) => setFontSettings((prev: FontSettings) => ({ ...prev, [type]: font }))}
    >
      {isDictionaryOpen && <WordSearch onClose={() => { setIsDictionaryOpen(false); setWordSearchInitial(undefined); }} initialWord={wordSearchInitial} />}
      {isConjugationOpen && <VerbConjugation onClose={() => setIsConjugationOpen(false)} />}
      {isRootSearchOpen && (
        <RootSearch
          onClose={() => { setIsRootSearchOpen(false); setRootSearchPreload(null); }}
          onNavigate={(num) => { const s = surahs.find(x => x.number === num); if (s) handleSelectSurah(s); }}
          preloadRoot={rootSearchPreload ?? undefined}
        />
      )}
      {isThematicOpen && (
        <ThematicSearch
          onClose={() => setIsThematicOpen(false)}
          onNavigate={(num) => { const s = surahs.find(x => x.number === num); if (s) handleSelectSurah(s); }}
          onOpenRootSearch={(root) => {
            setIsThematicOpen(false);
            setRootSearchPreload(root);
            setIsRootSearchOpen(true);
          }}
        />
      )}

      {isNotesPanelOpen && (
        <NotesPanel
          notes={notes}
          surahs={surahs}
          onClose={() => setIsNotesPanelOpen(false)}
          onNavigate={handleNavigateToNote}
          onDeleteNote={handleDeleteNote}
        />
      )}

      {isBookmarksPanelOpen && (
        <BookmarksPanel
          bookmarks={bookmarks}
          onClose={() => setIsBookmarksPanelOpen(false)}
          onNavigate={handleNavigateToBookmark}
          onDelete={handleDeleteBookmark}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--grove-green)' }} />
          <p className="font-bold uppercase tracking-widest text-xs opacity-60" style={{ color: 'var(--grove-purple)' }}>
            {t('loadingLib')}
          </p>
        </div>
      ) : selectedSurah ? (
        <SurahView
          surah={selectedSurah}
          onBack={() => { setSelectedSurah(null); setTargetAyah(undefined); }}
          notes={notes}
          onSaveNote={handleSaveNote}
          fontSize={fontSize}
          scrollToAyah={targetAyah}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          onWordSearch={(word) => { setWordSearchInitial(word); setIsDictionaryOpen(true); }}
          onRootSearch={(root) => { setRootSearchPreload(root); setIsRootSearchOpen(true); }}
        />
      ) : (
        <div className="space-y-12">
          {/* Hero */}
          <div className="text-center max-w-2xl mx-auto py-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)' }}>
              <Star size={14} />
              {t('heroBadge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ color: 'var(--grove-purple)' }}>
              {t('heroTitle')}
            </h2>
            <p className="text-lg leading-relaxed font-medium opacity-70" style={{ color: 'var(--grove-purple)' }}>
              {t('heroDesc')}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'dict', icon: <Languages size={22} />, label: t('dict'), descEn: 'Word-by-word analysis', descUr: 'لفظ بلفظ تجزیہ', color: 'var(--grove-teal)', bg: 'color-mix(in srgb, var(--grove-teal) 10%, transparent)', onClick: () => setIsDictionaryOpen(true) },
              { key: 'tasreef', icon: <span style={{ fontFamily: '"Amiri", serif', fontSize: '22px', lineHeight: 1 }}>ص</span>, label: t('tasreef'), descEn: 'Verb conjugation table', descUr: 'فعل کی گردان', color: 'var(--grove-gold)', bg: 'color-mix(in srgb, var(--grove-gold) 10%, transparent)', onClick: () => setIsConjugationOpen(true) },
              { key: 'roots', icon: <GitBranch size={22} />, label: t('roots'), descEn: 'Search by Arabic root', descUr: 'عربی جذر سے تلاش', color: 'var(--grove-green)', bg: 'color-mix(in srgb, var(--grove-green) 10%, transparent)', onClick: () => setIsRootSearchOpen(true) },
              { key: 'themes', icon: <Sparkles size={22} />, label: t('themes'), descEn: 'AI thematic verse search', descUr: 'موضوعی آیات تلاش', color: 'var(--grove-purple)', bg: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', onClick: () => setIsThematicOpen(true) },
            ].map(({ key, icon, label, descEn, descUr, color, bg, onClick }) => (
              <button key={key} onClick={onClick}
                className="flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-md"
                style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg, color }}>
                  {icon}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--grove-purple)' }}>{label}</div>
                  <div className="text-[11px] opacity-55 mt-0.5 leading-snug" style={{ color: 'var(--grove-purple)' }}>
                    {isUrdu ? descUr : descEn}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* My Bookmarks shortcut */}
          {bookmarks.length > 0 && (
            <button
              onClick={() => setIsBookmarksPanelOpen(true)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:shadow-md hover:scale-[1.005] group"
              style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}
            >
              <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)' }}>
                <BookmarkIcon size={20} style={{ color: 'var(--grove-gold)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--grove-purple)' }}>
                  {isUrdu ? 'میرے بُک مارکس' : 'My Bookmarks'}
                </div>
                <div className="text-[11px] opacity-55 mt-0.5" style={{ color: 'var(--grove-purple)' }}>
                  {bookmarks.length} {isUrdu
                    ? 'آیات محفوظ ہیں'
                    : `saved ayah${bookmarks.length !== 1 ? 's' : ''} across ${new Set(bookmarks.map(b => b.surahNumber)).size} surah${new Set(bookmarks.map(b => b.surahNumber)).size !== 1 ? 's' : ''}`}
                </div>
              </div>
              <div className="text-xs font-bold opacity-40 group-hover:opacity-70 transition-opacity shrink-0" style={{ color: 'var(--grove-purple)' }}>
                {isUrdu ? 'دیکھیں' : 'View all →'}
              </div>
            </button>
          )}

          {/* My Notes shortcut */}
          {notes.filter(n => n.content.trim()).length > 0 && (
            <button
              onClick={() => setIsNotesPanelOpen(true)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:shadow-md hover:scale-[1.005] group"
              style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}
            >
              <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-pink) 12%, transparent)' }}>
                <FileText size={20} style={{ color: 'var(--grove-pink)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--grove-purple)' }}>
                  {isUrdu ? 'میرے نوٹس' : 'My Notes'}
                </div>
                <div className="text-[11px] opacity-55 mt-0.5" style={{ color: 'var(--grove-purple)' }}>
                  {notes.filter(n => n.content.trim()).length}{' '}
                  {isUrdu ? 'نوٹ محفوظ ہیں' : `saved note${notes.filter(n => n.content.trim()).length !== 1 ? 's' : ''} across ${new Set(notes.filter(n => n.content.trim()).map(n => n.surahNumber)).size} surah${new Set(notes.filter(n => n.content.trim()).map(n => n.surahNumber)).size !== 1 ? 's' : ''}`}
                </div>
              </div>
              <div className="text-xs font-bold opacity-40 group-hover:opacity-70 transition-opacity shrink-0" style={{ color: 'var(--grove-purple)' }}>
                {isUrdu ? 'دیکھیں' : 'View all →'}
              </div>
            </button>
          )}

          {/* Recently Viewed */}
          {recentSurahs.length > 0 && (
            <div className="rounded-[2rem] p-6 border" style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)' }}>
                  <Clock size={20} style={{ color: 'var(--grove-gold)' }} />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-widest" style={{ color: 'var(--grove-purple)' }}>
                    {isUrdu ? 'حال ہی میں دیکھا' : 'Recently Viewed'}
                  </h3>
                  <p className="text-xs opacity-50" style={{ color: 'var(--grove-purple)' }}>
                    {isUrdu ? 'آپ کے آخری سورے' : 'Your last visited surahs'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSurahs.map(s => (
                  <button key={s.number} onClick={() => handleSelectSurah(s)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:shadow-md hover:scale-[1.02] text-sm font-medium"
                    style={{ backgroundColor: 'var(--grove-cream)', borderColor: 'color-mix(in srgb, var(--grove-purple) 12%, transparent)', color: 'var(--grove-purple)' }}>
                    <span className="text-xs font-mono opacity-60">{s.number}.</span>
                    <span style={{ fontFamily: '"Amiri", serif', fontSize: '17px' }}>{s.name}</span>
                    <span className="text-xs opacity-60">{s.englishName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Surah list */}
          <div className="rounded-[2rem] p-8 border" style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
            <div className="flex items-center gap-3 mb-8 border-b pb-6" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 12%, transparent)' }}>
                <BookOpen size={24} style={{ color: 'var(--grove-teal)' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--grove-purple)' }}>
                  {t('sectionTitle')}
                </h3>
                <p className="text-xs opacity-50" style={{ color: 'var(--grove-purple)' }}>
                  {t('sectionSub')}
                </p>
              </div>
            </div>
            <SurahList
              surahs={filteredSurahs}
              onSelect={handleSelectSurah}
              selectedSurahNumber={undefined}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Sign-in / Sign-up pages ───────────────────────────────────────────────
function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--grove-cream)' }}>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={basePath || '/'} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--grove-cream)' }}>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={basePath || '/'} />
    </div>
  );
}

// ── Clerk provider + router ───────────────────────────────────────────────
function ClerkApp() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to sync your notes across devices' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Save and access your Quran notes anywhere' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <LanguageProvider>
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={AppContent} />
        </Switch>
      </LanguageProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}
