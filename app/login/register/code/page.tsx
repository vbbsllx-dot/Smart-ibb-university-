"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // 🎯 تحديد وتوحيد نوع الحساب (طالب أم أكاديمي)
  const [role, setRole] = useState<'student' | 'instructor'>('student');

  useEffect(() => {
    const roleFromUrl = searchParams.get('role');
    const roleFromStorage = localStorage.getItem('temp_reg_role');
    const activeRole = roleFromUrl || roleFromStorage;

    if (activeRole === 'faculty' || activeRole === 'instructor' || activeRole === 'academic') {
      setRole('instructor');
    } else {
      setRole('student');
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);
    
    const rawEmail = localStorage.getItem('temp_reg_email');
    if (!rawEmail) {
      console.warn("⚠️ لم يتم العثور على بريد إلكتروني في الـ localStorage");
      router.push('/login/register');
      return;
    }
    const email = rawEmail.trim().toLowerCase();
    const inputCode = code.trim();

    console.log("🔍 جاري التحقق للبريد الإلكتروني:", email);
    console.log("🔑 الكود الذي أدخله المستخدم في الواجهة:", inputCode);

    try {
      // جلب السجلات المرتبطة بهذا الإيميل
      const { data, error } = await supabase
        .from('verification')
        .select('*')
        .eq('email', email);

      if (error) {
        console.error("🚨 خطأ أثناء جلب البيانات من Supabase:", error.message);
        throw error;
      }

      console.log("📡 السجلات المسترجعة من قاعدة البيانات لهذا البريد:", data);

      if (data && data.length > 0) {
        // البحث بداخل السجلات المسترجعة محلياً
        const matchingRecord = data.find(record => String(record.code).trim() === inputCode);

        if (matchingRecord) {
          console.log("✅ تم العثور على تطابق صحيح! معرف السجل المحذوف:", matchingRecord.id);
          
          // حذف السجل المستخدم لمرة واحدة
          const { error: deleteError } = await supabase
            .from('verification')
            .delete()
            .eq('id', matchingRecord.id);

          if (deleteError) {
            console.warn("⚠️ فشل حذف رمز التحقق المستخدم:", deleteError.message);
          }

          // تأكيد حفظ الرول المعتمد بـ localStorage
          localStorage.setItem('temp_reg_role', role);

          // 🚀 التوجيه الصريح والآمن لصفحة التفاصيل مع تمرير الرول في الرابط
          router.push(`/login/register/details?role=${role}`);
        } else {
          console.warn("❌ لم يتطابق الكود المدخل مع أي كود في قاعدة البيانات.");
          setNotification("❌ رمز التحقق الذي أدخلته غير صحيح، يرجى مراجعة بريدك.");
          setIsLoading(false);
        }
      } else {
        console.warn("❌ لا توجد أي أكواد نشطة مسجلة لهذا البريد في الداتابيز.");
        setNotification("❌ لم يتم العثور على طلب تفعيل نشط لهذا البريد.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("🚨 عطل فني في السيرفر:", err.message);
      setNotification("🚨 حدث خطأ أثناء الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#070b14] min-h-screen flex items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      
      {/* توهج خلفي يتغير حساسيته ولونه حسب نوع الحساب */}
      <div className={`absolute w-[400px] h-[400px] rounded-full blur-[130px] pointer-events-none ${
        role === 'student' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
      }`} />

      <div className={`w-full max-w-[420px] bg-[#0d1527]/70 backdrop-blur-3xl border rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-500 ${
        role === 'student' ? 'border-emerald-500/20' : 'border-indigo-500/20'
      }`}>
        
        {/* هيدر مخصص ونصوص ترحيبية بناءً على نوع الحساب */}
        <div className="text-center mb-6 select-none">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border transition-all duration-500 ${
            role === 'student' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
          }`}>
            {role === 'student' ? '🎓' : '👨‍🏫'}
          </div>
          
          <h3 className="text-xl font-bold text-white">
            {role === 'student' ? 'تأكيد بريد الطالب الجامعي' : 'تأكيد بريد عضو هيئة التدريس'}
          </h3>
          
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            {role === 'student' 
              ? 'أدخل رمز التفعيل المكون من 6 أرقام المرسل لحسابك الطلابي.' 
              : 'أدخل رمز التفعيل الأكاديمي المكون من 6 أرقام المرسل لبريدك المعتمد.'}
          </p>
        </div>
        
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)}
              className={`w-full bg-[#090d16] border rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.4em] font-mono text-white focus:outline-none transition-all ${
                role === 'student' 
                  ? 'border-slate-800 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20' 
                  : 'border-slate-800 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20'
              }`}
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          {notification && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/30 text-red-300 text-xs text-center font-bold animate-in fade-in">
              {notification}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg disabled:opacity-50 select-none ${
              role === 'student'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-900/20'
            }`}
          >
            {isLoading ? "جاري التحقق ومزامنة السيرفر..." : "تأكيد الرمز والانتقال لاستكمال الملف"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-sm" dir="rtl">
        جاري تشغيل نظام فحص الأكواد والبروتوكول الأمني...
      </div>
    }>
      <VerifyCodeContent />
    </Suspense>
  );
}