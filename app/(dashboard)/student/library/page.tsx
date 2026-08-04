"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  Cpu, 
  ArrowRight, 
  Building2, 
  Layers, 
  FolderGit2, 
  Sparkles, 
  Search, 
  Database,
  DownloadCloud,
  Scroll,
  PlayCircle,
  FileText,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import AiChatWidget from '@/app/components/AIChatWidget'; // أو '@/components/AiChatWidget' بحسب مساره في مشروعك

// 🏛️ الهيكلية التنظيمية المعتمدة لكليات وأقسام جامعة إب
const universityStructure = [
  {
    id: "engineering",
    name: "كلية الهندسة",
    icon: Cpu,
    color: "from-sky-500 to-blue-600",
    departments: [
      { id: "computer_control", name: "هندسة الحاسبات والتحكم" },
      { id: "civil", name: "الهندسة المدنية" },
      { id: "architecture", name: "الهندسة المعمارية" },
      { id: "communications", name: "هندسة الاتصالات" }
    ]
  },
  {
    id: "medicine",
    name: "كلية الطب والعلوم الصحية",
    icon: Building2,
    color: "from-emerald-500 to-teal-600",
    departments: [
      { id: "general_medicine", name: "الطب البشري" },
      { id: "laboratories", name: "المختبرات الطبية" },
      { id: "nursing", name: "التمريض" }
    ]
  },
  {
    id: "dentistry",
    name: "كلية طب الأسنان",
    icon: Layers,
    color: "from-blue-500 to-indigo-600",
    departments: [
      { id: "dentistry_surgery", name: "طب وجراحة الفم والأسنان" }
    ]
  },
  {
    id: "law",
    name: "كلية الشريعة والقانون",
    icon: GraduationCap,
    color: "from-slate-500 to-slate-700",
    departments: [
      { id: "sharia_law", name: "الشريعة والقانون" }
    ]
  },
  {
    id: "commerce",
    name: "كلية التجارة والاقتصاد",
    icon: BookOpen,
    color: "from-indigo-500 to-purple-600",
    departments: [
      { id: "business_admin", name: "إدارة الأعمال" },
      { id: "accounting", name: "المحاسبة" },
      { id: "banking_finance", name: "العلوم المالية والمصرفية" }
    ]
  }
];

const academicLevels = [
  { id: 1, name: "المستوى الأول" },
  { id: 2, name: "المستوى الثاني" },
  { id: 3, name: "المستوى الثالث" },
  { id: 4, name: "المستوى الرابع" },
  { id: 5, name: "المستوى الخامس" }
];

const deptStringToIdMap: { [key: string]: number } = {
  "computer_control": 1, "civil": 2, "architecture": 3, "communications": 4,
  "general_medicine": 5, "laboratories": 6, "nursing": 7, "dentistry_surgery": 8,
  "sharia_law": 9, "business_admin": 10, "accounting": 11, "banking_finance": 12
};

export default function PerfectHarmonizedLibrary() {
  const [time, setTime] = useState('');
  
  const [activeSection, setActiveSection] = useState<'books' | 'projects' | 'theses' | 'ai'>('books');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'accredited' | 'summary' | 'video'>('all');
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const [isLoadingSection, setIsLoadingSection] = useState(false);
  const [realBooksData, setRealBooksData] = useState<any[]>([]); 

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedLevel || !selectedDept) {
      setRealBooksData([]);
      return;
    }

    const fetchLibraryResources = async () => {
      setIsLoadingSection(true);
      
      const numericDeptId = deptStringToIdMap[selectedDept];

      let query = supabase
        .from('resources')
        .select('*')
        .eq('level_id', selectedLevel)
        .eq('dep_id', numericDeptId)
        .eq('is_visible', true);

      if (resourceFilter !== 'all') {
        const typeMapping: Record<string, string> = {
          accredited: 'accredited_book',
          summary: 'summary_pdf',
          video: 'educational_video'
        };
        query = query.eq('resource_type', typeMapping[resourceFilter]);
      }

      const { data, error } = await query;
      if (!error && data) {
        setRealBooksData(data);
      } else {
        console.error("خطأ استدعاء المكتبة:", error);
        setRealBooksData([]);
      }
      setIsLoadingSection(false);
    };

    fetchLibraryResources();
  }, [selectedLevel, resourceFilter, selectedDept]);

  const handleSectionChange = (sectionId: 'books' | 'projects' | 'ai' | 'theses') => {
    setIsLoadingSection(true);
    setActiveSection(sectionId as any);

    if (sectionId !== 'books') {
      setSelectedCollege(null);
      setSelectedDept(null);
      setSelectedLevel(null);
    }

    setTimeout(() => setIsLoadingSection(false), 350);
  };

  const currentCollegeData = universityStructure.find(c => c.id === selectedCollege);
  const currentDeptData = currentCollegeData?.departments.find(d => d.id === selectedDept);

  return (
    <div className="min-h-screen bg-[#E6ECEB] text-slate-800 flex flex-col justify-between p-4 md:p-6 font-sans relative overflow-hidden select-none" dir="rtl">
      
      {/* 🏛 الخلفية الكريستالية */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[140px] -top-20 -right-20" />
        <motion.div animate={{ x: [0, -40, 30, 0], y: [0, 30, -40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="absolute w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[130px] bottom-10 -left-20" />
      </div>

      {/* 🏛 الشريط العلوي */}
      <header className="w-full bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#0F5E49] text-white px-6 py-4 flex justify-between items-center relative z-10 rounded-2xl shadow-xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#34d399]" />
          <h1 className="text-sm md:text-base font-black tracking-wide text-slate-50 flex items-center gap-2">
            المستودع المعرفي والبيئة المعمارية للمكتبة الرقمية <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-black">CORE LIBRARY</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs border border-white/10 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-emerald-300 font-extrabold shadow-inner hidden sm:block">
            {time || "00:00:00"}
          </div>
          <Link href="/" className="text-xs font-black bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm flex items-center gap-1 text-white">
            العودة للرئيسية ←
          </Link>
        </div>
      </header>

      {/* 📥 الجسم الرئيسي للمنصة */}
      <main className="flex-grow grid grid-cols-12 gap-6 relative z-10 py-6 max-w-[1550px] w-full mx-auto items-stretch">
        
        {/* 📋 القائمة الجانبية */}
        <div className="col-span-12 lg:col-span-3 flex flex-col justify-between gap-4 flex-shrink-0">
          <div className="flex flex-col gap-3">
            <div className="border border-white bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
              <span className="text-[10px] font-black text-emerald-700 block mb-1 uppercase tracking-wider">Library Index</span>
              <h2 className="text-xs font-black text-slate-900">أجنحة وأقسام المكتبة الحية</h2>
            </div>

            {[
              { id: 'books', title: 'مراجع وبحوث الكليات المعتمدة', desc: 'دليل الكليات التخصصية والمستويات الأكاديمية', icon: BookOpen },
              { id: 'projects', title: 'مستودع مشاريع التخرج الهندسية', desc: 'أرشيف رقمي كامل لأبحاث ومشاريع التخرج', icon: FolderGit2 },
              { id: 'theses', title: 'رسائل الماجستير والدكتوراه', desc: 'الأطروحات العلمية والبحوث العليا', icon: Scroll },
              { id: 'ai', title: 'محرك الاستعلام المعزز الذكي (RAG)', desc: 'البحث الدلالي المتقدم بداخل ملفات الجامعة', icon: Sparkles }
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSectionChange(sec.id as any)}
                  className={`w-full p-4 rounded-2xl border text-right transition-all duration-300 flex items-center gap-3.5 group cursor-pointer ${
                    isActive 
                      ? "bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#0F5E49] text-white border-transparent shadow-xl translate-x-[-4px]" 
                      : "bg-white/70 border-white text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border shadow-inner transition-transform group-hover:scale-105 ${
                    isActive ? 'bg-white/10 border-white/20 text-emerald-300' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xs font-black tracking-tight">{sec.title}</h3>
                    <p className={`text-[10px] font-bold mt-0.5 opacity-80 leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{sec.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border border-white bg-white/50 backdrop-blur-xl rounded-2xl p-4 shadow-sm space-y-2 hidden lg:block">
            <span className="text-[8.5px] font-mono font-black text-emerald-600 uppercase tracking-widest block animate-pulse">● DATABASE_CONNECTIVITY</span>
            <div className="text-[10px] font-bold text-slate-600 flex justify-between">
              <span>حالة قاعدة البيانات الحقيقية:</span>
              <span className="font-mono text-emerald-700 font-black flex items-center gap-1"><Database className="w-3 h-3" /> READY_TO_LINK</span>
            </div>
          </div>
        </div>

        {/* 📄 لوحة العرض المعمارية */}
        <div className="col-span-12 lg:col-span-9 border border-white bg-white/30 backdrop-blur-2xl rounded-3xl p-6 flex flex-col justify-between shadow-[0_30px_70px_rgba(0,0,0,0.02)] relative overflow-hidden">
          
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-900/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 rounded-full bg-[#0F5E49] shadow-[0_0_8px_rgba(15,94,73,0.4)]" />
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                  {activeSection === 'books' && "بوابة الكابلات التخصصية والأرفف الأكاديمية"}
                  {activeSection === 'projects' && "مستودع أبحاث ومشاريع التخرج الهندسية وحوسبة النظم"}
                  {activeSection === 'theses' && "أرشيف الرسائل العلمية والأطروحات العليا"}
                  {activeSection === 'ai' && "منظومة المحادثة والاستعلام الدلالي وفهرسة بطون الكتب RAG"}
                </h2>
              </div>
              <span className="text-[9px] font-mono tracking-widest border bg-white/80 text-slate-500 px-2 py-0.5 rounded-lg shadow-sm font-black">
                {activeSection === 'ai' ? "AI_CHAT_INTERFACE" : "NESTED_STRUCTURE"}
              </span>
            </div>

            {/* الجزء الأول: المراجع والكتب */}
            {activeSection === 'books' && (
              <div className="flex-grow flex flex-col justify-start">
                <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 bg-white/60 p-2.5 rounded-xl border border-white shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="cursor-pointer hover:text-emerald-600 transition-colors font-black" onClick={() => { setSelectedCollege(null); setSelectedDept(null); setSelectedLevel(null); setResourceFilter('all'); }}>المكتبة الرئيسية</span>
                    
                    {selectedCollege && (
                      <>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="cursor-pointer hover:text-emerald-600 transition-colors font-black" onClick={() => { setSelectedDept(null); setSelectedLevel(null); setResourceFilter('all'); }}>{currentCollegeData?.name}</span>
                      </>
                    )}
                    {selectedDept && (
                      <>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="cursor-pointer hover:text-emerald-600 transition-colors font-black" onClick={() => { setSelectedLevel(null); setResourceFilter('all'); }}>{currentDeptData?.name}</span>
                      </>
                    )}
                    {selectedLevel && (
                      <>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-700 font-black">{academicLevels.find(l => l.id === selectedLevel)?.name}</span>
                      </>
                    )}
                  </div>

                  {selectedLevel && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 bg-white/95 border border-slate-200/80 p-1 rounded-xl shadow-inner select-none self-start sm:self-auto">
                      <button type="button" onClick={() => setResourceFilter('accredited')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${resourceFilter === 'accredited' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}`}><BookOpen className="w-3.5 h-3.5" /> <span>PDF كتب معتمدة</span></button>
                      <button type="button" onClick={() => setResourceFilter('summary')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${resourceFilter === 'summary' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'}`}><FileText className="w-3.5 h-3.5" /> <span>PDF ملخصات</span></button>
                      <button type="button" onClick={() => setResourceFilter('video')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${resourceFilter === 'video' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'}`}><PlayCircle className="w-3.5 h-3.5" /> <span>فيديوهات تعليمية</span></button>
                    </motion.div>
                  )}
                </div>
                
                <AnimatePresence mode="wait">
                  {!selectedCollege && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                      {universityStructure.map((college) => {
                        const CollegeIcon = college.icon;
                        return (
                          <button key={college.id} onClick={() => setSelectedCollege(college.id)} className="bg-white/80 hover:bg-white border border-white hover:border-emerald-500/30 rounded-2xl p-5 text-right transition-all duration-300 group shadow-sm hover:shadow-md flex flex-col justify-between h-[130px] relative overflow-hidden cursor-pointer">
                            <div className="flex justify-between items-start w-full">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 transition-colors">
                                <CollegeIcon className="w-5 h-5 group-hover:text-emerald-600 transition-colors" />
                              </div>
                              <span className="text-[8px] font-mono tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">COLLEGE_NODE</span>
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{college.name}</h3>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">اضغط لاستعراض تخصصات وأقسام الكلية الرقمية</p>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}

                  {selectedCollege && !selectedDept && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                      {currentCollegeData?.departments.map((dept) => (
                        <button key={dept.id} onClick={() => setSelectedDept(dept.id)} className="bg-white/80 hover:bg-white border border-white hover:border-sky-500/30 rounded-2xl p-5 text-right transition-all duration-300 group shadow-sm hover:shadow-md flex flex-col justify-between h-[120px] cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><Layers className="w-4 h-4" /></div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition-colors">{dept.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">تصفح المستويات الأكاديمية والمناهج المعتمدة</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {selectedDept && !selectedLevel && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-1">
                      {academicLevels.map((level) => (
                        <button key={level.id} onClick={() => setSelectedLevel(level.id)} className="bg-white/80 hover:bg-white border border-white hover:border-emerald-500/30 rounded-2xl p-4 text-center transition-all duration-300 group shadow-sm hover:shadow-md flex flex-col items-center justify-center h-[110px] cursor-pointer">
                          <span className="text-xs font-black text-slate-500 font-mono bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 px-2 py-1 rounded-md transition-colors">LVL - 0{level.id}</span>
                          <h3 className="text-xs font-black text-slate-900 mt-3 group-hover:text-emerald-700 transition-colors">{level.name}</h3>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {selectedLevel && (
                    <div className="w-full">
                      {isLoadingSection ? (
                        <div className="text-center py-12 text-xs font-bold text-[#0F5E49] animate-pulse">جاري استدعاء السجلات وفحص الرف الرقمي...</div>
                      ) : realBooksData.length > 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full p-1 text-right">
                          {realBooksData.map((res: any) => (
                            <div key={res.id} className="bg-white/80 border border-white hover:border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between h-[130px] shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-slate-50 border border-slate-100 text-emerald-600 rounded-xl">
                                  {res.resource_type === 'accredited_book' && <BookOpen className="w-4 h-4" />}
                                  {res.resource_type === 'summary_pdf' && <FileText className="w-4 h-4" />}
                                  {res.resource_type === 'educational_video' && <PlayCircle className="w-4 h-4" />}
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-relaxed">{res.title}</h4>
                                  <div className="flex gap-1.5 mt-2">
                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">
                                      {res.resource_type === 'accredited_book' ? '📖 كتاب معتمد' : res.resource_type === 'summary_pdf' ? '📄 ملخص PDF' : '🎥 فيديو دراسي'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-slate-100 pt-2.5 mt-2 flex justify-between items-center">
                                <span className="text-[9px] font-mono text-slate-400 font-bold">SQL_RES_{res.id}</span>
                                <a href={res.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-xl transition-all">
                                  <DownloadCloud className="w-3.5 h-3.5" /> تحميل / عرض المصدر
                                </a>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div key={resourceFilter} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-14 bg-white/40 border border-white rounded-2xl shadow-inner text-center p-6 w-full">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <Database className="w-6 h-6" />
                          </div>
                          <h3 className="text-sm font-black text-slate-900">الرف الشامل جاهز ولا توجد مواد حالية</h3>
                          <p className="text-xs font-bold text-slate-500 mt-2 max-w-sm leading-relaxed">
                            تمت مزامنة قفل التخصيص لمسار ({currentDeptData?.name} - {academicLevels.find(l => l.id === selectedLevel)?.name}) بنجاح. لا توجد مواد مطابقة للتصنيف حالياً.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* الجزء الثاني: مشاريع التخرج */}
            {activeSection === 'projects' && (
              <div className="flex-grow flex flex-col justify-start">
                <div className="w-full max-w-md mx-auto mb-6">
                  <div className="relative flex items-center bg-white border border-slate-200 focus-within:border-emerald-500/50 rounded-xl px-4 py-2.5 transition-all shadow-sm">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="البحث السريع بداخل مستودع مشاريع التخرج..." className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none text-right" />
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="w-full flex flex-col items-center justify-center py-16 bg-white/40 border border-white rounded-2xl shadow-inner text-center p-6">
                  <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-4 border border-sky-100"><FolderGit2 className="w-6 h-6" /></div>
                  <h3 className="text-sm font-black text-slate-900">مستودع أبحاث التخرج خالٍ حالياً</h3>
                </div>
              </div>
            )}

            {/* الجزء الثالث: رسائل الماجستير والدكتوراه */}
            {activeSection === 'theses' && (
              <div className="flex-grow flex flex-col justify-start">
                <div className="w-full flex flex-col items-center justify-center py-16 bg-white/40 border border-white rounded-2xl shadow-inner text-center p-6">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 border border-amber-100"><Scroll className="w-6 h-6" /></div>
                  <h3 className="text-sm font-black text-slate-900">أرشيف الرسائل العلمية جاهز للربط</h3>
                </div>
              </div>
            )}

            {/* 🟢 الجزء الرابع: محرك الاستعلام المعزز RAG مدمج كاملاً بداخل اللوحة الرئيسية */}
            {activeSection === 'ai' && (
              <div className="flex-grow w-full h-full min-h-[520px] flex flex-col justify-between">
                <AiChatWidget 
                  subjectId={selectedDept || "GENERAL"}
                  collegeId={selectedCollege || undefined}
                  levelId={selectedLevel || undefined}
                  resourceType={resourceFilter}
                />
              </div>
            )}

          </div>

          {/* الشريط السفلي الداخلي للوحة */}
          <div className="text-center text-[9px] font-mono text-slate-400 select-none border-t border-slate-200 py-2 mt-4">
            REGIONAL REPOSITORY MANAGEMENT CORE SYSTEM // PLATFORM ACCESS OK
          </div>

        </div>

      </main>

      {/* الشريط السفلي الخارجي */}
      <footer className="w-full py-4 text-center text-[10px] font-mono tracking-widest z-10 border border-white bg-white/80 backdrop-blur-md rounded-2xl shadow-sm select-none text-slate-400">
        IBB UNIVERSITY ACCREDITED PLATFORM SYSTEM NODE v3.0.0 // SECURE CENTRAL HUB
      </footer>
      
    </div>
  );
}