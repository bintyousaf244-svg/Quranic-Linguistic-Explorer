export type ReciterId =
  | 'Abdul_Basit_Murattal_64kbps'
  | 'Alafasy_64kbps'
  | 'Husary_64kbps'
  | 'Sudais_192kbps';

export interface ReciterMeta {
  nameEn: string;
  nameAr: string;
}

export const RECITERS: Record<ReciterId, ReciterMeta> = {
  Abdul_Basit_Murattal_64kbps: { nameEn: 'Abdul Basit (Murattal)', nameAr: 'عبد الباسط (مرتل)' },
  Alafasy_64kbps: { nameEn: 'Mishary Alafasy', nameAr: 'مشاری العفاسی' },
  Husary_64kbps: { nameEn: 'Mahmoud Husary', nameAr: 'محمود خلیل الحصری' },
  Sudais_192kbps: { nameEn: 'Abdul Rahman Al-Sudais', nameAr: 'عبد الرحمن السدیس' },
};

export const DEFAULT_RECITER: ReciterId = 'Alafasy_64kbps';

const RECITER_PATH: Record<ReciterId, string> = {
  Abdul_Basit_Murattal_64kbps: 'Abdul_Basit_Murattal_64kbps',
  Alafasy_64kbps: 'Alafasy_64kbps',
  Husary_64kbps: 'Husary_64kbps',
  Sudais_192kbps: 'Abdurrahmaan_As-Sudais_192kbps',
};

export function getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciter: ReciterId): string {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${RECITER_PATH[reciter]}/${s}${a}.mp3`;
}

let _currentAudio: HTMLAudioElement | null = null;
let _currentStopCb: (() => void) | null = null;

export function playAyahAudio(url: string, onEnded: () => void): void {
  stopAyahAudio();
  const audio = new Audio(url);
  _currentAudio = audio;
  _currentStopCb = onEnded;
  audio.play().catch(() => onEnded());
  audio.onended = () => {
    _currentAudio = null;
    _currentStopCb = null;
    onEnded();
  };
}

export function stopAyahAudio(): void {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentStopCb?.();
    _currentAudio = null;
    _currentStopCb = null;
  }
}
