"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// مصفوفة الأقسام الهندسية التخصصية في جامعة إب
const engineeringBranches = [
  {
    name: "قسم هندسة الحاسوب والتحكم الذكي",
    code: "DEPT-COMP-ENG",
    desc: "يركز على الأنظمة المدمجة، إنترنت الأشياء (IoT)، تصميم المعالجات، وأنظمة التحكم البرمجية المشفرة والمؤتمتة صناعياً.",
    labs: "معمل المعالجات الدقيقة، معمل التحكم الآلي، مختبر الشبكات الرقمية",
    color: "from-emerald-500/20 to-teal-500/5"
  },
  {
    name: "قسم هندسة تقنية المعلومات (IT)",
    desc: "يعنى ببناء وتطوير البرمجيات واسعة النطاق، الشبكات المؤسسية، الأمن السيبراني، ومحركات الذكاء الاصطناعي كأنظمة RAG.",
    labs: "مختبر البرمجيات المتقدمة، معمل الحوسبة السحابية، وحدة النظم الذكية",
    color: "from-blue-500/20 to-cyan-500/5"
  },
  {
    name: "قسم الهندسة المدنية",
    desc: "دراسة وتصميم البنى التحتية، المنشآت الخرسانية، هندسة الطرق والجسور باستخدام أحدث برمجيات التحليل الإنشائي ثلاثي الأبعاد.",
    labs: "معمل ميكانيكا التربة، مختبر البيئة والمياه، ورشة الخرسانة والمواد",
    color: "from-amber-500/20 to-orange-500/5"
  },
  {
    name: "قسم الهندسة المعمارية",
    desc: "التخطيط الحضري المستدام، التصميم البيئي، وإخراج المجسمات الهندسية الذكية باستخدام تقنيات نمذجة معلومات البناء (BIM).",
    labs: "مرسم التصميم المعماري الرقمي، معمل الإخراج البصري، صالة مجسمات الطين",
    color: "from-purple-500/20 to-indigo-500/5"
  }
];

export default function EngineeringPage() {
  const [time, setTime] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col justify-between transition-colors duration-700 font-sans p-4 md:p-6 ${
      isDarkMode ? "bg-[#02050f] text-slate-200" : "bg-[#f5f8fa] text-slate-800"
    }`} dir="rtl">
      
      {/* 📐 خلفية شبكة الرسم الهندسي التقنية المعززة (Technical Blueprint Grid) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-opacity duration-500"
           style={{
             backgroundImage: isDarkMode 
               ? 'linear-gradient(to right, rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,0.04) 1px, transparent 1px)'
               : 'linear-gradient(to right, rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.04) 1px, transparent 1px)',
             backgroundSize: '24px 24px'
           }} 
      />

      {/* 🌌 الوميض الجانبي الزمردي العائم */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/[0.02] blur-[120px] top-[-10%] right-[-10%] z-0" />

      {/* 🏛️ شريط التحكم العلوي المصقول الفاخر */}
      <header className={`w-full backdrop-blur-2xl px-6 py-4 flex justify-between items-center relative z-20 select-none border rounded-2xl transition-all duration-500 ${
        isDarkMode ? "bg-[#080d1a]/90 border-slate-800/80 shadow-md" : "bg-white/80 border-slate-200/80 shadow-md"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 rotate-45 animate-pulse shadow-[0_0_10px_#10b981]" />
          <h1 className="text-sm md:text-base font-extrabold tracking-wide">
            بوابة كلية الهندسة  // جامعة إب
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-500 shadow-sm active:scale-95 ${
              isDarkMode ? "bg-slate-900/80 border-slate-800 text-amber-400 hover:bg-slate-800" : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50"
            }`}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
            ) : (
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <div className={`font-mono text-[11px] border px-3 py-1 rounded-xl ${isDarkMode ? "text-slate-300 border-slate-800/60 bg-slate-900/60" : "text-slate-600 border-slate-200 bg-white"}`}>
            {time || "00:00:00"}
          </div>
        </div>
      </header>

      {/* 🛠️ المحتوى الهيكلي الرئيسي الموزع عرضياً ببطاقات عملاقة */}
      <main className="flex-grow w-full max-w-[1300px] mx-auto flex flex-col justify-center gap-5 relative z-10 my-6">
        
        {/* الحقل الترحيبي المصغر للأقسام الهندسية */}
        <div className="text-right px-2 select-none flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono border px-2 py-0.5 rounded border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.03]">FACULTY NODE</span>
            <h2 className="text-sm font-bold opacity-80">الأقسام العلمية والمختبرات المعتمدة</h2>
          </div>
          {/* زر تراجع سريع وذكي يرجع لصفحة الكليات السابقة */}
          <Link href="/departments" className={`text-[10px] font-bold border px-3 py-1 rounded-xl transition-all duration-300 ${
            isDarkMode ? "border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 bg-slate-900/50" : "border-slate-200 hover:border-indigo-500/40 text-slate-500 hover:text-indigo-600 bg-white"
          }`}>
            ← دليل الكليات
          </Link>
        </div>

        {/* شبكة الأقسام الهندسية ممتدة عرضياً بفخامة هندسية فريدة */}
        <div className="flex flex-col gap-4 w-full">
          {engineeringBranches.map((branch, idx) => (
            <div
              key={idx}
              className={`w-full border rounded-2xl p-5 md:p-6 backdrop-blur-xl relative transition-all duration-500 group flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                isDarkMode 
                  ? "bg-[#060a14]/90 border-slate-800/80 shadow-md hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.04)]" 
                  : "bg-white/90 border-slate-200 shadow-sm hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.04)]"
              }`}
            >
              {/* تأثير التوهج اللوني الخلفي الداخلي المتدرج ببطء داخل الكرت عند مرور الماوس */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-l ${branch.color} pointer-events-none`} />

              {/* الجزء الأيمن: العنوان، الرمز، والوصف الدقيق لقسم الهندسة */}
              <div className="flex-grow select-none relative z-10 max-w-3xl">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                    isDarkMode ? "bg-slate-900/80 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>
                    {branch.code}
                  </span>
                  <h3 className={`text-base font-extrabold transition-colors duration-300 ${
                    isDarkMode ? "text-slate-100 group-hover:text-emerald-400" : "text-slate-900 group-hover:text-indigo-600"
                  }`}>
                    {branch.name}
                  </h3>
                </div>
                <p className={`text-xs md:text-sm font-light leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? "text-slate-400 group-hover:text-slate-300" : "text-slate-600 group-hover:text-slate-700"
                }`}>
                  {branch.desc}
                </p>
              </div>

              {/* الجزء الأيسر: المختبرات والورش المصاحبة للقسم بشكل تكنولوجي متناسق */}
              <div className={`w-full md:w-[320px] p-3.5 rounded-xl border relative z-10 select-none transition-all duration-500 ${
                isDarkMode ? "bg-slate-900/40 border-slate-800/60 group-hover:border-emerald-500/20" : "bg-slate-50 border-slate-100 group-hover:border-indigo-500/20"
              }`}>
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-40 mb-1">المعامل والورش التخصصية:</div>
                <div className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? "text-slate-300 group-hover:text-emerald-300/90" : "text-slate-700 group-hover:text-indigo-900"}`}>
                  {branch.labs}
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>

      {/* 📌 الفوتر الرقمي الموحد للمنصة الأكاديمية */}
      <footer className={`w-full py-3.5 text-center text-[10px] font-mono tracking-widest z-10 border rounded-2xl backdrop-blur-md select-none transition-all duration-500 ${
        isDarkMode ? "text-slate-600 border-slate-800/50 bg-[#060a12]/50" : "text-slate-400 border-slate-200/60 bg-white/50"
      }`}>
        IBB UNIVERSITY ACCREDITED PLATFORM SYSTEM NODE v2.6.0 // SECURE CENTRAL HUB
      </footer>
    </div>
  );
}