"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
// 1️⃣ استيراد عميل الاتصال بـ Supabase للربط الفعلي
import { supabase } from '@/lib/supabase';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'student' | 'faculty'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);

  // 🔄 التقاط نوع البوابة القادمة من الصفحة الرئيسية وتحديد التبويب تلقائياً
  useEffect(() => {
    const portalType = searchParams.get('type');
    if (portalType === 'faculty') {
      setActiveTab('faculty');
    } else if (portalType === 'student') {
      setActiveTab('student');
    }
  }, [searchParams]);

  const destination = searchParams.get('dest');

  // 2️⃣ 🚀 دالة المصادقة والربط الحقيقي مع جداول السيرفر المركزي لجامعة إب
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    try {
      // 📡 استعلام الأمان لمطابقة اسم المستخدم من جدول user_accounts حياً
      const { data: user, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('username', username)
        .single();

      // إذا واجه النظام خطأ أو لم يجد اسم المستخدم مقيداً
      if (error || !user) {
        setNotification("⚠️ خطأ: الرمز الأكاديمي أو اسم المستخدم غير مقيد بالمنظومة.");
        setIsLoading(false);
        return;
      }

      // 🔐 التحقق من الرتبة (Role Match) لضمان عدم دخول طالب إلى بوابة الدكاترة والعكس
      const expectedRole = activeTab === 'faculty' ? 'instructor' : 'student';
      if (user.role !== expectedRole) {
        setNotification(
          activeTab === 'faculty' 
            ? "❌ خطأ: هذا الحساب غير مصادق عليه كعضو هيئة تدريس." 
            : "❌ خطأ: هذا الحساب غير مصادق عليه كطالب في الجامعة."
        );
        setIsLoading(false);
        return;
      }

      // 🔑 مطابقة الرمز السري والباسوورد
      if (user.password_hash !== password) {
        setNotification("🔑 خطأ: الرمز السري أو كلمة المرور غير مطابقة، أعد المحاولة.");
        setIsLoading(false);
        return;
      }

      // 🚦 💡 التعديل البرمجي الجديد: التحقق من حالة تفعيل الحساب
      if (user.status === 'pending') {
        setNotification("⏳ تنبيه: حسابك قيد التأكيد والمراجعة من قِبل مشرف الكلية.");
        setIsLoading(false);
        return;
      } else if (user.status === 'rejected') {
        setNotification("❌ معذرة: تم رفض طلب انضمامك للمنظومة من قِبل الإدارة.");
        setIsLoading(false);
        return;
      }

      // 🎯 في حال النجاح والقبول التام: التقاط الوجهة الديناميكية أو تحويله للمسار الافتراضي الصحيح
      const targetPath = destination || (activeTab === 'student' ? '/student' : '/faculty/dashboard');

      if (activeTab === 'student') {
        setNotification("تم التحقق بنجاح.. مرحباً بك في بوابة الطالب الذكية");
      } else if (activeTab === 'faculty') {
        setNotification("أهلاً يا دكتور.. تم منح صلاحيات الهيئة التدريسية وإدارة الموارد");
      }

      // في ملف الـ Login عند نجاح مطابقة حساب الطالب، اضف هذا السطر قبل الـ router.push:
      localStorage.setItem('university_username', username);
      // توجيه آمن بعد انتهاء عرض إشعار النجاح اللطيف
      setTimeout(() => router.push(targetPath), 1200);

    } catch (err) {
      setNotification("🚨 حدث خطأ غير متوقع أثناء الاتصال بخوادم الحماية المركزية.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#070b14] text-slate-200 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-6" dir="rtl">
      
      {/* 🌌 تأثير الخلفية السيبرانية العميق الموحد */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,transparent_65%)]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/[0.015] blur-[130px] top-[-10%] right-[-10%]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/[0.015] blur-[130px] bottom-[-10%] left-[-10%]" />

      {/* 🔔 نظام الإشعارات الذكي والمشع المدمج في الأعلى */}
      {notification && (
        <div className={`fixed top-6 max-w-[380px] w-full px-5 py-4 rounded-2xl border backdrop-blur-2xl z-50 shadow-2xl transition-all duration-500 flex items-center gap-3 ${
          activeTab === 'student' ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300" : "bg-blue-950/80 border-blue-500/30 text-blue-300"
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <p className="text-xs font-bold leading-relaxed">{notification}</p>
          <button type="button" onClick={() => setNotification(null)} className="mr-auto text-[10px] opacity-60 hover:opacity-100">إغلاق</button>
        </div>
      )}

      {/* 🏛️ صندوق تسجيل الدخول الزجاجي الفخم המطور بالكامل وبدون أي نقص */}
      <div className="w-full max-w-[440px] bg-[#0d1527]/40 backdrop-blur-3xl border border-slate-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-500 hover:border-slate-700/40">
        
        {/* 🎛️ شريط التبويب الثنائي المطور */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900 mb-6 select-none">
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setNotification(null); }}
            className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 text-xs font-bold transition-all duration-300 ${
              activeTab === 'student' ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5"/></svg>
            <span>بوابة الطالب (المكتبة / الشؤون)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('faculty'); setNotification(null); }}
            className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 text-xs font-bold transition-all duration-300 ${
              activeTab === 'faculty' ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>بوابة الكادر الأكاديمي</span>
          </button>
        </div>

        {/* 🎓 رأس التفاعل الذكي الأصلي والكامل المعزز بحركة العينين واليدين وتغطية الوجه */}
        <div className="w-full flex justify-center mb-6 select-none relative h-28">
          <svg className="w-28 h-28 transition-all duration-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15L85 27L50 39L15 27L50 15Z" fill="#111827" stroke={activeTab === 'student' ? '#10b981' : '#3b82f6'} strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M30 32v10c0 8 9 12 20 12s20-4 20-12V32" fill="#111827" stroke={activeTab === 'student' ? '#10b981' : '#3b82f6'} strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M85 27v15" stroke={activeTab === 'student' ? '#10b981' : '#3b82f6'} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="85" cy="42" r="2" fill={activeTab === 'student' ? '#10b981' : '#3b82f6'}/>

            <path d="M28 45C28 58 35 68 50 68C65 68 72 58 72 45H28Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>

            {/* منطق حركة العيون التفاعلي الأصلي عند التركيز أو إخفاء كلمة السر */}
            <g className="transition-all duration-500" style={{
              transform: isPasswordFocused && !showPassword 
                ? 'translate(0px, 5px) scale(0)' 
                : isUsernameFocused 
                ? 'translate(-3px, 2px)' 
                : 'translate(0px, 0px)',
              transformOrigin: 'center'
            }}>
              <circle cx="40" cy="52" r="4" fill="#f8fafc"/>
              <circle cx="40" cy="52" r="2" fill="#0f172a"/>
              <circle cx="60" cy="52" r="4" fill="#f8fafc"/>
              <circle cx="60" cy="52" r="2" fill="#0f172a"/>
              <path d="M34 52h12M54 52h12M46 52a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM66 52a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" stroke={activeTab === 'student' ? '#10b981' : '#3b82f6'} strokeWidth="1"/>
            </g>

            <path d="M46 60q4 2 8 0" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round"/>

            {/* حركية اليدين الأصلية لتغطية العينين عند التركيز على حقل كلمة السر */}
            <g className="transition-all duration-500 ease-out" style={{
              transform: isPasswordFocused && !showPassword ? 'translate(0px, -14px)' : 'translate(0px, 25px)',
              opacity: isPasswordFocused && !showPassword ? 1 : 0
            }}>
              <path d="M26 65c2-4 6-4 8 0l4 8c1 2-1 5-4 4l-7-4c-2-1-2-3-1-4z" fill="#334155" stroke={activeTab === 'student' ? '#10b981' : '#3b82f6'} strokeWidth="1"/>
              <path d="M74 65c-2-4-6-4-8 0l-4 8c-1 2 1 5 4 4l7-4c2-1 2-3 1-4z" fill="#334155" stroke={activeTab === 'student' ? '#10b981' : '#3b82f6'} strokeWidth="1"/>
            </g>
          </svg>
        </div>

        {/* العناوين المتغيرة ذكياً حسب الفئة */}
        <div className="text-center mb-6 select-none">
          <h3 className="text-lg font-bold text-slate-100 transition-all duration-300">
            {activeTab === 'student' ? "لوحة ولوج الطالب الأكاديمية" : "بوابة الكادر الأكاديمي والتدريسي"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">منصة جامعة إب الذكية الشاملة</p>
        </div>

        {/* حقول الإدخال وبناء الواجهة التفاعلية مجهزة للربط الفعلي */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          
          {/* حقل اسم المستخدم / الرقم الجامعي */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 mr-1">
              {activeTab === 'student' ? "الرقم الجامعي للطالب" : "اسم المستخدم أو البريد الأكاديمي"}
            </label>
            <div className="relative">
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => setIsUsernameFocused(false)}
                className={`w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none transition-all shadow-inner focus:ring-2 ${
                  activeTab === 'student' ? "focus:border-emerald-500/50 focus:ring-emerald-500/10" : "focus:border-blue-500/50 focus:ring-blue-500/10"
                }`}
                placeholder={activeTab === 'student' ? "ادخل رقمك الجامعي الفعلي..." : "ادخل الحساب الأكاديمي..."}
                required
              />
            </div>
          </div>

          {/* حقل كلمة المرور مع كاشف العين */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 mr-1">كلمة المرور المشفرة</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                className={`w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none transition-all shadow-inner focus:ring-2 ${
                  activeTab === 'student' ? "focus:border-emerald-500/50 focus:ring-emerald-500/10" : "focus:border-blue-500/50 focus:ring-blue-500/10"
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors z-30"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* خيارات إضافية */}
          <div className="flex justify-between items-center text-xs text-slate-400 px-1 select-none">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className={`rounded bg-slate-900 border-slate-800 ${activeTab === 'student' ? "accent-emerald-500" : "accent-blue-500"}`} />
              <span className="group-hover:text-slate-300 transition-colors">تذكر حسابي</span>
            </label>
            <a href="#" className={`transition-colors ${activeTab === 'student' ? "hover:text-emerald-400" : "hover:text-blue-400"}`}>نسيت كلمة السر؟</a>
          </div>

          {/* زر تسجيل الدخول المضيء المتغير لونه حسب البوابة الحالية */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 active:scale-[0.98] mt-2 shadow-lg relative overflow-hidden flex items-center justify-center gap-2 ${
              isLoading ? "opacity-80 cursor-wait" : ""
            } ${
              activeTab === 'student' 
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/10" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/10"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>جاري الاتصال بقاعدة البيانات الأمنية...</span>
              </>
            ) : (
              <span>الولوج الآمن للنظام</span>
            )}
          </button>
        </form>

        {/* 🛠️ 💡 التعديل البصري الجديد: إضافة رابط إنشاء حساب جديد تفاعلي */}
        <div className="mt-5 text-center text-xs select-none border-t border-slate-800/50 pt-4">
          <span className="text-slate-400">ليس لديك حساب أكاديمي؟ </span>
          <Link 
            href="/login/register" 
            className={`font-bold transition-all duration-300 hover:underline ${
              activeTab === 'student' ? "text-emerald-400 hover:text-emerald-300" : "text-blue-400 hover:text-blue-300"
            }`}
          >
            إنشاء حساب جديد
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <span>العودة للبوابة الرئيسية</span>
            <svg className="w-3 h-3 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>

      <div className="absolute bottom-4 text-center text-[10px] text-slate-600 font-mono tracking-widest select-none relative z-10 mt-6">
        SECURE AUTH SERVICE NODE // SHIELD MULTI-FACTOR ENCRYPTION
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 font-mono text-xs">LOADING SECURE NODE...</div>}>
      <LoginContent />
    </Suspense>
  );
}