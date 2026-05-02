import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';

export interface WordInfo {
  root?: string;
  wazn?: string;
  type?: string;
  meaning?: string;
  ar_meaning?: string;
  transliteration?: string;
  source?: 'classical' | 'quran.com' | 'ai';
}

interface WordPopupProps {
  word: string;
  info: WordInfo | null;
  isLoading: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenDictionary: (word: string) => void;
}

export const WordPopup: React.FC<WordPopupProps> = ({
  word, info, isLoading, position, onClose, onOpenDictionary,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const left = Math.min(Math.max(position.x - 140, 8), window.innerWidth - 292);
  const isAbove = position.y > window.innerHeight * 0.55;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left,
        top: isAbove ? position.y - 12 : position.y + 28,
        transform: isAbove ? 'translateY(-100%)' : 'none',
        zIndex: 9999,
        width: '280px',
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
      }}
    >
      {!isAbove && (
        <div className="flex justify-center mb-[-1px]" style={{ paddingLeft: `${position.x - left - 6}px` }}>
          <div className="w-3 h-3 rotate-45 border-t border-l"
            style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 15%, transparent)' }} />
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 15%, transparent)' }}>

        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-3xl leading-tight" dir="rtl"
              style={{ fontFamily: 'var(--font-arabic-var)', color: 'var(--grove-purple)' }}>
              {word}
            </span>
            {info?.source === 'classical' && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full self-start"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-green) 15%, transparent)', color: 'var(--grove-green)' }}>
                Classical Source
              </span>
            )}
            {info?.source === 'quran.com' && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full self-start"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 15%, transparent)', color: 'var(--grove-teal)' }}>
                quran.com
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="p-1 rounded-full opacity-40 hover:opacity-80 transition-opacity mt-1.5 shrink-0"
            style={{ color: 'var(--grove-purple)' }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <Loader2 className="animate-spin" size={18} style={{ color: 'var(--grove-purple)' }} />
              <span className="text-xs opacity-50" style={{ color: 'var(--grove-purple)' }}>Looking up…</span>
            </div>
          ) : info && (info.root || info.meaning || info.transliteration) ? (
            <div className="space-y-2">
              {info.transliteration && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-40 w-10 shrink-0"
                    style={{ color: 'var(--grove-purple)' }}>Latin</span>
                  <span className="text-sm italic opacity-60" style={{ color: 'var(--grove-purple)' }}>{info.transliteration}</span>
                </div>
              )}
              {info.root && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-40 w-10 shrink-0"
                    style={{ color: 'var(--grove-purple)' }}>Root</span>
                  <span className="text-base font-bold tracking-widest" dir="rtl"
                    style={{ fontFamily: 'var(--font-arabic-var)', color: 'var(--grove-green)' }}>{info.root}</span>
                </div>
              )}
              {info.wazn && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-40 w-10 shrink-0"
                    style={{ color: 'var(--grove-purple)' }}>Wazn</span>
                  <span className="text-sm" dir="rtl"
                    style={{ fontFamily: 'var(--font-arabic-var)', color: 'var(--grove-purple)' }}>{info.wazn}</span>
                </div>
              )}
              {info.type && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-40 w-10 shrink-0"
                    style={{ color: 'var(--grove-purple)' }}>Type</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 15%, transparent)', color: 'var(--grove-gold)' }}>
                    {info.type}
                  </span>
                </div>
              )}
              {info.meaning && (
                <div className="pt-2 border-t"
                  style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--grove-purple)', opacity: 0.85 }}>
                    {info.meaning}
                  </p>
                </div>
              )}
              {info.ar_meaning && (
                <p className="text-[11px] leading-relaxed text-right opacity-50" dir="rtl"
                  style={{ color: 'var(--grove-purple)', fontFamily: 'var(--font-arabic-var)' }}>
                  {info.ar_meaning}
                </p>
              )}
            </div>
          ) : !isLoading ? (
            <p className="text-xs opacity-40 text-center py-3" style={{ color: 'var(--grove-purple)' }}>
              No data found
            </p>
          ) : null}
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => { onOpenDictionary(word); onClose(); }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
            style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)', color: 'var(--grove-purple)' }}
          >
            <ExternalLink size={11} />
            Full Dictionary Entry
          </button>
        </div>
      </div>

      {isAbove && (
        <div className="flex justify-center mt-[-1px]" style={{ paddingLeft: `${position.x - left - 6}px` }}>
          <div className="w-3 h-3 rotate-45 border-b border-r"
            style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 15%, transparent)' }} />
        </div>
      )}
    </div>
  );
};
