"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  UploadCloud, 
  ArrowRight, 
  FileText, 
  PlayCircle, 
  BookOpen, 
  AlertCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react';

// 🤖 1️⃣ استيراد خدمة الذكاء الاصطناعي للمزامنة
import { aiService } from '@/app/service/aiService';

const universityStructure = [
  {
    name: "كلية الهندسة",
    departments: [
      { id: 1, name: "هندسة الحاسبات والتحكم" },
      { id: 2, name: "الهندسة المدنية" },
      { id: 3, name: "الهندسة المعمارية" },
      { id: 4, name: "هندسة الاتصالات" }
    ]
  },
  {
    name: "كلية الطب والعلوم الصحية",
    departments: [
      { id: 5, name: "الطب البشري" },
      { id: 6, name: "المختبرات الطبية" },
      { id: 7, name: "التمريض" }
    ]
  },
  {
    name: "كلية طب الأسنان",
    departments: [
      { id: 8, name: "طب وجراحة الفم والأسنان" }
    ]
  },
  {
    name: "كلية الشريعة والقانون",
    departments: [
      { id: 9, name: "الشريعة والقانون" }
    ]
  },
  {
    name: "كلية التجارة والاقتصاد",
    departments: [
      { id: 10, name: "إدارة الأعمال" },
      { id: 11, name: "المحاسبة" },
      { id: 12, name: "العلوم المالية والمصرفية" }
    ]
  }
];

export default function FacultyUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('accredited_book');
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [currentInstructorId, setCurrentInstructorId] = useState('جاري التعرف...');
  const router = useRouter();

  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true'; 
  const resourceId = searchParams.get('id');

  useEffect(() => {
    const storedUsername = localStorage.getItem('university_username') || localStorage.getItem('faculty_username') || 'دكتور غير معروف';
    setCurrentInstructorId(storedUsername);

    if (isEdit) {
      setTitle(searchParams.get('title') || '');
      setResourceType(searchParams.get('type') || 'accredited_book');
      
      const deptRawValue = searchParams.get('dept') || searchParams.get('dep') || '1';
      const parsedDept = parseInt(deptRawValue);
      setSelectedDeptId(isNaN(parsedDept) ? 1 : parsedDept);

      const levelRawValue = searchParams.get('level') || '1';
      const parsedLevel = parseInt(levelRawValue);
      setSelectedLevel(isNaN(parsedLevel) ? 1 : parsedLevel);

      setIsVisible(searchParams.get('visible') !== 'false'); 
    }
  }, [isEdit, searchParams]);

  const loadPdfJSFromSources = (): Promise<any> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(null);
      if ((window as any).pdfjsLib) return resolve((window as any).pdfjsLib);

      const cdnSources = [
        {
          script: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
          worker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"
        },
        {
          script: "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js",
          worker: "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"
        },
        {
          script: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
          worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        }
      ];

      let currentSourceIndex = 0;

      const tryLoadScript = () => {
        if (currentSourceIndex >= cdnSources.length) {
          console.warn("⚠️ تم استنفاد جميع سيرفرات الـ CDN ولم يتم تحميل محرك الأغلفة؛ سيتم تفعيل التخطي الآمن.");
          return resolve(null);
        }

        const source = cdnSources[currentSourceIndex];
        const oldScript = document.getElementById('pdf-core-cdn');
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.id = 'pdf-core-cdn';
        script.src = source.script;
        
        script.onload = () => {
          const pdfjsLib = (window as any).pdfjsLib;
          if (pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'data:text/javascript;base64,' + btoa('importScripts("' + source.worker + '");');
            resolve(pdfjsLib);
          } else {
            fallbackToNext();
          }
        };

        script.onerror = () => {
          fallbackToNext();
        };

        document.head.appendChild(script);
      };

      const fallbackToNext = () => {
        currentSourceIndex++;
        tryLoadScript();
      };

      tryLoadScript();
    });
  };

 const generatePdfThumbnail = async (pdfFile: File): Promise<Blob | null> => {
  try {
    // مهلة زمنية أقصاها 1.5 ثانية لاقتناص الغلاف، وإذا تأخر يتم التخطي فوراً دون تعليق الرفع
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    
    const renderPromise = (async () => {
      const pdfjsLib = await loadPdfJSFromSources();
      if (!pdfjsLib) return null;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) return null;
      await page.render({ canvasContext: context, viewport }).promise;

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
      });
    })();

    return await Promise.race([renderPromise, timeoutPromise]);
  } catch (err) {
    console.warn("تخطي صامت للغلاف لضمان سرعة الرفع:", err);
    return null;
  }
};

  const generateVideoThumbnail = async (videoFile: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.currentTime = 1;
      video.muted = true;
      video.playsInline = true;

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src);
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
      video.onerror = () => resolve(null);
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const instructorUsername = localStorage.getItem('university_username') || localStorage.getItem('faculty_username');
    if (!instructorUsername) {
      return alert('⚠️ خطأ في الجلسة: الرجاء تسجيل الدخول أولاً ليتم التعرف على هويتك الأكاديمية ونشر الملف باسمك الحقيقي!');
    }

    if (!title || (!file && !isEdit)) {
      return alert('الرجاء كتابة عنوان المحاضرة واختيار الملف أولاً!');
    }

    setIsUploading(true);
    setStatusMessage('🧠 جاري معالجة البيانات وبث التحديثات سحابياً...');
    
    try {
      let filePublicUrl = null;
      let thumbnailPublicUrl = null;
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);

      if (file) {
        setStatusMessage('📸 جاري قراءة الملف واقتناص غلاف عالي الدقة (HD)...');
        let thumbnailBlob: Blob | null = null;
        if (file.type === 'application/pdf') {
          thumbnailBlob = await generatePdfThumbnail(file);
        } else if (file.type.startsWith('video/')) {
          thumbnailBlob = await generateVideoThumbnail(file);
        }

        if (thumbnailBlob) {
          const thumbPath = `thumbnails/${timestamp}_${randomStr}.jpg`;
          const { error: thumbError } = await supabase.storage
            .from('university-files')
            .upload(thumbPath, thumbnailBlob, { contentType: 'image/jpeg' });

          if (!thumbError) {
            const { data: { publicUrl } } = supabase.storage
              .from('university-files')
              .getPublicUrl(thumbPath);
            thumbnailPublicUrl = publicUrl;
          }
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${resourceType}/${timestamp}_${randomStr}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('university-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: fUrl } } = supabase.storage
          .from('university-files')
          .getPublicUrl(filePath);
        filePublicUrl = fUrl;
      }

      setStatusMessage('💾 جاري توثيق السجلات وربط المرجع بالمعرف الأكاديمي...');
      let dbError = null;

      if (isEdit) {
        const { error } = await supabase
          .from('resources')
          .update({
            title: title,
            resource_type: resourceType,
            level_id: selectedLevel,        
            dep_id: selectedDeptId, 
            is_visible: isVisible,          
            ...(filePublicUrl && { file_url: filePublicUrl }),
            ...(thumbnailPublicUrl && { thumbnail_url: thumbnailPublicUrl })
          })
          .eq('id', parseInt(resourceId || '0')); 
        
        dbError = error;
      } else {
        const { error } = await supabase
          .from('resources')
          .insert({
            title: title,
            file_url: filePublicUrl,
            thumbnail_url: thumbnailPublicUrl, 
            resource_type: resourceType,
            level_id: selectedLevel,       
            dep_id: selectedDeptId, 
            instructor_id: instructorUsername, 
            is_visible: isVisible          
          });
        
        dbError = error;
      }

      if (dbError) throw dbError;

      // 🤖 2️⃣ التكشيف الذكي الآلي: إذا كان الملف المرفوع PDF يتم إرساله لسيرفر FastAPI
      // 🤖 2️⃣ التكشيف الذكي الآلي: إرسال الملف مع كافة البيانات الوصفية لسيرفر الذكاء الاصطناعي
if (file && file.type === 'application/pdf') {
  try {
    setStatusMessage('🤖 جاري إرسال المنهج وتكشيفه بداخل سيرفر الذكاء الاصطناعي...');
    
    // 🎯 تمرير كافة البيانات الوصفية لضمان ربطه بالمستوى والقسم والمسمى
    await aiService.syncCurriculum({
      file: file,
      title: title,
      dep_id: selectedDeptId,
      level_id: selectedLevel,
      resource_type: resourceType
    });

  } catch (aiErr: any) {
    console.error("❌ فشل التكشيف في سيرفر الذكاء الاصطناعي:", aiErr);
    alert("⚠️ تم حفظ الملف في قواعد البيانات، لكن تعذر تكشيفه بداخل سيرفر الذكاء الاصطناعي. تأكد من تشغيل FastAPI!");
  }
}
      alert(isEdit ? '🎉 تم تحديث بيانات المرجع بنجاح!' : '🎉 تم بث المرجع الدراسي واقتناص الغلاف وتكشيفه بداخل محرك الذكاء الاصطناعي بنجاح!');
      router.push('/faculty'); 
    } catch (err: any) {
      alert('❌ فشلت العملية السحابية: ' + err.message);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8 flex flex-col justify-between items-center font-sans relative overflow-hidden" dir="rtl">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-[130px] top-[-10%] right-[-10%]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-[120px] bottom-[-10%] left-[-10%]" />
      </div>

      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200/60 space-y-6 relative z-10 my-auto">
        
        <div className="border-b border-slate-100 pb-4 flex justify-between items-center select-none">
          <div className="text-right">
            <h1 className="text-base md:text-lg font-black text-[#0A2540] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" /> الرفع الأكاديمي المؤتمت للوسائط
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-0.5">
              المعرف الحالي للدكتور: <span className="font-mono text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-md">{currentInstructorId}</span>
            </p>
          </div>
          <Link href="/faculty" className="text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1">
            إلغاء والعودة <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        <form onSubmit={handleUpload} className="space-y-5 text-right">
          
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">📝 عنوان المرجع أو المحاضرة الأكاديمية:</label>
            <input 
              type="text" 
              placeholder="مثال: هندسة التحكم الآلي - الفصل الثاني" 
              className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none bg-white shadow-inner focus:border-indigo-500/40 transition-colors"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1">🏛️ الكلية والتخصص المستهدف لفرز المرجع:</label>
              <select 
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-black bg-white text-slate-800 focus:outline-none focus:border-indigo-500/40 transition-all cursor-pointer"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
              >
                {universityStructure.map((college) => (
                  <optgroup key={college.name} label={`🏛️ ${college.name}`}>
                    {college.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        ➔ {dept.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1">📈 الفرز حسب المستوى الدراسي:</label>
              <select 
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-black bg-white text-slate-800 focus:outline-none focus:border-indigo-500/40 transition-all cursor-pointer"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
              >
                <option value="1">المستوى الأول</option>
                <option value="2">المستوى الثاني</option>
                <option value="3">المستوى الثالث</option>
                <option value="4">المستوى الرابع</option>
                <option value="5">المستوى الخامس</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">🏷️ تصنيف وتبويب المرجع في المكتبة الرقمية:</label>
            <select 
              className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-black bg-white text-slate-800 focus:outline-none focus:border-indigo-500/40 transition-all cursor-pointer"
              value={resourceType} 
              onChange={(e) => setResourceType(e.target.value)}
            >
              <option value="accredited_book">📚 كتاب معتمد مراجع تخصصية (يفتح كشف درجات الطلاب)</option>
              <option value="summary_pdf">📄 ملخص PDF وأوراق محاضرات إضافية (مادة إثرائية مساندة)</option>
              <option value="educational_video">🎥 فيديو تعليمي دراسي مسجل (مادة إثرائية مساندة)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">📁 اختيار الملف الفعلي المستهدف للرفع:</label>
            <div className="relative border-2 border-dashed border-slate-200/80 hover:border-indigo-500/40 transition-colors rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center text-center group cursor-pointer">
              <input 
                type="file" 
                accept=".pdf,.mp4"
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="space-y-1 select-none pointer-events-none flex flex-col items-center">
                {file ? (
                  <>
                    {file.type === "application/pdf" ? <FileText className="w-8 h-8 text-amber-500" /> : <PlayCircle className="w-8 h-8 text-emerald-500" />}
                    <span className="text-xs font-extrabold text-slate-900 truncate max-w-xs">{file.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">الحجم: {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-xs font-black text-slate-700">اضغط هنا أو اسحب الملف لرفعه مباشرة</span>
                    <span className="text-[10px] text-slate-400 font-bold">يدعم ملفات PDF أو مقاطع فيديو MP4</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between select-none">
            <div className="text-right space-y-0.5">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                {isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                تفعيل النشر الفوري والمباشر في مكتبة الطلاب؟
              </span>
              <span className="text-[10px] text-slate-500 font-bold block leading-relaxed">
                عند إيقاف المفتاح، سيحفظ المرجع كـ "مسودة صامتة" ولن يظهر للطالب حتى تقوم بتفعيله.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isVisible} 
                onChange={(e) => setIsVisible(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-black animate-pulse text-center border border-blue-100 flex items-center justify-center gap-2 select-none">
              <AlertCircle className="w-4 h-4 text-blue-600 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-[#0A2540] to-[#0E3354] hover:opacity-95 text-white font-black py-4 rounded-xl text-xs cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
          >
            {isUploading ? '⏳ محرك الموازنة السحابي يعمل الآن...' : '🚀 بث المرجع واقتناص الغلاف وتكشيفه آلياً بالذكاء الاصطناعي'}
          </button>

        </form>
      </div>

      <footer className="text-[9px] font-mono tracking-widest text-slate-400 select-none mt-4">
        REGIONAL FILE CONVERSION METADATA CONTROLLER // ACCESS OK
      </footer>
    </div>
  );
}