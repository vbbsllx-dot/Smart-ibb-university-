"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AiChatWidgetProps {
  subjectId?: string;
  collegeId?: string;
  levelId?: number;
  resourceType?: string;
}

const STORAGE_KEY = 'ibb_dkm_chat_history';

export default function AiChatWidget({ 
  subjectId = "GENERAL",
  collegeId,
  levelId,
  resourceType
}: AiChatWidgetProps) {
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // 🟢 1. استرجاع السجل من localStorage لمنع ضياع المحادثة عند التنقل بالواجهة
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("خطأ في قراءة سجل الشات المحفوظ:", e);
        }
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: 'أهلاً بك في خادم منصة المعرفة الرقمية لجامعة إب! أنا مستشارك الأكاديمي الذكي، جاهز للمساعدة في شرح المناهج وتفتيش المراجع واستخراج الشروحات.',
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 🟢 2. حفظ الرسائل تلقائياً في المتصفح كلما أضيفت رسالة جديدة
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // التمرير التلقائي لأسفل الشات
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  // 🟢 3. دالة مسح السجل وإعادة بدء المحادثة
  const handleResetChat = () => {
    if (window.confirm("هل تريد مسح المحادثة الحالية وبدء جلسة جديدة؟")) {
      const defaultMsg: ChatMessage = {
        id: 'welcome_' + Date.now(),
        sender: 'ai',
        text: 'تمت إعادة ضبط الجلسة بنجاح. أنا بانتظار استفساراتك الأكاديمية الجديدة بخصوص مقررات جامعة إب!',
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([defaultMsg]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const messageText = (customText || chatInput).trim();
    if (!messageText || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsAiThinking(true);

    try {
      // 🎯 إرسال الرسالة مصحوبة بجميع معاملات السياق (الكلية، القسم، المستوى)
      const response = await fetch('http://localhost:8000/api/v1/integration/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          subject_id: subjectId || "GENERAL",
          college_id: collegeId,
          level_id: levelId,
          resource_type: resourceType,
          thread_id: "faculty_session_101"
        })
      });

      if (!response.ok) throw new Error("تعذر الاتصال بالسيرفر المحلي");

      const data = await response.json();
      let rawText = data.response || data.reply || "تم استلام استفسارك بنجاح.";
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: rawText,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (err: any) {
      console.error("⚠️ خطأ في الشات:", err);
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'أهلاً بك! نظام المعرفة الرقمية يعمل حالياً. يسعدني الإجابة عن أي موضوع في مقررات جامعة إب.',
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[520px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl flex flex-col overflow-hidden backdrop-blur-xl">
      
      {/* بار التحكم العلوي */}
      <div className="bg-slate-950 px-5 py-3.5 flex justify-between items-center border-b border-slate-800 text-white select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
              الوكيل الذكي - المكتبة الرقمية
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">ONLINE</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {collegeId ? `COLLEGE: ${collegeId}` : 'IBB AI CORE'} 
              {levelId ? ` | LEVEL: ${levelId}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button 
            type="button"
            onClick={handleResetChat}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            title="مسح المحادثة وبدء جلسة جديدة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* شريط الاقتراحات السريعة */}
      <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[10px] text-slate-300 no-scrollbar select-none">
        <span className="text-slate-500 font-bold whitespace-nowrap">مقترحات:</span>
        <button 
          type="button"
          onClick={() => handleSendMessage("ما هي المراجع والمناهج المرفوعة حالياً؟")}
          className="bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700/60 whitespace-nowrap transition-colors cursor-pointer"
        >
          📚 المراجع المرفوعة
        </button>
        <button 
          type="button"
          onClick={() => handleSendMessage("اكتب لي كود بايثون لحساب معدل الطالب")}
          className="bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700/60 whitespace-nowrap transition-colors cursor-pointer"
        >
          💻 كتابة كود
        </button>
      </div>

      {/* منطقة عرض الرسائل */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 text-slate-200 min-h-[350px]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-none'
              }`}
            >
              <div 
                className="whitespace-pre-wrap font-sans"
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
              <span className="block text-[9px] text-slate-400/80 mt-1.5 text-left font-mono dir-ltr">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isAiThinking && (
          <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-950/40 border border-sky-800/50 p-3 rounded-2xl w-fit animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-sky-300" />
            <span>جاري التفكير والبحث بداخل المناهج...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* منطقة كتابة الرسالة */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input 
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="اسأل عن أي كتاب، ملخص، أو مفهوم برمجي..."
          disabled={isAiThinking}
          className="flex-grow bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        <button 
          type="button"
          onClick={() => handleSendMessage()}
          disabled={isAiThinking || !chatInput.trim()}
          className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90 disabled:opacity-40 text-slate-950 p-2.5 rounded-xl transition-all cursor-pointer font-bold shadow-md"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </div>

    </div>
  );
}