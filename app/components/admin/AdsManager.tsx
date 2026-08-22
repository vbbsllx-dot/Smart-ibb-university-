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
    <section className="bg-[#edf2ee] border border-[#d2ded6] rounded-[2.5rem] p-6 md:p-8 shadow-xl max-w-6xl mx-auto dir-rtl text-right font-sans">       
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#d8e3dd]">
        <div className="w-11 h-11 rounded-2xl bg-[#00bc7e]/15 border border-[#00bc7e]/30 flex items-center justify-center text-[#059669]">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#062c35]">
            شريط الإعلانات البنري السريع (جدول images_ads)
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            إدارة وتحديث البنرات الترويجية والإعلانات في واجهة المنصة الرئيسية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* نموذج الإضافة */}
        <form onSubmit={handleUploadAd} className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-[#d8e3dd] rounded-3xl p-5 shadow-sm">
            <h4 className="text-xs font-black text-[#059669] mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> نشر إعلان بنري جديد
            </h4>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  عنوان الإعلان الرئيسي:
                </label>
                <input 
                  type="text" 
                  placeholder="مثال: رؤية عالمية والتطور الأكاديمي..." 
                  className="w-full p-3 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35] focus:outline-none focus:border-[#059669]"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  الوصف الفرعي للإعلان:
                </label>
                <input 
                  type="text" 
                  placeholder="توضيح مختصر يظهر تحت العنوان..." 
                  className="w-full p-3 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35] focus:outline-none focus:border-[#059669]"
                  value={subtitle} 
                  onChange={(e) => setSubtitle(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                    <Tag className="w-3.5 h-3.5 text-[#059669]" /> الوسم (Badge):
                  </label>
                  <input 
                    type="text" 
                    placeholder="إعلان أكاديمي" 
                    className="w-full p-3 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35] focus:outline-none focus:border-[#059669]"
                    value={badge} 
                    onChange={(e) => setBadge(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                    <LinkIcon className="w-3.5 h-3.5 text-sky-600" /> رابط التفاعلية:
                  </label>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    className="w-full p-3 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35] focus:outline-none focus:border-[#059669] font-mono dir-ltr text-left"
                    value={linkUrl} 
                    onChange={(e) => setLinkUrl(e.target.value)} 
                  />
                </div>
              </div>

              {/* رفع وتوفير معينات الصورة */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" /> صورة البنَر الإعلاني:
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="w-full text-xs text-slate-600 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#059669] file:text-white cursor-pointer bg-[#f4f7f5] p-2 rounded-2xl border border-[#cde0d5]" 
                />
              </div>

              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-[#059669]/40 h-28 w-full mt-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-[#062c35]/80 text-[#00bc7e] text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
                    معاينة قبل النشر
                  </span>
                </div>
              )}
            </div>
          </div>

          {statusMsg && (
            <p className="text-center text-xs font-bold text-[#059669] animate-pulse bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
              {statusMsg}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isUploading} 
            className="w-full py-3.5 bg-gradient-to-r from-[#059669] to-[#00bc7e] hover:from-[#047857] hover:to-[#059669] text-white font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
            <span>بث الإعلان في السلايدر الرئيسي</span>
          </button>
        </form>

        {/* قائمة الإعلانات الحالية والتغيير الفوري */}
        <div className="lg:col-span-6 space-y-3">
          <h4 className="text-xs font-black text-[#062c35] flex items-center justify-between pb-2 border-b border-[#d8e3dd]">
            <span>قائمة الإعلانات الحالية ({ads.length})</span>
            <span className="text-[10px] text-[#059669] font-mono font-bold">استجابة فورية 0ms</span>
          </h4>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500 animate-pulse">جاري تحميل الإعلانات...</div>
          ) : ads.length > 0 ? (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {ads.map((ad) => (
                <div 
                  key={ad.id} 
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    ad.is_active 
                      ? 'bg-white border-[#d8e3dd] shadow-sm hover:border-[#059669]/40' 
                      : 'bg-[#f4f7f5] border-[#d8e3dd] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={ad.image_url} 
                      alt={ad.title} 
                      className="w-14 h-14 rounded-xl object-cover border border-[#d8e3dd] flex-shrink-0" 
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black text-[#062c35] truncate max-w-[180px]">{ad.title}</h5>
                        {ad.badge && (
                          <span className="text-[9px] font-bold bg-[#00bc7e]/15 text-[#059669] border border-[#00bc7e]/30 px-1.5 py-0.2 rounded">
                            {ad.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{ad.subtitle || 'بدون وصف فرعي'}</p>
                    </div>
                  </div>

                  {/* أزرار التحكم الفوري */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      type="button" 
                      onClick={() => handleToggleActive(ad.id, ad.is_active)}
                      className={`p-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                        ad.is_active 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-[#059669] hover:bg-emerald-500/20' 
                          : 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={ad.is_active ? "إخفاء الإعلان" : "إظهار الإعلان"}
                    >
                      {ad.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 hover:bg-rose-500/20 transition-all cursor-pointer"
                      title="حذف الإعلان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-[#d8e3dd] rounded-3xl text-xs text-slate-500 font-bold shadow-sm">
              لا توجد إعلانات منشورة حالياً
            </div>
          )}
        </div>

      </div>
    </section>
  );}