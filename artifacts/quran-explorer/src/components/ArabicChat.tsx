import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, MessageCircle, RotateCcw, Bot } from 'lucide-react';

interface ArabicChatProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const WELCOME: Message = {
  role: 'assistant',
  id: 'welcome',
  content: `مرحباً! أنا أستاذك في اللغة العربية. 🌟

يمكنني مساعدتك في ممارسة اللغة العربية المحادثة. إليك ما يمكنني فعله:

• نتحدث عن أي موضوع تختاره
• أُصحح أخطاءك بلطف
• أقترح عليك مواضيع للمحادثة

هل تريد أن أقترح لك مواضيع للمحادثة؟ أم لديك موضوع في ذهنك؟

(Hello! I'm your Arabic tutor. I can practice conversation with you, correct your mistakes gently, and suggest topics. What would you like to do?)`,
};

function parseContent(text: string) {
  const parts: { type: 'correction' | 'text'; content: string }[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('✏️')) {
      parts.push({ type: 'correction', content: line.replace('✏️', '').trim() });
    } else {
      parts.push({ type: 'text', content: line });
    }
  }
  return parts;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isBot = msg.role === 'assistant';
  const parts = parseContent(msg.content);

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 text-white text-sm shadow"
          style={{ backgroundColor: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
          أ
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isBot ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={{
          backgroundColor: isBot
            ? 'var(--grove-paper)'
            : 'var(--grove-purple)',
          color: isBot ? 'var(--grove-purple)' : 'white',
          border: isBot ? '1px solid color-mix(in srgb, var(--grove-purple) 10%, transparent)' : 'none',
        }}
      >
        {parts.map((part, i) => {
          if (part.type === 'correction') {
            return (
              <div key={i} className="my-1.5 px-3 py-2 rounded-xl text-xs"
                style={{ backgroundColor: 'color-mix(in srgb, var(--grove-gold) 12%, transparent)', color: 'var(--grove-gold)', borderLeft: '3px solid var(--grove-gold)' }}>
                ✏️ {part.content}
              </div>
            );
          }
          if (!part.content.trim()) return <br key={i} />;
          return (
            <p key={i} dir="auto" style={{ marginBottom: i < parts.length - 1 ? '4px' : 0 }}>
              {part.content}
            </p>
          );
        })}
      </div>
      {!isBot && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold shadow"
          style={{ backgroundColor: 'var(--grove-teal)' }}>
          أنت
        </div>
      )}
    </div>
  );
}

export const ArabicChat: React.FC<ArabicChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = { role: 'user', content, id: Date.now().toString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE}/api/arabic-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      const botMsg: Message = {
        role: 'assistant',
        content: data.reply,
        id: Date.now().toString() + '_bot',
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.\n(Sorry, something went wrong. Please try again.)',
        id: Date.now().toString() + '_err',
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([WELCOME]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const QUICK_STARTERS = [
    { ar: 'اقترح مواضيع', en: 'Suggest topics' },
    { ar: 'كيف حالك؟', en: 'How are you?' },
    { ar: 'تحدث معي عن السفر', en: 'Talk about travel' },
    { ar: 'صحح لغتي', en: 'Correct my Arabic' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border"
        style={{
          backgroundColor: 'var(--grove-cream)',
          borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)',
          height: 'min(680px, 90vh)',
        }}>

        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg text-lg"
              style={{ backgroundColor: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
              أ
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--grove-purple)' }}>أستاذ · Arabic Tutor</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs opacity-55" style={{ color: 'var(--grove-purple)' }}>AI-powered conversation practice</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} title="Reset conversation"
              className="p-2 rounded-full transition-all hover:opacity-70"
              style={{ color: 'var(--grove-purple)' }}>
              <RotateCcw size={17} />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-full transition-all hover:opacity-70"
              style={{ color: 'var(--grove-purple)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm shadow"
                style={{ backgroundColor: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>
                أ
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm border shadow-sm"
                style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 10%, transparent)' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--grove-purple)', opacity: 0.5 }} />
                <span className="text-xs opacity-40" style={{ color: 'var(--grove-purple)', fontFamily: '"Amiri", serif' }}>يكتب...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick starters — only show at start */}
        {messages.length === 1 && (
          <div className="px-5 pb-3 flex gap-2 flex-wrap shrink-0">
            {QUICK_STARTERS.map(s => (
              <button key={s.ar} onClick={() => sendMessage(s.ar)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:opacity-80"
                style={{
                  backgroundColor: 'var(--grove-paper)',
                  color: 'var(--grove-purple)',
                  borderColor: 'color-mix(in srgb, var(--grove-purple) 15%, transparent)',
                }}>
                <span dir="rtl" style={{ fontFamily: '"Amiri", serif' }}>{s.ar}</span>
                <span className="opacity-50 ms-1">· {s.en}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 shrink-0 border-t"
          style={{ backgroundColor: 'var(--grove-paper)', borderColor: 'color-mix(in srgb, var(--grove-purple) 8%, transparent)' }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب بالعربية أو بالإنجليزية... (Press Enter to send)"
              rows={2}
              dir="auto"
              className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--grove-cream)',
                color: 'var(--grove-purple)',
                border: '1px solid color-mix(in srgb, var(--grove-purple) 12%, transparent)',
                fontFamily: '"Amiri", serif',
                fontSize: '1rem',
                lineHeight: '1.5',
              }}
              autoFocus
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-40 shadow-md shrink-0"
              style={{ backgroundColor: 'var(--grove-purple)' }}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] opacity-30 mt-1.5 text-center" style={{ color: 'var(--grove-purple)' }}>
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
};
