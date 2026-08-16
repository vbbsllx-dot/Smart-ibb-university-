"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl'; // 👈 استدعاء خطاف الترجمة
import { supabase } from '@/lib/supabase';

function AdminLoginContent() {
  const router = useRouter();
  const t = useTranslations('AdminLogin'); // 👈 ربط قسم تسجيل الدخول
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    try {
      // 📡 استعلام الأمان لمطابقة اسم المستخدم
      const { data: user, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) {
        setNotification(t('errNotFound'));
        setIsLoading(false);
        return;
      }

      // 🔐 التحقق الصارم من الرتبة (يجب أن يكون admin فقط)
      if (user.role !== 'admin') {
        setNotification(t('errForbidden'));
        setIsLoading(false);
        return;
      }

      // 🔑 مطابقة كلمة المرور
      if (user.password_hash !== password) {
        setNotification(t('errPassword'));
        setIsLoading(false);
        return;
      }

      // 🎯 النجاح
      setNotification(t('successRedirect'));
      localStorage.setItem('admin_username', username);
      
      setTimeout(() => router.push('/admin/dashboard'), 1200);

    } catch (err) {
      setNotification(t('errServer'));
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#04181e] text-slate-100 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-6 font-sans">
      
      {/* 🌌 تأثير الخلفية التفاعلية بهوية الزيتي والأخضر الزمردي */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,188,126,0.06)_0%,transparent_70%)]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#059669]/10 blur-[140px] top-[-10%] right-[-10%]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#00bc7e]/10 blur-[140px] bottom-[-10%] left-[-10%]" />

      {/* 🔔 نظام الإشعارات العائم المترجم */}
      {notification && (
        <div className="fixed top-6 max-w-[400px] w-full px-5 py-4 rounded-2xl border backdrop-blur-2xl z-50 shadow-2xl transition-all duration-500 flex items-center gap-3 bg-[#062c35]/90 border-[#00bc7e]/40 text-[#00bc7e]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00bc7e] animate-ping flex-shrink-0" />
          <p className="text-xs font-black leading-relaxed text-slate-100 flex-1">{notification}</p>
          <button type="button" onClick={() => setNotification(null)} className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">
            {t('close')}
          </button>
        </div>
      )}

      {/* 🏛️ صندوق تسجيل الدخول الرئيسي */}
      <div className="w-full max-w-[440px] bg-[#062c35]/70 backdrop-blur-2xl border border-[#00bc7e]/25 rounded-[2.5rem] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative z-10 transition-all duration-500 hover:border-[#00bc7e]/40">
        
        {/* 🎓 قبعة ورأس التفاعل الذكي (بألوان الأخضر الزمردي) */}
        <div className="w-full flex justify-center mb-6 select-none relative h-28">
          <svg className="w-28 h-28 transition-all duration-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15L85 27L50 39L15 27L50 15Z" fill="#04161c" stroke="#00bc7e" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M30 32v10c0 8 9 12 20 12s20-4 20-12V32" fill="#04161c" stroke="#00bc7e" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M85 27v15" stroke="#00bc7e" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="85" cy="42" r="2.5" fill="#00bc7e"/>
            <path d="M28 45C28 58 35 68 50 68C65 68 72 58 72 45H28Z" fill="#0a3945" stroke="#0e5363" strokeWidth="1.5"/>

            {/* حركة العيون */}
            <g className="transition-all duration-500" style={{
              transform: isPasswordFocused && !showPassword ? 'translate(0px, 5px) scale(0)' : isUsernameFocused ? 'translate(-3px, 2px)' : 'translate(0px, 0px)',
              transformOrigin: 'center'
            }}>
              <circle cx="40" cy="52" r="4" fill="#ffffff"/>
              <circle cx="40" cy="52" r="2" fill="#04181e"/>
              <circle cx="60" cy="52" r="4" fill="#ffffff"/>
              <circle cx="60" cy="52" r="2" fill="#04181e"/>
              <circle cx="40" cy="52" r="5" stroke="#00bc7e" strokeWidth="1" fill="none"/>
              <circle cx="60" cy="52" r="5" stroke="#00bc7e" strokeWidth="1" fill="none"/>
            </g>

            <path d="M46 60q4 2 8 0" stroke="#00bc7e" strokeWidth="1.8" strokeLinecap="round"/>

            {/* حركية اليدين عند تغطية العينين */}
            <g className="transition-all duration-500 ease-out" style={{
              transform: isPasswordFocused && !showPassword ? 'translate(0px, -14px)' : 'translate(0px, 25px)',
              opacity: isPasswordFocused && !showPassword ? 1 : 0
            }}>
              <path d="M26 65c2-4 6-4 8 0l4 8c1 2-1 5-4 4l-7-4c-2-1-2-3-1-4z" fill="#0a3945" stroke="#00bc7e" strokeWidth="1.2"/>
              <path d="M74 65c-2-4-6-4-8 0l-4 8c-1 2 1 5 4 4l7-4c2-1 2-3 1-4z" fill="#0a3945" stroke="#00bc7e" strokeWidth="1.2"/>
            </g>
          </svg>
        </div>

        <div className="text-center mb-8 select-none">
          <div className="inline-block px-3 py-1 rounded-full bg-[#00bc7e]/15 border border-[#00bc7e]/30 text-[#00bc7e] text-[10px] font-mono font-black mb-2">
            {t('badge')}
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">{t('title')}</h3>
          <p className="text-xs text-slate-300 font-medium mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-5">
          {/* حقل اسم المستخدم */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 px-1">{t('adminIdLabel')}</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
              className="w-full bg-[#041a21]/90 border border-[#0d4e5d] rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all shadow-inner focus:border-[#00bc7e] focus:ring-2 focus:ring-[#00bc7e]/20 placeholder-slate-500 font-medium"
              placeholder={t('adminIdPlaceholder')}
              required
            />
          </div>

          {/* حقل كلمة المرور */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 px-1">{t('passwordLabel')}</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                className="w-full bg-[#041a21]/90 border border-[#0d4e5d] rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all shadow-inner focus:border-[#00bc7e] focus:ring-2 focus:ring-[#00bc7e]/20 placeholder-slate-500 font-medium"
                placeholder={t('passwordPlaceholder')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3.5 p-1.5 rounded-xl text-slate-400 hover:text-[#00bc7e] transition-colors z-30 cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* زر التقديم والتسجيل */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-black py-3.5 px-4 rounded-2xl text-sm transition-all duration-300 active:scale-[0.98] mt-2 shadow-lg relative overflow-hidden flex items-center justify-center gap-2 cursor-pointer ${
              isLoading ? "opacity-80 cursor-wait" : ""
            } bg-gradient-to-r from-[#059669] to-[#00bc7e] hover:from-[#047857] hover:to-[#059669] shadow-[#00bc7e]/20`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('verifying')}</span>
              </>
            ) : (
              <span>{t('loginBtn')}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#00bc7e] transition-colors font-bold">
            <span>{t('backHome')}</span>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-4 text-center text-[10px] text-[#00bc7e]/40 font-mono tracking-widest select-none relative z-10 mt-6">
        IBB SMART UNIVERSITY // ADMINISTRATIVE CORE NODE
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const t = useTranslations('AdminLogin');
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#04181e] flex items-center justify-center text-[#00bc7e] font-mono text-xs font-bold">
        {t('initializing')}
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}