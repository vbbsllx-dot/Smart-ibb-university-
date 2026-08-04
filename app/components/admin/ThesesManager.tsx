"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, UploadCloud, Loader2 } from 'lucide-react';

export default function ThesesManager() {
  const [thesisTitle, setThesisTitle] = useState('');
  const [thesisAbstract, setThesisAbstract] = useState('');
  const [thesisFile, setThesisFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadThesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesisTitle || !thesisFile) return alert('الرجاء كتابة العنوان واختيار ملف الرسالة!');

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const filePath = `theses/thesis_${timestamp}_${thesisFile.name}`;

      const { error: uploadErr } = await supabase.storage
        .from('university-files')
        .upload(filePath, thesisFile);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase.from('master_theses').insert({
        title: thesisTitle,
        abstract: thesisAbstract,
        file_url: publicUrl
      });

      if (dbErr) throw dbErr;

      alert('🎉 تم أرشفة رسالة الماجستير في جدول (master_theses) بنجاح!');
      setThesisTitle('');
      setThesisAbstract('');
      setThesisFile(null);
    } catch (err: any) {
      alert('❌ فشل الرفع: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="bg-[#0D1629]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl max-w-3xl mx-auto">
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <GraduationCap className="w-5 h-5 text-emerald-400" /> أرشفة رسائل الماجستير (جدول master_theses)
      </h3>

      <form onSubmit={handleUploadThesis} className="space-y-4 text-right">
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">عنوان رسالة الماجستير:</label>
          <input 
            type="text" 
            placeholder="أدخل عنوان رسالة الماجستير..." 
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
            value={thesisTitle} 
            onChange={(e) => setThesisTitle(e.target.value)} 
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">ملخص الرسالة (Abstract):</label>
          <textarea 
            rows={4} 
            placeholder="اكتب ملخصاً موجزاً عن البحث المنجز والأهداف العلمية..." 
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            value={thesisAbstract} 
            onChange={(e) => setThesisAbstract(e.target.value)} 
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">ملف الرسالة الكامل (PDF):</label>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => setThesisFile(e.target.files?.[0] || null)} 
            className="w-full text-xs text-slate-400 file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer" 
          />
        </div>

        <button 
          type="submit" 
          disabled={isUploading} 
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
          <span>أرشفة الرسالة في قسم الدراسات العليا</span>
        </button>
      </form>
    </section>
  );
}