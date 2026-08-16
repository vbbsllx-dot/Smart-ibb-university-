"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  PlayCircle, 
  Eye, 
  Trash2,
  Pencil
} from 'lucide-react';

const departmentNamesMap: { [key: string | number]: string } = {
  1: 'هندسة الحاسبات والتحكم', 2: 'الهندسة المدنية', 3: 'الهندسة المعمارية', 4: 'هندسة الاتصالات',
  5: 'الطب البشري', 6: 'المختبرات الطبية', 7: 'التمريض', 8: 'طب وجراحة الفم والأسنان',
  9: 'الشريعة والقانون', 10: 'إدارة الأعمال', 11: 'المحاسبة', 12: 'العلوم المالية والمصرفية'
};

const levelNamesMap: { [key: string | number]: string } = {
  1: 'المستوى الأول', 2: 'المستوى الثاني', 3: 'المستوى الثالث', 4: 'المستوى الرابع', 5: 'المستوى الخامس', 6: 'المستوى السادس', 7: 'المستوى السابع'
};

interface ResourceCarouselProps {
  myResources: any[];
  selectedResource: any;
  onSelectResource: (resource: any, shouldLoad: boolean) => void; 
  onDeleteResource: (id: number, e: React.MouseEvent) => void;
  setPreviewUrl: (url: string | null) => void;
  setPreviewType: (type: string | null) => void;
  router: any;
}

export default function ResourceCarousel({
  myResources,
  selectedResource,
  onSelectResource,
  onDeleteResource,
  setPreviewUrl,
  setPreviewType,
  router
}: ResourceCarouselProps) {
  const t = useTranslations('ResourceCarousel');
  const tGlobal = useTranslations('RegistrationDetails');

  // 🟢 حالة خاصة بمؤشر المرجع المعروض حالياً بمنتصف الكاروسيل
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // 🔄 مزامنة المؤشر المحلي عند اختيار مرجع محدد أو تحديث قائمة المراجع
  useEffect(() => {
    if (selectedResource && myResources.length > 0) {
      const foundIdx = myResources.findIndex(r => r.id === selectedResource.id);
      if (foundIdx >= 0) {
        setCarouselIndex(foundIdx);
      }
    }
  }, [selectedResource, myResources]);

  // 🔔 دالة توليد صوت النقر الكريستالي برمجياً
  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log(e);
    }
  };

  const handleCardClick = (res: any) => {
    playClickSound();
    onSelectResource(res, true); // 🟢 فتح المرجع وتحميل بياناته
  };

  // 🎯 المرجع المعروض حالياً بمنتصف الكاروسيل للترويسة العلوية
  const activeDisplayResource = myResources.length > 0 
    ? myResources[carouselIndex % myResources.length] 
    : selectedResource;

  return (
    <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden print:hidden relative">
      
      {/* 🏛️ ترويسة الأرشيف مع إظهار تفاصيل المادة المعروضة بمنتصف الكاروسيل ديناميكياً */}
      <div className="bg-white/80 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between z-30 relative flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-3.5 rounded-full bg-[#00bc7e]" />
          <h3 className="text-xs font-black text-[#062c35]">
            {t('archiveTitle')} 
          </h3>
        </div>

        {/* 📌 شارات تفاصيل المادة الظاهرة بمنتصف المسرح حالياً */}
        {activeDisplayResource ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#00bc7e]/15 text-[#059669] border border-[#00bc7e]/30 px-3 py-1 rounded-xl text-xs font-black">
              {t('coursePrefix')} {activeDisplayResource.title}
            </span>

            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-bold">
              🏢 {tGlobal(`departments.${activeDisplayResource.dept_id || activeDisplayResource.dep_id}` as any) || departmentNamesMap[Number(activeDisplayResource.dept_id || activeDisplayResource.dep_id)] || t('defaultDept')}
            </span>

            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-bold">
              🎓 {tGlobal(`levels.${activeDisplayResource.level_id}` as any) || levelNamesMap[Number(activeDisplayResource.level_id)] || `${t('levelPrefix')} ${activeDisplayResource.level_id}`}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
            {t('noResourceSelected')}
          </span>
        )}

        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100 font-bold">
          {t('countLabel')} {myResources.length}
        </span>
      </div>

      {/* المسرح ثلاثي الأبعاد */}
      <div className="w-full h-[270px] flex items-center justify-center [perspective:1400px] overflow-hidden relative bg-slate-50/50 select-none py-4">

        {/* 🏹 السهم الأيمن */}
        <button 
          type="button"
          onClick={() => {
            if (myResources.length > 0) {
              playClickSound();
              setCarouselIndex((prev) => (prev - 1 + myResources.length) % myResources.length);
            }
          }}
          className="absolute end-6 z-40 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg border border-slate-200 hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>

        {/* 🏹 السهم الأيسر */}
        <button 
          type="button"
          onClick={() => {
            if (myResources.length > 0) {
              playClickSound();
              setCarouselIndex((prev) => (prev + 1) % myResources.length);
            }
          }}
          className="absolute start-6 z-40 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg border border-slate-200 hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </button>

        {/* الحلقة الدوارة */}
        <div 
          className="relative w-[300px] h-[155px] transition-transform duration-700 ease-out flex items-center justify-center"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: `rotateY(${carouselIndex * 45}deg)`
          }}
        >
          {myResources.length > 0 ? (
            myResources.map((res, idx) => {
              const anglePerItem = 45; 
              const activeIdx = ((carouselIndex % myResources.length) + myResources.length) % myResources.length;

              let distance = Math.abs(idx - activeIdx);
              if (distance > myResources.length / 2) {
                distance = myResources.length - distance;
              }

              const isCurrent = idx === activeIdx;
              const isAdjacent = distance === 1; 

              let cardStyle = {};
              if (isCurrent) {
                cardStyle = {
                  transform: `rotateY(${-idx * anglePerItem}deg) translateZ(360px) scale(1)`,
                  opacity: 1, 
                  zIndex: 50,
                  pointerEvents: 'auto' as const
                };
              } else if (isAdjacent) {
                cardStyle = {
                  transform: `rotateY(${-idx * anglePerItem}deg) translateZ(330px) scale(0.85)`,
                  opacity: 0.35, 
                  zIndex: 20,
                  pointerEvents: 'auto' as const
                };
              } else {
                cardStyle = {
                  transform: `rotateY(${-idx * anglePerItem}deg) translateZ(280px) scale(0.7)`,
                  opacity: 0, 
                  zIndex: 10,
                  pointerEvents: 'none' as const
                };
              }

              return (
                <div
                  key={res.id || idx}
                  onClick={() => handleCardClick(res)}
                  style={{ 
                    transformStyle: "preserve-3d",
                    transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)", 
                    ...cardStyle
                  }}
                  className={`absolute w-full h-full rounded-2xl cursor-pointer overflow-hidden group border transition-all duration-500 backface-hidden subpixel-antialiased transform-gpu ${
                    isCurrent 
                      ? 'border-[#0d1527]/20 bg-[#0d1527]/80 shadow-[0_20px_40px_rgba(0,0,0,0.2)]' 
                      : 'border-slate-200/40 bg-white/10 shadow-sm'
                  }`}
                >
                  {/* 🖼️ خلفية المادة/المستند */}
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <img 
                      src={res.thumbnail_url || (
                        res.resource_type === 'accredited_book' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500' : 
                        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500'
                      )} 
                      alt="Cover"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* 🌟 الغطاء البلوري الزجاجي التفاعلي عند تمرير الماوس */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-between transition-all duration-300 pointer-events-none">

                    {/* الطبقة الزجاجية التي تظهر عند الـ Hover */}
                    <div className="absolute inset-0 bg-[#070b14]/75 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

                    {/* الهيدر العلوي والأزرار */}
                    <div className="p-3 flex justify-between items-center w-full relative z-20 pointer-events-auto">

                      {/* وسم نوع المرجع */}
                      <div className={`p-1.5 rounded-xl border backdrop-blur-xl shadow-md transition-all ${
                        res.resource_type === 'accredited_book' ? 'bg-[#0A2540]/90 border-sky-400/40 text-sky-300' : 
                        res.resource_type === 'summary_pdf' ? 'bg-amber-950/90 border-amber-400/40 text-amber-300' :
                        'bg-emerald-950/90 border-emerald-400/40 text-emerald-300'
                      }`}>
                        {res.resource_type === 'accredited_book' && <BookOpen className="w-3.5 h-3.5" />}
                        {res.resource_type === 'summary_pdf' && <FileText className="w-3.5 h-3.5" />}
                        {res.resource_type === 'educational_video' && <PlayCircle className="w-3.5 h-3.5" />}
                      </div>

                      {/* أزرار الإجراءات الزجاجية عند الـ Hover */}
                      {isCurrent && (
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">

                          {/* 👁️ المعاينة */}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              playClickSound();
                              setPreviewUrl(res.file_url);
                              setPreviewType(res.resource_type);
                            }}
                            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-indigo-600 text-white border border-white/20 backdrop-blur-xl shadow-lg transition-all active:scale-90"
                            title={t('previewTooltip')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* ✏️ التعديل */}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              playClickSound();
                              router.push(`/faculty/upload?edit=true&id=${res.id}&title=${encodeURIComponent(res.title)}&type=${res.resource_type}&dept=${res.dept_id}&level=${res.level_id}`);
                            }}
                            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-sky-600 text-white border border-white/20 backdrop-blur-xl shadow-lg transition-all active:scale-90"
                            title={t('editTooltip')}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* 🗑️ الحذف */}
                          <button 
                            type="button"
                            onClick={(e) => onDeleteResource(res.id, e)}
                            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white border border-white/20 backdrop-blur-xl shadow-lg transition-all active:scale-90"
                            title={t('deleteTooltip')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* الشريط السفلي الأنيق لعنوان المادة */}
                    <div className="p-3 bg-[#090f1c]/95 border-t border-white/10 w-full text-start rounded-b-2xl shadow-2xl relative z-20 backdrop-blur-md">
                      <h4 className="font-black text-xs text-white line-clamp-1 tracking-wide">
                        {res.title}
                      </h4>
                      <p className="text-[9.5px] text-indigo-300 font-bold mt-0.5 truncate">
                        {tGlobal(`departments.${res.dept_id || res.dep_id}` as any) || departmentNamesMap[Number(res.dept_id || res.dep_id)]}
                      </p>
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-400 font-bold text-xs [transform:translateZ(0)]">
              {t('noLectures')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}