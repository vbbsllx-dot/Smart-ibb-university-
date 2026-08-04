"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderGit2, UploadCloud, Loader2 } from 'lucide-react';

export default function ProjectsManager() {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !projectFile) return alert('الرجاء كتابة عنوان المشروع واختيار الملف!');

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const filePath = `projects/proj_${timestamp}_${projectFile.name}`;

      const { error: uploadErr } = await supabase.storage
        .from('university-files')
        .upload(filePath, projectFile);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase.from('graduation_projects').insert({
        title: projectTitle,
        description: projectDesc,
        file_url: publicUrl
      });

      if (dbErr) throw dbErr;

      alert('🎉 تم أرشفة مشروع التخرج في جدول (graduation_projects) بنجاح!');
      setProjectTitle('');
      setProjectDesc('');
      setProjectFile(null);
    } catch (err: any) {
      alert('❌ فشل الرفع: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="bg-[#0D1629]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl max-w-3xl mx-auto">
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <FolderGit2 className="w-5 h-5 text-emerald-400" /> نشر مشاريع التخرج الممتازة (جدول graduation_projects)
      </h3>

      <form onSubmit={handleUploadProject} className="space-y-4 text-right">
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">عنوان مشروع التخرج:</label>
          <input 
            type="text" 
            placeholder="مثال: منصة ذكية لإدارة الخدمات برئاسة الجامعة..." 
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
            value={projectTitle} 
            onChange={(e) => setProjectTitle(e.target.value)} 
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">شرح وتفاصيل المشروع:</label>
          <textarea 
            rows={4} 
            placeholder="وصف التقنيات المستخدمة، فريق العمل، ومخرجات المشروع..." 
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            value={projectDesc} 
            onChange={(e) => setProjectDesc(e.target.value)} 
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">ملف وثيقة المشروع (PDF):</label>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => setProjectFile(e.target.files?.[0] || null)} 
            className="w-full text-xs text-slate-400 file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer" 
          />
        </div>

        <button 
          type="submit" 
          disabled={isUploading} 
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
          <span>نشر المشروع في الأرشيف الهندسي</span>
        </button>
      </form>
    </section>
  );
}