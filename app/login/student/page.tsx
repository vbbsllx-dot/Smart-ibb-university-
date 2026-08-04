"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

function StudentLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // 🎯 حالة الاهتزاز عند الخطأ
  const [isShaking, setIsShaking] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);

  const destination = searchParams.get('dest');

  // دالة تفعيل الاهتزاز عند الخطأ
  const triggerError = (msg: string) => {
    setNotification(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
    setIsLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    try {
      const { data: user, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('username', username.trim())
        .single();

      if (error || !user) {
        triggerError("⚠️ خطأ: الرقم الجامعي أو اسم المستخدم غير مقيد بالمنظومة.");
        return;
      }

      if (user.role !== 'student') {
        triggerError("❌ خطأ: هذا الحساب غير مصادق عليه كطالب في الجامعة.");
        return;
      }

      if (user.password_hash !== password) {
        triggerError("🔑 خطأ: الرمز السري أو كلمة المرور غير مطابقة، أعد المحاولة.");
        return;
      }

      if (user.status === 'pending') {
        triggerError("⏳ تنبيه: حسابك قيد التأكيد والمراجعة من قِبل مشرف الكلية.");
        return;
      } else if (user.status === 'rejected') {
        triggerError("❌ معذرة: تم رفض طلب انضمامك للمنظومة من قِبل الإدارة.");
        return;
      }

      const targetPath = destination || '/student';
      setNotification("تم التحقق بنجاح.. مرحباً بك في بوابة الطالب الذكية");
      
      localStorage.setItem('university_username', username.trim());
      if (rememberMe) {
        localStorage.setItem('remember_student', 'true');
      }

      setTimeout(() => router.push(targetPath), 1200);

    } catch (err) {
      triggerError("🚨 حدث خطأ غير متوقع أثناء الاتصال بخوادم الحماية المركزية.");
    }
  };

  return (
    <div className="bg-[#050811] text-slate-200 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-4 sm:p-6" dir="rtl">
      
      {/* 🏠 زر الرجوع للواجهة الرئيسية */}
      <Link 
        href="/" 
        className="absolute top-6 right-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#090f1c]/80 hover:bg-[#111a2e] border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-xs font-bold transition-all duration-300 backdrop-blur-xl shadow-lg select-none group"
      >
        <svg className="w-4 h-4 transform group-hover:rotate-12 transition-transform text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>الرجوع للرئيسية</span>
      </Link>

      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,transparent_70%)]" />
      <div className="absolute w-[450px] h-[450px] rounded-full blur-[140px] top-[-10%] right-[-5%] bg-emerald-500/[0.04]" />

      {/* التوست التنبيهي */}
      {notification && (
        <div className="fixed top-6 max-w-[400px] w-[90%] px-5 py-4 rounded-2xl border backdrop-blur-3xl z-50 shadow-2xl bg-emerald-950/90 border-emerald-500/30 text-emerald-300 flex items-center gap-3.5 animate-in fade-in slide-in-from-top-4">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span></span>
          <p className="text-xs font-bold flex-1">{notification}</p>
          <button type="button" onClick={() => setNotification(null)} className="text-[11px] opacity-50 hover:opacity-100 px-2 py-1 rounded-lg bg-white/5">إغلاق</button>
        </div>
      )}

      {/* 🎛️ الكارد الرئيسي مع أنيميشن الاهتزاز عند الخطأ */}
      <motion.div 
        animate={isShaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[450px] bg-[#090f1c]/60 backdrop-blur-3xl border border-emerald-500/15 rounded-[32px] p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative z-10 mt-10"
      >
        
        {/* أفاتار الطالب التفاعلي بالكامل */}
        <div className="w-full flex justify-center mb-6 h-28 relative select-none">
          <div className="absolute w-24 h-24 rounded-full blur-2xl opacity-20 bg-emerald-500" />
          <svg className="w-28 h-28 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15L85 27L50 39L15 27L50 15Z" fill="#0f172a" stroke="#10b981" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M30 32v10c0 8 9 12 20 12s20-4 20-12V32" fill="#0f172a" stroke="#10b981" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M85 27v15" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="85" cy="42" r="2.5" fill="#10b981"/>
            <path d="M28 45C28 58 35 68 50 68C65 68 72 58 72 45H28Z" fill="#111827" stroke="#1e293b" strokeWidth="1.5"/>
            <g className="transition-all duration-500" style={{
              transform: isPasswordFocused && !showPassword ? 'translate(0px, 5px) scale(0)' : isUsernameFocused ? 'translate(-3px, 2px)' : 'translate(0px, 0px)',
              transformOrigin: 'center'
            }}>
              <circle cx="40" cy="52" r="4.5" fill="#ffffff"/><circle cx="40" cy="51.5" r="2" fill="#090f1c"/>
              <circle cx="60" cy="52" r="4.5" fill="#ffffff"/><circle cx="60" cy="51.5" r="2" fill="#090f1c"/>
            </g>
            <path d="M46 60q4 2 8 0" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
            <g className="transition-all duration-500 ease-out" style={{
              transform: isPasswordFocused && !showPassword ? 'translate(0px, -14px)' : 'translate(0px, 25px)',
              opacity: isPasswordFocused && !showPassword ? 1 : 0
            }}>
              <path d="M26 65c2-4 6-4 8 0l4 8c1 2-1 5-4 4l-7-4c-2-1-2-3-1-4z" fill="#1e293b" stroke="#10b981" strokeWidth="1.5"/>
              <path d="M74 65c-2-4-6-4-8 0l-4 8c-1 2 1 5 4 4l7-4c2-1 2-3 1-4z" fill="#1e293b" stroke="#10b981" strokeWidth="1.5"/>
            </g>
          </svg>
        </div>

        <div className="text-center mb-7 select-none">
          <h3 className="text-xl font-extrabold text-white">بوابة الطالب الذكية</h3>
          <p className="text-[11px] text-slate-400 mt-1.5 opacity-80">جامعة إب - منصة شؤون الطلاب والمكتبة الرقمية</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 mr-1">الرقم الجامعي الموحد</label>
            <div className="relative flex items-center">
              <div className="absolute right-4 text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></div>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onFocus={() => setIsUsernameFocused(true)} onBlur={() => setIsUsernameFocused(false)} className="w-full bg-[#04070d]/90 border border-slate-800/80 rounded-2xl pr-11 pl-4 py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all duration-300 focus:ring-4 focus:border-emerald-500/60 focus:ring-emerald-500/10" placeholder="مثال: 2026-XXXXX" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 mr-1">شفرة العبور الأمنية</label>
            <div className="relative flex items-center">
              <div className="absolute right-4 text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></div>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} className="w-full bg-[#04070d]/90 border border-slate-800/80 rounded-2xl pr-11 pl-12 py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all duration-300 focus:ring-4 focus:border-emerald-500/60 focus:ring-emerald-500/10" placeholder="••••••••••••" required />
              
              {/* 👁️ زر العين بدلاً من الإيموجي */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute left-4 text-slate-500 hover:text-emerald-400 transition-colors p-1 select-none"
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7-1.274-4.057-5.065-7-9.542-7-4.477 0-8.268 2.943-9.542 7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 px-1 select-none">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="rounded bg-slate-950 border-slate-800 accent-emerald-500 cursor-pointer" 
              />
              <span className="group-hover:text-slate-300">تذكر بياناتي الآمنة</span>
            </label>
            <Link href="/login/register" className="hover:text-emerald-400 font-semibold transition-colors">
              استعادة رمز المرور؟
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="w-full text-white font-bold py-4 px-4 rounded-2xl text-sm transition-all duration-300 active:scale-[0.98] mt-4 shadow-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2.5 group select-none">
            {isLoading ? <span>جاري فحص جدران الحماية...</span> : <><span>الولوج الآمن للمنصة</span><span className="transform group-hover:-translate-x-1 transition-transform">←</span></>}
          </button>
        </form>

        <div className="mt-6 text-center text-xs border-t border-slate-900 pt-5 select-none">
          <span className="text-slate-400">ليس لديك حساب؟ </span>
          <Link href="/login/register" className="text-emerald-400 font-extrabold hover:underline">أنشئ حسابك الآن</Link>
        </div>

        {/* 🛡️ شارة الحماية والأمان */}
        <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono select-none">
          <svg className="w-3.5 h-3.5 text-emerald-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>نظام تشفير وحماية البيانات 256-bit SSL Enabled</span>
        </div>

      </motion.div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050811] flex items-center justify-center text-slate-500 text-xs font-mono">LOADING STUDENT NODE...</div>}>
      <StudentLoginContent />
    </Suspense>
  );
}