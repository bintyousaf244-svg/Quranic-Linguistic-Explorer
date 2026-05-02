import React from 'react';
import { X, Bookmark, ArrowRight, Trash2, BookOpen, Cloud, HardDrive } from 'lucide-react';
import { Bookmark as BookmarkType } from '../types';
import { useLanguage } from '../context/useLanguage';
import { useUser } from '@clerk/react';

interface BookmarksPanelProps {
  bookmarks: BookmarkType[];
  onClose: () => void;
  onNavigate: (surahNumber: number, ayahNumber: number) => void;
  onDelete: (surahNumber: number, ayahNumber: number) => void;
}

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  bookmarks, onClose, onNavigate, onDelete,
}) => {
  const { lang } = useLanguage();
  const { isSignedIn, isLoaded } = useUser();
  const isUrdu = lang === 'ur';

  // Group bookmarks by surah
  const grouped = React.useMemo(() => {
    const map = new Map<number, BookmarkType[]>();
    for (const bm of bookmarks) {
      if (!map.has(bm.surahNumber)) map.set(bm.surahNumber, []);
      map.get(bm.surahNumber)!.push(bm);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([surahNum, bms]) => ({ surahNum, bms: bms.sort((a, b) => a.ayahNumber - b.ayahNumber) }));
  }, [bookmarks]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--grove-paper)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)' }}>
              <Bookmark size={18} style={{ color: 'var(--grove-gold)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                {isUrdu ? 'میرے بُک مارکس' : 'My Bookmarks'}
              </h2>
              <p className="text-xs opacity-50 flex items-center gap-1" style={{ color: 'var(--grove-purple)' }}>
                {bookmarks.length} {isUrdu ? 'آیات' : `ayah${bookmarks.length !== 1 ? 's' : ''}`}
                {isLoaded && (
                  <span className="inline-flex items-center gap-1 ml-1">
                    · {isSignedIn
                      ? <><Cloud size={10} className="inline" /> {isUrdu ? 'محفوظ' : 'synced'}</>
                      : <><HardDrive size={10} className="inline" /> {isUrdu ? 'مقامی' : 'local only'}</>}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-all hover:opacity-70"
            style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', color: 'var(--grove-purple)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 10%, transparent)' }}>
                <Bookmark size={28} style={{ color: 'var(--grove-gold)', opacity: 0.4 }} />
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: 'var(--grove-purple)', opacity: 0.6 }}>
                  {isUrdu ? 'ابھی کوئی بُک مارک نہیں' : 'No bookmarks yet'}
                </p>
                <p className="text-sm opacity-40" style={{ color: 'var(--grove-purple)' }}>
                  {isUrdu
                    ? 'کسی آیت پر بُک مارک آئیکن دبائیں'
                    : 'Tap the bookmark icon on any ayah to save it here'}
                </p>
              </div>
            </div>
          ) : (
            grouped.map(({ surahNum, bms }) => (
              <div key={surahNum}>
                {/* Surah header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)' }}>
                    {surahNum}
                  </span>
                  <span className="font-bold text-sm" style={{ color: 'var(--grove-purple)' }}>
                    {bms[0].surahName}
                  </span>
                  {bms[0].surahNameAr && (
                    <span className="text-base" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)', opacity: 0.7 }}>
                      {bms[0].surahNameAr}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] opacity-40 font-medium" style={{ color: 'var(--grove-purple)' }}>
                    {bms.length} {bms.length === 1 ? 'ayah' : 'ayahs'}
                  </span>
                </div>

                {/* Bookmarks for this surah */}
                <div className="space-y-2 pl-1">
                  {bms.map(bm => (
                    <div key={bm.id}
                      className="group rounded-xl border p-4 flex items-center gap-3 transition-all hover:shadow-md"
                      style={{
                        backgroundColor: 'var(--grove-cream)',
                        borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)',
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 15%, transparent)', color: 'var(--grove-gold)' }}>
                        {bm.ayahNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--grove-purple)' }}>
                          {isUrdu ? `آیت ${bm.ayahNumber}` : `Ayah ${bm.ayahNumber}`}
                        </p>
                        <p className="text-[10px] opacity-40 mt-0.5" style={{ color: 'var(--grove-purple)' }}>
                          {new Date(bm.createdAt).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { onNavigate(bm.surahNumber, bm.ayahNumber); onClose(); }}
                          className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-all hover:opacity-80"
                          style={{ backgroundColor: 'color-mix(in srgb, var(--grove-green) 15%, transparent)', color: 'var(--grove-green)' }}>
                          <BookOpen size={11} />
                          {isUrdu ? 'جائیں' : 'Go to Ayah'}
                          <ArrowRight size={11} />
                        </button>
                        <button
                          onClick={() => onDelete(bm.surahNumber, bm.ayahNumber)}
                          className="p-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{ backgroundColor: 'color-mix(in srgb, #dc2626 10%, transparent)', color: '#dc2626' }}
                          title={isUrdu ? 'ہٹائیں' : 'Remove bookmark'}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — sign-in nudge */}
        {isLoaded && !isSignedIn && bookmarks.length > 0 && (
          <div className="shrink-0 border-t px-6 py-4 flex items-center gap-3"
            style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)', backgroundColor: 'color-mix(in srgb, var(--grove-gold) 6%, transparent)' }}>
            <Cloud size={16} style={{ color: 'var(--grove-gold)', flexShrink: 0 }} />
            <p className="text-xs leading-snug" style={{ color: 'var(--grove-purple)', opacity: 0.75 }}>
              {isUrdu
                ? 'بُک مارکس صرف اس ڈیوائس پر ہیں۔ سائن ان کریں تاکہ ہر جگہ دستیاب ہوں۔'
                : 'Bookmarks are saved locally. Sign in to sync them across all your devices.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
