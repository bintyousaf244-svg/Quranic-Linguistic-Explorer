export interface ArabicProgress {
  conversationsStarted: number;
  totalUserMessages: number;
  correctionsReceived: number;
  topicsCovered: string[];
  streak: number;
  lastPracticedDate: string;
  firstPracticedDate: string;
}

export interface TopicDef {
  ar: string;
  en: string;
  keywords: string[];
  color: string;
}

export const TOPICS: TopicDef[] = [
  { ar: 'السفر والرحلات', en: 'Travel', keywords: ['سفر', 'رحلة', 'رحل', 'سافر', 'مطار', 'فندق', 'بلد', 'مدينة'], color: '#4A90D9' },
  { ar: 'الطعام والطبخ', en: 'Food', keywords: ['طعام', 'أكل', 'طبخ', 'وجبة', 'مطعم', 'شرب', 'طبق', 'وصفة'], color: '#E8843A' },
  { ar: 'الأسرة والمجتمع', en: 'Family', keywords: ['أسرة', 'عائلة', 'أب', 'أم', 'أخ', 'أخت', 'زواج', 'أولاد'], color: '#8B5CF6' },
  { ar: 'الهوايات والترفيه', en: 'Hobbies', keywords: ['هواية', 'لعب', 'رياضة', 'موسيقى', 'فيلم', 'قراءة', 'رسم', 'ترفيه'], color: '#10B981' },
  { ar: 'الأخبار والسياسة', en: 'News', keywords: ['أخبار', 'سياسة', 'حكومة', 'انتخاب', 'رئيس', 'دولة', 'عالم'], color: '#EF4444' },
  { ar: 'الطقس والطبيعة', en: 'Weather', keywords: ['طقس', 'مطر', 'شمس', 'حرارة', 'برد', 'فصل', 'ربيع', 'صيف', 'خريف', 'شتاء'], color: '#06B6D4' },
  { ar: 'العمل والمهنة', en: 'Work', keywords: ['عمل', 'وظيفة', 'مهنة', 'شركة', 'مكتب', 'راتب', 'مدير', 'موظف'], color: '#F59E0B' },
  { ar: 'الدين والثقافة', en: 'Religion', keywords: ['دين', 'إسلام', 'صلاة', 'قرآن', 'ثقافة', 'تاريخ', 'تراث', 'حضارة'], color: '#582C6F' },
  { ar: 'الصحة والرياضة', en: 'Health', keywords: ['صحة', 'طب', 'رياضة', 'تمرين', 'طبيب', 'مستشفى', 'دواء', 'جسم'], color: '#EC4899' },
  { ar: 'العلم والتكنولوجيا', en: 'Science & Tech', keywords: ['علم', 'تقنية', 'حاسوب', 'إنترنت', 'ذكاء', 'اختراع', 'بحث', 'مستقبل'], color: '#3B82F6' },
];

const KEY = 'arabic_progress_v1';

const DEFAULT: ArabicProgress = {
  conversationsStarted: 0,
  totalUserMessages: 0,
  correctionsReceived: 0,
  topicsCovered: [],
  streak: 0,
  lastPracticedDate: '',
  firstPracticedDate: '',
};

export function loadProgress(): ArabicProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProgress(p: ArabicProgress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function recordConversationStart(): ArabicProgress {
  const p = loadProgress();
  const today = new Date().toISOString().slice(0, 10);

  let streak = p.streak;
  if (p.lastPracticedDate) {
    const lastDate = new Date(p.lastPracticedDate);
    const todayDate = new Date(today);
    const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  } else {
    streak = 1;
  }

  const updated: ArabicProgress = {
    ...p,
    conversationsStarted: p.conversationsStarted + 1,
    streak,
    lastPracticedDate: today,
    firstPracticedDate: p.firstPracticedDate || today,
  };
  saveProgress(updated);
  return updated;
}

export function recordUserMessage(text: string): ArabicProgress {
  const p = loadProgress();
  const lower = text;

  const newTopics = new Set(p.topicsCovered);
  for (const topic of TOPICS) {
    if (!newTopics.has(topic.ar)) {
      if (topic.keywords.some(kw => lower.includes(kw))) {
        newTopics.add(topic.ar);
      }
    }
  }

  const updated: ArabicProgress = {
    ...p,
    totalUserMessages: p.totalUserMessages + 1,
    topicsCovered: Array.from(newTopics),
  };
  saveProgress(updated);
  return updated;
}

export function recordBotMessage(text: string): ArabicProgress {
  const p = loadProgress();
  const corrections = (text.match(/✏️/g) ?? []).length;
  const updated: ArabicProgress = {
    ...p,
    correctionsReceived: p.correctionsReceived + corrections,
  };
  saveProgress(updated);
  return updated;
}

export function resetProgress(): void {
  localStorage.removeItem(KEY);
}
