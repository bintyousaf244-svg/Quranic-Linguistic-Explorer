import { Bookmark } from '../types';

const BOOKMARKS_KEY = 'quran_bookmarks_v1';

function load(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(bookmarks: Bookmark[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function getAllBookmarks(): Bookmark[] {
  return load();
}

export function isBookmarked(surahNumber: number, ayahNumber: number): boolean {
  return load().some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
}

export function addBookmark(surahNumber: number, ayahNumber: number, surahName: string, surahNameAr: string): Bookmark {
  const bookmarks = load().filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
  const bm: Bookmark = {
    id: `${surahNumber}_${ayahNumber}`,
    surahNumber,
    ayahNumber,
    surahName,
    surahNameAr,
    createdAt: new Date().toISOString(),
  };
  bookmarks.unshift(bm);
  persist(bookmarks);
  return bm;
}

export function removeBookmark(surahNumber: number, ayahNumber: number): void {
  persist(load().filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)));
}

export function replaceAllBookmarks(bookmarks: Bookmark[]): void {
  persist(bookmarks);
}
