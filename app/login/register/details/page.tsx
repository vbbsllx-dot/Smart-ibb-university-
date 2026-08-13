"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// 📚 تعريف البيانات الثابتة للكليات والأقسام
const COLLEGES = [
  { id: 1, name: 'كلية الهندسة' },
  { id: 2, name: 'كلية الطب والعلوم الصحية' }
];
const LEVELS = [
  { id: 1, name: 'المستوى الأول' },
  { id: 2, name: 'المستوى الثاني' },
  { id: 3, name: 'المستوى الثالث' },
  { id: 4, name: 'المستوى الرابع' },
  { id: 5, name: 'المستوى الخامس' }
];



const DEPARTMENTS: Record<number, { id: number, name: string }[]> = {
  1: [ // أقسام كلية الهندسة
    { id: 1, name: 'قسم الحاسبات والتحكم' },
    { id: 2, name: 'قسم الاتصالات' },
    { id: 3, name: 'قسم العمارة' },
    { id: 4, name: 'قسم الهندسة المدنية' },
    { id: 5, name: 'قسم التصميم الداخلي' }
  ],
  2: [ // أقسام كلية الطب
    { id: 6, name: 'قسم المختبرات' },
    { id: 7, name: 'قسم الطب العام' }
  ]
};

export default function RegistrationDetailsPage() {
  const router = useRouter();
  
  // 1️⃣ متغيرات النموذج

  const [selectedLevel, setSelectedLevel] = useState('');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [name, setName] = useState('');
  const [academicId, setAcademicId] = useState(''); // الرقم الجامعي أو المعرف الأكاديمي
  const [username, setUsername] = useState(''); // 📌 اسم المستخدم الفريد (للدخول)
  const [password, setPassword] = useState('');
  
  // متغيرات القوائم الديناميكية
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCollege(e.target.value);
    setSelectedDepartment(''); 
  };

  // 2️⃣ دالة الإرسال والفحص المسبق (Unique Validation)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    if (!selectedCollege) {
      setNotification({ type: 'error', msg: "⚠️ يرجى تحديد الكلية أولاً." });
      setIsLoading(false); return;
    }
    if (role === 'student' && !selectedDepartment) {
      setNotification({ type: 'error', msg: "⚠️ يرجى تحديد القسم الأكاديمي." });
      setIsLoading(false); return;
    }

    try {
      // 🔍 📌 الفحص المسبق: البحث في قاعدة البيانات للتأكد من أن اسم المستخدم فريد (Unique)
      const { data: existingUser, error: checkError } = await supabase
        .from('user_accounts')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;

      // إذا وجد حساباً بنفس اسم المستخدم، سيمنعه من الإرسال
      if (existingUser) {
        setNotification({ type: 'error', msg: "❌ اسم المستخدم (Username) مستخدم مسبقاً! يرجى اختيار اسم آخر." });
        setIsLoading(false);
        return; 
      }

      // 🚀 إنشاء الحساب (بعد التأكد من أنه فريد)
      const { data: accountData, error: accountError } = await supabase
        .from('user_accounts')
        .insert([{ 
            username: username, 
            password_hash: password, 
            role: role, 
            status: 'pending' 
        }])
        .select('id')
        .single(); 

      if (accountError) throw accountError;
      const newAccountId = accountData.id;

      // 🚀 إدخال البيانات في جدول الطلاب أو الدكاترة
     if (role  === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([{ 
              student_id: academicId, 
              name: name, 
              user_account_id: newAccountId, 
              dep_id: parseInt(selectedDepartment),
              level_id: parseInt(selectedLevel)
          }]);
        if (studentError) throw studentError;

      } else if (role === 'instructor') {
        const { error: instructorError } = await supabase
          .from('instructors')
          .insert([{ 
              id: academicId, 
              name: name, 
              user_account_id: newAccountId, 
              college_id: parseInt(selectedCollege) 
          }]);
        if (instructorError) throw instructorError;
      }

      // 🎉 النجاح والتوجيه
      setNotification({ type: 'success', msg: "✅ تم تسجيل بياناتك بنجاح! تم إرسال طلبك للإدارة للمراجعة." });
      
      setTimeout(() => {
        router.push('/login'); 
      }, 3500);

    } catch (err) {
      setNotification({ type: 'error', msg: "🚨 حدث خطأ غير متوقع أثناء حفظ البيانات." });
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#070b14] text-slate-200 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-6" dir="rtl">
      
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02)_0%,transparent_65%)]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/[0.015] blur-[130px] top-[-10%] right-[-10%]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/[0.015] blur-[130px] bottom-[-10%] left-[-10%]" />

      {notification && (
        <div className={`fixed top-6 max-w-[380px] w-full px-5 py-4 rounded-2xl border backdrop-blur-2xl z-50 shadow-2xl transition-all duration-500 flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' : 'bg-red-950/80 border-red-500/30 text-red-300'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <p className="text-xs font-bold leading-relaxed">{notification.msg}</p>
        </div>
      )}

      <div className="w-full max-w-[500px] bg-[#0d1527]/60 backdrop-blur-3xl border border-slate-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 mt-8 mb-8">
        
        <div className="text-center mb-6 select-none">
          <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">📝</div>
          <h3 className="text-xl font-bold text-slate-100">استكمال البيانات الشخصية</h3>
          <p className="text-xs text-slate-400 mt-2">الخطوة 3 والأخيرة: إنشاء الملف الأكاديمي</p>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900 mb-4 select-none">
            <button
              type="button"
              onClick={() => { setRole('student'); setSelectedCollege(''); setSelectedDepartment(''); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                role === 'student' ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              طالب جامعي
            </button>
            <button
              type="button"
              onClick={() => { setRole('instructor'); setSelectedCollege(''); setSelectedDepartment(''); }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                role === 'instructor' ? "bg-violet-500/10 border border-violet-500/20 text-violet-400" : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              عضو هيئة تدريس
            </button>
          </div>

          {/* الاسم الرباعي */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم الرباعي</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder="مثال: زايد سلطان الخولاني"
            />
          </div>

          {/* الرقم الجامعي (رقم الهوية الأكاديمية) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {role === 'student' ? 'الرقم الجامعي' : 'المعرف الوظيفي (ID)'}
            </label>
            <input 
              type="text" value={academicId} onChange={(e) => setAcademicId(e.target.value)} required
              className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder={role === 'student' ? "مثال: 20231010" : "أدخل رقمك الوظيفي"}
            />
          </div>

          {/* اسم المستخدم (الفريد) */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">اسم المستخدم الخاص بالدخول (Username)</label>
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-indigo-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder="مثال: Zaid_Eng"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              * يجب أن يكون فريداً باللغة الإنجليزية، وسيُستخدم لتسجيل الدخول للنظام.
            </p>
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">كلمة المرور</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder="••••••••"
            />
          </div>

          {/* 🏢 اختيار الكلية */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">الكلية التابع لها</label>
            <select 
              value={selectedCollege} onChange={handleCollegeChange} required
              className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none focus:border-indigo-500/50 appearance-none"
            >
              <option value="" disabled>-- اختر الكلية --</option>
              {COLLEGES.map(college => (
                <option key={college.id} value={college.id}>{college.name}</option>
              ))}
            </select>
          </div>

          {/* 🏫 اختيار القسم */}
          {role === 'student' && selectedCollege && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">القسم الأكاديمي</label>
              <select 
                value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} required
                className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none focus:border-indigo-500/50 appearance-none"
              >
                <option value="" disabled>-- اختر القسم --</option>
                {DEPARTMENTS[parseInt(selectedCollege)]?.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

          {role === 'student' && selectedCollege && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">المستوى الدراسي</label>
          <select 
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value)} 
            required
            className="w-full bg-[#090d16]/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none focus:border-indigo-500/50 appearance-none"
          >
            <option value="" disabled>-- اختر المستوى --</option>
            {LEVELS.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
                )}

          <button 
            type="submit" disabled={isLoading}
            className={`w-full text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all mt-6 ${
              isLoading ? "opacity-80 cursor-wait" : "hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20"
            } bg-gradient-to-r from-indigo-600 to-violet-600`}
          >
            {isLoading ? "جاري فحص وتأكيد البيانات..." : "تسجيل البيانات وإرسال الطلب"}
          </button>
        </form>
      </div>

    </div>
  );
}