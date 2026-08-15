"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// 1️⃣ استيراد عميل الاتصال بـ Supabase
import { supabase } from '@/lib/supabase';

import DubbingStudio from '../../components/student/DubbingStudio';


export default function StudentDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [time, setTime] = useState('');

  // حالة التحكم بتبويبات المعاملات الطلابية
  const [activeTransactionTab, setActiveTransactionTab] = useState('absence');

  // حالات رفع الملخصات
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCourse, setUploadCourse] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });


  // 2️⃣ الحالات الذكية لاستقبال البيانات الحقيقية من السيرفر بدون أي بيانات افتراضية
  const [studentData, setStudentData] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState('schedule');

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3️⃣ 📡 دالة استدعاء ملف الطالب الأكاديمي والمقررات حياً من جداول السيرفر
// 3️⃣ 📡 دالة استدعاء ملف الطالب الأكاديمي والمقررات وجدول الكلية
  useEffect(() => {
    const fetchStudentProfileAndGrades = async () => {
      setLoading(true);
      try {
        const loggedInUser = typeof window !== 'undefined' ? localStorage.getItem('university_username') : null;
        const usernameToSearch = loggedInUser || 'raed123'; 

        // الاستعلام الذكي: يجلب بيانات الطالب + اسم المستخدم + بيانات القسم والكلية المرتبطة
       // الاستعلام المحدث للوصول إلى جدول schedules
        const { data: studentRow, error: studentError } = await supabase
          .from('students')
          .select(`
            *,
            user_accounts!inner (
              username
            ),
            departments (
              name,
              colleges (
                name,
                schedules (
                  schedule_image_url
                )
              )
            )
          `)
          .eq('user_accounts.username', usernameToSearch)
          .maybeSingle();

        if (!studentError && studentRow) {
          
          // استخراج البيانات بالمسار الجديد
          const departmentName = studentRow.departments?.name || "القسم غير محدد";
          const collegeName = studentRow.departments?.colleges?.name || "الكلية غير محددة";
          
          // الدخول إلى مصفوفة schedules لجلب رابط الصورة المربوطة بالكلية
          const scheduleUrl = studentRow.departments?.colleges?.schedules?.[0]?.schedule_image_url || null;

    // تحويل رقم المستوى القادم من قاعدة البيانات إلى نص عربي
          const levelNames: { [key: number]: string } = {
            1: "المستوى الأول",
            2: "المستوى الثاني",
            3: "المستوى الثالث",
            4: "المستوى الرابع",
            5: "المستوى الخامس",
            6: "المستوى السادس",
            7: "المستوى السابع"
          };
          
          // استخراج اسم المستوى بناءً على الـ level_id، وإذا لم يجده يعرض الرقم مباشرة
          const studentLevelText = levelNames[studentRow.level_id] || `المستوى ${studentRow.level_id}`;

          setStudentData({
            name: studentRow.name,
            id: studentRow.student_id,
            username: studentRow.user_accounts.username,
            department: departmentName,
            dep_id: studentRow.dep_id, 
            college_name: collegeName,
            level: studentLevelText, // 👈 هنا التعديل! أصبح ديناميكياً
            level_id: studentRow.level_id, 
            gpa: studentRow.gpa || "0.00",
            status: studentRow.status || "منتظم",
            schedule_url: scheduleUrl
          });
          // استكمال جلب المواد المسجلة...

          // جلب المواد المسجلة للطالب
          const { data: coursesData, error: coursesError } = await supabase
            .from('student_courses')
            .select('*')
            .eq('student_id', studentRow.student_id);

          if (!coursesError && coursesData) {
            setEnrolledCourses(coursesData);
          }
        } else {
          console.error("مشكلة في جلب بيانات الطالب:", studentError);
        }
      } catch (err) {
        console.error("خطأ عام في الاتصال:", err);
      }
      setLoading(false);
    };

    fetchStudentProfileAndGrades();
  }, []);

  // دالة رفع الملخص إلى قاعدة البيانات والمكتبة
  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile || !uploadTitle || !uploadCourse) {
      setUploadMessage({ type: 'error', text: 'يرجى تعبئة جميع الحقول واختيار ملف للرفع.' });
      return;
    }

    if (!studentData?.dep_id || !studentData?.level_id) {
      setUploadMessage({ type: 'error', text: 'خطأ: بيانات القسم أو المستوى مفقودة، لا يمكن الرفع.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage({ type: '', text: '' });

    try {
      // 1. رفع الملف إلى Storage في Supabase
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${studentData.id}_${Date.now()}.${fileExt}`;
      
      // 👈 التعديل الأول: تضمين مجلد summary_pdf في المسار ليتطابق مع هيكلتك
      const filePath = `summary_pdf/dept_${studentData.dep_id}/level_${studentData.level_id}/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('university-files') // 👈 التعديل الثاني: اسم المستودع الصحيح من الصورة
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // 2. جلب الرابط العام للملف المرفوع
      const { data: publicUrlData } = supabase.storage
        .from('university-files') // 👈 التعديل الثالث: اسم المستودع الصحيح هنا أيضاً
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 3. إدراج البيانات في جدول resources لكي تظهر في المكتبة
     // 3. إدراج البيانات في جدول resources لكي تظهر في المكتبة
      const { error: insertError } = await supabase
        .from('resources')
        .insert([
          {
            title: `${uploadCourse} - ${uploadTitle}`, 
            file_url: fileUrl,
            level_id: studentData.level_id,
            dep_id: studentData.dep_id,
            student_id: studentData.id.toString(), 
            instructor_id: null, 
            resource_type: 'summary_pdf', // 👈 هنا التعديل! استخدمنا القيمة المسموحة في قاعدة البيانات
            is_visible: true
          }
        ]);

      if (insertError) throw insertError;

      // 4. رسالة النجاح وتفريغ الحقول
      setUploadMessage({ type: 'success', text: 'تم رفع الملخص بنجاح! وهو متاح الآن لزملائك في المكتبة 📚' });
      setUploadFile(null);
      setUploadTitle('');
      setUploadCourse('');
      
    } catch (error: any) {
      console.error("Upload Error:", error);
      setUploadMessage({ type: 'error', text: 'حدث خطأ أثناء الرفع: ' + (error.message || 'حاول مرة أخرى.') });
    } finally {
      setIsUploading(false);
    }
  };
  // مصفوفة الألوان لتزيين الخطوط الجانبية للمواد بشكل ديناميكي
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

      {/* 🏛️ 1. الشريط العلوي الثابت الفخم */}
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

      {/* 📊 محتوى لوحة التحكم */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center text-xs font-black text-[#0A2540] animate-pulse">
          🔄 جاري فحص ملف الطالب واستدعاء السجلات الحية من قاعدة البيانات المركزية...
        </div>
      ) : (
        <div className="max-w-[1500px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 flex-grow">






          
          {/* 🔐 الكرت الجانبي الموحد: الهوية الأكاديمية + بوابات الوصول */}
          <aside className="border border-blue-200/60 bg-blue-100/50 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.05)] h-fit space-y-6 transition-all duration-500 hover:bg-blue-100/70 hover:shadow-[0_15px_35px_rgba(59,130,246,0.15)] hover:-translate-y-1 hover:border-blue-300/80 lg:col-span-1">     
            
            {/* 1. قسم بيانات الطالب (الهوية المباشرة بخلفية افتراضية) */}
            {/* 1. قسم بيانات الطالب (الهوية المباشرة بخلفية افتراضية) */}
            <div className="w-full">
              <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-sm">
                
                {/* 🖼️ الصورة الخلفية الافتراضية الفخمة */}
                <div className="h-28 w-full bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600')" }}>
                  <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-[2px]"></div>
                </div>

                {/* 🧑‍💻 الصورة الشخصية الافتراضية المتداخلة */}
                <div className="relative -mt-10 flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-white to-blue-50 border-4 border-white text-4xl rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.05)] z-10">
                    👨‍💻
                  </div>
                </div>

                {/* 📄 بيانات الهوية المباشرة */}
                <div className="text-center px-4 pb-5 pt-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {studentData?.name || "No Connect"}
                  </h2>
                  
                  {/* اسم المستخدم (Username) */}
                  <p className="text-sm font-bold text-blue-600 mt-0.5" dir="ltr">
                    @{studentData?.username || "no_connect"}
                  </p>
                  
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    {studentData?.department || "No Connect"}
                  </p>
                  
                  {/* تفاصيل الرقم الأكاديمي والمستوى */}
                  <div className="mt-4 space-y-2.5 text-xs font-semibold text-slate-600 bg-white/50 p-3 rounded-xl border border-white/50 shadow-inner">
                    <div className="flex justify-between flex-row-reverse text-right items-center">
                      <span className="text-slate-400 font-medium">الرقم الأكاديمي:</span>
                      <span className="font-mono font-black text-[#0A2540]">
                        {studentData?.id || "No Connect"}
                      </span>
                    </div>
                    <div className="flex justify-between flex-row-reverse text-right items-center">
                      <span className="text-slate-400 font-medium">حالة القيد:</span>
                      <span className={`font-black px-2 py-0.5 rounded border ${studentData?.status ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-500 bg-rose-50 border-rose-100'}`}>
                        {studentData?.status || "No Connect"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div> 

            

            {/* 2. قسم بوابات الوصول الذكية (الكروت الزجاجية) */}
            <div className="space-y-3.5 border-t border-slate-200/60 pt-6">
              <h3 className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest mb-2">بوابات الوصول الذكية</h3>
               {/* 4️⃣ كرت جدول المحاضرات الفوري */}
              <button 
                onClick={() => setActiveView('schedule')} 
                className={`h-[125px] rounded-2xl p-3 flex flex-col justify-between relative group/card border ${activeView === 'schedule' ? 'border-indigo-400 shadow-md bg-white/90' : 'border-white/80 bg-white/60 hover:-translate-y-1 hover:bg-white'} backdrop-blur-md transition-all duration-500 ease-out text-right w-full cursor-pointer`}
              >
                <div className="w-full h-[55px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">📅</div>
                </div>
                <div className="mt-1">
                  <h4 className={`font-black text-xs tracking-tight transition-colors ${activeView === 'schedule' ? 'text-indigo-600' : 'text-slate-900 group-hover/card:text-indigo-600'}`}>جدول المحاضرات الفوري</h4>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1">مواعيد القاعات والمختبرات</p>
                </div>
              </button>
         

              {/* 2️⃣ كرت محرك المكتبة الذكية RAG */}
              <Link 
                href="/student/library"
                className="h-[125px] rounded-2xl p-3 flex flex-col justify-between relative group/card border border-white/80 bg-white/60 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-[0_15px_30px_rgba(14,165,233,0.08)] hover:border-sky-500/30 text-right w-full block"
              >
                <div className="w-full h-[55px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">🧠</div>
                </div>
                <div className="mt-1">
                  <h4 className="font-black text-slate-900 text-xs tracking-tight group-hover/card:text-sky-600 transition-colors">محرك المكتبة الذكية</h4>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1">البحث الدلالي والتفاعل التوليدي</p>
                </div>
              </Link>

              {/* 3️⃣ كرت السجل الأكاديمي (رابط خارجي لنتائج جامعة إب) */}
              <a 
                href="https://ibbunivsas.net/enter_s2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-[125px] rounded-2xl p-3 flex flex-col justify-between relative group/card border border-white/80 bg-white/60 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all duration-500 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-[0_15px_30px_rgba(16,185,129,0.08)] hover:border-emerald-500/30 text-right w-full block cursor-pointer"
              >
                <div className="w-full h-[55px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">📊</div>
                </div>
                <div className="mt-1">
                  <h4 className="font-black text-slate-900 text-xs tracking-tight group-hover/card:text-emerald-600 transition-colors">السجل الأكاديمي والنتائج</h4>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1">الاستعلام المباشر عن الدرجات</p>
                </div>
              </a>

           
             
              {/* 4️⃣ كرت إجراء المعاملات الطلابية */}
            <button 
                onClick={() => setActiveView('transactions')} 
                className={`h-[125px] rounded-2xl p-3 flex flex-col justify-between relative group/card border ${activeView === 'transactions' ? 'border-amber-400 shadow-md bg-white/90' : 'border-white/80 bg-white/60 hover:-translate-y-1 hover:bg-white'} backdrop-blur-md transition-all duration-500 ease-out text-right w-full cursor-pointer`}
              >
                <div className="w-full h-[55px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">📝</div>
                </div>
                <div className="mt-1">
                  <h4 className={`font-black text-xs tracking-tight transition-colors ${activeView === 'transactions' ? 'text-amber-600' : 'text-slate-900 group-hover/card:text-amber-600'}`}>إجراء المعاملات الطلابية</h4>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1">تقديم ومتابعة الطلبات</p>
                </div>
              </button>

              {/* 5️⃣ كرت رفع الملخصات */}
              <button 
                onClick={() => setActiveView('uploads')} 
                className={`h-[125px] rounded-2xl p-3 flex flex-col justify-between relative group/card border ${activeView === 'uploads' ? 'border-rose-400 shadow-md bg-white/90' : 'border-white/80 bg-white/60 hover:-translate-y-1 hover:bg-white'} backdrop-blur-md transition-all duration-500 ease-out text-right w-full cursor-pointer`}
              >
                <div className="w-full h-[55px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">📤</div>
                </div>
                <div className="mt-1">
                  <h4 className={`font-black text-xs tracking-tight transition-colors ${activeView === 'uploads' ? 'text-rose-600' : 'text-slate-900 group-hover/card:text-rose-600'}`}>رفع ملخصات</h4>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1">مشاركة المواد الدراسية</p>
                </div>
              </button>
              {/* 6️⃣ كرت دبلجة الفيديوهات بالذكاء الاصطناعي */}
              <button 
                onClick={() => setActiveView('dubbing')} 
                className={`h-[125px] rounded-2xl p-3 flex flex-col justify-between relative group/card border ${activeView === 'dubbing' ? 'border-purple-400 shadow-md bg-white/90' : 'border-white/80 bg-white/60 hover:-translate-y-1 hover:bg-white'} backdrop-blur-md transition-all duration-500 ease-out text-right w-full cursor-pointer`}
              >
                <div className="w-full h-[55px] rounded-xl bg-cover bg-center relative overflow-hidden border border-white/40 shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=400')" }}>
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-xs">🎙️</div>
                </div>
                <div className="mt-1">
                  <h4 className={`font-black text-xs tracking-tight transition-colors ${activeView === 'dubbing' ? 'text-purple-600' : 'text-slate-900 group-hover/card:text-purple-600'}`}>استوديو الدبلجة (AI)</h4>
                  <p className="text-[10px] font-medium text-slate-500 line-clamp-1">ترجمة المقاطع التعليمية</p>
                </div>
              </button>
            </div>
            
          </aside>










           {/* القسم الرئيسي الديناميكي (يتغير حسب اختيار الطالب) */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* 1. واجهة جدول المحاضرات (مخصصة حسب الكلية وتدعم الصور و PDF) */}
            {activeView === 'schedule' && (
              <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.01)] h-full min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                <div className="border-b border-slate-200/60 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-indigo-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      جدول المحاضرات الموحد
                    </h3>
                  </div>
                  
                  {/* عرض اسم الكلية والقسم ليتأكد الطالب أنه جدوله الصحيح */}
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                      🏛️ {studentData?.college_name || "الكلية غير محددة"}
                    </span>
                    <span className="bg-white/60 text-slate-500 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                      {studentData?.department || "القسم غير محدد"}
                    </span>
                  </div>
                </div>

                <div className="flex-grow flex items-center justify-center bg-white/50 rounded-2xl border border-white shadow-inner overflow-hidden relative">
                  
                  {/* عرض ملف الجدول (يدعم PDF وصور) */}
                  {studentData?.schedule_url ? (
                    studentData.schedule_url.toLowerCase().endsWith('.pdf') ? (
                      // عرض ملف PDF
                      <object 
                        data={studentData.schedule_url} 
                        type="application/pdf" 
                        className="w-full h-[600px] rounded-xl"
                      >
                        <p className="text-sm text-slate-500 text-center p-10">
                          متصفحك لا يدعم عرض ملفات PDF. 
                          <a href={studentData.schedule_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline ml-1">
                            انقر هنا لتنزيل الجدول
                          </a>.
                        </p>
                      </object>
                    ) : (
                      // عرض كصورة إذا لم يكن PDF
                      <img 
                        src={studentData.schedule_url} 
                        alt={`جدول محاضرات ${studentData?.college_name}`} 
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                      />
                    )
                  ) : (
                    <div className="text-center p-10">
                      <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-100 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner mx-auto">
                        📅
                      </div>
                      <h4 className="text-lg font-black text-slate-800 mb-2">
                        لم يتم رفع جدول {studentData?.college_name ? `(${studentData.college_name})` : "كليتك"} بعد
                      </h4>
                      <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                        سيتم عرض صورة جدول المحاضرات الخاص بكليتك هنا تلقائياً بمجرد أن تقوم إدارة الكلية برفعه إلى النظام.
                      </p>
                    </div>
                  )}

                </div>
              </section>
            )}

            {/* 3. واجهة إجراء المعاملات الطلابية (نظام التبويبات) */}
            {activeView === 'transactions' && (
              <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.01)] h-full min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                
                {/* 📌 ترويسة القسم */}
                <div className="flex items-center gap-3 mb-6 border-b border-slate-200/60 pb-4">
                  <div className="w-1.5 h-6 rounded-full bg-amber-500" />
                  <h3 className="text-xl font-black text-slate-900">بوابة المعاملات الطلابية الإلكترونية</h3>
                </div>

                {/* 🗂️ الشريط الأفقي للتبويبات (Tabs Navbar) */}
                <div className="flex overflow-x-auto pb-2 mb-6 gap-2 hide-scrollbar">
                  {[
                    { id: 'absence', name: 'غياب بعذر', icon: '📝' },
                    { id: 'suspend', name: 'وقف قيد', icon: '⏸️' },
                    { id: 'resume', name: 'فتح قيد', icon: '▶️' },
                    { id: 'withdraw', name: 'سحب ملف', icon: '📂' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTransactionTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                        activeTransactionTab === tab.id
                          ? 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                          : 'bg-white/60 text-slate-600 hover:bg-white hover:text-amber-600 border border-slate-200/50'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>

                {/* 📋 منطقة عرض محتوى المعاملة المختارة */}
                <div className="flex-grow bg-slate-50/50 border border-slate-200/60 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                  
                  {activeTransactionTab === 'absence' && (
                    <div className="animate-in fade-in duration-300">
                      <h4 className="text-lg font-black text-slate-800 mb-2">تقديم طلب غياب بعذر</h4>
                      <p className="text-sm font-medium text-slate-500 mb-6">يرجى تعبئة الحقول أدناه لتقديم العذر ليتم مراجعته من قبل شؤون الطلاب.</p>
                      {/* سيتم وضع حقول نموذج الغياب هنا */}
                      <div className="p-10 border-2 border-dashed border-amber-200 rounded-xl text-center text-amber-600 font-bold bg-amber-50/50">
                        [ جاهز لاستقبال حقول نموذج الغياب بعذر منك ]
                      </div>
                    </div>
                  )}

                  {activeTransactionTab === 'suspend' && (
                    <div className="animate-in fade-in duration-300">
                      <h4 className="text-lg font-black text-slate-800 mb-2">طلب وقف القيد الأكاديمي</h4>
                      <p className="text-sm font-medium text-slate-500 mb-6">يمكنك تقديم طلب لوقف قيدك مؤقتاً وفقاً للوائح الجامعة.</p>
                      {/* سيتم وضع حقول نموذج وقف القيد هنا */}
                      <div className="p-10 border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-500 font-bold bg-white/50">
                        [ جاهز لاستقبال حقول نموذج وقف القيد منك ]
                      </div>
                    </div>
                  )}

                  {activeTransactionTab === 'resume' && (
                    <div className="animate-in fade-in duration-300">
                      <h4 className="text-lg font-black text-slate-800 mb-2">طلب فتح القيد (إعادة التسجيل)</h4>
                      <p className="text-sm font-medium text-slate-500 mb-6">استئناف دراستك بعد فترة الوقف المعتمدة.</p>
                      {/* سيتم وضع حقول نموذج فتح القيد هنا */}
                      <div className="p-10 border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-500 font-bold bg-white/50">
                        [ جاهز لاستقبال حقول نموذج فتح القيد منك ]
                      </div>
                    </div>
                  )}

                  {activeTransactionTab === 'withdraw' && (
                    <div className="animate-in fade-in duration-300">
                      <h4 className="text-lg font-black text-slate-800 mb-2">طلب إخلاء طرف وسحب ملف</h4>
                      <p className="text-sm font-medium text-slate-500 mb-6">إجراءات سحب ملفك الأكاديمي بشكل نهائي من الجامعة.</p>
                      {/* سيتم وضع حقول نموذج سحب الملف هنا */}
                      <div className="p-10 border-2 border-dashed border-rose-300 rounded-xl text-center text-rose-500 font-bold bg-rose-50/50">
                        [ جاهز لاستقبال حقول نموذج سحب الملف منك ]
                      </div>
                    </div>
                  )}

                </div>
              </section>
            )}
            
           {/* واجهة منصة رفع الملخصات (المقيدة ببيانات الطالب) */}
            {activeView === 'uploads' && (
              <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.01)] h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-200/60 pb-4">
                  <div className="w-1.5 h-6 rounded-full bg-rose-500" />
                  <h3 className="text-xl font-black text-slate-900">مشاركة الملخصات والمقررات</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* الجانب الأيمن: بيانات محددة وتلقائية (مقفلة) */}
                  <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
                    <h4 className="font-bold text-slate-700 text-sm mb-4">📍 سياق الرفع (تلقائي ومقفل لدُفعتك)</h4>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">الكلية</label>
                      <input type="text" disabled value={studentData?.college_name || 'جاري التحميل...'} className="w-full bg-slate-200/50 text-slate-600 font-semibold p-2.5 rounded-xl border border-slate-200 text-xs cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">القسم الأكاديمي</label>
                      <input type="text" disabled value={studentData?.department || 'جاري التحميل...'} className="w-full bg-slate-200/50 text-slate-600 font-semibold p-2.5 rounded-xl border border-slate-200 text-xs cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">المستوى الدراسي</label>
                      <input type="text" disabled value={studentData?.level || 'جاري التحميل...'} className="w-full bg-slate-200/50 text-slate-600 font-semibold p-2.5 rounded-xl border border-slate-200 text-xs cursor-not-allowed" />
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-medium bg-rose-50 p-2 rounded-lg border border-rose-100 mt-4 leading-relaxed">
                      💡 ملاحظة: يتم ربط أي ملف تقوم برفعه تلقائياً بقسمك ومستواك لضمان عدم تشتت زملائك وظهوره في المكان الصحيح بالمكتبة.
                    </p>
                  </div>

                  {/* الجانب الأيسر: نموذج الإدخال والرفع */}
                  <form onSubmit={handleUploadResource} className="flex flex-col space-y-4">
                    
                    {uploadMessage.text && (
                      <div className={`p-3 rounded-xl text-xs font-bold border ${uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {uploadMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1.5">اسم المادة الدراسية <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        placeholder="مثال: هندسة برمجيات، ذكاء اصطناعي..."
                        value={uploadCourse}
                        onChange={(e) => setUploadCourse(e.target.value)}
                        className="w-full bg-white/80 focus:bg-white text-slate-800 font-medium p-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all text-xs outline-none" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1.5">عنوان أو وصف الملخص <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        placeholder="مثال: ملخص الشابتر الأول، نماذج اختبارات..."
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-white/80 focus:bg-white text-slate-800 font-medium p-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all text-xs outline-none" 
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1.5">الملف المرفق <span className="text-rose-500">*</span></label>
                      <input 
                        type="file" 
                        required
                        onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full bg-white/80 text-slate-600 font-medium p-2.5 rounded-xl border border-slate-200 text-xs outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 cursor-pointer" 
                      />
                    </div>

                    <div className="flex-grow flex items-end">
                      <button 
                        type="submit" 
                        disabled={isUploading}
                        className={`w-full font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${isUploading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white hover:shadow-lg'}`}
                      >
                        {isUploading ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"></span>
                            <span>جاري الرفع والأرشفة...</span>
                          </>
                        ) : (
                          <>
                            <span>رفع ونشر الملخص</span>
                            <span className="text-lg">📤</span>
                          </>
                        )}
                      </button>

                    </div>

                  </form>

                </div>
              </section>
            )}
            {/* واجهة دبلجة الفيديوهات بالذكاء الاصطناعي (مكون خارجي) */}
            {activeView === 'dubbing' && (
              <DubbingStudio studentData={studentData} />
            )}

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