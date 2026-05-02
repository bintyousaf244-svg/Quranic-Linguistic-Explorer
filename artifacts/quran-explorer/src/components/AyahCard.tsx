import React, { useState } from 'react';
import { Ayah, Note } from '../types';
import { BookOpen, FileText, MessageSquare, Save, Loader2, X, Copy, Check, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamAnalysis } from '../services/analysisService';
import { AnalysisCache } from '../services/cacheService';

interface AyahCardProps {
  ayah: Ayah;
  surahName: string;
  note?: Note;
  onSaveNote: (content: string) => void;
  fontSize: number;
}

export const AyahCard: React.FC<AyahCardProps> = ({ ayah, surahName, note, onSaveNote, fontSize }) => {
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [activeTranslation, setActiveTranslation] = useState<'en' | 'ur' | 'ar' | 'none'>('en');
  const [grammarAnalysis, setGrammarAnalysis] = useState('');
  const [morphologyAnalysis, setMorphologyAnalysis] = useState('');
  const [dictionaryAnalysis, setDictionaryAnalysis] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [noteContent, setNoteContent] = useState(note?.content || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const toggleTab = (tab: string) => {
    setActiveTabs(prev => prev.includes(tab) ? prev.filter(t => t !== tab) : [...prev, tab]);
  };

  const handleFetchAnalysis = async (type: 'grammar' | 'morphology' | 'dictionary') => {
    const isAlreadyActive = activeTabs.includes(type);
    toggleTab(type);
    if (isAlreadyActive) return;

    const existing = type === 'grammar' ? grammarAnalysis : type === 'morphology' ? morphologyAnalysis : dictionaryAnalysis;
    if (existing) return;

    const cached = AnalysisCache.get(type, surahName, ayah.numberInSurah);
    if (cached) {
      if (type === 'grammar') setGrammarAnalysis(cached);
      else if (type === 'morphology') setMorphologyAnalysis(cached);
      else setDictionaryAnalysis(cached);
      return;
    }

    setLoadingStates(prev => ({ ...prev, [type]: true }));
    try {
      let fullText = '';
      await streamAnalysis(type, { ayahText: ayah.text, surahName, ayahNumber: ayah.numberInSurah }, (text) => {
        fullText = text;
        if (type === 'grammar') setGrammarAnalysis(text);
        else if (type === 'morphology') setMorphologyAnalysis(text);
        else setDictionaryAnalysis(text);
      });
      if (fullText) AnalysisCache.set(type, surahName, ayah.numberInSurah, fullText);
    } catch {
      const msg = 'Failed to fetch analysis. Please try again.';
      if (type === 'grammar') setGrammarAnalysis(msg);
      else if (type === 'morphology') setMorphologyAnalysis(msg);
      else setDictionaryAnalysis(msg);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSaveNote = () => {
    setIsSavingNote(true);
    onSaveNote(noteContent);
    setTimeout(() => {
      setIsSavingNote(false);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }, 300);
  };

  const analysisFontSize = Math.max(15, fontSize * 0.55);

  const TabBtn = ({ id, label, icon: Icon, color }: { id: string; label: string; icon: any; color: string }) => (
    <button
      onClick={() => id === 'notes' ? toggleTab('notes') : handleFetchAnalysis(id as any)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
      style={{
        backgroundColor: activeTabs.includes(id)
          ? color
          : `color-mix(in srgb, ${color} 12%, transparent)`,
        color: activeTabs.includes(id) ? 'white' : color
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );

  const Panel = ({ id, title, content, color, note: noteText, rtl }: { id: string; title: string; content: string; color: string; note?: string; rtl?: boolean }) => (
    <div className="p-8 md:p-10 border-b" style={{ backgroundColor: `color-mix(in srgb, ${color} 6%, transparent)`, borderColor: `color-mix(in srgb, var(--grove-purple) 5%, transparent)` }}>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color }}>{title}</h4>
        <div className="flex items-center gap-2">
          {content && (
            <button onClick={() => handleCopy(content, id)} className="p-2 transition-all hover:opacity-70" style={{ color }}>
              {copiedType === id ? <Check size={18} style={{ color: 'var(--grove-green)' }} /> : <Copy size={18} />}
            </button>
          )}
          <button onClick={() => toggleTab(id)} className="transition-all hover:opacity-70" style={{ color }}>
            <X size={20} />
          </button>
        </div>
      </div>
      {loadingStates[id] ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="animate-spin" size={24} style={{ color }} />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color }}>Analyzing with AI...</p>
        </div>
      ) : (
        <>
          <div
            className={`markdown-body prose prose-sm max-w-none${rtl ? ' markdown-rtl' : ''}`}
            style={{
              fontSize: `${analysisFontSize}px`,
              direction: rtl ? 'rtl' : 'ltr',
              textAlign: rtl ? 'right' : 'left',
              fontFamily: rtl ? '"Amiri", serif' : undefined,
            }}
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          {noteText && (
            <div className="mt-8 pt-4 border-t text-[10px] italic opacity-40"
              style={{ borderColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
              {noteText}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="rounded-[2rem] overflow-hidden mb-8 transition-all border"
      style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
      <div className="p-8 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-mono text-xs font-bold shadow-inner"
              style={{ backgroundColor: 'var(--grove-cream)', color: 'var(--grove-green)' }}>
              {ayah.numberInSurah}
            </div>
            <button onClick={() => handleCopy(ayah.text, 'ayah')} className="p-2.5 rounded-xl transition-all hover:opacity-70"
              style={{ color: 'var(--grove-purple)' }}>
              {copiedType === 'ayah' ? <Check size={18} style={{ color: 'var(--grove-green)' }} /> : <Copy size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <TabBtn id="dictionary" label="Dictionary" icon={Languages} color="var(--grove-teal)" />
            <TabBtn id="grammar" label="Grammar" icon={BookOpen} color="var(--grove-purple)" />
            <TabBtn id="morphology" label="Morphology" icon={FileText} color="var(--grove-gold)" />
            <TabBtn id="notes" label="Notes" icon={MessageSquare} color="var(--grove-pink)" />
          </div>
        </div>

        <div className="text-right mb-10" dir="rtl">
          <p className="leading-loose font-arabic" style={{ fontSize: `${fontSize}px`, fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
            {ayah.text}
          </p>
        </div>

        <div className="border-t pt-8" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {(['en', 'ur', 'ar', 'none'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTranslation(lang)}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: activeTranslation === lang
                    ? (lang === 'none' ? 'var(--grove-pink)' : 'var(--grove-purple)')
                    : 'transparent',
                  color: activeTranslation === lang ? 'white' : `color-mix(in srgb, var(--grove-purple) 50%, transparent)`
                }}
              >
                {lang === 'en' ? 'English' : lang === 'ur' ? 'Urdu' : lang === 'ar' ? 'Arabic (Tafsir)' : 'Hide'}
              </button>
            ))}
          </div>

          {activeTranslation !== 'none' && (
            <div className={activeTranslation === 'ur' || activeTranslation === 'ar' ? 'text-right' : 'text-left'}
              dir={activeTranslation === 'ur' || activeTranslation === 'ar' ? 'rtl' : 'ltr'}>
              <p className={`leading-relaxed opacity-80 ${activeTranslation === 'ur' || activeTranslation === 'ar' ? 'text-2xl font-arabic' : 'text-base font-medium'}`}
                style={{ color: 'var(--grove-purple)', fontFamily: activeTranslation !== 'en' ? '"Amiri", serif' : undefined }}>
                {activeTranslation === 'en' && ayah.translations?.en}
                {activeTranslation === 'ur' && ayah.translations?.ur}
                {activeTranslation === 'ar' && ayah.translations?.ar}
              </p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--grove-gold)' }}>
                {activeTranslation === 'en' && 'Sahih International'}
                {activeTranslation === 'ur' && 'Fateh Muhammad Jalandhry'}
                {activeTranslation === 'ar' && 'Tafsir al-Jalalayn'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col border-t" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
        {activeTabs.includes('grammar') && (
          <Panel id="grammar" title="Arabic Grammar Analysis (I'rab)" content={grammarAnalysis} color="var(--grove-purple)" rtl
            note="Analysis aligned with classical works including I'rab al-Quran by Al-Darwish and Al-Nahhas." />
        )}
        {activeTabs.includes('dictionary') && (
          <Panel id="dictionary" title="Word Dictionary" content={dictionaryAnalysis} color="var(--grove-teal)"
            note="Definitions derived from Lisan al-Arab, Mu'jam Maqayis al-Lugha, and Lane's Lexicon." />
        )}
        {activeTabs.includes('morphology') && (
          <Panel id="morphology" title="Morphological Analysis (Sarf)" content={morphologyAnalysis} color="var(--grove-gold)" rtl
            note="Morphological data follows classical Sarf methodology of Ibn Jinni and Al-Hamalawy." />
        )}
        {activeTabs.includes('notes') && (
          <div className="p-8 md:p-10" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-pink) 6%, transparent)' }}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--grove-pink)' }}>Personal Notes</h4>
              <button onClick={() => toggleTab('notes')} className="hover:opacity-70 transition-all" style={{ color: 'var(--grove-pink)' }}>
                <X size={20} />
              </button>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your reflections or notes about this ayah..."
              className="w-full h-40 p-6 rounded-3xl resize-none focus:outline-none focus:ring-4 transition-all"
              style={{
                backgroundColor: 'var(--grove-paper)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 10%, transparent)',
                fontSize: `${Math.max(13, fontSize * 0.45)}px`
              }}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 shadow-lg active:scale-95"
                style={{ backgroundColor: 'var(--grove-pink)' }}
              >
                {isSavingNote ? <Loader2 className="animate-spin" size={16} /> : noteSaved ? <Check size={16} /> : <Save size={16} />}
                {noteSaved ? 'Saved!' : 'Save Note'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
