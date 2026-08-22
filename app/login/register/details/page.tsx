"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

// 📊 البيانات الرسمية المطابقة لجداول Supabase
const COLLEGES_DATA = [
  { co_id: 1 },
  { co_id: 2 },
  { co_id: 3 },
  { co_id: 4 },
  { co_id: 5 }
];

const DEPARTMENTS_DATA: Record<number, { dep_id: number }[]> = {
  1: [{ dep_id: 1 }, { dep_id: 2 }, { dep_id: 3 }, { dep_id: 4 }],
  2: [{ dep_id: 5 }, { dep_id: 6 }, { dep_id: 7 }],
  3: [{ dep_id: 8 }],
  4: [{ dep_id: 9 }],
  5: [{ dep_id: 10 }, { dep_id: 11 }, { dep_id: 12 }]
};

const ALL_LEVELS_DATA = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 }
];

function RegistrationDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('RegistrationDetails');
  
  // 🎯 قراءة الرول المختار سابقاً تلقائياً من الرابط بعد إتمام التحقق من البريد
  const roleParam = searchParams.get('role');
  const currentRole = (roleParam === 'instructor' || roleParam === 'faculty' || roleParam === 'academic') 
    ? 'instructor' 
    : 'student';

  // متغيرات الحقول الشخصية
  const [name, setName] = useState('');
  const [academicId, setAcademicId] = useState(''); 
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  
  // حقول القوائم والربط
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

  // إعادة ضبط الأقسام والمستويات عند تغيير الكلية
  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCollege(e.target.value);
    setSelectedDepartment(''); 
    setSelectedLevel('');
  };

  // إعادة ضبط المستويات عند تغيير القسم لتطبيق شروط السنوات ديناميكياً
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
    setSelectedLevel('');
  };

  // دالة احتساب عدد المستويات المتاحة لكل قسم وكلية ديناميكياً
  const getFilteredLevels = () => {
    const collegeId = parseInt(selectedCollege);
    const deptId = parseInt(selectedDepartment);

    if (!collegeId) return [];

    let maxLevel = 4; // الافتراضي لبقية الأقسام والكليات هو 4 سنوات

    if (collegeId === 1) {
      maxLevel = 5; // كلية الهندسة بالكامل 5 سنوات
    } else if (collegeId === 2) {
      if (deptId === 5) maxLevel = 7; // الطب البشري 7 سنوات
      else maxLevel = 4; // المختبرات الطبية والتمريض 4 سنوات
    } else if (collegeId === 3) {
      maxLevel = 5; // طب الأسنان 5 سنوات
    }

    return ALL_LEVELS_DATA.filter(level => level.id <= maxLevel);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    if (!selectedCollege) {
      setNotification({ type: 'error', msg: t('errSelectCollege') });
      setIsLoading(false); return;
    }
    if (currentRole === 'student' && !selectedDepartment) {
      setNotification({ type: 'error', msg: t('errSelectDept') });
      setIsLoading(false); return;
    }
    if (currentRole === 'student' && !selectedLevel) {
      setNotification({ type: 'error', msg: t('errSelectLevel') });
      setIsLoading(false); return;
    }

    try {
      // 🛡️ [فحص صارم 1]: فرادة اسم المستخدم
      const { data: userExists, error: userCheckErr } = await supabase
        .from('user_accounts')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (userCheckErr) throw userCheckErr;
      if (userExists) {
        setNotification({ type: 'error', msg: t('errUserExists') });
        setIsLoading(false); return;
      }

      // 🛡️ [فحص صارم 2]: منع تكرار المعرف الأكاديمي/الوظيفي في الجداول الفرعية
      if (currentRole === 'student') {
        const { data: studentExists, error: studentCheckErr } = await supabase
          .from('students')
          .select('student_id')
          .eq('student_id', academicId.trim())
          .maybeSingle();

        if (studentCheckErr) throw studentCheckErr;
        if (studentExists) {
          setNotification({ type: 'error', msg: t('errStudentExists', { id: academicId }) });
          setIsLoading(false); return;
        }
      } else {
        const { data: instructorExists, error: instCheckErr } = await supabase
          .from('instructors')
          .select('id')
          .eq('id', academicId.trim())
          .maybeSingle();

        if (instCheckErr) throw instCheckErr;
        if (instructorExists) {
          setNotification({ type: 'error', msg: t('errFacultyExists', { id: academicId }) });
          setIsLoading(false); return;
        }
      }

      // 🚀 جلب البريد الإلكتروني المحفوظ من خطوة التحقق
      const emailToSave = localStorage.getItem('temp_reg_email');

      // 🚀 تنفيذ الإدخال: حساب المستخدم الرئيسي
      const { data: accountData, error: accountError } = await supabase
        .from('user_accounts')
        .insert([{ 
            username: username.trim(), 
            password_hash: password, 
            role: currentRole, 
            status: 'pending',
            email: emailToSave 
        }])
        .select('id')
        .single(); 

      if (accountError) throw accountError;
      const newAccountId = accountData.id;

      // 🧹 تنظيف الذاكرة المؤقتة بعد الحفظ الناجح
      localStorage.removeItem('temp_reg_email');

      // 🚀 تنفيذ الإدخال: تفاصيل الطالب أو الأكاديمي
      if (currentRole === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([{ 
              student_id: academicId.trim(), 
              name: name.trim(), 
              user_account_id: newAccountId, 
              dep_id: parseInt(selectedDepartment),
              level_id: parseInt(selectedLevel)
          }]);
        if (studentError) throw studentError;

      } else if (currentRole === 'instructor') {
        const { error: instructorError } = await supabase
          .from('instructors')
          .insert([{ 
              id: academicId.trim(), 
              name: name.trim(), 
              user_account_id: newAccountId, 
              college_id: parseInt(selectedCollege) 
          }]);
        if (instructorError) throw instructorError;
      }

      setNotification({ type: 'success', msg: t('successRegistration') });
     
      setTimeout(() => {
        // التوجيه للواجهة المخصصة بناءً على رتبة الحساب المسجل
        if (currentRole === 'instructor') {
          router.push('/login/academic');
        } else {
          router.push('/login/student');
        }
      }, 3500);

    } catch (err: any) {
      console.error(err);
      if (err.code === '23505') {
        setNotification({ type: 'error', msg: t('errConflict') });
      } else {
        setNotification({ type: 'error', msg: t('errGeneric') });
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#030712] text-slate-200 min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-4 md:p-8">
      
      {/* التوهج الخلفي المخصص حسب الرول المحدد سلفاً */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.015)_0%,transparent_70%)]" />
      <div className={`absolute w-[450px] h-[450px] rounded-full blur-[140px] top-[-5%] end-[-5%] ${currentRole === 'student' ? 'bg-emerald-500/5' : 'bg-blue-600/5'}`} />
      <div className={`absolute w-[450px] h-[450px] rounded-full blur-[140px] bottom-[-5%] start-[-5%] ${currentRole === 'student' ? 'bg-teal-500/5' : 'bg-indigo-600/5'}`} />

      {/* التوست الذكي للرسائل */}
      {notification && (
        <div className={`fixed top-6 max-w-[420px] w-[90%] px-5 py-4 rounded-2xl border backdrop-blur-3xl z-50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex items-start gap-3 transform animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-950/90 border-red-500/40 text-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notification.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
          <p className="text-xs font-semibold leading-relaxed">{notification.msg}</p>
        </div>
      )}

      {/* كارد التصميم المخصص تلقائياً بدون أزرار تبديل */}
      <div className={`w-full max-w-[520px] bg-[#0b1120]/50 backdrop-blur-3xl border rounded-[32px] p-6 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative z-10 my-8 transition-all duration-500 ${
        currentRole === 'student' ? 'border-emerald-500/15' : 'border-blue-500/15'
      }`}>
        
        {/* الهيدر المخصص تلقائياً */}
        <div className="text-center mb-8 select-none">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${
            currentRole === 'student' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
          }`}>
            {currentRole === 'student' ? (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.174L11.25 14.01a1.75 1.75 0 001.5 0l6.99-3.837m-13.98 0a1.75 1.75 0 010-3.047l6.99-3.837a1.75 1.75 0 011.5 0l6.99 3.837a1.75 1.75 0 010 3.048l-6.99 3.837a1.75 1.75 0 01-1.5 0l-6.99-3.837zm13.98 0v6.215c0 .574-.306 1.108-.806 1.39l-4.73 2.656a1.75 1.75 0 01-1.728 0l-4.73-2.656a1.748 1.748 0 01-.806-1.39v-6.215m12.75 0v.105" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21V9.75M3.284 14.253A8.996 8.996 0 013.043 12c0-1.21.238-2.366.67-3.42m0 0a9.002 9.002 0 0115.522 0m-15.52 0a9.008 9.008 0 011.493-2.235m14.027 5.655a8.996 8.996 0 01.24 2.254c0 1.21-.238 2.366-.67 3.42m0 0a9.002 9.002 0 01-15.522 0m15.52 0a9.008 9.008 0 01-1.493 2.235m-7.48-12.72c.496 0 .984.041 1.46.12a9.08 9.08 0 012.333.694m-3.793-.814a9.079 9.079 0 00-2.333.694m3.793-.814V3m0 0h.008v.008H12V3zm0 6.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {currentRole === 'student' ? t('studentHeaderTitle') : t('facultyHeaderTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">{t('headerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-5">
          
          {/* الاسم */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 px-1">{t('nameLabel')}</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              placeholder={t('namePlaceholder')}
            />
          </div>

          {/* المعرف المالي / الأكاديمي */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 px-1">
              {currentRole === 'student' ? t('studentIdLabel') : t('facultyIdLabel')}
            </label>
            <input 
              type="text" value={academicId} onChange={(e) => setAcademicId(e.target.value)} required
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              placeholder={currentRole === 'student' ? t('studentIdPlaceholder') : t('facultyIdPlaceholder')}
            />
          </div>

          {/* اسم المستخدم */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 px-1">{t('usernameLabel')}</label>
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm text-indigo-300 tracking-wide font-mono text-start focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              placeholder={t('usernamePlaceholder')}
              dir="ltr"
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 px-1">{t('passwordLabel')}</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all tracking-widest"
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          {/* 🏢 اختيار الكلية */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-400 mb-2 px-1">{t('collegeLabel')}</label>
            <select 
              value={selectedCollege} onChange={handleCollegeChange} required
              className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
            >
              <option value="" disabled>{t('collegeSelectPlaceholder')}</option>
              {COLLEGES_DATA.map(college => (
                <option key={college.co_id} value={college.co_id} className="bg-[#0b1120] text-slate-200">
                  {t(`colleges.${college.co_id}` as any)}
                </option>
              ))}
            </select>
            <div className="absolute end-4 bottom-4 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* 🏫 الأقسام (تظهر حصرياً للطلاب فقط) */}
          {currentRole === 'student' && selectedCollege && (
            <div className="animate-in fade-in slide-in-from-top-3 duration-300 relative">
              <label className="block text-xs font-semibold text-slate-400 mb-2 px-1">{t('departmentLabel')}</label>
              <select 
                value={selectedDepartment} onChange={handleDepartmentChange} required
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
              >
                <option value="" disabled>{t('departmentSelectPlaceholder')}</option>
                {DEPARTMENTS_DATA[parseInt(selectedCollege)]?.map(dept => (
                  <option key={dept.dep_id} value={dept.dep_id} className="bg-[#0b1120] text-slate-200">
                    {t(`departments.${dept.dep_id}` as any)}
                  </option>
                ))}
              </select>
              <div className="absolute end-4 bottom-4 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}

          {/* 🎓 المستوى (يظهر حصرياً للطلاب فقط ومفلتر بدقة حسب الكلية والتخصص) */}
          {currentRole === 'student' && selectedCollege && selectedDepartment && (
            <div className="animate-in fade-in slide-in-from-top-3 duration-300 relative">
              <label className="block text-xs font-semibold text-slate-400 mb-2 px-1">{t('levelLabel')}</label>
              <select 
                value={selectedLevel} 
                onChange={(e) => setSelectedLevel(e.target.value)} 
                required
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
              >
                <option value="" disabled>{t('levelSelectPlaceholder')}</option>
                {getFilteredLevels().map(level => (
                  <option key={level.id} value={level.id} className="bg-[#0b1120] text-slate-200">
                    {t(`levels.${level.id}` as any)}
                  </option>
                ))}
              </select>
              <div className="absolute end-4 bottom-4 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}

          {/* زر حفظ البيانات */}
          <button 
            type="submit" disabled={isLoading}
            className={`w-full text-white font-bold py-4 px-4 rounded-xl text-sm transition-all duration-500 relative overflow-hidden mt-6 group select-none ${
              isLoading 
                ? "opacity-60 cursor-wait bg-slate-800" 
                : currentRole === 'student'
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/10 active:scale-[0.99]"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 shadow-lg shadow-blue-500/10 active:scale-[0.99]"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t('submitting')}</span>
                </>
              ) : (
                t('submitBtn')
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegistrationDetailsPage() {
  const t = useTranslations('RegistrationDetails');

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-slate-400 font-medium text-sm tracking-wide">
        {t('fallback')}
      </div>
    }>
      <RegistrationDetailsContent />
    </Suspense>
  );
}