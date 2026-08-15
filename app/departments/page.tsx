"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Clock, 
  BookOpen, 
  Cpu, 
  Activity, 
  Building2, 
  Scale, 
  GraduationCap, 
  Sparkles, 
  Award, 
  ArrowLeft,
  Briefcase
} from 'lucide-react';

const collegesData = [
  {
    id: 'engineering',
    name: 'كلية الهندسة ',
    theme: 'indigo',
    borderColor: 'border-indigo-500/20',
    glowColor: 'bg-indigo-500/10',
    iconColor: 'text-indigo-400',
    departments: [
      {
        id: 'computer-control',
        name: 'هندسة الحاسبات والتحكم',
        duration: 5,
        creditHours: 172,
        description: 'تصميم وبناء الأنظمة المدمجة الذكية، شبكات الحاسوب، وأنظمة التحكم الصناعي المؤتمتة.',
        careers: ['مهندس أنظمة مدمجة', 'مطور برمجيات تحكم', 'أخصائي شبكات سحابية'],
        icon: Cpu,
        path: '/departments/engineering?tab=computer-control' 
      },
      {
        id: 'civil',
        name: 'الهندسة المدنية',
        duration: 5,
        creditHours: 168,
        description: 'إعداد وتصميم البنى التحتية، الجسور، الطرقات، وإدارة المشاريع الإنشائية الضخمة.',
        careers: ['مهندس إنشائي', 'مدير مشاريع تشييد', 'مخطط بنى تحتية'],
        icon: Building2,
        path: '/departments/engineering?tab=civil'
      },
      {
        id: 'architecture',
        name: 'الهندسة المعمارية',
        duration: 5,
        creditHours: 175,
        description: 'تكامل الفن مع الهندسة لتصميم مبانٍ مستدامة وعصرية تعكس الهوية والثقافة الإنسانية.',
        careers: ['مصمم معماري', 'مخطط مدني وعمراني', 'مصمم مستدام'],
        icon: Building2,
        path: '/departments/engineering?tab=architecture'
      },
      {
        id: 'telecom',
        name: 'هندسة الاتصالات',
        duration: 5,
        creditHours: 170,
        description: 'بث البيانات، شبكات الاتصالات اللاسلكية والجيل الخامس وتطوير نظم الميكروويف والألياف الضوئية.',
        careers: ['مهندس شبكات اتصالات', 'أخصائي إشارات لاسلكية', 'مطور نظم اتصالات'],
        icon: Cpu,
        path: '/departments/engineering?tab=telecom'
      }
    ]
  },
  {
    id: 'medicine',
    name: 'كلية الطب والعلوم الصحية',
    theme: 'emerald',
    borderColor: 'border-emerald-500/20',
    glowColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    departments: [
      {
        id: 'general-medicine',
        name: 'الطب البشري',
        duration: 7, 
        creditHours: 250,
        description: 'تشخيص الأمراض وتقديم الرعاية الطبية الشاملة والقيام بالبحوث الطبية المتقدمة لإنقاذ البشرية.',
        careers: ['طبيب عام في المشافي', 'باحث سريري وأكاديمي', 'تخصص زمالة دقيقة'],
        icon: Activity,
        path: '/departments/medicine?tab=general-medicine'
      },
      {
        id: 'dentistry',
        name: 'طب وجراحة الفم والأسنان',
        duration: 5, 
        creditHours: 180,
        description: 'علاج ورعاية وتجميل الأسنان واللثة وجراحة الوجه والفكين بأحدث التقنيات الطبية.',
        careers: ['طبيب أسنان متخصص', 'جراح وجه وفكين', 'إخصائي تجميل أسنان'],
        icon: Activity,
        path: '/departments/dentistry?tab=dent-surgery'
      },
      {
        id: 'labs',
        name: 'المختبرات الطبية',
        duration: 4, 
        creditHours: 140,
        description: 'تحليل العينات الطبية والمساعدة في تشخيص الأمراض ببيولوجيا الجزيئات والتحاليل الدقيقة.',
        careers: ['أخصائي تحاليل طبية', 'باحث في بنك الدم', 'محلل جينات مخبري'],
        icon: Activity,
        path: '/departments/medicine?tab=labs' // تم تصليحه ليوجه لكلية الطب بتبويب المختبرات
      },
      {
        id: 'nursing',
        name: 'التمريض',
        duration: 4,
        creditHours: 136,
        description: 'تقديم الرعاية الصحية التمريضية الطارئة والدورية للمرضى في غرف العناية والمشافي.',
        careers: ['ممرض قانوني متخصص', 'مشرف رعاية صحية أولية', 'أخصائي طوارئ'],
        icon: Activity,
        path: '/departments/medicine?tab=nursing' // تم تصليحه ليوجه لكلية الطب بتبويب التمريض فوراً!
      }
    ]
  },
  {
    id: 'admin',
    name: 'كلية العلوم الإدارية',
    theme: 'amber',
    borderColor: 'border-amber-500/20',
    glowColor: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    departments: [
      {
        id: 'bba',
        name: 'إدارة الأعمال',
        duration: 4,
        creditHours: 132,
        description: 'دراسة استراتيجيات القيادة، الهيكلة التنظيمية للشركات، وإدارة الموارد البشرية واللوجستية.',
        careers: ['مدير تنفيذي ومستشار', 'رائد أعمال خاص', 'محلل تطوير إداري'],
        icon: Building2,
        path: '/departments/admin?tab=bba'
      },
      {
        id: 'accounting',
        name: 'المحاسبة',
        duration: 4,
        creditHours: 130,
        description: 'تدقيق الحسابات المالية، إعداد التقارير الضريبية، ومراقبة الميزانيات للكيانات التجارية والحكومية.',
        careers: ['محاسب قانوني معتمد', 'مدقق مالي داخلي', 'مستشار ضرائب وميزانيات'],
        icon: Building2,
        path: '/departments/admin?tab=accounting'
      },
      {
        id: 'finance',
        name: 'العلوم المالية والمصرفية',
        duration: 4,
        creditHours: 134,
        description: 'تحليل الاستثمار، إدارة المحافظ البنية، ونظم البنوك الرقمية وإدارة المخاطر النقدية.',
        careers: ['محلل مالي واستثماري', 'إخصائي ائتمان مصرفي', 'مخطط ثروات واستثمار'],
        icon: Building2,
        path: '/departments/admin?tab=finance'
      }
    ]
  },
  {
    id: 'law',
    name: 'كلية الشريعة والقانون',
    theme: 'purple',
    borderColor: 'border-purple-500/20',
    glowColor: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    departments: [
      {
        id: 'law-sharia',
        name: 'الشريعة والقانون',
        duration: 4,
        creditHours: 140,
        description: 'دراسة الفقه الموحد، القوانين الدستورية والجنائية والمدنية، وإعداد الكوادر القضائية والحقوقية.',
        careers: ['محامٍ معتمد ومستشار', 'قاضٍ أو معاون قضائي', 'أخصائي صياغة عقود'],
        icon: Scale,
        path: '/departments/law?tab=sharia-law'
      }
    ]
  }
];

export default function DepartmentsPortal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const totalColleges = collegesData.length;
  const totalDepartments = collegesData.reduce((sum, c) => sum + c.departments.length, 0);

  const filteredColleges = collegesData
    .map(college => {
      if (activeFilter !== 'all' && college.id !== activeFilter) {
        return null;
      }

      const matchedDeps = college.departments.filter(dep => 
        dep.name.includes(searchTerm) || dep.description.includes(searchTerm)
      );

      if (matchedDeps.length === 0) return null;

      return {
        ...college,
        departments: matchedDeps
      };
    })
    .filter(Boolean) as typeof collegesData;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden" dir="rtl">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-400/10 blur-[140px] top-[-10%] right-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-[130px] bottom-[-10%] left-[-10%]" />
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 py-8 relative z-10 flex-grow space-y-8">
        
        <div className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>البوابة التعليمية الذكية لجامعة إب</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">دليل الكليات والتخصصات الأكاديمية</h1>
            <p className="text-xs text-slate-500 font-bold max-w-xl leading-relaxed">
              تصفح الأقسام العلمية، تعرف على خططها الدراسية وسنوات رصدها، والفرص والمسارات المهنية الواعدة لكل تخصص أكاديمي.
            </p>
          </div>

          <div className="flex items-center gap-4 select-none">
            <div className="bg-[#0A2540] text-white border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-md">
              <div className="p-2 bg-white/10 rounded-xl"><GraduationCap className="w-5 h-5 text-sky-400" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-300">إجمالي الكليات</p>
                <p className="text-base font-black text-white">{totalColleges}</p>
              </div>
            </div>
            <div className="bg-white/80 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Award className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">التخصصات المتاحة</p>
                <p className="text-base font-black text-indigo-600">{totalDepartments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 border border-white/60 bg-white/40 backdrop-blur-xl p-4 rounded-3xl shadow-inner">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="ابحث عن تخصص أكاديمي، مهارة، أو نبذة معينة..."
              className="w-full pl-4 pr-10 py-3 border border-slate-200/60 rounded-2xl text-xs bg-white/90 font-semibold focus:outline-none focus:border-indigo-500 shadow-sm transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 select-none">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`text-xs font-black px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                activeFilter === 'all' 
                  ? 'bg-[#0A2540] border-[#0A2540] text-white shadow-md' 
                  : 'bg-white/80 border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              الكل
            </button>
            {collegesData.map(college => (
              <button 
                key={college.id}
                onClick={() => setActiveFilter(college.id)}
                className={`text-xs font-black px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === college.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white/80 border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {college.name.replace('كلية ', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {filteredColleges.length > 0 ? (
            filteredColleges.map(college => (
              <div key={college.id} className="space-y-6">
                
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <span className={`w-2.5 h-6 rounded-full ${
                    college.theme === 'indigo' ? 'bg-indigo-600' :
                    college.theme === 'emerald' ? 'bg-emerald-600' :
                    college.theme === 'amber' ? 'bg-amber-600' : 'bg-purple-600'
                  }`} />
                  <h2 className="text-base font-black text-slate-900">{college.name}</h2>
                  <span className="text-[10px] font-mono bg-white/60 text-slate-400 border px-2.5 py-0.5 rounded-full font-bold">
                    عدد الأقسام: {college.departments.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {college.departments.map(dep => {
                    const DepIcon = dep.icon;
                    return (
                      <div 
                        key={dep.id}
                        className="border border-white/80 bg-white/50 backdrop-blur-md rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group/card relative overflow-hidden"
                      >
                        <div className={`absolute w-32 h-32 rounded-full ${college.glowColor} blur-2xl -top-10 -left-10 pointer-events-none`} />

                        <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl bg-white border border-slate-100 shadow-sm ${college.iconColor}`}>
                              <DepIcon className="w-5 h-5" />
                            </div>

                            <div className="flex items-center gap-1.5 select-none">
                              <div className="flex items-center gap-1 text-[10px] font-black bg-slate-950 text-white px-2.5 py-1 rounded-full shadow-sm">
                                <Clock className="w-3 h-3 text-sky-400" />
                                <span>{dep.duration} {dep.duration === 7 ? 'سنوات' : dep.duration === 5 ? 'سنوات' : 'سنوات'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full">
                                <BookOpen className="w-3 h-3" />
                                <span>{dep.creditHours} ساعة</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <h3 className="font-black text-sm text-slate-900 tracking-wide group-hover/card:text-indigo-600 transition-colors">
                              {dep.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              {dep.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 space-y-2 text-right">
                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 select-none">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>مجالات العمل المتوقعة للخريج:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {dep.careers.map((career, cIdx) => (
                                <span 
                                  key={cIdx}
                                  className="text-[9px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                >
                                  {career}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100/60 flex justify-end relative z-10">
                          <Link 
                            href={dep.path}
                            className="text-[10px] font-black text-[#0A2540] bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow"
                          >
                            <span>عرض الخطط الدراسية والمناهج</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-slate-400 font-bold text-xs select-none space-y-2 border border-dashed border-slate-300 rounded-3xl bg-white/40">
              <p>📭 لا توجد نتائج مطابقة لبحثك الحالي.</p>
              <p className="text-[11px] text-slate-400 font-medium">تأكد من كتابة الكلمات بشكل صحيح أو قم بتغيير فلاتر الكليات لليمين.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="w-full py-4 text-center text-[10px] font-mono tracking-widest z-10 border-t border-white bg-white/80 backdrop-blur-md rounded-xl shadow-sm text-slate-400 select-none print:hidden">
        IBB UNIVERSITY PORTAL MODULE v2.0.0 // DYNAMIC ROSTER ENGINE
      </footer>
    </div>
  );
}