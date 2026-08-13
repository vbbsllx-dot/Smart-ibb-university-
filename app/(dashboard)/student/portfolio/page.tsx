import React from 'react';
import Link from 'next/link';

export default function StudentPortfolio() {
  // بيانات الهوية المهنية للطالب
  const portfolioData = {
    skills: ["Next.js", "TypeScript", "Node.js", "Python", "Cyber Security", "Network Scanner Scripting"],
    certifications: [
      { title: "Google IT Support Professional Certificate", issuer: "Coursera / Google", date: "2026" }
    ],
    projects: [
      { title: "منصة إب الذكية (Ibb Smart Platform)", tech: "Next.js & Node.js & Supabase", desc: "مشروع تخرج متكامل وبوابة طالب ذكية مدعومة بتقنية الـ RAG لحوار ملفات الـ PDF الأكاديمية." },
      { title: "نظام زفات زفافي (Zafat Zifafi)", tech: "Vercel & Supabase & GitHub", desc: "تطبيق ويب متطور تم نشره وإعداده بالكامل لإدارة المحتوى الصوتي والمناسبات." }
    ]
  };

  return (
    <div className="min-h-screen p-6 md:p-12 bg-gradient-to-br from-[#0a1128] to-[#020617] text-white">
      
      {/* رأس الصفحة وزر العودة */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-imperial-gold">💼 ملف الهوية المهنية الرقمية</h1>
          <p className="text-xs text-slate-400 mt-1">المستند الرقمي الموثق للخريج وجاهزية سوق العمل</p>
        </div>
        <Link 
          href="/student" 
          className="text-xs text-cyber-cyan hover:text-cyber-blue transition-colors border border-cyber-cyan/20 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md"
        >
          ← العودة للرئيسية
        </Link>
      </header>

      {/* الهيكل الرئيسي للملف المهني بنظام Bento Grid */}
      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* بطاقة المهارات التقنية (Skills) */}
        <section className="glass-card rounded-3xl p-6 md:col-span-1 text-right">
          <h3 className="text-cyber-cyan font-bold text-base mb-4">⚡ المهارات والقدرات التقنية</h3>
          <div className="flex flex-wrap gap-2 justify-start md:justify-start">
            {portfolioData.skills.map((skill, index) => (
              <span key={index} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-slate-300">
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* بطاقة الشهادات والاعتمادات المهنية */}
        <section className="glass-card rounded-3xl p-6 md:col-span-2 text-right flex flex-col justify-between">
          <div>
            <h3 className="text-imperial-gold font-bold text-base mb-4">📜 الشهادات العالمية والاعتمادات</h3>
            <div className="space-y-4">
              {portfolioData.certifications.map((cert, index) => (
                <div key={index} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center flex-row-reverse">
                  <div className="text-right">
                    <h4 className="text-sm font-semibold text-white">{cert.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{cert.issuer} • {cert.date}</p>
                  </div>
                  <span className="text-xl">🏆</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-4 flex items-center gap-1 justify-end">
            ✓ تم التحقق من الاعتماد وربطه بملف LinkedIn بنجاح
          </p>
        </section>

        {/* بطاقة المشاريع المنجزة وعينات العمل */}
        <section className="glass-card rounded-3xl p-6 md:col-span-3 text-right">
          <h3 className="text-cyber-cyan font-bold text-base mb-4">🚀 سجل المشاريع الهندسية المنجزة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolioData.projects.map((project, index) => (
              <div key={index} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-cyber-cyan/10 text-cyber-cyan px-2.5 py-1 rounded-full font-mono">
                      {project.tech}
                    </span>
                    <h4 className="text-base font-bold text-white">{project.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">{project.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}