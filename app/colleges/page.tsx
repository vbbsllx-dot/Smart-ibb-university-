"use client";

import React from 'react';
import Link from 'next/link';

export default function CollegesDirectory() {
  // بيانات دليل الكليات والأقسام لجامعة إب
  const universityColleges = [
    {
      name: "🏛️ كلية الهندسة ",
      color: "border-amber-500/30 text-amber-700 bg-amber-50/50",
      departments: ["هندسة الحاسبات والتحكم", "الهندسة المدنية", "الهندسة المعمارية", "الهندسة الكهربائية"]
    },
    {
      name: "💻 كلية الحاسبات وتقنية المعلومات",
      color: "border-blue-500/30 text-blue-700 bg-blue-50/50",
      departments: ["علوم الحاسوب", "تكنولوجيا المعلومات IT", "نظم المعلومات الحاسوبية IS"]
    },
    {
      name: "🧪 كلية العلوم التطبيقية",
      color: "border-emerald-500/30 text-emerald-700 bg-emerald-50/50",
      departments: ["الرياضيات الحاسوبية", "الفيزياء الإلكترونية", "الكيمياء الصناعية", "علوم الحياة"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans flex flex-col justify-between" dir="rtl">
      
      {/* الهيدر العلوي للدليل */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-row">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <h1 className="text-md font-bold text-[#1e3a8a]">دليل التخصصات الأكاديمية</h1>
          </div>
          <Link href="/" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-colors font-semibold">
            ← العودة للرئيسية
          </Link>
        </div>
      </header>

      {/* المحتوى التفاعلي للكليات */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-8">
        
        <div className="text-right space-y-2">
          <h2 className="text-2xl font-black text-[#1e3a8a]">كليات وأقسام جامعة إب</h2>
          <p className="text-xs text-[#64748b]">تصفح الدليل الأكاديمي الشامل لأقسام الكليات الهندسية والعلمية المتاحة في المنصة الذكية.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {universityColleges.map((college, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all text-right">
              <div className={`p-3 rounded-2xl font-bold text-xs mb-4 border ${college.color}`}>
                {college.name}
              </div>
              <ul className="space-y-3 pr-2">
                {college.departments.map((dept, dIdx) => (
                  <li key={dIdx} className="text-xs text-slate-600 flex items-center gap-2 flex-row-reverse justify-end">
                    <span>{dept}</span>
                    <span className="w-1.5 h-1.5 bg-[#059669] rounded-full shrink-0"></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </main>

      <footer className="bg-slate-100 text-slate-500 py-4 text-center text-xs border-t border-slate-200">
        <p>© 2026 دليل كليات الجامعة - جامعة إب</p>
      </footer>

    </div>
  );
}