"use client";

import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  Archive,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  User,
  X
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
// 1️⃣ خريطة مسميات المستويات
const levelNamesMap: Record<number, string> = {
  1: "المستوى الأول",
  2: "المستوى الثاني",
  3: "المستوى الثالث",
  4: "المستوى الرابع",
  5: "المستوى الخامس",
  6: "المستوى السادس",
  7: "المستوى السابع"
};

// 2️⃣ دالة تحديد أقصى عدد مستويات بناءً على القسم المختار
const getMaxLevels = (depId: number | string): number => {
  if (depId === 'all' || !depId) return 7;
  
  const numId = Number(depId);
  if ([1, 2, 3, 4].includes(numId)) return 5; // كلية الهندسة (5 سنوات)
  if (numId === 8) return 5;                  // طب وجراحة الفم والأسنان (5 سنوات)
  if (numId === 5) return 7;                  // الطب البشري (7 سنوات)
  
  return 4;                                   // باقي الكليات والأقسام (4 سنوات)
};

const resourceTypeLabels: Record<string, string> = {
  accredited_book: '📚 كتاب معتمد',
  summary_pdf: '📄 ملخص PDF',
  educational_video: '🎥 فيديو دراسي'
};

interface ResourcesManagerProps {
  adminName?: string;
}

export default function ResourcesManager({ adminName = "الأدمن العام" }: ResourcesManagerProps) {
  // حالة عناصر النموذج والتعديل
  const [editingId, setEditingId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('accredited_book');
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);

  // حالة النافذة المنبثقة للأرشيف والبحث
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);


  const [instructorsMap, setInstructorsMap] = useState<Record<string, string>>({});

useEffect(() => {
  const fetchInstructorsMap = async () => {
    const { data } = await supabase.from('instructors').select('id, name');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((ins) => {
        map[String(ins.id)] = ins.name;
      });
      setInstructorsMap(map);
    }
  };
  fetchInstructorsMap();
}, []);

  // جلب قائمة المراجع المأرشفة حياً
  const fetchResourcesList = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResourcesList(data);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    fetchResourcesList();
  }, []);

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

  // ✏️ بدء عملية التعديل على مرجع مأرشف
  const handleStartEdit = (res: any) => {
    setEditingId(res.id);
    setTitle(res.title || '');
    setResourceType(res.resource_type || 'accredited_book');
    setSelectedDeptId(res.dep_id || 1);
    setSelectedLevel(res.level_id || 1);
    setIsVisible(res.is_visible ?? true);
    setExistingFileUrl(res.file_url || null);
    setExistingThumbnailUrl(res.thumbnail_url || null);

    setFile(null);
    setShowArchiveModal(false);
  };

  // إلغاء وضع التعديل والعودة للإضافة
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setFile(null);
    setExistingFileUrl(null);
    setExistingThumbnailUrl(null);
  };

  // 🚀 دالة الرفع والتعديل الموحدة لجدول resources
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      return alert('الرجاء كتابة عنوان المرجع الأكاديمي!');
    }

    if (!editingId && !file) {
      return alert('الرجاء اختيار الملف الفعلي المستهدف للرفع أولاً!');
    }

    setIsUploading(true);
    setStatusMessage(editingId ? '🔄 جاري تحديث بيانات المرجع...' : '🧠 جاري قراءة الملف واقتناص غلاف عالي الدقة (HD)...');

    try {
      let filePublicUrl = existingFileUrl;
      let thumbnailPublicUrl = existingThumbnailUrl;
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);

      // في حال قام المستخدم برفع ملف جديد عند التعديل أو الإضافة
      if (file) {
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
      }

      const payload = {
        title: title,
        file_url: filePublicUrl,
        thumbnail_url: thumbnailPublicUrl,
        resource_type: resourceType,
        level_id: selectedLevel,
        dep_id: selectedDeptId,
        instructor_id: adminName,
        is_visible: isVisible
      };

      if (editingId) {
        // تحديث مرجع قديم
        const { error: dbError } = await supabase
          .from('resources')
          .update(payload)
          .eq('id', editingId);

        if (dbError) throw dbError;
        alert('🎉 تم تحديث المرجع الدراسي والأرشيف بنجاح!');
      } else {
        // إضافة مرجع جديد
        setStatusMessage('💾 جاري توثيق المرجع في جدول (resources)...');
        const { error: dbError } = await supabase
          .from('resources')
          .insert(payload);

        if (dbError) throw dbError;
        alert('🎉 تم بث المرجع الدراسي واقتناص الغلاف عالي الدقة بنجاح!');
      }

      handleCancelEdit();
      fetchResourcesList();
    } catch (err: any) {
      alert('❌ فشلت العملية السحابية: ' + err.message);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };

  // 🗑️ الحذف النهائي من الأرشيف
  const handleDeleteResource = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرجع النهائي من الأرشيف؟')) return;

    setResourcesList(prev => prev.filter(item => item.id !== id));
    const { error } = await supabase.from('resources').delete().eq('id', id);

    if (error) {
      alert('❌ فشلت عملية الحذف من السيرفر');
      fetchResourcesList();
    }
  };

  // 👁️ التبديل الفوري لحالة العرض والمناقلة
  const handleToggleVisibility = async (id: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setResourcesList(prev => prev.map(item => item.id === id ? { ...item, is_visible: nextStatus } : item));

    await supabase.from('resources').update({ is_visible: nextStatus }).eq('id', id);
  };

  // تصفية نتائج البحث بداخل نافذة الأرشيف
  const filteredArchive = resourcesList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.resource_type?.toLowerCase().includes(q) ||
      item.id?.toString().includes(q)
    );
  });
return (
    <section className="bg-[#edf2ee] border border-[#d2ded6] rounded-[2.5rem] p-6 md:p-8 shadow-xl max-w-3xl mx-auto relative dir-rtl text-right font-sans">
      
      {/* الهيدر والعنوان + زر الأرشيف */}
      <div className="flex items-center justify-between pb-4 border-b border-[#d8e3dd] mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#00bc7e]/15 border border-[#00bc7e]/30 flex items-center justify-center text-[#059669]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-[#062c35] flex items-center gap-2">
              {editingId ? "تعديل المرجع الأكاديمي المأرشف" : "رفع الكتب والملازم والامتحانات (جدول resources)"}
              {editingId && <span className="text-[10px] bg-amber-500/15 text-amber-800 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono font-bold">MODE_EDIT #{editingId}</span>}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              رفع ومزامنة الأرشيف المركزي برئاسة الأدمن: <span className="text-[#059669] font-mono font-black">{adminName}</span>
            </p>
          </div>
        </div>

        {/* 📦 أيقونة فتح الأرشيف المباشر */}
        <button 
          type="button"
          onClick={() => setShowArchiveModal(true)} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00bc7e]/15 hover:bg-[#00bc7e]/25 border border-[#00bc7e]/30 text-[#059669] hover:text-[#062c35] font-black text-xs transition-all cursor-pointer shadow-sm"
        >
          <Archive className="w-4 h-4 text-[#059669]" />
          <span>فتح الأرشيف والمراجع ({resourcesList.length})</span>
        </button>
      </div>

      <form onSubmit={handleSaveResource} className="space-y-5 text-right">
        
        {editingId && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-900">
            <span>أنت الآن في وضع التعديل للمرجع المأرشف. يمكنك تعديل الحقول أو استبدال الملف.</span>
            <button type="button" onClick={handleCancelEdit} className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer">إلغاء التعديل</button>
          </div>
        )}

        {/* عنوان المرجع */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#059669]" /> عنوان المرجع أو المحاضرة الأكاديمية:
          </label>
          <input 
            type="text" 
            placeholder="مثال: هندسة التحكم الآلي - المرجع الرئيسي" 
            className="w-full p-3.5 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] focus:outline-none focus:border-[#059669] transition-colors"
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

       <div>
  <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
    <Building2 className="w-4 h-4 text-[#059669]" /> الكلية والتخصص المستهدف:
  </label>
  <select 
    className="w-full p-3.5 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-black text-[#062c35] focus:outline-none focus:border-[#059669] transition-all cursor-pointer"
    value={selectedDeptId}
    onChange={(e) => {
      const newDeptId = parseInt(e.target.value);
      setSelectedDeptId(newDeptId);
      // 🔄 إعادة ضبط المستوى إلى الأول تلقائياً في حال تجاوز الحد الأقصى للقسم الجديد
      if (selectedLevel > getMaxLevels(newDeptId)) {
        setSelectedLevel(1);
      }
    }}
  >
    {universityStructure.map((college) => (
      <optgroup key={college.name} label={`🏛️ ${college.name}`} className="bg-white text-[#059669] font-bold">
        {college.departments.map((dept) => (
          <option key={dept.id} value={dept.id} className="bg-white text-slate-800 font-normal">
            ➔ {dept.name}
          </option>
        ))}
      </optgroup>
    ))}
  </select>
</div>


          <div className="space-y-1.5">
  <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
    <GraduationCap className="w-4 h-4 text-[#059669]" /> المستوى الدراسي المستهدف:
  </label>
  <select 
    className="w-full p-3.5 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-black text-[#062c35] focus:outline-none focus:border-[#059669] transition-all cursor-pointer"
    value={selectedLevel}
    onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
  >
    {Array.from({ length: getMaxLevels(selectedDeptId) }, (_, i) => i + 1).map((lvl) => (
      <option key={lvl} value={lvl}>
        {levelNamesMap[lvl]}
      </option>
    ))}
  </select>
</div>
        

        {/* تصنيف المرجع */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#059669]" /> تصنيف وتبويب المرجع في المكتبة الرقمية:
          </label>
          <select 
            className="w-full p-3.5 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-black text-[#062c35] focus:outline-none focus:border-[#059669] transition-all cursor-pointer"
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
          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            📁 اختيار الملف الفعلي المستهدف للرفع:
          </label>
          <div className="relative border-2 border-dashed border-[#cde0d5] hover:border-[#059669] transition-colors rounded-2xl p-6 bg-white flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs">
            <input 
              type="file" 
              accept=".pdf,.mp4"
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-1.5 select-none pointer-events-none flex flex-col items-center">
              {file ? (
                <>
                  {file.type === "application/pdf" ? <FileText className="w-10 h-10 text-amber-600" /> : <PlayCircle className="w-10 h-10 text-[#059669]" />}
                  <span className="text-xs font-black text-[#062c35] truncate max-w-xs">{file.name}</span>
                  <span className="text-[10px] text-[#059669] font-mono font-bold bg-[#00bc7e]/15 border border-[#00bc7e]/30 px-2 py-0.5 rounded-md">
                    الحجم: {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </>
              ) : existingFileUrl ? (
                <>
                  <FileText className="w-10 h-10 text-[#059669]" />
                  <span className="text-xs font-black text-[#059669]">يوجد ملف مأرشف سابقاً لهذا المرجع</span>
                  <span className="text-[10px] text-slate-500">اضغط هنا لاستبداله بملف جديد إن أردت</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-[#059669] transition-colors" />
                  <span className="text-xs font-black text-slate-700">اضغط هنا أو اسحب الملف لرفعه مباشرة</span>
                  <span className="text-[10px] text-slate-400 font-bold">يدعم ملفات PDF أو مقاطع فيديو MP4</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* تفعيل النشر المباشر */}
        <div className="p-4 rounded-2xl bg-white border border-[#d8e3dd] flex items-center justify-between select-none shadow-xs">
          <div className="text-right space-y-0.5">
            <span className="text-xs font-black text-[#062c35] flex items-center gap-1.5">
              {isVisible ? <Eye className="w-4 h-4 text-[#059669]" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
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
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#059669]"></div>
          </label>
        </div>

        {/* حالة الرفع الحية */}
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-[#059669] text-[11px] font-black animate-pulse text-center border border-emerald-500/20 flex items-center justify-center gap-2 select-none">
            <AlertCircle className="w-4 h-4 text-[#059669] animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* زر الرفع والتعديل */}
        <div className="flex items-center gap-3">
          <button 
            type="submit" 
            disabled={isUploading}
            className="flex-1 bg-gradient-to-r from-[#059669] to-[#00bc7e] hover:from-[#047857] hover:to-[#059669] text-white font-black py-4 rounded-2xl text-xs cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>محرك الموازنة السحابي يعمل الآن...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>{editingId ? "تحديث المرجع العلمي" : "بث المرجع واقتناص الغلاف آلياً بدقة HD"}</span>
              </>
            )}
          </button>

          {editingId && (
            <button 
              type="button" 
              onClick={handleCancelEdit} 
              className="px-5 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer"
            >
              إلغاء
            </button>
          )}
        </div>

      </form>
{/* 📦 النافذة المنبثقة الشفافة للأرشيف والشاملة لمربع البحث وأيقونة التعديل واسم الدكتور */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white border border-[#d8e3dd] rounded-3xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col justify-between shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* رأس نافذة الأرشيف */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-[#059669]" />
                  <h4 className="text-sm font-black text-[#062c35]">المستودع المأرشف للكتب والملازم ({resourcesList.length})</h4>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowArchiveModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 🔍 مربع البحث الفوري */}
              <div className="my-4">
                <div className="relative flex items-center bg-[#f4f7f5] border border-[#cde0d5] rounded-2xl px-3.5 py-2.5 focus-within:border-[#059669]">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المرجع، الدكتور، تصنيف الملف أو المعرف..." 
                    className="w-full bg-transparent text-xs text-[#062c35] placeholder-slate-400 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                </div>
              </div>
            </div>

            {/* قائمة المراجع المأرشفة */}
            <div className="flex-grow overflow-y-auto space-y-2.5 my-2 pr-1">
              {loadingList ? (
                <p className="text-center text-xs text-slate-500 animate-pulse py-8">جاري استدعاء المراجع المأرشفة...</p>
              ) : filteredArchive.length > 0 ? (
                filteredArchive.map((res) => (
                  <div 
                    key={res.id} 
                    className="p-3.5 rounded-2xl bg-white border border-[#d8e3dd] flex items-center justify-between gap-3 hover:border-[#059669]/40 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {res.thumbnail_url ? (
                        <img src={res.thumbnail_url} alt="Cover" className="w-10 h-10 rounded-xl object-cover border border-[#d8e3dd] flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#00bc7e]/10 border border-[#00bc7e]/20 text-[#059669] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <h5 className="text-xs font-black text-[#062c35] truncate">{res.title}</h5>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {/* 👤 الشارة الجديدة لاسم الدكتور / أستاذ المادة */}
                         <span className="text-[9.5px] font-black text-[#059669] bg-[#00bc7e]/10 border border-[#00bc7e]/25 px-2 py-0.5 rounded-md flex items-center gap-1">
  <User className="w-3 h-3 text-[#059669]" />
  <span>{instructorsMap[String(res.instructor_id)] || res.instructor_id || 'غير محدد'}</span>
</span>

                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                            {resourceTypeLabels[res.resource_type] || res.resource_type}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">المستوى: {res.level_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* ✏️ أيقونة التعديل */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(res)}
                        className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 hover:bg-sky-500/20 transition-all cursor-pointer"
                        title="تعديل بيانات المرجع"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* 👁️ أيقونة الإخفاء/الإظهار */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(res.id, res.is_visible)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          res.is_visible 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-[#059669]' 
                            : 'bg-slate-100 border-slate-300 text-slate-400'
                        }`}
                        title={res.is_visible ? "متاح للطلاب (اضغط للإخفاء)" : "مخفي عن الطلاب (اضغط للإظهار)"}
                      >
                        {res.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* 🗑️ أيقونة الحذف */}
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(res.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="حذف المرجع نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-8 font-bold">لا توجد مراجع مأرشفة مطابقة للبحث.</p>
              )}
            </div>

            {/* أزرار الإغلاق والتحديث */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-mono">
              <button 
                type="button" 
                onClick={fetchResourcesList} 
                className="flex items-center gap-1 text-[#059669] font-bold hover:underline transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> إعادة تحديث السجلات
              </button>
              <button 
                type="button" 
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-[#062c35] hover:bg-[#093d49] text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
  
}