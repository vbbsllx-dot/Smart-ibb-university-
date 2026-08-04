"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// 1️⃣ استيراد عميل الاتصال بـ Supabase
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [time, setTime] = useState('');

  // 2️⃣ الحالات الذكية لاستقبال البيانات الحقيقية من السيرفر بدون أي بيانات افتراضية
  const [studentData, setStudentData] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3️⃣ 📡 دالة استدعاء ملف الطالب الأكاديمي والمقررات حياً من جداول السيرفر
  useEffect(() => {
    const fetchStudentProfileAndGrades = async () => {
      setLoading(true);
      try {
        // التقاط اسم المستخدم أو الرقم الجامعي الذي تم تسجيل الدخول به من المتصفح (افتراضياً 202020 للتجربة)
        const loggedInUser = localStorage.getItem('university_username') || '202020';

        // جلب السجل الشخصي للطالب من جدول students
        const { data: studentRow, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', loggedInUser)
          .maybeSingle();

        if (!studentError && studentRow) {
          setStudentData({
            name: studentRow.name,
            id: studentRow.student_id,
            department: studentRow.department || "هندسة الحاسبات والتحكم",
            level: studentRow.level || "المستوى الرابع",
            gpa: studentRow.gpa || "0.00",
            status: studentRow.status || "منتظم"
          });

          // جلب المواد المسجلة للطالب حياً من جدول المقررات المربوط بالـ Student ID حقه
          const { data: coursesData, error: coursesError } = await supabase
            .from('student_courses')
            .select('*')
            .eq('student_id', studentRow.student_id);

          if (!coursesError && coursesData) {
            setEnrolledCourses(coursesData);
          }
        }
      } catch (err) {
        console.error("Error connecting to database:", err);
      }
      setLoading(false);
    };

    fetchStudentProfileAndGrades();
  }, []);

  // مصفوفة الألوان لتزيين الخطوط الجانبية للمواد بشكل ديناميكي أنيق ومطابق لتصميمك
  const colorPalettes = [
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-blue-500",
    "from-indigo-500 to-purple-500",
    "from-rose-500 to-pink-500"
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden selection:bg-emerald-500/30" dir="rtl">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-emerald-400/10 blur-[140px] top-[15%] right-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-[130px] bottom-[15%] left-[-10%]" />
      </div>

      {/* 🏛️ 1. الشريط العلوي الثابت الفخم الموحد للهوية السيبرانية */}
      <header className="w-full bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#12422C] text-white px-6 py-4.5 flex justify-between items-center relative z-40 rounded-b-2xl shadow-xl border-b-2 border-emerald-500/30 select-none">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399]" />
          <div className="text-right">
            <h1 className="text-base font-black tracking-wider text-slate-50 drop-shadow-sm">بوابة الخدمات الأكاديمية الذكية</h1>
            <p className="text-[10px] text-emerald-300 font-mono tracking-widest uppercase">Student Cyber Portal // IBB UNI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-emerald-300 font-extrabold shadow-inner hidden sm:block">
            {time || "00:00:00"}
          </div>
          <Link href="/login" className="text-xs font-bold bg-white/10 hover:bg-rose-600/20 hover:text-rose-300 border border-white/10 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm">
            تسجيل الخروج ↩
          </Link>
        </div>
      </header>

      {/* 📊 محتوى لوحة التحكم مقسم هندسياً بنظام الزجاج ثلاثي الأبعاد */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center text-xs font-black text-[#0A2540] animate-pulse">
          🔄 جاري فحص ملف الطالب واستدعاء السجلات الحية من قاعدة البيانات المركزية...
        </div>
      ) : (
        <div className="max-w-[1500px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 flex-grow">
          
          {/* 🔐 الكرت الجانبي: الملف الأكاديمي الرقمي المصقول (Sidebar Profile) */}
          <aside className="border border-white/90 bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.02)] h-fit space-y-6 transition-all duration-500 hover:shadow-xl hover:border-white">
            {studentData ? (
              <>
                <div className="text-center space-y-3 border-b border-slate-200/60 pb-4 relative overflow-hidden group">
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-50 to-indigo-50 border border-slate-200 text-[#0A2540] text-3xl rounded-2xl flex items-center justify-center mx-auto shadow-sm transition-transform duration-500 group-hover:scale-105">
                    👨‍💻
                  </div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{studentData.name}</h2>
                  <p className="text-xs font-bold text-slate-500">{studentData.department}</p>
                  <span className="inline-block bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-200/50 shadow-inner">
                    القيد: {studentData.status}
                  </span>
                </div>

                <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between flex-row-reverse text-right items-center">
                    <span className="text-slate-400 font-medium">الرقم الجامعي:</span>
                    <span className="font-mono font-black text-[#0A2540] border border-slate-200/60 bg-white px-2 py-0.5 rounded shadow-sm">{studentData.id}</span>
                  </div>
                  <div className="flex justify-between flex-row-reverse text-right items-center">
                    <span className="text-slate-400 font-medium">المستوى الدراسي:</span>
                    <span className="text-slate-800">{studentData.level}</span>
                  </div>
                  <div className="flex justify-between flex-row-reverse text-right items-center">
                    <span className="text-slate-400 font-medium">المعدل التراكمي:</span>
                    <span className="font-black text-emerald-600 font-mono text-sm border border-emerald-100 bg-emerald-50/50 px-2.5 py-0.5 rounded-lg shadow-inner">{studentData.gpa} / 4.00</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-xs font-bold text-slate-400 py-6">
                ⚠️ لم يتم العثور على سجل أكاديمي مطابق للرقم المدخل في جدول الطلاب.
              </div>
            )}

            <div className="pt-2">
              <Link href="/student/portfolio" className="w-full bg-gradient-to-r from-[#0A2540] to-[#0E3354] hover:shadow-[0_8px_20px_rgba(10,37,64,0.15)] text-white text-center font-black py-2.5 rounded-xl text-xs block transition-all duration-300 active:scale-95">
                💼 عرض الهوية المهنية الموثقة
              </Link>
            </div>
          </aside>

          {/* القسم الرئيسي: الكروت الملمومة الصغار وجدول الرصد الذكي */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* 🎛️ شبكة كروت البوابات الذكية بنمط الحجم الصغير والملموم المتناسق (Micro Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* كرت أقسام الجامعة */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="h-[145px] rounded-2xl p-3.5 flex flex-col justify-between relative group/card border border-white/80 bg-white/60 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_15px_30px_rgba(16,185,129,0.08)] hover:border-emerald-500/30 text-right w-full cursor-pointer"
              >
                <div className="w-full h-[65px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">🏛️</div>
                </div>
                <div className="mt-1">
                  <h4 className="font-black text-slate-900 text-xs tracking-tight group-hover/card:text-emerald-600 transition-colors">أقسام الكلية والجامعة</h4>
                  <p className="text-[10.5px] font-medium text-slate-500 line-clamp-1">استعراض الخطط الأكاديمية المعتمدة</p>
                </div>
              </button>

              {/* كرت المكتبة الذكية RAG */}
              <Link 
                href="/student/library"
                className="h-[145px] rounded-2xl p-3.5 flex flex-col justify-between relative group/card border border-white/80 bg-white/60 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_15px_30px_rgba(14,165,233,0.08)] hover:border-sky-500/30 text-right w-full"
              >
                <div className="w-full h-[65px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">🧠</div>
                </div>
                <div className="mt-1">
                  <h4 className="font-black text-slate-900 text-xs tracking-tight group-hover/card:text-sky-600 transition-colors">محرك المكتبة الذكية </h4>
                  <p className="text-[10.5px] font-medium text-slate-500 line-clamp-1">البحث الدلالي والتفاعل التوليدي الحقيقي</p>
                </div>
              </Link>

              {/* كرت جدول المحاضرات */}
              <div className="h-[145px] rounded-2xl p-3.5 flex flex-col justify-between relative group/card border border-white/80 bg-white/60 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_15px_30px_rgba(99,102,241,0.08)] hover:border-indigo-500/30 text-right w-full">
                <div className="w-full h-[65px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">📅</div>
                </div>
                <div className="mt-1">
                  <h4 className="font-black text-slate-900 text-xs tracking-tight group-hover/card:text-indigo-600 transition-colors">جدول المحاضرات الفوري</h4>
                  <p className="text-[10.5px] font-medium text-slate-500 line-clamp-1">مواعيد القاعات والمختبرات الدراسية</p>
                </div>
              </div>

            </div>

            {/* 📑 جدول رصد درجات الفصل الحالي */}
            <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.01)] overflow-hidden transition-all duration-500 hover:shadow-md">
              <div className="bg-white/80 border-b border-slate-200/60 px-6 py-4 text-right flex items-center gap-2 select-none">
                <div className="w-1.5 h-3.5 rounded-full bg-[#0A2540]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">السجل الأكاديمي ورصد درجات الفصل الحالي</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-white/50 text-slate-500 font-bold border-b border-slate-200/60 select-none">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">رمز المساق</th>
                      <th className="px-6 py-3.5 font-bold">اسم المادة الدراسية</th>
                      <th className="px-6 py-3.5 text-center font-bold">الساعات المعتمدة</th>
                      <th className="px-6 py-3.5 text-center font-bold">التقدير الفوري</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 font-medium">
                    {enrolledCourses.length > 0 ? (
                      enrolledCourses.map((course, index) => (
                        <tr key={index} className="hover:bg-white/70 transition-colors duration-300 group/row">
                          <td className="px-6 py-4 font-mono font-black text-slate-400 group-hover/row:text-slate-600 transition-colors">{course.course_code || `CCE-${course.id}`}</td>
                          <td className="px-6 py-4 font-extrabold text-slate-800 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colorPalettes[index % colorPalettes.length]}`} />
                            {course.course_name}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{course.hours || 3} ساعات</td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-white border border-slate-200/80 font-black px-3 py-1 rounded-lg font-mono shadow-sm group-hover/row:border-slate-300 transition-all text-slate-900">
                              {course.grade || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400 font-bold">
                          📭 لا توجد مواد مسجلة أو درجات مرصودة لهذا الطالب في الفصل الحالي حتى الآن.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </main>
        </div>
      )}

      {/* 🏙️ النافذة المنبثقة التفاعلية الفخمة للأقسام (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md w-full max-w-2xl rounded-3xl p-6 relative text-right border border-white shadow-2xl max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 transition-colors cursor-pointer text-xs font-bold"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 select-none">
              <div className="w-1.5 h-3.5 rounded-full bg-[#0A2540]" />
              <h2 className="text-sm font-black text-slate-900 uppercase">دليل كليات وأقسام جامعة إب الرقمية</h2>
            </div>
            
            <div className="space-y-4 text-xs font-semibold">
              <div className="p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl">
                <h4 className="font-black text-emerald-600 mb-1">🏛️ كلية الهندسة والعمارة</h4>
                <p className="text-slate-600 font-medium">هندسة الحاسبات والتحكم • الهندسة المدنية • الهندسة المعمارية</p>
              </div>
              <div className="p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl">
                <h4 className="font-black text-[#0A2540] mb-1">💻 كلية حاسبات وتقنية المعلومات</h4>
                <p className="text-slate-600 font-medium">علوم حاسوب • تكنولوجيا المعلومات IT • نظم معلومات IS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📌 الفوتر الأكاديمي الموحد */}
      <footer className="w-full py-4 text-center text-[10px] font-mono tracking-widest z-10 border border-white bg-white/80 backdrop-blur-sm rounded-xl shadow-sm select-none text-slate-400">
        IBB UNIVERSITY ACCREDITED PLATFORM SYSTEM NODE v3.0.0 // SECURE CENTRAL HUB
      </footer>
    </div>
  );
}