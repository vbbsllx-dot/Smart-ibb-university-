"use client";

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl'; 
import AdsSlider from './components/AdsSlider';
import LanguageSwitcher from './components/LanguageSwitcher'; 
import { 
  GraduationCap, 
  Scale, 
  BarChart3, 
  ShieldCheck, 
  ArrowLeftRight, 
  BookOpen, 
  UserCheck, 
  FileText, 
  Building2, 
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 👇 إضافتك: مراجع السكرول التلقائي للأخبار
  const newsContainerRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);

  // استدعاء نصوص الترجمة
  const tHeader = useTranslations('Header');
  const tHome = useTranslations('Home');
  const tPortals = useTranslations('Portals');

  // بطاقات المنظومة مترجمة ديناميكياً
  const platformCards = [
    {
      title: tPortals('libraryTitle'),
      desc: tPortals('libraryDesc'),
      href: "/login?type=student&dest=/student/library",
      bgImage: "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400')",
      hoverGlow: "hover:shadow-[0_20px_40px_rgba(14,165,233,0.25)] hover:border-sky-500/60",
      themeColor: "from-sky-500 to-blue-600",
      icon: BookOpen
    },
    {
      title: tPortals('facultyTitle'),
      desc: tPortals('facultyDesc'),
      href: "/login?type=faculty&dest=/faculty",
      bgImage: "url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400')",
      hoverGlow: "hover:shadow-[0_20px_40px_rgba(99,102,241,0.25)] hover:border-indigo-500/60",
      themeColor: "from-indigo-500 to-purple-600",
      icon: UserCheck
    },
    {
      title: tPortals('studentsTitle'),
      desc: tPortals('studentsDesc'),
      href: "/login?type=student&dest=/student",
      bgImage: "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400')",
      hoverGlow: "hover:shadow-[0_20px_40px_rgba(59,130,246,0.25)] hover:border-blue-500/60",
      themeColor: "from-blue-500 to-indigo-600",
      icon: FileText
    },
    {
      title: tPortals('departmentsTitle'),
      desc: tPortals('departmentsDesc'),
      href: "/departments",
      bgImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400')",
      hoverGlow: "hover:shadow-[0_20px_40px_rgba(148,163,184,0.25)] hover:border-slate-400/60",
      themeColor: "from-slate-500 to-slate-700",
      icon: Building2
    }
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 250;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 👇 إضافتك: دالة تشغيل السكرول التلقائي للأخبار
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered.current && newsContainerRef.current) {
        newsContainerRef.current.scrollTop += 1;
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#E6ECEB] text-slate-800 flex flex-col justify-between p-4 md:p-6 font-sans relative overflow-hidden rtl:dir-rtl ltr:dir-ltr">
      
      {/* نظام الهالات والخلفية لجامعة إب */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[140px] -top-20 -right-20" />
        <motion.div animate={{x: [0, -40, 30, 0], y: [0, 30, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[130px] bottom-10 -left-20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8}}
          animate={{ opacity: 0.12, scale: 1, rotate: [0, 3, -3, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-contain bg-no-repeat bg-center"
          style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Nn9e9f_pX7M7pD_I2X60AInqEw8mCPlZ5A&s')" }}
        />
      </div>

      {/* الشريط العلوي الثابت مع زر تحويل اللغة وزر إنشاء الحساب */}
      <header className="w-full bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#0F5E49] text-white px-6 py-4 flex justify-between items-center relative z-10 rounded-2xl shadow-xl border border-white/10 backdrop-blur-md select-none">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#34d399]" />
          <h1 className="text-sm md:text-base font-black tracking-wide text-slate-50 flex items-center gap-2">
            {tHeader('platformName')} <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-black">{tHeader('secureCore')}</span>
          </h1>
        </div>

        {/* أزرار التحكم باللغة وإنشاء الحساب */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          <Link
            href="/login/register"
            className="group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-emerald-500/50 text-slate-200 hover:text-white transition-all duration-300 shadow-inner backdrop-blur-md select-none"
            title={tHeader('createAccount')}
          >
            <span className="text-xs font-bold tracking-wide text-emerald-300 group-hover:text-emerald-200 transition-colors">
              {tHeader('createAccount')}
            </span>
            <div className="relative w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" className="text-slate-400 group-hover:text-emerald-400 transition-colors duration-300" />
                <path d="M13 4v16" className="origin-left transform group-hover:rtl:rotate-45 group-hover:ltr:-rotate-45 group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1 transition-transform duration-300 ease-out text-emerald-400" />
                <g className="transform group-hover:rtl:-translate-x-1.5 group-hover:ltr:translate-x-1.5 transition-transform duration-300 ease-out">
                  <circle cx="5" cy="8" r="1.5" className="fill-emerald-400 stroke-none" />
                  <path d="M3 17c0-2 1.5-3.5 3.5-3.5510 15 10 17" className="text-emerald-400" />
                </g>
              </svg>
            </div>
          </Link>
        </div>
      </header>
      

      



      {/* استدعاء سلايدر إعلانات الجامعة المستقل */}
      <AdsSlider />

      {/* الجسم الرئيسي للمنصة */}
      <main className="flex-grow flex flex-col xl:flex-row items-center justify-center gap-6 max-w-[1550px] w-full mx-auto relative z-10 py-6">
        
        {/* الدرع الزجاجي الترحيبي العائم */}
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full xl:w-[380px] h-auto xl:h-[350px] bg-gradient-to-br from-white/80 via-white/50 to-white/30 border border-white rounded-3xl p-6 flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.02)] backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 select-none flex-shrink-0"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#0A2540]/5 border border-[#0A2540]/10 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-[#0F5E49]" />
            </div>
            <div className="space-y-2 rtl:text-right ltr:text-left">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {tHome('welcomeTitle')}
              </h2>
              <p className="text-xs font-bold leading-relaxed text-slate-500">
                {tHome('welcomeDesc')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-900/5 mt-4">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 shadow-sm">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-950">{tHome('academicBtn')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Scale className="w-4 h-4 text-sky-600" />
              <span className="text-[10px] font-black text-sky-950">{tHome('sovereignBtn')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-xl px-2.5 py-1.5 shadow-sm">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-950">{tHome('analyticalBtn')}</span>
            </div>
          </div>
        </motion.div>

        {/* لوحة التحكم الحاضنة للكروت */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-grow w-full border border-white bg-white/20 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_30px_70px_rgba(0,0,0,0.03)] relative group overflow-hidden"
        >
          <div className="rtl:text-right ltr:text-left mb-5 rtl:mr-1 ltr:ml-1 select-none flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 rounded-full bg-[#0F5E49]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{tHome('portalsHeader')}</span>
            </div>
            <div className="text-[9px] font-black bg-white/60 border text-slate-500 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm font-mono">
              <ArrowLeftRight className="w-3 h-3" /> {tHome('scrollMode')}
            </div>
          </div>

          {/* أسهم التمرير الأفقي */}
          <button onClick={() => handleScroll('right')} className="absolute rtl:right-2 ltr:right-12 top-[55%] -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#0A2540] hover:text-white flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90 z-30 group/btn cursor-pointer">
            <svg className="w-4 h-4 transform group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          
          <button onClick={() => handleScroll('left')} className="absolute rtl:left-2 ltr:left-2 top-[55%] -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#0A2540] hover:text-white flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90 z-30 group/btn cursor-pointer">
            <svg className="w-4 h-4 transform group-hover/btn:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>

          {/* حاوية الكروت */}
          <div ref={scrollContainerRef} className="flex overflow-x-auto gap-4 py-2 px-6 justify-start items-center select-none scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {platformCards.map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <motion.div key={idx} whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`w-[225px] h-[235px] min-w-[225px] rounded-2xl p-4 flex flex-col justify-between relative group/card border border-white bg-white/70 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-shadow duration-500 ${card.hoverGlow}`}>
                  
                  <div style={{ backgroundImage: card.bgImage }} className="w-full h-[95px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner">
                    <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[0.5px]" />
                    <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
                      {IconComponent && <IconComponent className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="absolute top-2 left-2 text-[8px] font-mono tracking-wider bg-black/40 text-slate-200 px-1.5 py-0.5 rounded border border-white/10">NODE-0{idx + 1}</span>
                  </div>

                  <div className="mt-2 flex-grow flex flex-col justify-end z-10 relative rtl:text-right ltr:text-left">
                    <h3 className="text-xs font-black mb-1 text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${card.themeColor}`} />
                      {card.title}
                    </h3>
                    <p className="text-[10.5px] font-bold leading-relaxed text-slate-500 line-clamp-2">{card.desc}</p>
                  </div>
                  <Link href={card.href} className="absolute inset-0 z-20 rounded-2xl" aria-label={card.title} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>

     {/* 🌟 قسم الأخبار المباشرة + كرت نبذة عن الجامعة */}
      <div className="flex flex-col xl:flex-row gap-6 max-w-[1550px] w-full mx-auto px-4 md:px-0 mt-2 z-10 relative mb-6">
        
        {/* نافذة أخبار جامعة إب (تأخذ المساحة الأكبر) */}
        <div className="w-full xl:w-3/4">
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full h-full bg-gradient-to-br from-sky-500/15 via-blue-500/10 to-indigo-500/15 border border-sky-200/40 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_30px_70px_rgba(14,165,233,0.06)] relative overflow-hidden"
          >
            {/* رأس النافذة */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 rounded-full bg-sky-600 animate-pulse" />
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  {tHome('liveNewsTitle')}
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-sky-500/10 text-sky-700 px-2.5 py-1 rounded-lg border border-sky-500/25 shadow-sm font-black">
                {tHome('liveFeedBadge')}
              </span>
            </div>

            {/* إطار العرض مع السكرول التلقائي والتوقف عند الـ Hover */}
            <div
              ref={newsContainerRef}
              onMouseEnter={() => { isHovered.current = true; }}
              onMouseLeave={() => { isHovered.current = false; }}
              className="w-full h-[450px] rounded-2xl overflow-y-auto overflow-x-hidden border border-sky-200/50 bg-white/60 shadow-inner relative scroll-smooth"
            >
              <iframe
                src="https://www.ibbuniv.edu.ye/news"
                title="Ibb University Live Feed"
                className="w-full h-[2500px] border-0 pointer-events-auto"
                loading="lazy"
              />
            </div>
          </motion.section>
        </div>

        {/* كرت نبذة عن الجامعة (يأخذ المساحة المتبقية بجانب الأخبار) */}
        <div className="w-full xl:w-1/4 flex">
          <a 
            href="https://www.ibbuniv.edu.ye/pages/%D9%86%D8%A8%D8%B0%D8%A9-%D8%B9%D9%86-%D8%A7%D9%84%D8%AC%D8%A7%D9%85%D8%B9%D8%A9" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-br from-[#0F5E49]/90 to-[#0A2540]/90 border border-emerald-500/30 rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-lg hover:shadow-[0_15px_30px_rgba(16,185,129,0.2)] hover:border-emerald-400/50 transition-all duration-300 group backdrop-blur-md relative overflow-hidden"
          >
            {/* تأثير الإضاءة الخلفية */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/20 transition-all" />
            
            <Building2 className="w-14 h-14 text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-300" />
            
            <h3 className="text-xl md:text-2xl font-black text-white mb-3">
              {tHome('aboutUniTitle')}
            </h3>
            
            <p className="text-xs font-bold text-emerald-100/70 leading-relaxed mb-6">
              {tHome('aboutUniDesc')}
            </p>
            
            <div className="mt-auto inline-flex items-center gap-2 text-xs font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl group-hover:bg-emerald-500/20 group-hover:text-white transition-colors z-10">
              <span>{tHome('readMoreBtn')}</span>
              <ExternalLink className="w-3.5 h-3.5 rtl:rotate-0 ltr:-rotate-45" />
            </div>
          </a>
        </div>

      </div>
      

      {/* التذييل السفلي */}
      <footer className="w-full mt-6 py-4 text-center text-[10px] font-mono tracking-widest z-10 border border-white bg-white/80 backdrop-blur-md rounded-2xl shadow-sm select-none text-slate-400">
        IBB UNIVERSITY ACCREDITED PLATFORM SYSTEM NODE v3.0.0 // SECURE CENTRAL HUB
      </footer>
    </div>
  );
}