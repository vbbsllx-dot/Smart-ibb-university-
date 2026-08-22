"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase'; // تأكد من صحة مسار ملف Supabase

// واجهة بيانات الفيديو لترتيب البيانات القادمة من قاعدة البيانات
interface DubbingTask {
  id: string;
  title: string;
  description: string;
  original_video_url: string;
  dubbed_video_url: string | null;
  status: string;
  created_at: string;
  is_public: boolean;
}

interface DubbingStudioProps {
  studentData: any;
}

export default function DubbingStudio({ studentData }: DubbingStudioProps) {
  const t = useTranslations('DubbingStudio');

  // حالات النموذج
  const [dubbingFile, setDubbingFile] = useState<File | null>(null);
  const [dubbingTitle, setDubbingTitle] = useState('');
  const [dubbingDescription, setDubbingDescription] = useState('');
  const [shareVideo, setShareVideo] = useState(false);
  const [isDubbingProcessing, setIsDubbingProcessing] = useState(false);
  const [dubbingMessage, setDubbingMessage] = useState({ type: '', text: '' });

  // حالات الفيديوهات السابقة
  const [previousVideos, setPreviousVideos] = useState<DubbingTask[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // جلب الفيديوهات السابقة الخاصة بالطالب عند تحميل الصفحة
  useEffect(() => {
    if (studentData?.id) {
      fetchPreviousVideos();
    }
   }, [studentData]);
    useEffect(() => {
    // التحقق هل يوجد أي فيديو حالته 'pending'
    const hasPendingVideos = previousVideos.some(video => video.status === 'pending');
    let interval: NodeJS.Timeout;

    if (hasPendingVideos) {
      interval = setInterval(() => {
        console.log("🔄 جاري فحص حالة الدبلجة...");
        fetchPreviousVideos();
      }, 20000); // يفحص كل 20 ثوانٍ
    }

    // تنظيف العداد عند انتهاء الدبلجة أو إغلاق الصفحة
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [previousVideos]);
 

 const fetchPreviousVideos = async (isSilent = false) => {
    // إظهار التحميل فقط إذا لم يكن التحديث صامتاً
    if (!isSilent) {
      setIsLoadingVideos(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('dubbing_tasks')
        .select('*')
        .eq('student_id', studentData.id) // تأكد من استخدام id أو db_id حسب آخر كود لديك
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      if (isSilent) {
        // 💡 التحديث الذكي: مقارنة البيانات قبل إجبار الشاشة على التحديث
        setPreviousVideos((prevVideos) => {
          let hasChanges = false;
          const newData = data || [];
          
          // إذا تغير عدد الفيديوهات، فهناك تغيير حقيقي
          if (prevVideos.length !== newData.length) {
            hasChanges = true;
          } else {
            // التحقق مما إذا كانت حالة أي فيديو قد تغيرت
            for (let i = 0; i < prevVideos.length; i++) {
              if (prevVideos[i].status !== newData[i].status) {
                hasChanges = true;
                break;
              }
            }
          }
          
          // لا تقم بتحديث الشاشة أبداً (ولن ينقطع الفيديو) إلا إذا كان هناك تغيير فعلي!
          return hasChanges ? newData : prevVideos;
        });
      } else {
        // التحديث العادي عند فتح الصفحة أول مرة
        setPreviousVideos(data || []);
      }

    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      if (!isSilent) {
        setIsLoadingVideos(false);
      }
    }
  };
// تأكد من استيراد العميل الخاص بـ supabase في أعلى الملف
// import { supabase } from '@/lib/supabase' // أو حسب المسار الذي تستخدمه

const handleDubbingSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!dubbingFile) {
    setDubbingMessage({ type: 'error', text: 'يرجى اختيار ملف فيديو أولاً' });
    return;
  }

  setIsDubbingProcessing(true);
  setDubbingMessage({ type: 'info', text: 'جاري رفع الفيديو وبدء الطلب...' });
  
  try {
    // 1. رفع الفيديو إلى Storage
    const fileExt = dubbingFile.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos_bucket')
      .upload(filePath, dubbingFile);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('videos_bucket')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 2. إدراج المهمة مباشرة بدون قيود (تخزين الرقم الأكاديمي أو المعرف مباشرة)
const { data: taskData, error: taskError } = await supabase
      .from('dubbing_tasks')
      .insert([
        {
          title: dubbingTitle,
          description: dubbingDescription,
          original_video_url: publicUrl,
          student_id: studentData.id, // 👈 التعديل هنا: عدنا للرقم الأكاديمي
          is_public: shareVideo,
          status: 'pending'
        }
      ])
      .select()   // 👈 1. هذا الأمر يخبر قاعدة البيانات بإرجاع الصف الجديد
      .single();
    if (taskError) throw taskError;

    // 3. إرسال الطلب لخادم البايثون
    const response = await fetch('http://127.0.0.1:8000/api/start-dubbing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskData.id,
        video_url: publicUrl,
      }),
    });

    if (!response.ok) throw new Error('فشل الاتصال بخادم المعالجة');

    setDubbingMessage({ type: 'success', text: 'تم بدء الدبلجة بنجاح! ✨' });
    setDubbingTitle('');
    setDubbingDescription('');
    setDubbingFile(null);
    fetchPreviousVideos();

  } catch (error: any) {
    console.error('Dubbing Error:', error);
    setDubbingMessage({ type: 'error', text: error.message || 'حدث خطأ غير متوقع' });
  } finally {
    setIsDubbingProcessing(false);
  }
};

  return (
    <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.01)] h-full animate-in fade-in slide-in-from-bottom-4 duration-500 rtl:text-right ltr:text-left rtl:dir-rtl ltr:dir-ltr overflow-y-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200/60 pb-4">
        <div className="w-1.5 h-6 rounded-full bg-purple-500" />
        <div>
          <h3 className="text-xl font-black text-slate-900">{t('studioTitle')}</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">{t('studioSubtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* قسم النموذج وإدخال البيانات */}
        <form onSubmit={handleDubbingSubmit} className="md:col-span-3 flex flex-col space-y-5">
          {dubbingMessage.text && (
            <div className={`p-4 rounded-xl text-xs font-bold border ${dubbingMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : dubbingMessage.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-purple-50 text-purple-700 border-purple-200'} animate-in fade-in`}>
              {dubbingMessage.text}
            </div>
          )}

          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('videoTitleLabel')} <span className="text-purple-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder={t('videoTitlePlaceholder')}
              value={dubbingTitle}
              onChange={(e) => setDubbingTitle(e.target.value)}
              className="w-full bg-white/80 focus:bg-white text-slate-800 font-medium p-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-xs outline-none" 
            />
          </div>
          
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('videoDescLabel')} <span className="text-purple-500">*</span></label>
            <textarea 
              required
              rows={3}
              placeholder={t('videoDescPlaceholder')}
              value={dubbingDescription}
              onChange={(e) => setDubbingDescription(e.target.value)}
              className="w-full bg-white/80 focus:bg-white text-slate-800 font-medium p-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-xs outline-none resize-none" 
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('videoFileLabel')} <span className="text-purple-500">*</span></label>
            <input 
              type="file" 
              accept="video/*"
              required
              onChange={(e) => setDubbingFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-white/80 text-slate-600 font-medium p-2.5 rounded-xl border border-slate-200 text-xs outline-none file:rtl:mr-4 file:ltr:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 cursor-pointer" 
            />
          </div>

          {/* زر التبديل */}
          <div className="flex items-center justify-between p-4 bg-purple-50/50 border border-purple-100 rounded-xl mt-2">
            <div className="rtl:text-right ltr:text-left">
              <h4 className="text-[11px] font-black text-slate-800">{t('shareVideoTitle')}</h4>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{t('shareVideoDesc')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShareVideo(!shareVideo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${shareVideo ? 'bg-purple-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${shareVideo ? 'rtl:-translate-x-6 ltr:translate-x-6' : 'rtl:-translate-x-1 ltr:translate-x-1'}`} />
            </button>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isDubbingProcessing}
              className={`w-full font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${isDubbingProcessing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)]'}`}
            >
              {isDubbingProcessing ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"></span>
                  <span>{t('processingBtn')}</span>
                </>
              ) : (
                <>
                  <span>{t('startDubbingBtn')}</span>
                  <span className="text-lg">✨</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* قسم جانبي توضيحي */}
        <div className="md:col-span-2 space-y-4 hidden md:block">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-[-20%] rtl:right-[-20%] ltr:left-[-20%] w-40 h-40 bg-purple-500/30 blur-[40px] rounded-full"></div>
            <div className="relative z-10 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h4 className="text-sm font-black mb-3 text-purple-300">{t('howItWorksTitle')}</h4>
              <ul className="text-[11px] text-slate-300 space-y-3 font-medium rtl:text-right ltr:text-left leading-relaxed list-disc list-inside">
                <li>{t('step1')}</li>
                <li>{t('step2')}</li>
                <li>{t('step3')}</li>
                <li>{t('step4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* --- القسم الجديد: معرض الفيديوهات السابقة --- */}
      <div className="mt-12 pt-8 border-t border-slate-200/60">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <span className="text-purple-600">🎬</span> 
          فيديوهاتي المدبلجة
        </h3>
        
        {isLoadingVideos ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
          </div>
        ) : previousVideos.length === 0 ? (
          <div className="text-center p-10 bg-slate-50/50 border border-slate-200/60 rounded-3xl border-dashed">
            <div className="text-4xl mb-3 opacity-50">📂</div>
            <p className="text-slate-500 font-bold text-sm">لا يوجد فيديو تم دبلجته من قبل.</p>
            <p className="text-slate-400 text-xs mt-1">قم برفع أول فيديو لك وابدأ التجربة!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {previousVideos.map((video) => (
              <div key={video.id} className="bg-white/80 rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3">
                  <h4 className="text-sm font-black text-slate-800 line-clamp-1">{video.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{video.description}</p>
                </div>
                
                {video.status === 'completed' && video.dubbed_video_url ? (
                  <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                    <video src={video.dubbed_video_url} controls className="w-full h-40 object-contain" />  </div>
                ) : video.status === 'failed' ? (
                  <div className="h-40 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 text-rose-500 text-xs font-bold">
                    فشلت عملية الدبلجة ❌
                  </div>
                ) : (
                  <div className="h-40 bg-slate-100 animate-pulse rounded-xl flex flex-col items-center justify-center border border-slate-200">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-purple-500 animate-spin mb-2"></div>
                    <span className="text-xs font-bold text-slate-500">جاري الدبلجة...</span>
                  </div>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${video.is_public ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    {video.is_public ? 'عام 🌍' : 'خاص 🔒'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {new Date(video.created_at).toLocaleDateString('ar-YE')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}