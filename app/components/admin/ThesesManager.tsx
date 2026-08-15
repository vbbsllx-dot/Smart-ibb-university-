"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  UploadCloud, 
  Loader2, 
  FileText, 
  FileArchive, 
  Building2, 
  User, 
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Search,
  Pencil,
  Archive,
  X,
  Scroll
} from 'lucide-react';

export default function ThesesManager() {
  // حالة نموذج الإدخال والتعديل
  const [editingId, setEditingId] = useState<number | null>(null);
  const [thesisTitle, setThesisTitle] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [researcherName, setResearcherName] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [thesisYear, setThesisYear] = useState<string>(new Date().getFullYear().toString());
  const [thesisAbstract, setThesisAbstract] = useState('');
  const [universityName, setUniversityName] = useState('');
  // الملفات والروابط المخزنة
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [existingZipUrl, setExistingZipUrl] = useState<string | null>(null);
  
  const [isVisible, setIsVisible] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // حالة الأرشيف ونافذة التصفح والبحث
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [thesesList, setThesesList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // جلب قائمة الأرشيف
  const fetchThesesList = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('master_theses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setThesesList(data);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    fetchThesesList();
  }, []);

  // ✏️ بدء عملية التعديل على رسالة مأرشفة
  const handleStartEdit = (thesis: any) => {
    setEditingId(thesis.id);
    setThesisTitle(thesis.title || '');
    setUniversityName(thesis.university || '');
    setDepartmentName(thesis.dep_name || '');
    setResearcherName(thesis.researcher_name || thesis.researcher_name || '');
    setSupervisor(thesis.supervisor_name || '');
    setThesisYear(thesis.year || new Date().getFullYear().toString());
    setThesisAbstract(thesis.abstract || '');
    setIsVisible(thesis.is_visible ?? true);
    setExistingPdfUrl(thesis.file_url || thesis.thesis_pdf_url || null);
    setExistingZipUrl(thesis.zip_file_url || null);
    
    setPdfFile(null);
    setZipFile(null);
    setShowArchiveModal(false);
  };

  // إلغاء التعديل
  const handleCancelEdit = () => {
    setEditingId(null);
    setThesisTitle('');
    setResearcherName('');
    setSupervisor('');
    setDepartmentName('');
    setUniversityName('');
    setThesisAbstract('');
    setPdfFile(null);
    setZipFile(null);
    setExistingPdfUrl(null);
    setExistingZipUrl(null);
  };

  // 🚀 حفظ المرفوع (إضافة جديدة أو تحديث رسالة)
  const handleSaveThesis = async (e: React.FormEvent) => {
    e.preventDefault();



    // 2. التحقق من طول الملخص (الشرط الجديد)
    if (thesisAbstract.trim().length < 20) {
      return alert('❌ تنبيه: الملخص العلمي يجب أن يحتوي على 20 حرفاً على الأقل!');
    }

    if (!thesisTitle) {
      return alert('الرجاء كتابة عنوان الرسالة العلمية!');
    }

    if (!departmentName.trim()) {
      return alert('الرجاء إدخال اسم القسم أو التخصص!');
    }

    // إضافة شرط التحقق من الجامعة
  if (!universityName.trim()) {
    return alert('الرجاء إدخال اسم الجامعة!');
  }
  if (!researcherName.trim()) {
      return alert('الرجاء إدخال اسم الباحث / الباحثة!');
    }

    if (!supervisor.trim()) {
      return alert('الرجاء إدخال اسم المشرف العلمي!');
    }

    if (!thesisAbstract.trim()) {
      return alert('الرجاء كتابة الملخص العلمي (Abstract) للرسالة!');
    }

    if (!editingId && !pdfFile) {
      return alert('الرجاء اختيار ملف الـ PDF للرسالة الجديدة!');
    }

    if (editingId && !pdfFile && !existingPdfUrl) {
      return alert('يجب توفر ملف PDF للرسالة!');
    }

    // 2. التحقق من نوع ملف PDF
    if (pdfFile) {
      const isPdf = pdfFile.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return alert('❌ خطأ: يجب أن يكون ملف الرسالة بصيغة PDF فقط!');
      }
    } else if (!editingId && !existingPdfUrl) {
      return alert('الرجاء اختيار ملف الـ PDF للرسالة!');
    }

    // 3. التحقق من نوع ملف ZIP/RAR
    if (zipFile) {
      const fileName = zipFile.name.toLowerCase();
      const isArchive = fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z');
      if (!isArchive) {
        return alert('❌ خطأ: المرفقات يجب أن تكون مضغوطة بصيغة ZIP أو RAR أو 7Z!');
      }
    }


    setIsUploading(true);
    setStatusMsg(editingId ? '🔄 جاري تحديث بيانات الرسالة...' : '🧠 جاري أرشفة الرسالة العلمية...');

    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);

      let finalPdfUrl = existingPdfUrl;
      let finalZipUrl = existingZipUrl;

      // 1. رفع PDF جديد إذا اختار المستخدم ملفاً جديداً
      if (pdfFile) {
        setStatusMsg('📄 جاري رفع ملف الـ PDF الجديد...');
        const pdfPath = `theses/pdf/${timestamp}_${randomStr}.pdf`;
        const { error: pdfErr } = await supabase.storage
          .from('university-files')
          .upload(pdfPath, pdfFile);

        if (pdfErr) throw pdfErr;

        const { data: { publicUrl: pUrl } } = supabase.storage
          .from('university-files')
          .getPublicUrl(pdfPath);
        finalPdfUrl = pUrl;
      }
      
      // 2. رفع ZIP جديد إذا اختار المستخدم ملفاً جديداً
      if (zipFile) {
        setStatusMsg('📦 جاري رفع المرفقات والبيانات الإحصائية (ZIP)...');
        const zipPath = `theses/attachments/${timestamp}_${randomStr}.zip`;
        const { error: zipErr } = await supabase.storage
          .from('university-files')
          .upload(zipPath, zipFile);

        if (!zipErr) {
          const { data: { publicUrl: zUrl } } = supabase.storage
            .from('university-files')
            .getPublicUrl(zipPath);
          finalZipUrl = zUrl;
        }
      }

      const payload = {
        title: thesisTitle,
        abstract: thesisAbstract,
        dep_name: departmentName,
        university: universityName,
        researcher_name: researcherName,
        supervisor_name: supervisor,
        thesis_pdf_url: finalPdfUrl,
        zip_file_url: finalZipUrl,
        year: thesisYear,
        is_visible: isVisible
      };

      if (editingId) {
        const { error: updateErr } = await supabase
          .from('master_theses')
          .update(payload)
          .eq('id', editingId);

        if (updateErr) throw updateErr;
        alert('🎉 تم تحديث بيانات الرسالة والأرشيف بنجاح!');
      } else {
        const { error: insertErr } = await supabase
          .from('master_theses')
          .insert(payload);

        if (insertErr) throw insertErr;
        alert('🎉 تم أرشفة ونشر رسالة الماجستير بنجاح!');
      }

      handleCancelEdit();
      fetchThesesList();
    } catch (err: any) {
      alert('❌ فشلت العملية: ' + err.message);
    } finally {
      setIsUploading(false);
      setStatusMsg('');
    }
  };

  // 🗑️ الحذف النهائي
  const handleDeleteThesis = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة من الأرشيف نهائياً؟')) return;

    setThesesList(prev => prev.filter(item => item.id !== id));
    const { error } = await supabase.from('master_theses').delete().eq('id', id);

    if (error) {
      alert('❌ فشلت عملية الحذف من السيرفر');
      fetchThesesList();
    }
  };

  // 👁️ التبديل الفوري لحالة العرض
  const handleToggleVisibility = async (id: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setThesesList(prev => prev.map(item => item.id === id ? { ...item, is_visible: nextStatus } : item));

    await supabase.from('master_theses').update({ is_visible: nextStatus }).eq('id', id);
  };

  // تصفية نتائج الأرشيف بحسب شريط البحث
  const filteredArchive = thesesList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const researcher = item.researcher_name || item.researcher_name || '';
    const supervisor = item.supervisor_name || '';
    return (
      item.title?.toLowerCase().includes(q) ||
      item.abstract?.toLowerCase().includes(q) ||
      item.dep_name?.toLowerCase().includes(q) ||
      researcher.toLowerCase().includes(q) ||
      supervisor.toLowerCase().includes(q) ||
      item.year?.toString().includes(q)
    );
  });

 return (
    <section className="bg-white border border-[#d8e3dd] rounded-3xl p-6 md:p-8 shadow-2xl max-w-4xl mx-auto dir-rtl text-right relative">
      
      {/* الشريط العلوي */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00bc7e]/10 border border-[#00bc7e]/20 flex items-center justify-center text-[#059669]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#062c35] flex items-center gap-2">
              {editingId ? "تعديل بيانات الرسالة العلمية" : "أرشفة رسائل الماجستير والدراسات العليا"}
              {editingId && <span className="text-[10px] bg-[#00bc7e]/15 text-[#059669] border border-[#00bc7e]/30 px-2 py-0.5 rounded font-mono font-bold">MODE_EDIT #{editingId}</span>}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              توثيق الأبحاث العلمية وملحقات النماذج والبيانات البحثية (ZIP)
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setShowArchiveModal(true)} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00bc7e]/10 hover:bg-[#00bc7e]/20 border border-[#00bc7e]/30 text-[#059669] font-black text-xs transition-all cursor-pointer shadow-xs"
        >
          <Archive className="w-4 h-4 text-[#059669]" />
          <span>فتح أطروحات الماجستير ({thesesList.length})</span>
        </button>
      </div>

      {/* نموذج الرفع أو التعديل */}
      <form onSubmit={handleSaveThesis} className="space-y-4">
        
        {editingId && (
          <div className="p-3 bg-[#00bc7e]/10 border border-[#00bc7e]/25 rounded-xl flex items-center justify-between text-xs font-bold text-[#059669]">
            <span>أنت الآن في وضع التعديل للرسالة المأرشفة. يمكنك تغيير البيانات أو إعادة رفع الملفات.</span>
            <button type="button" onClick={handleCancelEdit} className="text-xs text-slate-500 hover:text-[#062c35] underline cursor-pointer">إلغاء التعديل</button>
          </div>
        )}

        {/* العنوان والقسم */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              عنوان البحث / الرسالة العلمية:
            </label>
            <input 
              type="text" 
              placeholder="عنوان البحث..." 
              className="w-full p-3.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669]"
              value={thesisTitle} 
              onChange={(e) => setThesisTitle(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Building2 className="w-3.5 h-3.5 text-[#059669]" /> القسم العلمي:
            </label>
            <input 
              type="text" 
              placeholder="مثلاً: هندسة الحاسبات والتحكم..." 
              className="w-full p-3.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669]"
              value={departmentName} 
              onChange={(e) => setDepartmentName(e.target.value)} 
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#059669]" /> اسم الجامعة:
          </label>
          <input 
            type="text" 
            placeholder="مثلاً: جامعة إب..." 
            className="w-full p-3.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669]"
            value={universityName} 
            onChange={(e) => setUniversityName(e.target.value)} 
            required
          />
        </div>

        {/* الباحث، المشرف والسنة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-[#059669]" /> اسم الباحث / الباحثة:
            </label>
            <input 
              type="text" 
              placeholder="اسم صاحب الرسالة..." 
              className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669]"
              value={researcherName} 
              onChange={(e) => setResearcherName(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-[#059669]" /> المشرف العلمي:
            </label>
            <input 
              type="text" 
              placeholder="أ.د / د..." 
              className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669]"
              value={supervisor} 
              onChange={(e) => setSupervisor(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#059669]" /> سنة المناقشة والمنح:
            </label>
            <input 
              type="text" 
              placeholder="2026" 
              className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669] font-mono"
              value={thesisYear} 
              onChange={(e) => setThesisYear(e.target.value)} 
            />
          </div>
        </div>

        {/* الملخص */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            الملخص العلمي (Abstract):
          </label>
          <textarea 
            rows={3} 
            placeholder="ملخص البحث والحلول العلمية..." 
            className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669] resize-none"
            value={thesisAbstract} 
            onChange={(e) => setThesisAbstract(e.target.value)} 
          />
        </div>

        {/* رفع PDF و ZIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5 text-[#059669]" /> ملف الرسالة (PDF):
            </label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)} 
              className="w-full text-xs text-slate-600 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#059669] file:text-white cursor-pointer bg-[#f4f7f5] p-2 rounded-xl border border-[#cde0d5]" 
            />
            {existingPdfUrl && !pdfFile && (
              <span className="text-[10px] text-[#059669] font-mono font-bold mt-1 block">✓ يوجد ملف PDF مأرشف سابقاً (سيتم الاحتفاظ به إن لم ترفع جديداً)</span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
              <FileArchive className="w-3.5 h-3.5 text-sky-600" /> المرفقات والبيانات (ZIP / RAR):
            </label>
            <input 
              type="file" 
              accept=".zip,.rar,.7z" 
              onChange={(e) => setZipFile(e.target.files?.[0] || null)} 
              className="w-full text-xs text-slate-600 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white cursor-pointer bg-[#f4f7f5] p-2 rounded-xl border border-[#cde0d5]" 
            />
            {existingZipUrl && !zipFile && (
              <span className="text-[10px] text-sky-600 font-mono font-bold mt-1 block">✓ يوجد ملف ZIP مأرشف سابقاً</span>
            )}
          </div>
        </div>

        {/* النشر المباشر */}
        <div className="p-3.5 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            {isVisible ? <Eye className="w-4 h-4 text-[#059669]" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            عرض الرسالة في مكتبة الدراسات العليا للطلاب؟
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isVisible} 
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:bg-[#059669] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>

        {statusMsg && (
          <p className="text-center text-xs font-bold text-[#059669] animate-pulse bg-[#00bc7e]/10 p-2.5 rounded-xl border border-[#00bc7e]/25">
            {statusMsg}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button 
            type="submit" 
            disabled={isUploading} 
            className="flex-1 py-4 bg-gradient-to-r from-[#062c35] to-[#0F5E49] hover:opacity-95 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
            <span>{editingId ? "تحديث الرسالة العلمية المأرشفة" : "أرشفة ونشر الرسالة في المكتبة الرقمية"}</span>
          </button>

          {editingId && (
            <button 
              type="button" 
              onClick={handleCancelEdit} 
              className="px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              إلغاء
            </button>
          )}
        </div>

      </form>

      {/* نافذة الأرشيف المنبثقة */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white border border-[#d8e3dd] rounded-3xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col justify-between shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-[#059669]" />
                  <h4 className="text-sm font-black text-[#062c35]">مكتبة رسائل الماجستير والأطروحات المأرشفة ({thesesList.length})</h4>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowArchiveModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4">
                <div className="relative flex items-center bg-[#f4f7f5] border border-[#cde0d5] rounded-xl px-3 py-2.5 focus-within:border-[#059669]">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم الرسالة، الباحث، القسم، المشرف العلمي أو السنة..." 
                    className="w-full bg-transparent text-xs text-[#062c35] placeholder-slate-400 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2.5 my-2 pr-1">
              {loadingList ? (
                <p className="text-center text-xs text-slate-500 animate-pulse py-8">جاري استدعاء الأطروحات المأرشفة...</p>
              ) : filteredArchive.length > 0 ? (
                filteredArchive.map((thesis) => (
                  <div 
                    key={thesis.id} 
                    className="p-3.5 rounded-2xl bg-white border border-[#d8e3dd] flex items-center justify-between gap-3 hover:border-[#059669]/40 transition-all shadow-xs"
                  >
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-black text-[#062c35] truncate">{thesis.title}</h5>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5 truncate">
                        القسم: {thesis.dep_name || 'غير محدد'} | الباحث: {thesis.researcher_name || 'غير محدد'} | المشرف: {thesis.supervisor_name || 'غير محدد'} | السنة: {thesis.year || '2026'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(thesis)}
                        className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 hover:bg-sky-500/20 transition-all cursor-pointer"
                        title="تعديل بيانات الرسالة"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(thesis.id, thesis.is_visible)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          thesis.is_visible 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-[#059669]' 
                            : 'bg-slate-100 border-slate-300 text-slate-400'
                        }`}
                        title={thesis.is_visible ? "متاح للطلاب (اضغط للإخفاء)" : "مخفي عن الطلاب (اضغط للإظهار)"}
                      >
                        {thesis.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteThesis(thesis.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="حذف الرسالة نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-8 font-bold">لا توجد أطروحات مأرشفة مطابقة للبحث.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-mono">
              <button 
                type="button" 
                onClick={fetchThesesList} 
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