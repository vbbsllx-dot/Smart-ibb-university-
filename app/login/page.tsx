"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginRedirectDispatcher() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // قراءة نوع الحساب والوجهة من الرابط القديم الموحد
    const type = searchParams.get('type');
    const dest = searchParams.get('dest');

    // بناء بارامتر الوجهة (dest) للحفاظ عليه أثناء إعادة التوجيه
    const destinationParam = dest ? `?dest=${encodeURIComponent(dest)}` : '';

    // المصادقة والتوجيه الذكي بناءً على البنية الجديدة للمجلدات
    if (type === 'faculty' || type === 'instructor' || type === 'academic') {
      router.replace(`/login/academic${destinationParam}`);
    } else if (type === 'student') {
      router.replace(`/login/student${destinationParam}`);
    } else {
      // في حال الدخول لـ /login مباشرة بدون بارامترات، نوجهه تلقائياً لبوابة الطلاب أو الريجستير
      router.replace('/login/student');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center text-slate-400 font-sans" dir="rtl">
      <div className="flex items-center gap-3.5 bg-[#090f1c]/60 border border-slate-800/40 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-2xl">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <p className="text-xs font-medium tracking-wide text-slate-300">
          جاري فحص بروتوكول الدخول وإعادة توجيهك للبوابة المطورة...
        </p>
      </div>
    </div>
  );
}

// تصدير افتراضي نظيف لحل مشكلة الـ Runtime Error تماماً
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050811] flex items-center justify-center text-slate-600 text-xs font-mono tracking-widest">
        ROUTING INTERCEPTOR ACTIVE...
      </div>
    }>
      <LoginRedirectDispatcher />
    </Suspense>
  );
}