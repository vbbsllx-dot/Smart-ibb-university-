"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FolderGit2, 
  UploadCloud, 
  Loader2, 
  FileText, 
  FileArchive, 
  Building2, 
  User, 
  Users, 
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Sparkles,
  Search,
  Pencil,
  Archive,
  X,
  CheckCircle2
} from 'lucide-react';

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
    name: "كلية العلوم والتكنولوجيا",
    departments: [
      { id: 5, name: "علوم الحاسوب وتكنولوجيا المعلومات" },
      { id: 6, name: "الأمن السيبراني" }
    ]
  },
  {
    name: "كلية التجارة والاقتصاد",
    departments: [
      { id: 10, name: "إدارة الأعمال" },
      { id: 11, name: "المحاسبة" }
    ]
  }
];

export default function ProjectsManager() {
  // حالة نموذج الإدخال والتعديل
  const [editingId, setEditingId] = useState<number | null>(null); // معرف المشروع الجاري تعديله
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number>(1);
  const [supervisor, setSupervisor] = useState('');
  const [studentsNames, setStudentsNames] = useState('');
  const [graduationYear, setGraduationYear] = useState<string>(new Date().getFullYear().toString());
  const [projectDesc, setProjectDesc] = useState('');
  
  // الملفات والروابط المخزنة
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [existingZipUrl, setExistingZipUrl] = useState<string | null>(null);
  
  const [isVisible, setIsVisible] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // حالة الأرشيف ونافذة التصفح والبحث
  const [showArchiveModal, setShowArchiveModal] = useState(false); // التحكم بفتح وإغلاق الأرشيف
  const [searchQuery, setSearchQuery] = useState(''); // شريط البحث
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // جلب قائمة الأرشيف
  const fetchProjectsList = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('graduation_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjectsList(data);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    fetchProjectsList();
  }, []);

  // ✏️ بدء عملية التعديل على مشروع مأرشف
  const handleStartEdit = (proj: any) => {
    setEditingId(proj.id);
    setProjectTitle(proj.title || '');
    setSelectedDeptId(proj.dep_id || 1);
    setSupervisor(proj.supervisor_name || proj.supervisor_names || '');
    setStudentsNames(proj.student_names || proj.students_names || '');
    setGraduationYear(proj.year || new Date().getFullYear().toString());
    setProjectDesc(proj.abstract || proj.description || '');
    setIsVisible(proj.is_visible ?? true);
    setExistingPdfUrl(proj.file_url || proj.pdf_file_url || null);
    setExistingZipUrl(proj.zip_file_url || null);
    
    setPdfFile(null);
    setZipFile(null);
    setShowArchiveModal(false); // إغلاق النافذة للتركيز على التعديل
  };

  // إلغاء الوضعية والإعادة للجديد
  const handleCancelEdit = () => {
    setEditingId(null);
    setProjectTitle('');
    setSupervisor('');
    setStudentsNames('');
    setProjectDesc('');
    setPdfFile(null);
    setZipFile(null);
    setExistingPdfUrl(null);
    setExistingZipUrl(null);
  };
  const validateFileExtension = (file: File, allowedExtensions: string[]) => {
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some(ext => fileName.endsWith(ext));
};

  // 🚀 حفظ المرفوع سواء (إضافة جديد أو تحديث مشروع)
  const handleSaveProject = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1. قائمة التحقق من الحقول المطلوبة
  const requiredFields = [
    { value: projectTitle, message: "الرجاء كتابة عنوان المشروع!" },
    { value: projectDesc, message: "الرجاء كتابة ملخص المشروع (Abstract)!" },
    { value: studentsNames, message: "الرجاء إدخال أسماء الطلاب!" },
    { value: supervisor, message: "الرجاء إدخال اسم مشرف المشروع!" },
    { value: graduationYear, message: "الرجاء إدخال سنة التخرج!" },
  ];

  // 2. التحقق من أن الحقول ليست فارغة
  for (const field of requiredFields) {
    if (!field.value || field.value.trim() === '') {
      alert(field.message);
      return; // إيقاف العملية فوراً
    }
  }
  // 2. تحقق خاص بملخص المشروع (Abstract): يجب ألا يقل عن 20 حرفاً
  if (!projectDesc || projectDesc.trim().length < 20) {
    alert("يجب أن يحتوي ملخص المشروع على 20 حرفاً على الأقل ليكون مفهوماً!");
    return;
  }
  if (pdfFile && !validateFileExtension(pdfFile, ['.pdf'])) {
    alert("❌ خطأ: ملف التوثيق يجب أن يكون بصيغة PDF فقط!");
    return;
  }

  // 2. التحقق من امتداد ملف الـ ZIP
  if (zipFile && !validateFileExtension(zipFile, ['.zip', '.rar', '.7z'])) {
    alert("❌ خطأ: ملف السورس كود يجب أن يكون مضغوطاً (ZIP, RAR, 7Z)!");
    return;
  }

  // 3. التحقق من وجود ملف PDF للمشاريع الجديدة
  if (!editingId && !pdfFile) {
    return alert('الرجاء اختيار ملف التوثيق الـ PDF للمشروع الجديد!');
  }


  setIsUploading(true);
  setStatusMsg(editingId ? '🔄 جاري تحديث بيانات المشروع...' : '🧠 جاري أرشفة ورفع المشروع الجديد...');

  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);

    let finalPdfUrl = existingPdfUrl;
    let finalZipUrl = existingZipUrl;

    // 4. رفع PDF جديد إذا اختار المستخدم ملفاً
    if (pdfFile) {
      setStatusMsg('📄 جاري رفع وثيقة الـ PDF الجديد...');
      const pdfPath = `projects/pdf/${timestamp}_${randomStr}.pdf`;
      const { error: pdfErr } = await supabase.storage
        .from('university-files')
        .upload(pdfPath, pdfFile);

      if (pdfErr) throw pdfErr;

      const { data: { publicUrl: pUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(pdfPath);
      finalPdfUrl = pUrl;
    }

    // 5. رفع ZIP جديد إذا اختار المستخدم ملفاً
    if (zipFile) {
      setStatusMsg('📦 جاري رفع حزمة السورس كود الـ ZIP الجديدة...');
      const zipPath = `projects/source_code/${timestamp}_${randomStr}.zip`;
      const { error: zipErr } = await supabase.storage
        .from('university-files')
        .upload(zipPath, zipFile);

      if (zipErr) throw zipErr; // أضفت throw هنا للتأكد من التقاط الخطأ في catch

      const { data: { publicUrl: zUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(zipPath);
      finalZipUrl = zUrl;
    }

    // 6. تجهيز البيانات للإرسال (Payload)
    const payload = {
      title: projectTitle,
      abstract: projectDesc,
      dep_id: selectedDeptId,
      student_names: studentsNames,
      supervisor_name: supervisor,
      file_url: finalPdfUrl,
      zip_file_url: finalZipUrl,
      year: graduationYear,
      is_visible: isVisible
    };

    if (editingId) {
      // تحديث سجل قديم
      const { error: updateErr } = await supabase
        .from('graduation_projects')
        .update(payload)
        .eq('id', editingId);

      if (updateErr) throw updateErr;
      alert('🎉 تم تحديث بيانات المشروع والأرشيف بنجاح!');
    } else {
      // إدراج سجل جديد
      const { error: insertErr } = await supabase
        .from('graduation_projects')
        .insert(payload);

      if (insertErr) throw insertErr;
      alert('🎉 تم أرشفة ونشر مشروع التخرج بنجاح!');
    }

    handleCancelEdit();
    fetchProjectsList();
  } catch (err: any) {
    alert('❌ فشلت العملية: ' + err.message);
  } finally {
    setIsUploading(false);
    setStatusMsg('');
  }
};

  // 🗑️ الحذف النهائي
  const handleDeleteProject = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع من الأرشيف نهائياً؟')) return;

    setProjectsList(prev => prev.filter(item => item.id !== id));
    const { error } = await supabase.from('graduation_projects').delete().eq('id', id);

    if (error) {
      alert('❌ فشلت عملية الحذف من السيرفر');
      fetchProjectsList();
    }
  };

  // 👁️ التبديل الفوري لحالة العرض
  const handleToggleVisibility = async (id: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setProjectsList(prev => prev.map(item => item.id === id ? { ...item, is_visible: nextStatus } : item));

    await supabase.from('graduation_projects').update({ is_visible: nextStatus }).eq('id', id);
  };

  // تصفية نتائج الأرشيف بحسب شريط البحث
  const filteredArchive = projectsList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const students = item.student_names || item.students_names || '';
    const supervisor = item.supervisor_name || item.supervisor_names || '';
    return (
      item.title?.toLowerCase().includes(q) ||
      item.abstract?.toLowerCase().includes(q) ||
      students.toLowerCase().includes(q) ||
      supervisor.toLowerCase().includes(q) ||
      item.year?.toString().includes(q)
    );
  });

  return (
    <section className="bg-[#0D1629]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl max-w-4xl mx-auto dir-rtl text-right relative">
      
      {/* 🏛 الشريط العلوي المطور + زر فتح الأرشيف المباشر */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              {editingId ? "تعديل بيانات مشروع التخرج المأرشف" : "أرشفة مشاريع التخرج الهندسية"}
              {editingId && <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">MODE_EDIT #{editingId}</span>}
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              رفع وتوثيق المشاريع والسورس كود وإدارتها في المكتبة الرقمية
            </p>
          </div>
        </div>

        {/* 📦 أيقونة فتح الأرشيف المباشر */}
        <button 
          type="button"
          onClick={() => setShowArchiveModal(true)} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-black text-xs transition-all cursor-pointer shadow-md"
        >
          <Archive className="w-4 h-4 text-emerald-400" />
          <span>فتح الأرشيف والمراجع ({projectsList.length})</span>
        </button>
      </div>

      {/* 📄 نموذج الرفع أو التعديل */}
      <form onSubmit={handleSaveProject} className="space-y-4">
        
        {editingId && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-amber-300">
            <span>أنت الآن في وضع التعديل للمشروع المأرشف. يمكنك تغيير البيانات أو إعادة اختيار الملفات.</span>
            <button type="button" onClick={handleCancelEdit} className="text-xs text-slate-400 hover:text-white underline cursor-pointer">إلغاء التعديل</button>
          </div>
        )}

        {/* العنوان والتخصص */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              عنوان مشروع التخرج:
            </label>
            <input 
              type="text" 
              placeholder="مثال: منصة إدارة الخدمات الذكية..." 
              className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              value={projectTitle} 
              onChange={(e) => setProjectTitle(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" /> الكلية والتخصص:
            </label>
            <select 
              className="w-full p-3.5 rounded-xl bg-[#070D19] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
            >
              {universityStructure.map((college) => (
                <optgroup key={college.name} label={`🏛️ ${college.name}`} className="bg-[#0D1629] text-emerald-300 font-bold">
                  {college.departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-[#070D19] text-white">
                      ➔ {dept.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* أسماء الفريق، المشرف والسنة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> أسماء الطلاب / الفريق:
            </label>
            <input 
              type="text" 
              placeholder="أسماء الطلاب مفصولة بفاصلة..." 
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              value={studentsNames} 
              onChange={(e) => setStudentsNames(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-emerald-400" /> أستاذ / مشرف المشروع:
            </label>
            <input 
              type="text" 
              placeholder="أستاذ/مشرف المشروع..." 
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              value={supervisor} 
              onChange={(e) => setSupervisor(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> سنة التخرج / المناقشة:
            </label>
            <input 
              type="text" 
              placeholder="2026" 
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              value={graduationYear} 
              onChange={(e) => setGraduationYear(e.target.value)} 
            />
          </div>
        </div>

        {/* الملخص */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">
            ملخص ومخرجات المشروع (Abstract):
          </label>
          <textarea 
            rows={3} 
            placeholder="ملخص موجز للنظرية والأهداف العلمية..." 
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            value={projectDesc} 
            onChange={(e) => setProjectDesc(e.target.value)} 
          />
        </div>

        {/* رفع PDF و ZIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> وثيقة التوثيق (PDF):
            </label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)} 
              className="w-full text-xs text-slate-400 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer bg-black/30 p-2 rounded-xl border border-white/10" 
            />
            {existingPdfUrl && !pdfFile && (
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">✓ يوجد ملف PDF مأرشف سابقاً (سيتم الاحتفاظ به إن لم ترفع جديداً)</span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
              <FileArchive className="w-3.5 h-3.5 text-sky-400" /> حزمة السورس كود (ZIP / RAR):
            </label>
            <input 
              type="file" 
              accept=".zip,.rar,.7z" 
              onChange={(e) => setZipFile(e.target.files?.[0] || null)} 
              className="w-full text-xs text-slate-400 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white cursor-pointer bg-black/30 p-2 rounded-xl border border-white/10" 
            />
            {existingZipUrl && !zipFile && (
              <span className="text-[10px] text-sky-400 font-mono mt-1 block">✓ يوجد ملف ZIP مأرشف سابقاً</span>
            )}
          </div>
        </div>

        {/* النشر المباشر */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            {isVisible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
            إتاحة المشروع للعرض المباشر في المكتبة الرقمية؟
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isVisible} 
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:-translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>

        {statusMsg && (
          <p className="text-center text-xs font-bold text-emerald-400 animate-pulse bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            {statusMsg}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button 
            type="submit" 
            disabled={isUploading} 
            className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
            <span>{editingId ? "تحديث المرجع المأرشف" : "أرشفة ونشر مشروع التخرج مع ملف الـ ZIP"}</span>
          </button>

          {editingId && (
            <button 
              type="button" 
              onClick={handleCancelEdit} 
              className="px-5 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              إلغاء
            </button>
          )}
        </div>

      </form>

      {/* 📦 النافذة المنبثقة الشفافة للأرشيف والشاملة لمربع البحث وأيقونة التعديل */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
          <div className="bg-[#0D1629] border border-white/15 rounded-3xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col justify-between shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* رأس نافذة الأرشيف */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black text-white">المستودع الرقمي للمشاريع المأرشفة ({projectsList.length})</h4>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowArchiveModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 🔍 مربع البحث الفوري */}
              <div className="my-4">
                <div className="relative flex items-center bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-emerald-500/50">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المشروع، الطالب، المشرف أو السنة..." 
                    className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                </div>
              </div>
            </div>

            {/* قائمة المراجع مع أزرار التعديل والإخفاء والحذف */}
            <div className="flex-grow overflow-y-auto space-y-2.5 my-2 pr-1">
              {loadingList ? (
                <p className="text-center text-xs text-slate-400 animate-pulse py-8">جاري استدعاء السجلات المأرشفة...</p>
              ) : filteredArchive.length > 0 ? (
                filteredArchive.map((proj) => (
                  <div 
                    key={proj.id} 
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-all"
                  >
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-black text-white truncate">{proj.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        الفريق: {proj.student_names || proj.students_names || 'غير محدد'} | المشرف: {proj.supervisor_name || proj.supervisor_names || 'غير محدد'} | السنة: {proj.year || '2026'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* ✏️ أيقونة التعديل */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(proj)}
                        className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-all cursor-pointer"
                        title="تعديل بيانات المرجع"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* 👁️ أيقونة الإخفاء/الإظهار */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(proj.id, proj.is_visible)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          proj.is_visible 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                        title={proj.is_visible ? "متاح للطلاب (اضغط للإخفاء)" : "مخفي عن الطلاب (اضغط للإظهار)"}
                      >
                        {proj.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* 🗑️ أيقونة الحذف */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all cursor-pointer"
                        title="حذف المرجع نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-8">لا توجد مراجع مأرشفة مطابقة للبحث.</p>
              )}
            </div>

            {/* أزرار الإغلاق والتحديث */}
            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-slate-400 font-mono">
              <button 
                type="button" 
                onClick={fetchProjectsList} 
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> إعادة تحديث السجلات
              </button>
              <button 
                type="button" 
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
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