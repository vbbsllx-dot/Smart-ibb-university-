"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // 🚀 دالة إرسال الكود للجدول وتجهيز العملية
const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    // التحقق البسيط من صحة البريد (تأكد أنه يحتوي على @ و .)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNotification("⚠️ يرجى إدخال بريد إلكتروني صحيح.");
      setIsLoading(false);
      return;
    }

    try {
      setNotification("📩 جاري توليد رمز التحقق...");
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      await supabase.from('verification').delete().eq('email', email);
      
      const { error: insertError } = await supabase
        .from('verification')
        .insert([{ email: email, code: code }]);

      if (insertError) throw insertError;

      // هنا يتم عرض الكود في الكونسول أو إرساله عبر API
    // 5. استدعاء API الإرسال الذي أنشأناه
    const response = await fetch('/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
    });

    if (!response.ok) {
    throw new Error("فشل إرسال الإيميل");
    }

      localStorage.setItem('temp_reg_email', email);
      
      setNotification("✅ تم إرسال الرمز بنجاح!");
      router.push('/login/register/code'); 

    } catch (err) {
      setNotification("🚨 حدث خطأ أثناء محاولة توليد رمز التحقق.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#070b14] text-slate-200 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-6" dir="rtl">
      {/* 🌌 الخلفية */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02)_0%,transparent_65%)]" />

      {/* 🔔 الإشعارات */}
      {notification && (
        <div className="fixed top-6 max-w-[380px] w-full px-5 py-4 rounded-2xl border backdrop-blur-2xl z-50 bg-indigo-950/80 border-indigo-500/30 text-indigo-300">
          <p className="text-xs font-bold text-center">{notification}</p>
        </div>
      )}

      {/* 🏛️ الصندوق */}
      <div className="w-full max-w-[440px] bg-[#0d1527]/40 backdrop-blur-3xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-slate-100">إنشاء حساب أكاديمي جديد</h3>
          <p className="text-xs text-slate-400 mt-2">الخطوة 1: التحقق من الهوية الجامعية</p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 mr-1">البريد الإلكتروني الجامعي الرسمي</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:border-indigo-500/50"
              placeholder="example@ib-univ.edu.ye"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-bold py-3 px-4 rounded-xl text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
          >
            {isLoading ? "جاري المعالجة..." : "إرسال رمز التفعيل"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs border-t border-slate-800/50 pt-4">
          <Link href="/login" className="text-indigo-400 font-bold hover:underline">تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}