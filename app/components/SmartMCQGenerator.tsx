"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Settings2, 
  Globe, 
  ListOrdered 
} from 'lucide-react';

interface SmartMCQGeneratorProps {
  theme?: 'blue' | 'emerald';
}

export default function SmartMCQGenerator({ theme = 'blue' }: SmartMCQGeneratorProps) {
  // الحقول المستوحاة من الصورة
  const [bookName, setBookName] = useState('');
  const [topics, setTopics] = useState('');
  const [questionCount, setQuestionCount] = useState('15');
  const [difficulty, setDifficulty] = useState('متوسط');
  const [language, setLanguage] = useState('العربية');
  const [isGenerating, setIsGenerating] = useState(false);

  // تحديد الألوان بناءً على دور المستخدم (طالب / دكتور)
  const isBlue = theme === 'blue';
  const colorClasses = {
    primary: isBlue ? 'text-blue-400' : 'text-emerald-400',
    borderFocus: isBlue ? 'focus:border-blue-400' : 'focus:border-emerald-400',
    bgGradient: isBlue 
      ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]' 
      : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]',
    iconBg: isBlue ? 'bg-blue-500/15 border-blue-500/30' : 'bg-emerald-500/15 border-emerald-500/30',
    glow: isBlue ? 'bg-blue-500/10' : 'bg-emerald-500/10',
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    // سيتم ربط هذا لاحقاً مع مسار الذكاء الاصطناعي الخاص بك
    setTimeout(() => {
      setIsGenerating(false);
      alert('سيتم ربط هذه الدالة قريباً بمحرك الذكاء الاصطناعي لعرض النتائج هنا!');
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 select-none" dir="rtl">
      
      {/* رأس الصفحة والهوية البصرية */}
      <div className="flex flex-col items-center justify-center mb-10 mt-4 relative">
        <div className={`absolute w-40 h-40 ${colorClasses.glow} blur-[80px] rounded-full top-0 pointer-events-none`} />
        
        <div className={`p-4 rounded-3xl border mb-4 backdrop-blur-md shadow-2xl ${colorClasses.iconBg}`}>
          <BrainCircuit className={`w-10 h-10 ${colorClasses.primary}`} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          نظام توليد الاختبارات الذكية (MCQ)
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-lg text-center leading-relaxed">
          اعتمد على الذكاء الاصطناعي لتوليد أسئلة خيارات متعددة دقيقة بناءً على المنهج أو المواضيع المحددة خلال ثوانٍ.
        </p>
      </div>

      {/* نموذج الإدخال (Form) */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleGenerate}
        className="bg-[#0B1221]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="space-y-6 relative z-10">
          
          {/* الحقل الأول: اسم الكتاب */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <BookOpen className="w-4 h-4 text-slate-400" />
              اسم الكتاب المستهدف (اختياري لنتائج أدق)
            </label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="مثال: هندسة البرمجيات، شبكات الحاسوب..."
              className={`w-full bg-[#050811]/90 border border-white/10 ${colorClasses.borderFocus} rounded-2xl py-3.5 px-4 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none transition-all duration-300`}
            />
          </div>

          {/* الحقل الثاني: أسماء الدروس */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Layers className="w-4 h-4 text-slate-400" />
              أسماء الدروس أو المواضيع
            </label>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              required
              rows={2}
              placeholder="مفصول بينها بفاصلة، مثلاً: التشفير، الشبكات العصبية، خوارزميات البحث..."
              className={`w-full bg-[#050811]/90 border border-white/10 ${colorClasses.borderFocus} rounded-2xl py-3.5 px-4 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none transition-all duration-300 resize-none`}
            />
          </div>

          {/* الحقول الثلاثة في سطر واحد (اللغة، الصعوبة، العدد) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-6 mt-6">
            
            {/* اللغة */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <Globe className="w-3.5 h-3.5" /> لغة الاختبار
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full bg-[#050811]/90 border border-white/10 ${colorClasses.borderFocus} rounded-2xl py-3 px-3 text-xs font-bold text-white appearance-none cursor-pointer focus:outline-none transition-colors`}
              >
                <option value="العربية">العربية (Arabic)</option>
                <option value="الإنجليزية">الإنجليزية (English)</option>
              </select>
            </div>

            {/* مستوى الصعوبة */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <Settings2 className="w-3.5 h-3.5" /> مستوى الصعوبة
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`w-full bg-[#050811]/90 border border-white/10 ${colorClasses.borderFocus} rounded-2xl py-3 px-3 text-xs font-bold text-white appearance-none cursor-pointer focus:outline-none transition-colors`}
              >
                <option value="سهل">سهل (مباشر)</option>
                <option value="متوسط">متوسط (استنتاجي)</option>
                <option value="صعب">صعب (تحليل متعمق)</option>
              </select>
            </div>

            {/* عدد الأسئلة */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <ListOrdered className="w-3.5 h-3.5" /> عدد الأسئلة
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className={`w-full bg-[#050811]/90 border border-white/10 ${colorClasses.borderFocus} rounded-2xl py-3 px-3 text-xs font-bold text-white appearance-none cursor-pointer focus:outline-none transition-colors`}
              >
                <option value="5">5 أسئلة</option>
                <option value="10">10 أسئلة</option>
                <option value="15">15 سؤال</option>
                <option value="20">20 سؤال</option>
                <option value="30">30 سؤال</option>
              </select>
            </div>
            
          </div>

          {/* زر التوليد السحري */}
          <button
            type="submit"
            disabled={isGenerating || !topics.trim()}
            className={`w-full mt-6 py-4 px-6 rounded-2xl text-white text-sm font-black transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${colorClasses.bgGradient}`}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
                جاري تحليل المنهج وتوليد الأسئلة...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                توليد الاختبار
              </span>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}