"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageIcon, Plus, UploadCloud, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdsManager() {
  const [adsList, setAdsList] = useState<any[]>([]);
  const [adTitle, setAdTitle] = useState('');
  const [adSubtitle, setAdSubtitle] = useState('');
  const [adBadge, setAdBadge] = useState('إعلان أكاديمي');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adFile, setAdFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchAdsList();
  }, []);

  const fetchAdsList = async () => {
    try {
      const { data, error } = await supabase
        .from('images_ads')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data) setAdsList(data);
    } catch (err) {
      console.error("خطأ في جلب الإعلانات:", err);
    }
  };

  const handleUploadAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adFile) return alert('الرجاء كتابة العنوان واختيار صورة البنر!');

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const filePath = `ads/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from('university-files')
        .upload(filePath, adFile, { contentType: adFile.type });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase
        .from('images_ads')
        .insert({
          title: adTitle,
          subtitle: adSubtitle,
          badge: adBadge,
          image_url: publicUrl,
          link_url: adLinkUrl || null,
          is_active: true
        });

      if (dbErr) throw dbErr;

      alert('🎉 تم نشر الإعلان في السلايدر الرئيسي بنجاح!');
      setAdTitle('');
      setAdSubtitle('');
      setAdLinkUrl('');
      setAdFile(null);
      fetchAdsList();
    } catch (err: any) {
      alert('❌ فشل رفع الإعلان: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleStatus = async (adId: number, currentStatus: boolean) => {
    try {
      await supabase.from('images_ads').update({ is_active: !currentStatus }).eq('id', adId);
      fetchAdsList();
    } catch (err: any) {
      alert('خطأ في تغيير الحالة: ' + err.message);
    }
  };

  const handleDeleteAd = async (adId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف الإعلان؟')) return;
    try {
      await supabase.from('images_ads').delete().eq('id', adId);
      fetchAdsList();
    } catch (err: any) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* نموذج إضافة إعلان */}
      <section className="lg:col-span-1 bg-[#0D1629]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl h-fit">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <Plus className="w-4 h-4 text-emerald-400" /> نشر إعلان بنر جديد (images_ads)
        </h3>

        <form onSubmit={handleUploadAd} className="space-y-4 text-right">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">عنوان الإعلان الرئيسي:</label>
            <input 
              type="text" 
              placeholder="مثال: بدء التنسيق والقبول للعام الجديد" 
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">الوصف الفرعي للإعلان:</label>
            <textarea 
              rows={2}
              placeholder="توضيح مختصر يظهر تحت العنوان..." 
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
              value={adSubtitle}
              onChange={(e) => setAdSubtitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">الوسم (Badge):</label>
              <input 
                type="text" 
                placeholder="إعلان أكاديمي" 
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                value={adBadge}
                onChange={(e) => setAdBadge(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">رابط للتفاصيل:</label>
              <input 
                type="text" 
                placeholder="https://..." 
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                value={adLinkUrl}
                onChange={(e) => setAdLinkUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">صورة البنر (HD Image):</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setAdFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            <span>بث الإعلان في السلايدر الرئيسي</span>
          </button>
        </form>
      </section>

      {/* قائمة الإعلانات المرفوعة */}
      <section className="lg:col-span-2 bg-[#0D1629]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <ImageIcon className="w-4 h-4 text-emerald-400" /> قائمة الإعلانات الحالية ({adsList.length})
        </h3>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {adsList.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500 font-bold">لا توجد إعلانات مرفوعة حالياً.</p>
          ) : (
            adsList.map((ad) => (
              <div key={ad.id} className="p-3.5 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={ad.image_url} alt="Ad" className="w-16 h-12 object-cover rounded-xl border border-white/10" />
                  <div>
                    <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      {ad.badge || 'بدون وسم'}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{ad.title}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(ad.id, ad.is_active)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      ad.is_active 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-white/5 text-slate-500 border-white/10'
                    }`}
                  >
                    {ad.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAd(ad.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}