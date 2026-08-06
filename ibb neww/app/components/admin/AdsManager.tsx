"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Megaphone, 
  UploadCloud, 
  Loader2, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Eye, 
  EyeOff, 
  Trash2, 
  Sparkles,
  Tag,
  CheckCircle2
} from 'lucide-react';

export default function AdsManager() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // بيانات نموذج الإعلان الجديد
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('إعلان أكاديمي');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // جلب جميع الإعلانات
  const fetchAds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('images_ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAds(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // معاينة الصورة فور اختياها
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ⚡ إخفاء أو إظهار الإعلان فوراً (Optimistic UI) بدون أي تأخير
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // 1. تحديث الحالة فوراً في الشاشة (0 millisecond)
    setAds(prev => prev.map(ad => ad.id === id ? { ...ad, is_active: nextStatus } : ad));

    // 2. التحديث في السيرفر في الخلفية
    const { error } = await supabase
      .from('images_ads')
      .update({ is_active: nextStatus })
      .eq('id', id);

    if (error) {
      // إعادة الحالة القديمة في حال الفشل
      setAds(prev => prev.map(ad => ad.id === id ? { ...ad, is_active: currentStatus } : ad));
      alert('❌ تعذر تغيير حالة الإعلان في السيرفر!');
    }
  };

  // ⚡ حذف الإعلان فوراً
  const handleDeleteAd = async (id: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذا الإعلان نهائياً؟')) return;

    const previousAds = [...ads];
    setAds(prev => prev.filter(ad => ad.id !== id));

    const { error } = await supabase
      .from('images_ads')
      .delete()
      .eq('id', id);

    if (error) {
      setAds(previousAds);
      alert('❌ فشلت عملية الحذف من السيرفر!');
    }
  };

  // رفع ونشر الإعلان
  const handleUploadAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageFile) {
      return alert('الرجاء كتابة عنوان الإعلان واختيار صورة غلاف عالي الجودة!');
    }

    setIsUploading(true);
    setStatusMsg('🚀 جاري رفع الصورة وتوليد الرابط الترويجي...');

    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const filePath = `ads/${timestamp}_${randomStr}.png`;

      // 1. رفع الصورة في Storage
      const { error: uploadErr } = await supabase.storage
        .from('university-files')
        .upload(filePath, imageFile);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      // 2. الحفظ في جدول images_ads
      const newAdObj = {
        title,
        subtitle,
        badge: badge || 'إعلان مهم',
        image_url: publicUrl,
        link_url: linkUrl || null,
        is_active: true
      };

      const { data: insertedData, error: dbErr } = await supabase
        .from('images_ads')
        .insert(newAdObj)
        .select('*');

      if (dbErr) throw dbErr;

      // إضافة الإعلان الجديد مباشرة في أعلى القائمة المحلية
      if (insertedData && insertedData.length > 0) {
        setAds(prev => [insertedData[0], ...prev]);
      } else {
        fetchAds();
      }

      alert('🎉 تم بث ونشر الإعلان في السلايدر الرئيسي بنجاح!');
      setTitle('');
      setSubtitle('');
      setLinkUrl('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      alert('❌ فشلت عملية الرفع: ' + err.message);
    } finally {
      setIsUploading(false);
      setStatusMsg('');
    }
  };

  return (
    <section className="bg-[#0D1629]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl max-w-6xl mx-auto dir-rtl text-right">
      
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">
            شريط الإعلانات البنري السريع (جدول images_ads)
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            إدارة وتحديث البنرات الترويجية والإعلانات في واجهة المنصة الرئيسية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* نموذج الإضافة */}
        <form onSubmit={handleUploadAd} className="lg:col-span-6 space-y-4">
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
            <h4 className="text-xs font-black text-emerald-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> نشر إعلان بنري جديد
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  عنوان الإعلان الرئيسي:
                </label>
                <input 
                  type="text" 
                  placeholder="مثال: رؤية عالمية والتطور الأكاديمي..." 
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  الوصف الفرعي للإعلان:
                </label>
                <input 
                  type="text" 
                  placeholder="توضيح مختصر يظهر تحت العنوان..." 
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={subtitle} 
                  onChange={(e) => setSubtitle(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" /> الوسم (Badge):
                  </label>
                  <input 
                    type="text" 
                    placeholder="إعلان أكاديمي" 
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                    value={badge} 
                    onChange={(e) => setBadge(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                    <LinkIcon className="w-3.5 h-3.5 text-sky-400" /> رابط التفاعلية:
                  </label>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    value={linkUrl} 
                    onChange={(e) => setLinkUrl(e.target.value)} 
                  />
                </div>
              </div>

              {/* رفع وتوفير معينات الصورة */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> صورة البنَر الإعلاني:
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="w-full text-xs text-slate-400 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer bg-black/40 p-2 rounded-xl border border-white/10" 
                />
              </div>

              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 h-28 w-full mt-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-black/70 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
                    معاينة قبل النشر
                  </span>
                </div>
              )}
            </div>
          </div>

          {statusMsg && (
            <p className="text-center text-xs font-bold text-emerald-400 animate-pulse bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              {statusMsg}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isUploading} 
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
            <span>بث الإعلان في السلايدر الرئيسي</span>
          </button>
        </form>

        {/* قائمة الإعلانات الحالية والتغيير الفوري */}
        <div className="lg:col-span-6 space-y-3">
          <h4 className="text-xs font-black text-slate-300 flex items-center justify-between pb-2 border-b border-white/10">
            <span>قائمة الإعلانات الحالية ({ads.length})</span>
            <span className="text-[10px] text-emerald-400 font-mono">استجابة فورية 0ms</span>
          </h4>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 animate-pulse">جاري تحميل الإعلانات...</div>
          ) : ads.length > 0 ? (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {ads.map((ad) => (
                <div 
                  key={ad.id} 
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    ad.is_active 
                      ? 'bg-black/40 border-white/15 hover:border-emerald-500/30' 
                      : 'bg-black/20 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={ad.image_url} 
                      alt={ad.title} 
                      className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0" 
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black text-white truncate max-w-[180px]">{ad.title}</h5>
                        {ad.badge && (
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                            {ad.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{ad.subtitle || 'بدون وصف فرعي'}</p>
                    </div>
                  </div>

                  {/* أزرار التحكم الفوري */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      type="button" 
                      onClick={() => handleToggleActive(ad.id, ad.is_active)}
                      className={`p-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                        ad.is_active 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                      title={ad.is_active ? "إخفاء الإعلان" : "إظهار الإعلان"}
                    >
                      {ad.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all cursor-pointer"
                      title="حذف الإعلان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-black/20 border border-white/10 rounded-2xl text-xs text-slate-400 font-bold">
              لا توجد إعلانات منشورة حالياً
            </div>
          )}
        </div>

      </div>
    </section>
  );
}