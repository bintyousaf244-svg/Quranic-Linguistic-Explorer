import React from 'react';
import { X, Flame, MessageSquare, BookOpen, Pencil, Trophy, Calendar } from 'lucide-react';
import { ArabicProgress, TOPICS, resetProgress } from '../lib/arabicProgress';

interface ArabicProgressPanelProps {
  progress: ArabicProgress;
  onClose: () => void;
  onReset: () => void;
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-2xl border text-center"
      style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
      <div className="opacity-60 mb-0.5" style={{ color: 'var(--grove-purple)' }}>{icon}</div>
      <div className="text-2xl font-black" style={{ color: 'var(--grove-purple)' }}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 leading-tight"
        style={{ color: 'var(--grove-purple)' }}>{label}</div>
    </div>
  );
}

function TopicRing({ covered, total }: { covered: number; total: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : covered / total;
  const dash = pct * circ;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8"
          stroke="color-mix(in srgb, var(--grove-purple) 8%, transparent)" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8"
          stroke="var(--grove-gold)"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black" style={{ color: 'var(--grove-purple)' }}>{covered}</span>
        <span className="text-[9px] font-bold opacity-50 uppercase tracking-wide" style={{ color: 'var(--grove-purple)' }}>of {total}</span>
      </div>
    </div>
  );
}

export const ArabicProgressPanel: React.FC<ArabicProgressPanelProps> = ({ progress, onClose, onReset }) => {
  const coveredSet = new Set(progress.topicsCovered);
  const coveredCount = coveredSet.size;

  const hasStarted = progress.conversationsStarted > 0;

  const sinceText = progress.firstPracticedDate
    ? (() => {
        const days = Math.floor((Date.now() - new Date(progress.firstPracticedDate).getTime()) / 86400000);
        if (days === 0) return 'Started today';
        if (days === 1) return 'Started yesterday';
        return `${days} days of learning`;
      })()
    : 'Not started yet';

  const levelLabel = (() => {
    const m = progress.totalUserMessages;
    if (m === 0) return 'Beginner';
    if (m < 20) return 'Novice';
    if (m < 60) return 'Intermediate';
    if (m < 150) return 'Advanced';
    return 'Fluent';
  })();

  const levelAr = (() => {
    const m = progress.totalUserMessages;
    if (m === 0) return 'مبتدئ';
    if (m < 20) return 'مبتدئ متقدم';
    if (m < 60) return 'متوسط';
    if (m < 150) return 'متقدم';
    return 'متمكن';
  })();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border"
        style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between"
          style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div>
            <h2 className="text-lg font-black" style={{ color: 'var(--grove-purple)' }}>Learning Progress</h2>
            <p className="text-xs opacity-50 mt-0.5" style={{ color: 'var(--grove-purple)' }}>{sinceText}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:opacity-70" style={{ color: 'var(--grove-purple)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">

          {/* Empty state */}
          {!hasStarted && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📚</div>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--grove-purple)' }}>No sessions yet</p>
              <p className="text-sm opacity-50" style={{ color: 'var(--grove-purple)' }}>
                Start a conversation in Arabic to begin tracking your progress.
              </p>
            </div>
          )}

          {hasStarted && (
            <>
              {/* Level badge */}
              <div className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 8%, transparent)' }}>
                <Trophy size={28} style={{ color: 'var(--grove-gold)' }} />
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--grove-gold)' }}>Current Level</div>
                  <div className="font-black text-lg leading-tight" style={{ color: 'var(--grove-purple)' }}>
                    {levelLabel} <span dir="rtl" style={{ fontFamily: '"Amiri", serif' }}>· {levelAr}</span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<MessageSquare size={18} />}
                  value={progress.conversationsStarted}
                  label="Sessions"
                />
                <StatCard
                  icon={<Flame size={18} />}
                  value={`${progress.streak} day${progress.streak !== 1 ? 's' : ''}`}
                  label="Streak"
                />
                <StatCard
                  icon={<BookOpen size={18} />}
                  value={progress.totalUserMessages}
                  label="Messages Sent"
                />
                <StatCard
                  icon={<Pencil size={18} />}
                  value={progress.correctionsReceived}
                  label="Corrections"
                />
              </div>

              {/* Topics section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-black text-sm" style={{ color: 'var(--grove-purple)' }}>Topics Practiced</h3>
                    <p className="text-[10px] opacity-50" style={{ color: 'var(--grove-purple)' }}>
                      Topics are detected automatically as you practice
                    </p>
                  </div>
                  <TopicRing covered={coveredCount} total={TOPICS.length} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(topic => {
                    const done = coveredSet.has(topic.ar);
                    return (
                      <div
                        key={topic.ar}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          backgroundColor: done
                            ? `color-mix(in srgb, ${topic.color} 12%, transparent)`
                            : 'color-mix(in srgb, var(--grove-purple) 5%, transparent)',
                          color: done ? topic.color : 'color-mix(in srgb, var(--grove-purple) 35%, transparent)',
                          border: `1px solid ${done ? `color-mix(in srgb, ${topic.color} 25%, transparent)` : 'color-mix(in srgb, var(--grove-purple) 8%, transparent)'}`,
                        }}
                      >
                        {done && <span>✓</span>}
                        <span dir="rtl" style={{ fontFamily: '"Amiri", serif', fontSize: '0.9em' }}>{topic.ar}</span>
                        <span className="opacity-60">· {topic.en}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Encouragement */}
              <div className="p-4 rounded-2xl text-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-purple) 4%, transparent)' }}>
                <p dir="rtl" className="text-base font-bold mb-1"
                  style={{ fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
                  {coveredCount === 0 && 'ابدأ محادثتك الأولى اليوم!'}
                  {coveredCount >= 1 && coveredCount < 4 && 'أحسنت! استمر في التمرين.'}
                  {coveredCount >= 4 && coveredCount < 7 && 'ممتاز! لغتك تتحسن يوماً بعد يوم.'}
                  {coveredCount >= 7 && coveredCount < 10 && 'بارك الله فيك! أنت على الطريق الصحيح.'}
                  {coveredCount === 10 && 'أتقنتَ جميع المواضيع! أنت متميز في العربية الفصحى.'}
                </p>
                <p className="text-xs opacity-50" style={{ color: 'var(--grove-purple)' }}>
                  {10 - coveredCount > 0 ? `${10 - coveredCount} topic${10 - coveredCount !== 1 ? 's' : ''} left to explore` : 'All topics covered!'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <p className="text-[10px] opacity-40" style={{ color: 'var(--grove-purple)' }}>
            Progress saved locally on this device
          </p>
          <button
            onClick={() => {
              if (confirm('Reset all progress? This cannot be undone.')) {
                resetProgress();
                onReset();
              }
            }}
            className="text-xs opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--grove-purple)' }}
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  );
};
