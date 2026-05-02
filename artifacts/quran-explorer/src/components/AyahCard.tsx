import React, { useState, useEffect } from 'react';
import { Ayah, Note } from '../types';
import { BookOpen, FileText, MessageSquare, Save, Loader2, X, Copy, Check, Languages, BookMarked } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamAnalysis, fetchAuthenticGrammar } from '../services/analysisService';
import { AnalysisCache } from '../services/cacheService';
import { useLanguage } from '../context/useLanguage';
import { TafseerEdition, TAFSEER_META } from '../services/tafseerService';

interface AyahCardProps {
  ayah: Ayah;
  surahName: string;
  surahNumber: number;
  note?: Note;
  onSaveNote: (content: string) => void;
  fontSize: number;
  highlighted?: boolean;
  tafseerText?: string;
  tafseerEdition?: TafseerEdition;
}

export const AyahCard: React.FC<AyahCardProps> = ({ ayah, surahName, surahNumber, note, onSaveNote, fontSize, highlighted, tafseerText, tafseerEdition }) => {
  const { lang, t } = useLanguage();

  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [activeTranslation, setActiveTranslation] = useState<'en' | 'ur' | 'ar' | 'none'>(lang === 'ur' ? 'ur' : 'en');
  const [grammarAnalysis, setGrammarAnalysis] = useState('');
  const [grammarSourceLabel, setGrammarSourceLabel] = useState('');
  const [grammarIsAuthentic, setGrammarIsAuthentic] = useState(false);
  const [morphologyAnalysis, setMorphologyAnalysis] = useState('');
  const [dictionaryAnalysis, setDictionaryAnalysis] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [noteContent, setNoteContent] = useState(note?.content || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    setActiveTranslation(lang === 'ur' ? 'ur' : 'en');
  }, [lang]);

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
      if (type === 'grammar') {
        const meta = AnalysisCache.getMeta(type, surahName, ayah.numberInSurah);
        setGrammarAnalysis(cached);
        setGrammarSourceLabel(meta?.sourceLabel ?? '');
        setGrammarIsAuthentic(meta?.authentic ?? false);
      } else if (type === 'morphology') setMorphologyAnalysis(cached);
      else setDictionaryAnalysis(cached);
      return;
    }

    setLoadingStates(prev => ({ ...prev, [type]: true }));
    try {
      if (type === 'grammar') {
        const authentic = await fetchAuthenticGrammar(surahNumber, ayah.numberInSurah);
        if (authentic) {
          setGrammarAnalysis(authentic.data);
          setGrammarSourceLabel(authentic.sourceLabel);
          setGrammarIsAuthentic(true);
          AnalysisCache.set(type, surahName, ayah.numberInSurah, authentic.data, {
            sourceLabel: authentic.sourceLabel,
            authentic: true,
          });
          return;
        }
      }

      let fullText = '';
      await streamAnalysis(type, { ayahText: ayah.text, surahName, ayahNumber: ayah.numberInSurah }, (text) => {
        fullText = text;
        if (type === 'grammar') {
          setGrammarAnalysis(text);
          setGrammarSourceLabel('');
          setGrammarIsAuthentic(false);
        } else if (type === 'morphology') setMorphologyAnalysis(text);
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
  const isUrdu = lang === 'ur';

  const TabBtn = ({ id, label, icon: Icon, color }: { id: string; label: string; icon: any; color: string }) => (
    <button
      onClick={() => id === 'notes' ? toggleTab('notes') : handleFetchAnalysis(id as any)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
      style={{
        backgroundColor: activeTabs.includes(id)
          ? color
          : `color-mix(in srgb, ${color} 12%, transparent)`,
        color: activeTabs.includes(id) ? 'white' : color,
        fontFamily: isUrdu ? '"Amiri", serif' : undefined,
        fontSize: isUrdu ? '13px' : undefined,
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );

  const Panel = ({ id, title, content, color, note: noteText, rtl }: {
    id: string; title: string; content: string; color: string; note?: string; rtl?: boolean
  }) => {
    const isGrammar = id === 'grammar';
    const footerNote = isGrammar
      ? grammarIsAuthentic
        ? grammarSourceLabel
        : "AI analysis based on الإعراب الميسر methodology — verify with classical references."
      : noteText;

    return (
      <div className="p-8 md:p-10 border-b" style={{ backgroundColor: `color-mix(in srgb, ${color} 6%, transparent)`, borderColor: `color-mix(in srgb, var(--grove-purple) 5%, transparent)` }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color }}>{title}</h4>
            {isGrammar && grammarIsAuthentic && content && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, var(--grove-green) 15%, transparent)`, color: 'var(--grove-green)' }}>
                {t('authenticSrc')}
              </span>
            )}
          </div>
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
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color, fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
              {isGrammar ? t('loadingIrab') : t('loadingAI')}
            </p>
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
            {footerNote && (
              <div className="mt-8 pt-4 border-t text-[10px] italic opacity-40 flex items-center gap-1.5"
                style={{ borderColor: `color-mix(in srgb, ${color} 15%, transparent)`, color, direction: 'rtl', textAlign: 'right', fontFamily: '"Amiri", serif' }}>
                {isGrammar && grammarIsAuthentic && <span style={{ opacity: 0.7 }}>📚</span>}
                {footerNote}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-[2rem] overflow-hidden mb-8 transition-all border"
      style={{
        backgroundColor: 'var(--grove-paper)',
        borderColor: highlighted
          ? 'var(--grove-gold)'
          : 'color-mix(in srgb, var(--grove-purple) 6%, transparent)',
        boxShadow: highlighted
          ? '0 0 0 3px color-mix(in srgb, var(--grove-gold) 25%, transparent)'
          : undefined,
      }}>
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
            {tafseerText && (
              <TabBtn id="tafseer" label={t('tabTafseer')} icon={BookMarked} color="var(--grove-teal)" />
            )}
            <TabBtn id="dictionary" label={t('tabDict')} icon={Languages} color="var(--grove-teal)" />
            <TabBtn id="grammar" label={t('tabIrab')} icon={BookOpen} color="var(--grove-purple)" />
            <TabBtn id="morphology" label={t('tabMorph')} icon={FileText} color="var(--grove-gold)" />
            <TabBtn id="notes" label={t('tabNotes')} icon={MessageSquare} color="var(--grove-pink)" />
          </div>
        </div>

        <div className="text-right mb-10" dir="rtl">
          <p className="leading-loose font-arabic" style={{ fontSize: `${fontSize}px`, fontFamily: '"Amiri", serif', color: 'var(--grove-purple)' }}>
            {ayah.text}
          </p>
        </div>

        <div className="border-t pt-8" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {(['en', 'ur', 'ar', 'none'] as const).map((tLang) => (
              <button
                key={tLang}
                onClick={() => setActiveTranslation(tLang)}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: activeTranslation === tLang
                    ? (tLang === 'none' ? 'var(--grove-pink)' : 'var(--grove-purple)')
                    : 'transparent',
                  color: activeTranslation === tLang ? 'white' : `color-mix(in srgb, var(--grove-purple) 50%, transparent)`,
                  fontFamily: tLang === 'ur' || tLang === 'ar' || isUrdu ? '"Amiri", serif' : undefined,
                  fontSize: isUrdu ? '13px' : undefined,
                }}
              >
                {tLang === 'en' ? t('transEn') : tLang === 'ur' ? t('transUr') : tLang === 'ar' ? t('transAr') : t('transHide')}
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
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--grove-gold)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                {activeTranslation === 'en' && t('srcSahih')}
                {activeTranslation === 'ur' && t('srcJalandhry')}
                {activeTranslation === 'ar' && t('srcJalalayn')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col border-t" style={{ borderColor: 'color-mix(in srgb, var(--grove-purple) 6%, transparent)' }}>
        {activeTabs.includes('tafseer') && tafseerText && tafseerEdition && (() => {
          const meta = TAFSEER_META[tafseerEdition];
          const isRtl = meta.rtl;
          return (
            <div className="p-8 md:p-10 border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--grove-purple) 5%, transparent)' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--grove-teal)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                    {t('tabTafseer')}
                  </h4>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--grove-teal) 15%, transparent)', color: 'var(--grove-teal)' }}>
                    {isUrdu ? meta.labelUr : meta.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopy(tafseerText, 'tafseer')} className="p-2 transition-all hover:opacity-70" style={{ color: 'var(--grove-teal)' }}>
                    {copiedType === 'tafseer' ? <Check size={18} style={{ color: 'var(--grove-green)' }} /> : <Copy size={18} />}
                  </button>
                  <button onClick={() => toggleTab('tafseer')} className="transition-all hover:opacity-70" style={{ color: 'var(--grove-teal)' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div
                className="leading-loose"
                style={{
                  fontSize: isRtl ? `${Math.max(18, analysisFontSize * 1.1)}px` : `${analysisFontSize}px`,
                  direction: isRtl ? 'rtl' : 'ltr',
                  textAlign: isRtl ? 'right' : 'left',
                  fontFamily: isRtl ? '"Amiri", serif' : undefined,
                  color: 'var(--grove-purple)',
                  opacity: 0.85,
                  lineHeight: isRtl ? 2.4 : 1.8,
                }}
              >
                {tafseerText}
              </div>
              <div className="mt-6 pt-4 border-t text-[10px] italic opacity-35 flex items-center gap-1.5"
                style={{ borderColor: 'color-mix(in srgb, var(--grove-teal) 15%, transparent)', color: 'var(--grove-teal)', direction: 'rtl', textAlign: 'right', fontFamily: '"Amiri", serif' }}>
                📚 {isUrdu ? meta.sourceUr : meta.sourceEn}
              </div>
            </div>
          );
        })()}
        {activeTabs.includes('grammar') && (
          <Panel id="grammar" title="Arabic I'rab (إعراب)" content={grammarAnalysis} color="var(--grove-purple)" rtl />
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
              <h4 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--grove-pink)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}>
                {t('tabNotes')}
              </h4>
              <button onClick={() => toggleTab('notes')} className="hover:opacity-70 transition-all" style={{ color: 'var(--grove-pink)' }}>
                <X size={20} />
              </button>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full h-40 p-6 rounded-3xl resize-none focus:outline-none focus:ring-4 transition-all"
              style={{
                backgroundColor: 'var(--grove-paper)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 10%, transparent)',
                fontSize: `${Math.max(13, fontSize * 0.45)}px`,
                direction: isUrdu ? 'rtl' : 'ltr',
                fontFamily: isUrdu ? '"Amiri", serif' : undefined,
              }}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 shadow-lg active:scale-95"
                style={{ backgroundColor: 'var(--grove-pink)', fontFamily: isUrdu ? '"Amiri", serif' : undefined }}
              >
                {isSavingNote ? <Loader2 className="animate-spin" size={16} /> : noteSaved ? <Check size={16} /> : <Save size={16} />}
                {noteSaved ? t('saved') : t('saveNote')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
