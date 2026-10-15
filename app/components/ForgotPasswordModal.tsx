"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  Mail, 
  Lock, 
  UserCheck, 
  KeyRound, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUsername?: string;
  theme?: 'blue' | 'emerald';
}

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  initialUsername = '',
  theme = 'emerald' 
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [targetAccountId, setTargetAccountId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && initialUsername) {
      setUsername(initialUsername);
    }
  }, [isOpen, initialUsername]);

  if (!isOpen) return null;

  const isBlue = theme === 'blue';

  // 1️⃣ المرحلة الأولى: التحقق الذكي (يقبل اسم المستخدم أو الرقم الجامعي student_id أو معرف الدكتور)
  const handleVerifyAccountAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanInput = username.trim();
      const cleanEmail = email.trim().toLowerCase();

      let account: { id: number; username: string; email: string } | null = null;

      // أ) البحث الأول: في جدول user_accounts مباشرة عبر username
      const { data: directAccount } = await supabase
        .from('user_accounts')
        .select('id, username, email')
        .eq('username', cleanInput)
        .ilike('email', cleanEmail)
        .limit(1)
        .maybeSingle();

      if (directAccount) {
        account = directAccount;
      }

      // ب) البحث الثاني: إذا أدخل الطالب رقمه الجامعي (student_id مثل 2003423) نبحث في جدول students
      if (!account) {
        const { data: studentData } = await supabase
          .from('students')
          .select('user_account_id')
          .eq('student_id', cleanInput)
          .limit(1)
          .maybeSingle();

        if (studentData?.user_account_id) {
          const { data: linkedStudentAcc } = await supabase
            .from('user_accounts')
            .select('id, username, email')
            .eq('id', studentData.user_account_id)
            .ilike('email', cleanEmail)
            .limit(1)
            .maybeSingle();

          if (linkedStudentAcc) {
            account = linkedStudentAcc;
          }
        }
      }

      // ج) البحث الثالث: إذا أدخل الدكتور معرفه الأكاديمي (id) نبحث في جدول instructors
      if (!account && !isNaN(Number(cleanInput))) {
        const { data: instructorData } = await supabase
          .from('instructors')
          .select('user_account_id')
          .eq('id', Number(cleanInput))
          .limit(1)
          .maybeSingle();

        if (instructorData?.user_account_id) {
          const { data: linkedInstAcc } = await supabase
            .from('user_accounts')
            .select('id, username, email')
            .eq('id', instructorData.user_account_id)
            .ilike('email', cleanEmail)
            .limit(1)
            .maybeSingle();

          if (linkedInstAcc) {
            account = linkedInstAcc;
          }
        }
      }

      // إذا لم يتم العثور على الحساب أو كان البريد غير مطابق
      if (!account) {
        setErrorMsg('لم يتم العثور على حساب بهذا الرقم/المعرف، أو أن البريد الإلكتروني لا يطابق البريد المسجل لهذا الحساب!');
        setIsLoading(false);
        return;
      }

      // توليد رمز تحقق من 6 أرقام
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

      // حفظ الكود في جدول verification
      const { error: verError } = await supabase
        .from('verification')
        .insert({
          email: cleanEmail,
          code: generatedCode
        });

      if (verError) throw verError;

      // إرسال الكود عبر مسار البريد
      const res = await fetch('/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          code: generatedCode,
          type: 'reset'
        }),
      });

      if (!res.ok) {
        throw new Error('فشل إرسال رمز التحقق إلى البريد الإلكتروني.');
      }

      setTargetAccountId(account.id);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2️⃣ المرحلة الثانية: مطابقة الرمز السري من جدول verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = otpInput.trim();

      const { data: verData, error } = await supabase
        .from('verification')
        .select('*')
        .ilike('email', cleanEmail)
        .eq('code', cleanCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !verData) {
        setErrorMsg('رمز التحقق غير صحيح! يرجى التأكد من الرمز المرسل إلى بريدك.');
        setIsLoading(false);
        return;
      }

      const createdAt = new Date(verData.created_at).getTime();
      if (Date.now() - createdAt > 10 * 60 * 1000) {
        setErrorMsg('انتهت صلاحية هذا الرمز (مضى أكثر من 10 دقائق). يرجى طلب رمز جديد.');
        setIsLoading(false);
        return;
      }

      setStep(3);
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء التحقق من الرمز.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3️⃣ المرحلة الثالثة: تحديث password_hash في جدول user_accounts
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('يجب أن تتكون شفرة العبور الجديدة من 6 خانات على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين!');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ password_hash: newPassword })
        .eq('id', targetAccountId);

      if (error) throw error;

      await supabase
        .from('verification')
        .delete()
        .ilike('email', email.trim().toLowerCase());

      alert('🎉 تم تحديث شفرة العبور الأمنية بنجاح! يمكنك الآن تسجيل الدخول.');
      onClose();
      setStep(1);
      setOtpInput('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg('فشل تحديث كلمة المرور: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none" dir="rtl">
      <div className={`w-full max-w-md ${isBlue ? 'bg-[#090f1c] border-blue-500/25' : 'bg-[#071815] border-emerald-500/25'} border rounded-[28px] p-6 sm:p-8 text-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden`}>
        
        <div className={`absolute -top-20 -right-20 w-44 h-44 ${isBlue ? 'bg-blue-500/15' : 'bg-emerald-500/15'} rounded-full blur-3xl pointer-events-none`} />

        {/* الهيدر */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isBlue ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'}`}>
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-wide text-white">
                استعادة شفرة العبور الأمنية
              </h3>
              <p className="text-[10px] text-slate-400">التحقق المزدوج عبر البريد الإلكتروني المعتمد</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* شريط التقدم */}
        <div className="flex items-center justify-center gap-2 mb-6 relative z-10">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === num 
                  ? (isBlue ? 'w-10 bg-blue-400' : 'w-10 bg-emerald-400') 
                  : step > num 
                  ? (isBlue ? 'w-6 bg-blue-700' : 'w-6 bg-emerald-700') 
                  : 'w-6 bg-white/15'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 text-right">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* المرحلة 1 */}
        {step === 1 && (
          <form onSubmit={handleVerifyAccountAndSendOtp} className="space-y-4 relative z-10 text-right">
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              أدخل المعرف الأكاديمي/الجامعي والبريد الإلكتروني الذي أنشأت به الحساب لإرسال رمز التحقق السري:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                المعرف الأكاديمي / الرقم الجامعي
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل الرقم الأكاديمي أو اسم المستخدم..."
                  className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition-all"
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute right-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                البريد الإلكتروني المسجل بالحساب
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 mt-2 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                isBlue 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isLoading ? 'جاري التحقق وإرسال الرمز...' : 'إرسال رمز التحقق للبريد'}</span>
            </button>
          </form>
        )}

        {/* المرحلة 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 relative z-10 text-right">
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك <span className="text-blue-400 font-mono">({email})</span>:
            </p>

            <input
              type="text"
              required
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="000000"
              className="w-full bg-black/40 border-2 border-blue-500/40 focus:border-blue-400 rounded-2xl py-3.5 text-center text-2xl font-mono font-black tracking-[10px] text-white focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isBlue ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>تأكيد الرمز والمتابعة</span>
              </button>
            </div>
          </form>
        )}

        {/* المرحلة 3 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 relative z-10 text-right">
            <p className="text-xs text-emerald-400 leading-relaxed font-bold">
              ✓ تم توثيق ملكية الحساب بنجاح! عيّن شفرة العبور الجديدة:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                شفرة العبور الجديدة
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-white focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                تأكيد شفرة العبور الجديدة
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-white focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                isBlue ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>حفظ وتحديث شفرة العبور</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}