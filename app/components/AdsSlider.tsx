"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink,
  Loader2
} from 'lucide-react';

interface AdItem {
  id: number | string;
  title: string;
  subtitle: string;
  badge: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
}

export default function AdsSlider() {
  const t = useTranslations('AdsSlider');

  // 🎨 إعلان افتراضي يتغير نصه تلقائياً مع لغة الموقع
  const fallbackAnnouncements: AdItem[] = [
    {
      id: 'default-fixed-1',
      title: t('defaultTitle'),
      subtitle: t('defaultSubtitle'),
      image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600",
      badge: t('defaultBadge'),
      is_active: true
    }
  ];

  const [ads, setAds] = useState<AdItem[]>(fallbackAnnouncements);
  const [isLoadingAds, setIsLoadingAds] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // تحديث الإعلان الافتراضي فور تغيير اللغة
  useEffect(() => {
    setAds((prev) => {
      if (prev.length === 1 && prev[0].id === 'default-fixed-1') {
        return fallbackAnnouncements;
      }
      return prev;
    });
  }, [t]);

  // 📡 جلب الإعلانات من Supabase ودمجها
  useEffect(() => {
    const fetchAdsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('images_ads')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setAds([...fallbackAnnouncements, ...data]);
        } else {
          setAds(fallbackAnnouncements);
        }
      } catch (err) {
        setAds(fallbackAnnouncements);
      } finally {
        setIsLoadingAds(false);
      }
    };

    fetchAdsFromSupabase();
  }, []);

  // 🔄 التبديل التلقائي كل 6 ثوانٍ
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [ads.length]);

  const nextSlide = () => {
    if (ads.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % ads.length);
  };

  const prevSlide = () => {
    if (ads.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const currentAd = ads[currentSlide] || fallbackAnnouncements[0];

  return (
    <section className="w-full max-w-[1550px] mx-auto relative z-10 mt-5 select-none">
      <div className="relative w-full h-[220px] sm:h-[280px] md:h-[320px] rounded-[32px] md:rounded-[40px] overflow-hidden border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] bg-[#0A2540] group">
        
        {isLoadingAds ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-wider">{t('loading')}</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd.id || currentSlide}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {/* الصورة */}
              <img 
                src={currentAd.image_url} 
                alt={currentAd.title || "Announcement"} 
                className="w-full h-full object-cover object-center"
              />

              {/* 🌟 التدرج الذكي الذي ينعكس تلقائياً حسب لغة الصفحة */}
              <div className="absolute inset-0 rtl:bg-gradient-to-l ltr:bg-gradient-to-r from-[#061e18]/95 via-[#0A2540]/80 to-transparent/20" />
              
              {/* محتوى الإعلان المتناسق مع الاتجاه */}
              <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 md:p-12 text-start">
                
                <div>
                  {currentAd.badge && (
                    <span className="inline-block text-[10px] sm:text-xs font-mono font-black bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full backdrop-blur-md mb-3">
                      {currentAd.badge}
                    </span>
                  )}
                  
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md max-w-2xl leading-tight">
                    {currentAd.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  {currentAd.subtitle && (
                    <p className="text-xs sm:text-sm md:text-base text-slate-200 font-bold max-w-xl leading-relaxed drop-shadow-sm opacity-90 line-clamp-2 sm:line-clamp-none">
                      {currentAd.subtitle}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4">
                    {/* شريط التزيين */}
                    <div className="w-16 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                    
                    {/* زر الرابط إن وجد */}
                    {currentAd.link_url && (
                      <a 
                        href={currentAd.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300 hover:text-white bg-black/40 hover:bg-black/60 px-3 py-1 rounded-lg border border-emerald-500/30 backdrop-blur-md transition-all"
                      >
                        <span>{t('viewDetails')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* 🏹 أسهم التحكم المتوافقة مع الاتجاهين */}
        {ads.length > 1 && !isLoadingAds && (
          <>
            <button 
              type="button"
              onClick={prevSlide}
              className="absolute end-4 sm:end-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer z-20"
              title={t('prev')}
            >
              <ChevronRight className="w-6 h-6 rtl:rotate-0 rotate-180" />
            </button>

            <button 
              type="button"
              onClick={nextSlide}
              className="absolute start-4 sm:start-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer z-20"
              title={t('next')}
            >
              <ChevronLeft className="w-6 h-6 rtl:rotate-0 rotate-180" />
            </button>

            {/* 🔘 مؤشرات النقاط */}
            <div className="absolute bottom-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex items-center gap-2 z-20 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {ads.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    currentSlide === idx 
                      ? "w-7 h-2 bg-emerald-400 shadow-[0_0_10px_#34d399]" 
                      : "w-2 h-2 bg-white/50 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  );
}