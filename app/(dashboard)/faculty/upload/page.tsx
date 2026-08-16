"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
  UploadCloud, 
  ArrowRight, 
  FileText, 
  PlayCircle, 
  BookOpen, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Building2,
  GraduationCap,
} from 'lucide-react';

// 🤖 استيراد خدمة الذكاء الاصطناعي للمزامنة
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

const levelNamesMap: Record<number, string> = {
  1: "المستوى الأول",
  2: "المستوى الثاني",
  3: "المستوى الثالث",
  4: "المستوى الرابع",
  5: "المستوى الخامس",
  6: "المستوى السادس",
  7: "المستوى السابع"
};

const getMaxLevels = (depId: number | string): number => {
  if (depId === 'all' || !depId) return 7;
  
  const numId = Number(depId);
  if ([1, 2, 3, 4].includes(numId)) return 5;
  if (numId === 8) return 5;
  if (numId === 5) return 7;
  
  return 4;
};

function FacultyUploadContent() {
  const t = useTranslations('FacultyUpload');
  const tGlobal = useTranslations('RegistrationDetails');

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('accredited_book');
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [currentInstructorId, setCurrentInstructorId] = useState(t('identifying'));
  const [doctorRealName, setDoctorRealName] = useState('');
  const router = useRouter();

  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true'; 
  const resourceId = searchParams.get('id');

  useEffect(() => {
    const storedUsername = localStorage.getItem('university_username') || localStorage.getItem('faculty_username') || '';
    setCurrentInstructorId(storedUsername || t('identifying'));

    const fetchDoctorName = async () => {
      if (!storedUsername) return;
      const numericId = parseInt(storedUsername);
      if (isNaN(numericId)) return;

      const { data } = await supabase
        .from('instructors')
        .select('name')
        .eq('id', numericId)
        .single();

      if (data && data.name) {
        setDoctorRealName(data.name);
        localStorage.setItem('faculty_name', data.name);
      }
    };

    fetchDoctorName();

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
  }, [isEdit, searchParams, t]);

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
    
    const doctorFullName = 
      localStorage.getItem('faculty_name') || 
      localStorage.getItem('university_fullname') || 
      localStorage.getItem('user_fullname') || 
      localStorage.getItem('university_username') || 
      'دكتور غير معروف';

    const instructorUsername = 
      localStorage.getItem('university_username') || 
      localStorage.getItem('faculty_username') || 
      doctorFullName;

    if (!instructorUsername) {
      return alert(t('alertSessionError'));
    }

    setIsUploading(true);
    setStatusMessage(t('statusProcessing'));
    
    try {
      let filePublicUrl = null;
      let thumbnailPublicUrl = null;
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);

      if (file) {
        setStatusMessage(t('statusThumbnail'));
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

      setStatusMessage(t('statusSavingDb'));
      let dbError = null;

      if (isEdit) {
        const { error } = await supabase
          .from('resources')
          .update({
            title: title,
            instructor_id: currentInstructorId,
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
            instructor_id: currentInstructorId,
            file_url: filePublicUrl,
            thumbnail_url: thumbnailPublicUrl, 
            resource_type: resourceType,
            level_id: selectedLevel,       
            dep_id: selectedDeptId, 
            is_visible: isVisible          
          });
        
        dbError = error;
      }
      
      if (dbError) throw dbError;

      // 🤖 التكشيف الذكي الآلي
      if (file && file.type === 'application/pdf') {
        try {
          setStatusMessage(t('statusAiSync'));
          
          await aiService.syncCurriculum({
            file: file,
            title: title,
            dep_id: selectedDeptId,
            level_id: selectedLevel,
            resource_type: resourceType
          });

        } catch (aiErr: any) {
          console.error("❌ فشل التكشيف في سيرفر الذكاء الاصطناعي:", aiErr);
          alert(t('alertAiFailed'));
        }
      }
      
      alert(isEdit ? t('alertUpdateSuccess') : t('alertUploadSuccess'));
      router.push('/faculty'); 
    } catch (err: any) {
      alert(t('alertFailed') + err.message);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8 flex flex-col justify-between items-center font-sans relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-[130px] top-[-10%] end-[-10%]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-[120px] bottom-[-10%] start-[-10%]" />
      </div>

      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200/60 space-y-6 relative z-10 my-auto">
        
        <div className="border-b border-slate-100 pb-4 flex justify-between items-center select-none">
          <div className="text-start">
            <h1 className="text-base md:text-lg font-black text-[#0A2540] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" /> {t('title')}
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-0.5">
              {t('instructorIdLabel')} <span className="font-mono text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-md">{currentInstructorId}</span>
            </p>
          </div>
          <Link href="/faculty" className="text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1">
            {t('cancelBtn')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        <form onSubmit={handleUpload} className="space-y-5 text-start">
          
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">{t('titleLabel')}</label>
            <input 
              type="text" 
              placeholder={t('titlePlaceholder')} 
              className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none bg-white shadow-inner focus:border-indigo-500/40 transition-colors"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#059669]" /> {t('deptLabel')}
            </label>
            <select 
              className="w-full p-3.5 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-black text-[#062c35] focus:outline-none focus:border-[#059669] transition-all cursor-pointer"
              value={selectedDeptId}
              onChange={(e) => {
                const newDeptId = parseInt(e.target.value);
                setSelectedDeptId(newDeptId);
                if (selectedLevel > getMaxLevels(newDeptId)) {
                  setSelectedLevel(1);
                }
              }}
            >
              {universityStructure.map((college, cIdx) => (
                <optgroup key={college.name} label={`🏛️ ${tGlobal(`colleges.${cIdx + 1}` as any) || college.name}`} className="bg-white text-[#059669] font-bold">
                  {college.departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-white text-slate-800 font-normal">
                      ➔ {tGlobal(`departments.${dept.id}` as any) || dept.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#059669]" /> {t('levelLabel')}
            </label>
            <select 
              className="w-full p-3.5 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-black text-[#062c35] focus:outline-none focus:border-[#059669] transition-all cursor-pointer"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
            >
              {Array.from({ length: getMaxLevels(selectedDeptId) }, (_, i) => i + 1).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {tGlobal(`levels.${lvl}` as any) || levelNamesMap[lvl]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">{t('typeLabel')}</label>
            <select 
              className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-black bg-white text-slate-800 focus:outline-none focus:border-indigo-500/40 transition-all cursor-pointer"
              value={resourceType} 
              onChange={(e) => setResourceType(e.target.value)}
            >
              <option value="accredited_book">{t('typeAccreditedBook')}</option>
              <option value="summary_pdf">{t('typeSummaryPdf')}</option>
              <option value="educational_video">{t('typeEducationalVideo')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">{t('fileLabel')}</label>
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
                    <span className="text-[10px] text-slate-400 font-mono">{t('sizeLabel')} {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-xs font-black text-slate-700">{t('fileDropText')}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{t('fileSupportedFormats')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between select-none">
            <div className="text-start space-y-0.5">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                {isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                {t('publishToggleLabel')}
              </span>
              <span className="text-[10px] text-slate-500 font-bold block leading-relaxed">
                {t('publishToggleDesc')}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isVisible} 
                onChange={(e) => setIsVisible(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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
            {isUploading ? t('uploadingBtn') : t('submitBtn')}
          </button>

        </form>
      </div>

      <footer className="text-[9px] font-mono tracking-widest text-slate-400 select-none mt-4">
        REGIONAL FILE CONVERSION METADATA CONTROLLER // ACCESS OK
      </footer>
    </div>
  );
}

export default function FacultyUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center text-slate-500 text-xs font-mono">
        INITIALIZING MEDIA UPLOADER NODE...
      </div>
    }>
      <FacultyUploadContent />
    </Suspense>
  );
}