"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UploadCloud, 
  FileText, 
  PlayCircle, 
  BookOpen, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Loader2,
  Building2,
  Layers,
  GraduationCap
} from 'lucide-react';

// 🏛️ التنسيق المعتمد لكليات وأقسام الجامعة
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

interface ResourcesManagerProps {
  adminName?: string;
}

export default function ResourcesManager({ adminName = "الأدمن العام" }: ResourcesManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('accredited_book');
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // 📸 محرك قراءة PDF وتوليد الغلاف من السيرفرات السحابية (HD Quality)
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
        }
      ];

      let currentSourceIndex = 0;
      const tryLoadScript = () => {
        if (currentSourceIndex >= cdnSources.length) return resolve(null);
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
            currentSourceIndex++;
            tryLoadScript();
          }
        };
        script.onerror = () => { currentSourceIndex++; tryLoadScript(); };
        document.head.appendChild(script);
      };

      tryLoadScript();
    });
  };

  // 🎯 اقتناص غلاف الـ PDF بدقة HD
  const generatePdfThumbnail = async (pdfFile: File): Promise<Blob | null> => {
    try {
      const pdfjsLib = await loadPdfJSFromSources();
      if (!pdfjsLib) return null;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) return null;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      await page.render({ canvasContext: context, viewport }).promise;
      return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95));
    } catch (err) {
      console.error("خطأ صامت في اقتناص الغلاف:", err);
      return null;
    }
  };

  // 🎥 اقتناص غلاف مقطع الفيديو
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

  // 🚀 دالة الرفع الموحدة لجدول resources
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !file) {
      return alert('الرجاء كتابة عنوان المرجع واختيار الملف أولاً!');
    }

    setIsUploading(true);
    setStatusMessage('🧠 جاري قراءة الملف واقتناص غلاف عالي الدقة (HD)...');

    try {
      let filePublicUrl = null;
      let thumbnailPublicUrl = null;
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);

      // 1. معالجة الغلاف المؤتمت
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

      // 2. رفع الملف الاصلي
      setStatusMessage('📤 جاري رفع المستند السحابي لمجلد ' + resourceType + '...');
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

      // 3. التوثيق في جدول resources
      setStatusMessage('💾 جاري توثيق المرجع في جدول (resources)...');
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: title,
          file_url: filePublicUrl,
          thumbnail_url: thumbnailPublicUrl,
          resource_type: resourceType,
          level_id: selectedLevel,
          dep_id: selectedDeptId,
          instructor_id: adminName,
          is_visible: isVisible
        });

      if (dbError) throw dbError;

      alert('🎉 تم بث المرجع الدراسي واقتناص الغلاف عالي الدقة بنجاح!');
      setTitle('');
      setFile(null);
    } catch (err: any) {
      alert('❌ فشلت العملية السحابية: ' + err.message);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };

  return (
    <section className="bg-[#0D1629]/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl max-w-3xl mx-auto">
      
      {/* الهيدر والعنوان */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white">
              رفع الكتب والملازم والامتحانات (جدول resources)
            </h3>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
              رفع ومزامنة الأرشيف المركزي برئاسة الأدمن: <span className="text-emerald-400 font-mono">{adminName}</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-5 text-right">
        
        {/* عنوان المرجع */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" /> عنوان المرجع أو المحاضرة الأكاديمية:
          </label>
          <input 
            type="text" 
            placeholder="مثال: هندسة التحكم الآلي - المرجع الرئيسي" 
            className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* الكلية والتخصص والمستوى الدراسي */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" /> الكلية والتخصص المستهدف:
            </label>
            <select 
              className="w-full p-3.5 rounded-xl bg-[#070D19] border border-white/10 text-xs font-black text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
            >
              {universityStructure.map((college) => (
                <optgroup key={college.name} label={`🏛️ ${college.name}`} className="bg-[#0D1629] text-emerald-300 font-bold">
                  {college.departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-[#070D19] text-white font-normal">
                      ➔ {dept.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-400" /> المستوى الدراسي:
            </label>
            <select 
              className="w-full p-3.5 rounded-xl bg-[#070D19] border border-white/10 text-xs font-black text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
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

        {/* تصنيف المرجع */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" /> تصنيف وتبويب المرجع في المكتبة الرقمية:
          </label>
          <select 
            className="w-full p-3.5 rounded-xl bg-[#070D19] border border-white/10 text-xs font-black text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
            value={resourceType} 
            onChange={(e) => setResourceType(e.target.value)}
          >
            <option value="accredited_book">📚 كتاب معتمد مراجع تخصصية (يفتح كشف درجات الطلاب)</option>
            <option value="summary_pdf">📄 ملخص PDF وأوراق محاضرات إضافية (مادة إثرائية مساندة)</option>
            <option value="educational_video">🎥 فيديو تعليمي دراسي مسجل (مادة إثرائية مساندة)</option>
          </select>
        </div>

        {/* مربع drag and drop لاختيار الملف */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            📁 اختيار الملف الفعلي المستهدف للرفع:
          </label>
          <div className="relative border-2 border-dashed border-white/15 hover:border-emerald-500/50 transition-colors rounded-2xl p-6 bg-black/30 flex flex-col items-center justify-center text-center group cursor-pointer">
            <input 
              type="file" 
              accept=".pdf,.mp4"
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-1.5 select-none pointer-events-none flex flex-col items-center">
              {file ? (
                <>
                  {file.type === "application/pdf" ? <FileText className="w-10 h-10 text-amber-400" /> : <PlayCircle className="w-10 h-10 text-emerald-400" />}
                  <span className="text-xs font-black text-white truncate max-w-xs">{file.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    الحجم: {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-xs font-black text-slate-200">اضغط هنا أو اسحب الملف لرفعه مباشرة</span>
                  <span className="text-[10px] text-slate-400 font-bold">يدعم ملفات PDF أو مقاطع فيديو MP4</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* تفعيل النشر المباشر */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between select-none">
          <div className="text-right space-y-0.5">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              {isVisible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
              تفعيل النشر الفوري والمباشر في مكتبة الطلاب؟
            </span>
            <span className="text-[10px] text-slate-400 font-bold block leading-relaxed">
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
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* حالة الرفع الحية */}
        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-300 text-[11px] font-black animate-pulse text-center border border-indigo-500/20 flex items-center justify-center gap-2 select-none">
            <AlertCircle className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* زر الرفع */}
        <button 
          type="submit" 
          disabled={isUploading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-xl text-xs cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>محرك الموازنة السحابي يعمل الآن...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>بث المرجع واقتناص الغلاف آلياً بدقة HD</span>
            </>
          )}
        </button>

      </form>
    </section>
  );
}