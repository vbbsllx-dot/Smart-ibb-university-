"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 🏛️ قاموس ترجمة معرف القسم الرقمي إلى النص العربي المطابق لجدول الطلاب
const departmentNamesMap: { [key: number]: string } = {
  1: 'هندسة الحاسبات والتحكم', 2: 'الهندسة المدنية', 3: 'الهندسة المعمارية', 4: 'هندسة الاتصالات',
  5: 'الطب البشري', 6: 'المختبرات الطبية', 7: 'التمريض', 8: 'طب وجراحة الفم والأسنان',
  9: 'الشريعة والقانون', 10: 'إدارة الأعمال', 11: 'المحاسبة', 12: 'العلوم المالية والمصرفية'
};

// 📈 قاموس ترجمة رقم المستوى إلى النص المقابل لمطابقة حقول جدول الطلاب ذكياً
const levelNamesMap: { [key: number]: string } = {
  1: 'المستوى الأول',
  2: 'المستوى الثاني',
  3: 'المستوى الثالث',
  4: 'المستوى الرابع',
  5: 'المستوى الخامس'
};

export default function FacultyDashboard() {
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 📁 حساب الدكتور والمراجع المرفوعة حياً
  const [instructorInfo, setInstructorInfo] = useState<any>({
    id: "",
    name: "جاري جلب الاسم...",
    college_name: "جامعة إب"
  });
  const [myResources, setMyResources] = useState<any[]>([]);
  
  // 🎯 المادة المحددة حالياً للكشف
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [studentsRoster, setStudentsRoster] = useState<any[]>([]);

  // ➕ نظام الأعمدة المخصصة والديناميكية للدكتور
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [cellData, setCellData] = useState<{[studentId: string]: {[colName: string]: string}}>({});

  // تحديث الساعة الفورية
  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📡 1. جلب بيانات الدكتور الحية + المواد التي رفعها فور فتح الصفحة
  useEffect(() => {
    const fetchInstructorDataAndResources = async () => {
      setLoading(true);
      try {
        const loggedInInstructor = localStorage.getItem('university_username') || '101010';

        // أ- جلب اسم الدكتور الحقيقي وكليته من جدول instructors
        const { data: instData, error: instError } = await supabase
          .from('instructors')
          .select('*')
          .eq('id', loggedInInstructor)
          .single();

        if (!instError && instData) {
          setInstructorInfo(instData);
        } else {
          setInstructorInfo({
            id: loggedInInstructor,
            name: `دكتور رقم (${loggedInInstructor})`,
            college_name: "كلية الهندسة والعمارة"
          });
        }

        // ب- جلب المواد والملفات المرفوعة باسم هذا الدكتور تحديداً
        const { data: resourcesData, error: resError } = await supabase
          .from('resources')
          .select('*')
          .eq('instructor_id', loggedInInstructor)
          .order('created_at', { ascending: false });

        if (!resError && resourcesData) {
          setMyResources(resourcesData);
        }
      } catch (err) {
        console.error("خطأ في جلب بيانات الكادر الأكاديمي:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructorDataAndResources();
  }, []);

  // 📡 2. استدعاء الطلاب ديناميكياً بفلترة مزدوجة (القسم + المستوى الدراسي معاً بالملّي)
  const handleSelectResource = async (resource: any) => {
    setSelectedResource(resource);
    setStudentsRoster([]); // تصفير مؤقت أثناء الفرز والحمل السحابي الجديد
    
    try {
      // استخراج النص العربي الصريح المقابل للقسم والمستوى
      const targetDepartmentName = departmentNamesMap[resource.dept_id];
      const targetLevelBaseName = levelNamesMap[resource.level_id]; // مثل: "المستوى الأول" أو "المستوى الرابع"

      if (targetDepartmentName && targetLevelBaseName) {
        // جلب الطلاب المسجلين حياً الملتزمين بالقسم والمستوى المحدد للمادة حصرياً
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('department', targetDepartmentName) // 1. قفل الفلترة بالقسم الأكاديمي
          .ilike('level', `${targetLevelBaseName}%`); // 2. قفل الفلترة بالمستوى الدراسي (تتعامل بمرونة مع لواحق الفصول)

        if (!error && data) {
          setStudentsRoster(data);
        }
      }
    } catch (err) {
      console.error("خطأ في جلب كشف الأسماء الفرعي المصفى:", err);
    }
  };

  // ➕ دالة إضافة عمود جديد مخصص للجدول
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    if (customColumns.includes(newColumnName.trim())) {
      alert('هذا العمود موجود مسبقاً!');
      return;
    }
    setCustomColumns([...customColumns, newColumnName.trim()]);
    setNewColumnName(''); 
  };

  // دالة تحديث قيم الخلايا الديناميكية
  const handleCellChange = (studentId: string, colName: string, value: string) => {
    setCellData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [colName]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden" dir="rtl">
      
      {/* طبقات الإضاءة الخلفية */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-400/10 blur-[140px] top-[-10%] left-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-[130px] bottom-[-10%] right-[-10%]" />
      </div>

      {/* الشريط العلوي الفخم */}
      <header className="w-full bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#12422C] text-white px-6 py-4.5 flex justify-between items-center relative z-40 rounded-b-2xl shadow-xl select-none">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <div>
            <h1 className="text-base font-black text-slate-50">بوابة الكادر الأكاديمي الذكية</h1>
            <p className="text-[10px] text-sky-300 font-mono tracking-widest uppercase">Instructor Control Panel // IBB UNI</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-sky-300 font-extrabold hidden sm:block">
            {time || "00:00:00"}
          </div>
          <Link href="/login" className="text-xs font-bold bg-white/10 border border-white/10 px-4 py-2 rounded-xl">
            تسجيل الخروج ↩
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex-grow flex items-center justify-center text-xs font-black text-[#0A2540] animate-pulse">
          🔄 جاري الاتصال بقاعدة البيانات المركزية...
        </div>
      ) : (
        <div className="max-w-[1500px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 flex-grow">
          
          {/* كرت معلومات الدكتور الجانبي الفخم */}
          <aside className="border border-white/90 bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm h-fit space-y-4">
            <div className="text-center space-y-2 border-b border-slate-200/60 pb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-50 to-indigo-50 border text-[#0A2540] text-2xl rounded-2xl flex items-center justify-center mx-auto">👨‍🏫</div>
              <h2 className="text-sm font-black text-slate-900">{instructorInfo.name}</h2>
              <p className="text-[11px] font-bold text-slate-500">{instructorInfo.college_name || "كلية الهندسة والعمارة"}</p>
              <p className="text-[10px] font-mono text-slate-400">رقم: {instructorInfo.id}</p>
            </div>
            <Link href="/faculty/upload" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center font-black py-3 rounded-xl text-xs block transition-transform active:scale-95 shadow-md">
              🚀 رفع مرجع أو مادة جديدة
            </Link>
          </aside>

          {/* القسم الرئيسي الفعال */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* 📚 أرشيف المواد المرفوعة */}
            <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-white/80 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3.5 rounded-full bg-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900">المواد والمراجع النشطة الصادرة منك (اضغط على المادة لعرض كشف طلابها)</h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 font-bold">العدد: {myResources.length}</span>
              </div>
              
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myResources.length > 0 ? (
                  myResources.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectResource(res)}
                      className={`p-4 rounded-2xl text-right transition-all border flex flex-col justify-between h-[105px] cursor-pointer ${
                        selectedResource?.id === res.id 
                          ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-md' 
                          : 'bg-white/70 hover:bg-white text-slate-800 border-slate-200/80 shadow-sm'
                      }`}
                    >
                      <h4 className="font-black text-xs line-clamp-1">{res.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md w-fit ${selectedResource?.id === res.id ? 'bg-white/20 text-sky-200' : 'bg-slate-100 text-slate-600'}`}>
                        📌 {departmentNamesMap[res.dept_id] || 'قسم عام'}
                      </span>
                      <div className="w-full flex justify-between items-center text-[10px] opacity-80 font-bold border-t border-current/10 pt-1 mt-1">
                        <span>🏷️ {res.resource_type === 'accredited_book' ? 'كتاب معتمد' : res.resource_type === 'summary_pdf' ? 'ملخص PDF' : 'فيديو تعليمي'}</span>
                        <span>المستوى الدراسي: {res.level_id}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-6 text-slate-400 font-bold text-xs">📭 لم تقم ببث أي مادة بعد. يرجى الضغط على زر الرفع لإضافة أول مادة في النظام.</div>
                )}
              </div>
            </section>

            {/* 📑 جدول الطلاب المعزول والذكي بالفرز المزدوج */}
            <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-white/80 border-b border-slate-200/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3.5 rounded-full bg-sky-600" />
                  <h3 className="text-xs font-black text-slate-900">
                    {selectedResource ? `كشف طلاب: [ ${departmentNamesMap[selectedResource.dept_id]} - ${levelNamesMap[selectedResource.level_id]} ] لـ مادة ( ${selectedResource.title} )` : "كشف الطلاب المرن"}
                  </h3>
                </div>

                {/* ➕ نموذج إضافة عمود جديد من قِبل الدكتور حياً */}
                {selectedResource && (
                  <form onSubmit={handleAddColumn} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="اسم العمود (مثال: الحضور)" 
                      className="p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none font-semibold shadow-inner"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                    />
                    <button type="submit" className="bg-[#0A2540] hover:bg-[#0e3354] text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm transition-all">
                      + إضافة عمود
                    </button>
                  </form>
                )}
              </div>

              {selectedResource ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-white/60 text-slate-500 font-bold border-b border-slate-200/60 select-none">
                      <tr>
                        <th className="px-6 py-4 font-black text-slate-800">الرقم الأكاديمي</th>
                        <th className="px-6 py-4 font-black text-slate-800">الأسماء</th>
                        <th className="px-6 py-4 font-black text-slate-800">المستوى</th>
                        <th className="px-6 py-4 text-center font-black text-slate-800">الحالة</th>
                        
                        {customColumns.map((col, index) => (
                          <th key={index} className="px-4 py-4 text-center text-sky-600 font-black border-r border-slate-200 bg-sky-50/40 relative group">
                            {col}
                            <button 
                              type="button"
                              onClick={() => setCustomColumns(customColumns.filter(c => c !== col))}
                              className="mr-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold cursor-pointer"
                              title="حذف العمود"
                            >
                              ✕
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40 font-medium bg-white/20">
                      {studentsRoster.length > 0 ? (
                        studentsRoster.map((student, idx) => (
                          <tr key={idx} className="hover:bg-white/60 transition-colors">
                            <td className="px-6 py-4 font-mono font-black text-slate-600">{student.student_id}</td>
                            <td className="px-6 py-4 font-extrabold text-slate-900">{student.name}</td>
                            <td className="px-6 py-4 text-slate-500 font-bold">{student.level}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100">
                                {student.status || 'منتظم'}
                              </span>
                            </td>

                            {customColumns.map((col, index) => (
                              <td key={index} className="px-2 py-2 border-r border-slate-200 text-center min-w-[120px]">
                                <input 
                                  type="text" 
                                  placeholder="أدخل هنا..."
                                  className="w-full p-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-800 bg-white shadow-inner focus:border-sky-400 focus:outline-none text-[11px]"
                                  value={cellData[student.student_id]?.[col] || ''}
                                  onChange={(e) => handleCellChange(student.student_id, col, e.target.value)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4 + customColumns.length} className="text-center py-8 text-slate-400 font-bold">📭 لا يوجد طلاب مسجلين في هذا المستوى لهذا القسم حالياً في قاعدة البيانات.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 bg-white/30 font-bold text-xs select-none space-y-2">
                  <p>📥 شاشة المراقبة مغلقة حالياً.</p>
                  <p className="text-[11px] text-slate-400 font-medium">الرجاء اختيار أو تحديد مادة واحدة من قائمة المواد المرفوعة أعلاه لفتح كشف الأسماء وتفعيل الرصد الفوري المعزول.</p>
                </div>
              )}
            </section>

          </main>
        </div>
      )}

      {/* الفوتر */}
      <footer className="w-full py-4 text-center text-[10px] font-mono tracking-widest z-10 border border-white bg-white/80 backdrop-blur-sm rounded-xl shadow-sm text-slate-400 select-none">
        IBB UNIVERSITY ACCREDITED PLATFORM SYSTEM NODE v3.5.0 // DYNAMIC ROSTER ENGINE
      </footer>
    </div>
  );
}