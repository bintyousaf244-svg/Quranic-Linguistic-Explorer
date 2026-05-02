import { Note } from '../types';

const NOTES_KEY = 'quran_notes';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getAllNotes(): Note[] {
  return loadNotes();
}

export function deleteNote(surahNumber: number, ayahNumber: number): void {
  const notes = loadNotes().filter(
    n => !(n.surahNumber === surahNumber && n.ayahNumber === ayahNumber)
  );
  saveNotes(notes);
}

export function saveNote(surahNumber: number, ayahNumber: number, content: string): Note {
  const notes = loadNotes();
  const existing = notes.find(n => n.surahNumber === surahNumber && n.ayahNumber === ayahNumber);

  if (existing) {
    existing.content = content;
    existing.updatedAt = new Date().toISOString();
    saveNotes(notes);
    return existing;
  } else {
    const newNote: Note = {
      id: `${surahNumber}_${ayahNumber}`,
      surahNumber,
      ayahNumber,
      content,
      updatedAt: new Date().toISOString()
    };
    notes.push(newNote);
    saveNotes(notes);
    return newNote;
  }
}
