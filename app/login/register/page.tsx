"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

export default function RegisterHubPage() {
  const router = useRouter();
  const t = useTranslations('RegisterHub');
  
  // حالات التحكم بالتصميم والخطوات
  const [hoveredRole, setHoveredRole] = useState<'student' | 'faculty' | null>(null);
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | null>(null);
  
  // حالات المنطق البرمجي وإرسال البيانات
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // 🚀 دالة معالجة إرسال البريد وتوليد رمز التحقق مع الحماية اللحظية
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);
    setNotification(null);

    // 1️⃣ فحص نظام الحظر المؤقت لحماية السيرفر
    const lockoutUntil = localStorage.getItem('reg_lockout_until');
    if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
      const timeLeft = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000 / 60);
      setNotification(t('errLockout', { minutes: timeLeft }));
      setIsLoading(false);
      return;
    }

    // تنظيف البريد الإلكتروني المكتوب كلياً من الفراغات والأحرف الكبيرة
    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setNotification(t('errInvalidEmail'));
      setIsLoading(false);
      return;
    }

    // 2️⃣ حساب وزيادة عدد المحاولات لمنع الإغراق
    let attempts = parseInt(localStorage.getItem('reg_attempts') || '0');
    attempts += 1;
    localStorage.setItem('reg_attempts', attempts.toString());
    localStorage.setItem('temp_reg_role', selectedRole); // يحفظ 'faculty' أو 'student'

    if (attempts >= 5) {
      const blockTime = Date.now() + 15 * 60 * 1000;
      localStorage.setItem('reg_lockout_until', blockTime.toString());
      localStorage.setItem('reg_attempts', '0'); 
      setNotification(t('errMaxAttempts'));
      setIsLoading(false);
      return;
    }

    try {
      setNotification(t('checkingRecords'));

      // 3️⃣ [منع التكرار القاطع]: الفحص في جدول الحسابات المركزي user_accounts فقط بناءً على المخطط
      const { data: accountCheck, error: accountErr } = await supabase
        .from('user_accounts')
        .select('email, status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (accountErr) {
        console.error("🚨 خطأ سوبابيز:", accountErr.message);
        throw new Error(t('errDatabase'));
      }

      // إذا وُجد الحساب بالإيميل (سواء مقبولApproved أو معلقPending) يتم حظره فوراً
      if (accountCheck) {
        setNotification(t('errEmailExists'));
        setIsLoading(false);
        return;
      }

      setNotification(t('generatingCode'));
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // تنظيف الرموز القديمة لنفس البريد الموحد في جدول verification الموضح بالمخطط
      await supabase.from('verification').delete().eq('email', cleanEmail);
      
      // إدراج الرمز الجديد في جدول التحقق المؤقت
      const { error: insertError } = await supabase
        .from('verification')
        .insert([{ email: cleanEmail, code: code }]);

      if (insertError) throw insertError;

      // استدعاء السيرفر لإرسال الرسالة إلى بريد المستخدم
      const response = await fetch('/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code })
      });

      if (!response.ok) {
        throw new Error(t('errSendEmail'));
      }

      // حفظ البريد مؤقتاً في الكاش
      localStorage.setItem('temp_reg_email', cleanEmail);
      localStorage.removeItem('reg_attempts');
      
      setNotification(t('successSent'));
      
      router.push(`/login/register/code?role=${selectedRole}`); 

    } catch (err: any) {
      console.error(err);
      setNotification(err.message || t('errGeneric'));
      setIsLoading(false);
    }
  };

  // تحديد اللون الحالي بناءً على حركة الماوس أو الكارت الذي تم اختياره
  const activeTheme = selectedRole || hoveredRole;

  return (
    <div className="bg-[#04060a] text-slate-200 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-6">
      
      {/* شبكة النيون الخلفية المستقبلية */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 z-0" />
      
      {/* الهالة الضوئية الذكية المعتمدة على خيارات المستخدم */}
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[160px] transition-all duration-700 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0 ${
        activeTheme === 'student' ? 'bg-emerald-500' : activeTheme === 'faculty' ? 'bg-blue-500' : 'bg-indigo-500/40'
      }`} />

      {/* 🔔 بنر الإشعارات الديناميكي بتصميم زجاجي متناسق ومتفاعل */}
      {notification && (
        <div className={`fixed top-6 max-w-[380px] w-full px-5 py-4 rounded-2xl border backdrop-blur-2xl z-50 transition-all duration-300 animate-pulse ${
          notification.includes('🚨') || notification.includes('⚠️')
            ? 'bg-red-950/80 border-red-500/30 text-red-300'
            : notification.includes('✅') 
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
            : 'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
        }`}>
          <p className="text-xs font-bold text-center leading-relaxed">{notification}</p>
        </div>
      )}

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        
        {/* ================= الخطوة الأولى: اختيار طبيعة الحساب ================= */}
        {!selectedRole ? (
          <>
            {/* العناوين الرئيسية */}
            <div className="text-center mb-12 select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-4 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                {t('badge')}
              </div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight sm:text-4xl">
                {t('title')}
              </h2>
              <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {/* شبكة الكروت الكريستالية المضيئة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              
              {/* كارت حساب الطالب */}
              <div
                onMouseEnter={() => setHoveredRole('student')}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => setSelectedRole('student')}
                className="group relative bg-[#090f1c]/40 backdrop-blur-2xl border border-slate-800/80 rounded-[28px] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-emerald-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)]"
              >
                <div className="absolute top-0 end-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transition-all group-hover:scale-150" />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-inner group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  {t('studentTitle')}
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">{t('instantBadge')}</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('studentDesc')}
                </p>
              </div>

              {/* كارت حساب الأكاديمي */}
              <div
                onMouseEnter={() => setHoveredRole('faculty')}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => setSelectedRole('faculty')}
                className="group relative bg-[#090f1c]/40 backdrop-blur-2xl border border-slate-800/80 rounded-[28px] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.1)]"
              >
                <div className="absolute top-0 start-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl transition-all group-hover:scale-150" />
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 shadow-inner group-hover:bg-blue-500 group-hover:text-black transition-all duration-500">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 0 1 8 0z"/></svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  {t('facultyTitle')}
                  <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">{t('reviewBadge')}</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('facultyDesc')}
                </p>
              </div>

            </div>

            {/* روابط العودة التحتية */}
            <div className="mt-10 text-center text-xs select-none">
              <span className="text-slate-500">{t('haveAccount')} </span>
              <Link href="/login/student" className="text-slate-300 font-bold hover:text-white underline transition-colors mx-1">
                {t('studentLoginLink')}
              </Link>
              <span className="text-slate-600">|</span>
              <Link href="/login/academic" className="text-slate-300 font-bold hover:text-white underline transition-colors mx-1">
                {t('academicLoginLink')}
              </Link>
            </div>
          </>
        ) : (
          
          // ================= الخطوة الثانية: إدخال البريد والتحقق والمنع الصارم =================
          <div className="w-full max-w-[460px] animate-[fadeIn_0.4s_ease-out]">
            
            {/* زر العودة لتغيير الرتبة */}
            <button 
              onClick={() => { setSelectedRole(null); setNotification(null); }}
              className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md"
            >
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
              {t('changeRoleBtn')}
            </button>

            {/* صندوق النموذج الكريستالي الفخم المطور */}
            <div className={`bg-[#0d1527]/40 backdrop-blur-3xl border rounded-[32px] p-8 shadow-2xl transition-colors duration-500 ${
              selectedRole === 'student' ? 'border-emerald-500/20' : 'border-blue-500/20'
            }`}>
              
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-100 select-none">
                  {selectedRole === 'student' ? t('studentFormTitle') : t('facultyFormTitle')}
                </h3>
                <p className="text-xs text-slate-400 mt-2">{t('step1Subtitle')}</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2.5 px-1 select-none">
                    {t('emailLabel')}
                  </label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-[#060a12]/90 border rounded-xl px-4 py-3.5 text-sm text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                      selectedRole === 'student' 
                        ? 'border-slate-800/80 focus:ring-emerald-500/40 focus:border-emerald-500/50' 
                        : 'border-slate-800/80 focus:ring-blue-500/40 focus:border-blue-500/50'
                    }`}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>

                {/* زر الإرسال المتفاعل مع الهوية البصرية المحددة ونظام الحماية */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg select-none ${
                    isLoading 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : selectedRole === 'student'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/10'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/10'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      {t('submitting')}
                    </span>
                  ) : t('submitBtn')}
                </button>
              </form>

              <div className="mt-6 text-center text-xs border-t border-slate-800/40 pt-4">
                <Link href="/login" className={`font-bold hover:underline transition-colors ${
                  selectedRole === 'student' ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  {t('cancelLink')}
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}