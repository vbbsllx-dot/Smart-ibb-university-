"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const universityDepartments = [
  {
    title: "كلية الهندسة ",
    desc: "تضم المنظومة التعليمية لأقسام الهندسة الكهربائية (حاسوب وتحكم)، هندسة تقنية المعلومات، بالإضافة إلى الفروع المدنية والمعمارية المصممة بأحدث المعايير.",
    code: "FACULTY OF ENGINEERING",
    stats: "4 أقسام علمية",
    href: "/departments/engineering",
    icon: (
      <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    )
  },
  {
    title: "كلية حوسبة وتكنولوجيا المعلومات",
    desc: "المركز السيبراني الرئيسي لأبحاث علوم الحاسوب، هندسة البرمجيات، نظم المعلومات، ومختبرات الأمن الرقمي والذكاء الاصطناعي الحديثة.",
    code: "COMPUTING & IT",
    stats: "3 أقسام علمية",
    href: "/departments/computing",
    icon: (
      <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      </svg>
    )
  },
  {
    title: "كلية الطب والعلوم الصحية",
    desc: "أقسام المختبرات الطبية، الصيدلة السريرية، والتمريض العالي المرتبطة مباشرة بوحدات المحاكاة وأنظمة الرصد الأكاديمي الحية.",
    code: "MEDICINE SCIENCES",
    stats: "5 أقسام علمية",
    href: "/departments/medicine",
    icon: (
      <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    )
  },
  {
    title: "كلية طب الأسنان",
    desc: "تتضمن العيادات التعليمية التخصصية وجراحة الفم، بالإضافة إلى معامل التعويضات السنية المربوطة رقمياً بشبكة الكلية المركزي.",
    code: "DENTISTRY FACULTY",
    stats: "قسم تخصصي موحد",
    href: "/departments/dentistry",
    icon: (
      <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/>
      </svg>
    )
  },
  {
    title: "كلية العلوم التطبيقية",
    desc: "الحاضنة العلمية لأقسام الكيمياء الصناعية، الفيزياء الحيوية، الرياضيات الحاسوبية، ومختبرات معالجة البيانات والتحليل الرقمي.",
    code: "APPLIED SCIENCES",
    stats: "4 أقسام علمية",
    href: "/departments/applied-sciences",
    icon: (
      <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l9 4.91V17.1L12 22l-9-4.9V6.91L12 2z"/>
      </svg>
    )
  },
  {
    title: "كلية التجارة والاقتصاد",
    desc: "أقسام إدارة الأعمال الدولية، نظم المعلومات الإدارية، المحاسبة القانونية، والعلوم المالية والمصرفية المحوسبة بالكامل.",
    code: "COMMERCE & ECONOMY",
    stats: "4 أقسام علمية",
    href: "/departments/commerce",
    icon: (
      <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )
  }
];

export default function DepartmentsPage() {
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
      isDarkMode ? "bg-[#040712] text-slate-200" : "bg-[#f4f7fa] text-slate-800"
    }`} dir="rtl">
      
      {/* 🌌 الإضاءة السحابية الخلفية الممتدة */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-700">
        {isDarkMode ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_60%)]" />
            <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[130px] bottom-[-5%] left-[-5%] animate-pulse" style={{ animationDuration: '9s' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04)_0%,transparent_70%)]" />
            <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-400/[0.05] blur-[110px] top-[-5%] right-[5%]" />
          </>
        )}
      </div>

      {/* 🏛️ الشريط العلوي المصقول الفخم */}
      <header className={`w-full backdrop-blur-2xl px-6 py-4 flex justify-between items-center relative z-20 select-none border rounded-2xl transition-all duration-500 ${
        isDarkMode ? "bg-[#0a101f]/80 border-slate-800/80 shadow-md" : "bg-white/80 border-slate-200/80 shadow-md"
      }`}>
        <div className="flex items-center gap-3">
          <Link href="/" className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#10b981]" />
          <h1 className="text-base font-bold tracking-wide">منظومة كليات جامعة إب الذكية</h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-500 shadow-md active:scale-95 ${
              isDarkMode ? "bg-slate-900/80 border-slate-800 text-amber-400 hover:bg-slate-800" : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50"
            }`}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4 animate-spin" style={{ animationDuration: '40s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
            ) : (
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <div className={`font-mono text-[11px] border px-3 py-1 rounded-xl ${isDarkMode ? "text-slate-300 border-slate-800/60 bg-slate-900/60" : "text-slate-600 border-slate-200 bg-white"}`}>
            {time || "00:00:00"}
          </div>
        </div>
      </header>

      {/* الهيكل التفصيلي: تقسيم ثنائي (Sidebar + Main Content) */}
      <div className="flex-grow w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-6 items-stretch relative z-10 my-6">
        
        {/* 📋 القسم الأيمن (Sidebar Index): لوحة البيانات السريعة */}
        <aside className={`w-full lg:w-[320px] border rounded-3xl p-6 backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between ${
          isDarkMode ? "bg-[#060b16]/90 border-slate-800/90 shadow-xl" : "bg-white/60 border-slate-200/80 shadow-sm"
        }`}>
          <div className="select-none">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800/40 pb-3">
              <div className={`w-1.5 h-3.5 rounded-full ${isDarkMode ? "bg-emerald-500" : "bg-indigo-500"}`} />
              <span className="text-xs font-bold tracking-wider opacity-80">الفهرس الإحصائي الموحد</span>
            </div>
            
            <p className="text-xs opacity-75 leading-relaxed font-light mb-6">
              مرحباً بك في وحدة عرض الهياكل البرمجية المعتمدة لجامعة إب، يمكنك الانتقال المباشر لكل كلية لمراجعة فروعها وأقسامها.
            </p>

            <div className="space-y-4">
              <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[10px] opacity-50 mb-0.5">إجمالي الكليات المدرجة</div>
                <div className="text-xl font-extrabold text-emerald-500">06 كليات مركزية</div>
              </div>
              <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[10px] opacity-50 mb-0.5">بروتوكول فحص الصلاحيات</div>
                <div className="text-xs font-mono text-blue-400">ACTIVE NODE OK // v2.6</div>
              </div>
            </div>
          </div>

          <Link href="/" className={`w-full py-3 px-4 mt-6 lg:mt-0 rounded-xl text-center font-bold text-xs border transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 ${
            isDarkMode ? "border-slate-800 hover:border-emerald-500/40 bg-slate-900/60 hover:text-emerald-400" : "border-slate-200 hover:border-indigo-500/40 bg-white hover:text-indigo-600 shadow-sm"
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7l-7-7 7-7"/></svg>
            <span>العودة للوحة القيادة الرئيسية</span>
          </Link>
        </aside>

        {/* 🎛 shrink القسم الأيسر (Grid Content): شبكة كروت الكليات بروابط توجيه حية */}
        <main className={`flex-grow border rounded-3xl p-6 backdrop-blur-2xl transition-all duration-500 ${
          isDarkMode ? "bg-[#060b16]/40 border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.4)]" : "bg-white/40 border-white/60 shadow-sm"
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full content-start">
            {universityDepartments.map((dept, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-5 flex flex-col justify-between border transition-all duration-500 ease-out hover:-translate-y-1 relative group ${
                  isDarkMode 
                    ? "bg-[#0e162a]/90 border-slate-800/80 shadow-md hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.06)]" 
                    : "bg-white/90 border-slate-200/80 shadow-sm hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.06)]"
                }`}
              >
                <div className="flex justify-between items-start mb-3 select-none">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-300 ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 group-hover:text-emerald-400" : "bg-slate-50 border-slate-200 text-slate-500 group-hover:text-indigo-600"
                  }`}>
                    {dept.icon}
                  </div>
                  <span className={`text-[9px] font-mono border px-2 py-0.5 rounded ${
                    isDarkMode ? "text-emerald-400/70 border-slate-800/60 bg-slate-900/50" : "text-indigo-500 border-slate-200 bg-white"
                  }`}>
                    {dept.stats}
                  </span>
                </div>

                <div className="flex-grow select-none">
                  <h3 className={`text-sm font-bold mb-1.5 transition-colors duration-300 ${
                    isDarkMode ? "text-slate-100 group-hover:text-emerald-400" : "text-slate-800 group-hover:text-indigo-600"
                  }`}>
                    {dept.title}
                  </h3>
                  <p className={`text-[11px] font-light leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}>
                    {dept.desc}
                  </p>
                </div>

                <div className={`text-[8px] font-mono tracking-widest mt-4 opacity-40 border-t pt-2 transition-colors duration-300 ${isDarkMode ? "border-slate-800/60 text-slate-500" : "border-slate-100 text-slate-400"}`}>
                  {dept.code}
                </div>

                {/* رابط التوجيه الفرعي المخصص والذكي للكرت */}
                <Link href={dept.href} className="absolute inset-0 z-20 rounded-2xl" aria-label={dept.title} />
              </div>
            ))}
          </div>
        </main>

      </div>

      {/* 📌 الفوتر الأكاديمي الموحد */}
      <footer className={`w-full py-3 text-center text-[10px] font-mono tracking-widest z-10 border rounded-2xl backdrop-blur-md select-none transition-all duration-500 ${
        isDarkMode ? "text-slate-600 border-slate-900/60 bg-[#060a12]/40" : "text-slate-400 border-slate-200/60 bg-white/40"
      }`}>
        IBB UNIVERSITY ACCREDITED PLATFORM SYSTEM NODE v2.6.0 // SECURE CENTRAL HUB
      </footer>
    </div>
  );
}