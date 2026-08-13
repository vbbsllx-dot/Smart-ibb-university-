"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VerifyCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const email = localStorage.getItem('temp_reg_email');
    if (!email) {
      router.push('/login/register');
      return;
    }

    try {
      // 1. البحث عن الكود في الجدول ومطابقته مع الإيميل
      const { data, error } = await supabase
        .from('verification')
        .select('id, code')
        .eq('email', email)
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // 2. إذا وجد الكود، نقوم بحذفه فوراً (لأنه استُخدم)
        await supabase.from('verification').delete().eq('id', data.id);
        
        // 3. التوجيه لصفحة إكمال البيانات
        router.push('/login/register/details');
      } else {
        setNotification("❌ رمز التحقق غير صحيح.");
        setIsLoading(false);
      }
    } catch (err) {
      setNotification("🚨 حدث خطأ أثناء التحقق، يرجى المحاولة لاحقاً.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#070b14] min-h-screen flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-[400px] bg-[#0d1527]/60 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-white text-center mb-6">أدخل رمز التحقق</h3>
        <p className="text-slate-400 text-xs text-center mb-6">تم إرسال الكود إلى بريدك الإلكتروني.</p>
        
        <form onSubmit={handleVerify} className="space-y-4">
          <input 
            type="text" 
            value={code} 
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] text-white focus:ring-2 focus:ring-indigo-500"
            placeholder="000000"
            required
          />
          {notification && <p className="text-red-400 text-xs text-center">{notification}</p>}
          <button 
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            {isLoading ? "جاري التحقق..." : "تأكيد الرمز"}
          </button>
        </form>
      </div>
    </div>
  );
}