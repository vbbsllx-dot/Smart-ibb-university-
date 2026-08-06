"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AdminLoginContent() {
  const router = useRouter();
  
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
        setNotification("⚠️ خطأ: بيانات الدخول غير موجودة في قاعدة بيانات النظام.");
        setIsLoading(false);
        return;
      }

      // 🔐 التحقق الصارم من الرتبة (يجب أن يكون admin فقط)
      if (user.role !== 'admin') {
        setNotification("⛔ صلاحيات مرفوضة: هذا الحساب لا يمتلك صلاحيات إدارة النظام (Admin).");
        setIsLoading(false);
        return;
      }

      // 🔑 مطابقة كلمة المرور
      if (user.password_hash !== password) {
        setNotification("🔑 خطأ: كلمة المرور غير صحيحة.");
        setIsLoading(false);
        return;
      }

      // 🎯 النجاح
      setNotification("✅ تم التحقق.. جاري توجيهك إلى لوحة تحكم الإدارة العليا.");
      localStorage.setItem('admin_username', username);
      
      // توجيه لصفحة إعدادات الأدمن (يمكنك تغيير المسار لاحقاً حسب مجلداتك)
      setTimeout(() => router.push('/admin/dashboard'), 1200);

    } catch (err) {
      setNotification("🚨 حدث خطأ في الاتصال بالخوادم المركزية.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#070b14] text-slate-200 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-6" dir="rtl">
      
      {/* 🌌 تأثير الخلفية (بنفسجي مخصص للأدمن) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.02)_0%,transparent_65%)]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/[0.02] blur-[130px] top-[-10%] right-[-10%]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-fuchsia-600/[0.02] blur-[130px] bottom-[-10%] left-[-10%]" />

      {/* 🔔 نظام الإشعارات */}
      {notification && (
        <div className="fixed top-6 max-w-[380px] w-full px-5 py-4 rounded-2xl border backdrop-blur-2xl z-50 shadow-2xl transition-all duration-500 flex items-center gap-3 bg-violet-950/80 border-violet-500/30 text-violet-300">
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <p className="text-xs font-bold leading-relaxed">{notification}</p>
          <button type="button" onClick={() => setNotification(null)} className="mr-auto text-[10px] opacity-60 hover:opacity-100">إغلاق</button>
        </div>
      )}

      {/* 🏛️ صندوق تسجيل الدخول */}
      <div className="w-full max-w-[440px] bg-[#0d1527]/40 backdrop-blur-3xl border border-violet-900/50 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-500 hover:border-violet-800/40">
        
        {/* 🎓 رأس التفاعل الذكي (بألوان الأدمن البنفسجية) */}
        <div className="w-full flex justify-center mb-6 select-none relative h-28">
          <svg className="w-28 h-28 transition-all duration-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15L85 27L50 39L15 27L50 15Z" fill="#111827" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M30 32v10c0 8 9 12 20 12s20-4 20-12V32" fill="#111827" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M85 27v15" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="85" cy="42" r="2" fill="#8b5cf6"/>
            <path d="M28 45C28 58 35 68 50 68C65 68 72 58 72 45H28Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>

            {/* حركة العيون */}
            <g className="transition-all duration-500" style={{
              transform: isPasswordFocused && !showPassword ? 'translate(0px, 5px) scale(0)' : isUsernameFocused ? 'translate(-3px, 2px)' : 'translate(0px, 0px)',
              transformOrigin: 'center'
            }}>
              <circle cx="40" cy="52" r="4" fill="#f8fafc"/>
              <circle cx="40" cy="52" r="2" fill="#0f172a"/>
              <circle cx="60" cy="52" r="4" fill="#f8fafc"/>
              <circle cx="60" cy="52" r="2" fill="#0f172a"/>
              <path d="M34 52h12M54 52h12M46 52a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM66 52a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" stroke="#8b5cf6" strokeWidth="1"/>
            </g>

            <path d="M46 60q4 2 8 0" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round"/>

            {/* حركية اليدين */}
            <g className="transition-all duration-500 ease-out" style={{
              transform: isPasswordFocused && !showPassword ? 'translate(0px, -14px)' : 'translate(0px, 25px)',
              opacity: isPasswordFocused && !showPassword ? 1 : 0
            }}>
              <path d="M26 65c2-4 6-4 8 0l4 8c1 2-1 5-4 4l-7-4c-2-1-2-3-1-4z" fill="#334155" stroke="#8b5cf6" strokeWidth="1"/>
              <path d="M74 65c-2-4-6-4-8 0l-4 8c-1 2 1 5 4 4l7-4c2-1 2-3 1-4z" fill="#334155" stroke="#8b5cf6" strokeWidth="1"/>
            </g>
          </svg>
        </div>

        <div className="text-center mb-8 select-none">
          <h3 className="text-xl font-bold text-slate-100">بوابة الإدارة العليا (Admin)</h3>
          <p className="text-xs text-violet-400 mt-1">نظام التحكم الشامل للمنصة</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-5">
          {/* حقل اسم المستخدم */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 mr-1">معرف المشرف (Admin ID)</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
              className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none transition-all shadow-inner focus:ring-2 focus:border-violet-500/50 focus:ring-violet-500/10"
              placeholder="أدخل معرف الإدارة..."
              required
            />
          </div>

          {/* حقل كلمة المرور */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 mr-1">كلمة المرور المشفرة</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none transition-all shadow-inner focus:ring-2 focus:border-violet-500/50 focus:ring-violet-500/10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 p-1.5 rounded-lg text-slate-500 hover:text-violet-400 transition-colors z-30"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* زر الدخول */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 active:scale-[0.98] mt-2 shadow-lg relative overflow-hidden flex items-center justify-center gap-2 ${isLoading ? "opacity-80 cursor-wait" : ""} bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-violet-500/20`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>جاري التحقق من الصلاحيات...</span>
              </>
            ) : (
              <span>دخول الإدارة</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <span>العودة للموقع الرئيسي</span>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-4 text-center text-[10px] text-violet-900/50 font-mono tracking-widest select-none relative z-10 mt-6">
        ADMINISTRATIVE NODE // ROOT ACCESS REQUIRED
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-violet-400 font-mono text-xs">INITIALIZING ADMIN NODE...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}