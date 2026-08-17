"use client";

import React, { useState } from 'react';

// تعريف الواجهة للبيانات المستقبلة
interface DubbingStudioProps {
  studentData: any;
}

export default function DubbingStudio({ studentData }: DubbingStudioProps) {
  // حالات دبلجة الفيديوهات (تم عزلها هنا لكي لا تثقل الملف الرئيسي)
  const [dubbingFile, setDubbingFile] = useState<File | null>(null);
  const [dubbingTitle, setDubbingTitle] = useState('');
  const [dubbingDescription, setDubbingDescription] = useState('');
  const [shareVideo, setShareVideo] = useState(false);
  const [isDubbingProcessing, setIsDubbingProcessing] = useState(false);
  const [dubbingMessage, setDubbingMessage] = useState({ type: '', text: '' });

  // دالة الإرسال الخاصة بالدبلجة
  const handleDubbingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dubbingFile || !dubbingTitle || !dubbingDescription) {
      setDubbingMessage({ type: 'error', text: 'يرجى إرفاق الفيديو وتعبئة جميع البيانات.' });
      return;
    }
    
    setIsDubbingProcessing(true);
    setDubbingMessage({ type: 'info', text: 'جاري رفع الفيديو وبدء عملية الدبلجة بواسطة الذكاء الاصطناعي...' });

    // محاكاة لعملية الدبلجة (تأخير وهمي للتجربة):
    setTimeout(() => {
      setDubbingMessage({ 
        type: 'success', 
        text: shareVideo 
          ? 'تمت دبلجة الفيديو بنجاح! وتم حفظه في المكتبة ليتمكن زملائك من الاستفادة منه. 🎉' 
          : 'تمت دبلجة الفيديو بنجاح! الفيديو متاح الآن في مساحتك الخاصة فقط. 🎬' 
      });
      setIsDubbingProcessing(false);
    }, 3000);
  };

  return (
    <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.01)] h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200/60 pb-4">
        <div className="w-1.5 h-6 rounded-full bg-purple-500" />
        <div>
          <h3 className="text-xl font-black text-slate-900">استوديو الدبلجة بالذكاء الاصطناعي</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">قم برفع المقاطع التعليمية الأجنبية لتحويلها إلى اللغة العربية بصوت طبيعي.</p>
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
            <label className="text-[11px] font-black text-slate-700 block mb-1.5">عنوان الفيديو المترجم <span className="text-purple-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder="مثال: شرح خوارزميات الترتيب - جامعة هارفارد"
              value={dubbingTitle}
              onChange={(e) => setDubbingTitle(e.target.value)}
              className="w-full bg-white/80 focus:bg-white text-slate-800 font-medium p-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-xs outline-none" 
            />
          </div>
          
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1.5">نبذة عن محتوى الفيديو <span className="text-purple-500">*</span></label>
            <textarea 
              required
              rows={3}
              placeholder="اكتب وصفاً مختصراً لمحتوى الفيديو ليسهل البحث عنه..."
              value={dubbingDescription}
              onChange={(e) => setDubbingDescription(e.target.value)}
              className="w-full bg-white/80 focus:bg-white text-slate-800 font-medium p-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-xs outline-none resize-none" 
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1.5">ملف الفيديو الأصلي <span className="text-purple-500">*</span></label>
            <input 
              type="file" 
              accept="video/*"
              required
              onChange={(e) => setDubbingFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-white/80 text-slate-600 font-medium p-2.5 rounded-xl border border-slate-200 text-xs outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 cursor-pointer" 
            />
          </div>

          {/* زر التبديل (Toggle) */}
          <div className="flex items-center justify-between p-4 bg-purple-50/50 border border-purple-100 rounded-xl mt-2">
            <div className="text-right">
              <h4 className="text-[11px] font-black text-slate-800">مشاركة الفيديو في المكتبة العامة</h4>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">اسمح لزملائك في الكلية بمشاهدة هذا الفيديو بعد دبلجته.</p>
            </div>
            <button
              type="button"
              onClick={() => setShareVideo(!shareVideo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${shareVideo ? 'bg-purple-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${shareVideo ? '-translate-x-6' : '-translate-x-1'}`} />
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
                  <span>جاري المعالجة والدبلجة...</span>
                </>
              ) : (
                <>
                  <span>بدء الدبلجة الآن</span>
                  <span className="text-lg">✨</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* قسم جانبي توضيحي */}
        <div className="md:col-span-2 space-y-4 hidden md:block">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-purple-500/30 blur-[40px] rounded-full"></div>
            <div className="relative z-10 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h4 className="text-sm font-black mb-3 text-purple-300">كيف تعمل الدبلجة؟</h4>
              <ul className="text-[11px] text-slate-300 space-y-3 font-medium text-right leading-relaxed list-disc list-inside">
                <li>يقوم الذكاء الاصطناعي بفصل الصوت عن الفيديو الأصلي.</li>
                <li>يتم تفريغ النص وترجمته إلى العربية بدقة أكاديمية.</li>
                <li>توليد صوت بشري طبيعي يتوافق مع حركة الشفاه.</li>
                <li>إذا قمت بتفعيل "المشاركة"، سيتم أرشفة الفيديو في قسمك بناءً على بياناتك الأكاديمية التلقائية.</li>
              </ul>
            </div>
          </div>
        </div>
        
      </div>
      
    </section>
  );
}