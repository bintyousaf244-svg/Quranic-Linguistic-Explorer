import React, { useMemo } from 'react';
import { X, FileText, ArrowRight, Trash2, BookOpen, Cloud, HardDrive } from 'lucide-react';
import { Note, Surah } from '../types';
import { useLanguage } from '../context/useLanguage';
import { useUser } from '@clerk/react';

interface NotesPanelProps {
  notes: Note[];
  surahs: Surah[];
  onClose: () => void;
  onNavigate: (surahNumber: number, ayahNumber: number) => void;
  onDeleteNote: (surahNumber: number, ayahNumber: number) => void;
}

function truncate(text: string, max = 120): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…';
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  surahs,
  onClose,
  onNavigate,
  onDeleteNote,
}) => {
  const { t, lang } = useLanguage();
  const { isSignedIn, isLoaded } = useUser();
  const isUrdu = lang === 'ur';

  const grouped = useMemo(() => {
    const map = new Map<number, { surah: Surah; notes: Note[] }>();
    for (const note of notes) {
      if (!note.content.trim()) continue;
      const surah = surahs.find(s => s.number === note.surahNumber);
      if (!surah) continue;
      if (!map.has(note.surahNumber)) {
        map.set(note.surahNumber, { surah, notes: [] });
      }
      map.get(note.surahNumber)!.notes.push(note);
    }
    return Array.from(map.values()).sort((a, b) => a.surah.number - b.surah.number);
  }, [notes, surahs]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--grove-paper)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
              <FileText size={18} style={{ color: 'var(--grove-purple)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--grove-purple)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                {isUrdu ? 'میرے نوٹس' : 'My Notes'}
              </h2>
              <p className="text-xs opacity-50" style={{ color: 'var(--grove-purple)' }}>
                {notes.filter(n => n.content.trim()).length} {isUrdu ? 'نوٹ' : 'notes'}{' '}
                {isLoaded && (
                  <span className="inline-flex items-center gap-1">
                    · {isSignedIn
                      ? <><Cloud size={10} className="inline" /> {isUrdu ? 'محفوظ' : 'synced'}</>
                      : <><HardDrive size={10} className="inline" /> {isUrdu ? 'مقامی' : 'local only'}</>
                    }
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all hover:opacity-70"
            style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', color: 'var(--grove-purple)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
                <FileText size={28} style={{ color: 'var(--grove-purple)', opacity: 0.4 }} />
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: 'var(--grove-purple)', opacity: 0.6 }}>
                  {isUrdu ? 'ابھی کوئی نوٹ نہیں' : 'No notes yet'}
                </p>
                <p className="text-sm opacity-40" style={{ color: 'var(--grove-purple)' }}>
                  {isUrdu
                    ? 'کسی آیت پر کلک کریں اور نوٹ لکھیں'
                    : 'Open any Surah and tap the notes icon on an ayah to get started'}
                </p>
              </div>
            </div>
          ) : (
            grouped.map(({ surah, notes: surahNotes }) => (
              <div key={surah.number}>
                {/* Surah header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 12%, transparent)', color: 'var(--grove-teal)' }}>
                    {surah.number}
                  </span>
                  <span className="font-bold text-sm" style={{ color: 'var(--grove-purple)' }}>
                    {surah.englishName}
                  </span>
                  <span className="text-base" style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)', opacity: 0.7 }}>
                    {surah.name}
                  </span>
                  <span className="ml-auto text-[10px] opacity-40 font-medium" style={{ color: 'var(--grove-purple)' }}>
                    {surahNotes.length} {surahNotes.length === 1 ? 'note' : 'notes'}
                  </span>
                </div>

                {/* Notes for this surah */}
                <div className="space-y-2 pl-1">
                  {surahNotes
                    .sort((a, b) => a.ayahNumber - b.ayahNumber)
                    .map(note => (
                      <div key={note.id}
                        className="group rounded-xl border p-4 transition-all hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--grove-cream)',
                          borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)',
                        }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 15%, transparent)', color: 'var(--grove-gold)' }}>
                            {isUrdu ? `آیت ${note.ayahNumber}` : `Ayah ${note.ayahNumber}`}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onNavigate(note.surahNumber, note.ayahNumber)}
                              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-all hover:opacity-80"
                              style={{ backgroundColor: 'color-mix(in srgb, var(--grove-green) 15%, transparent)', color: 'var(--grove-green)' }}
                            >
                              <BookOpen size={11} />
                              {isUrdu ? 'جائیں' : 'Go to Ayah'}
                              <ArrowRight size={11} />
                            </button>
                            <button
                              onClick={() => onDeleteNote(note.surahNumber, note.ayahNumber)}
                              className="p-1.5 rounded-lg transition-all hover:opacity-80"
                              style={{ backgroundColor: 'color-mix(in srgb, #dc2626 10%, transparent)', color: '#dc2626' }}
                              title={isUrdu ? 'حذف کریں' : 'Delete note'}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ color: 'var(--grove-purple)', opacity: 0.85, fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                          {truncate(note.content)}
                        </p>
                        <p className="text-[10px] mt-2 opacity-35" style={{ color: 'var(--grove-purple)' }}>
                          {new Date(note.updatedAt).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — sign-in nudge if not signed in */}
        {isLoaded && !isSignedIn && notes.filter(n => n.content.trim()).length > 0 && (
          <div className="shrink-0 border-t px-6 py-4 flex items-center gap-3"
            style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)', backgroundColor: 'color-mix(in srgb, var(--grove-gold) 6%, transparent)' }}>
            <Cloud size={16} style={{ color: 'var(--grove-gold)', flexShrink: 0 }} />
            <p className="text-xs leading-snug" style={{ color: 'var(--grove-purple)', opacity: 0.75 }}>
              {isUrdu
                ? 'نوٹس صرف اس ڈیوائس پر محفوظ ہیں۔ سائن ان کریں تاکہ تمام ڈیوائسز پر دستیاب ہوں۔'
                : 'Notes are saved locally on this device. Sign in to sync them across all your devices.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
