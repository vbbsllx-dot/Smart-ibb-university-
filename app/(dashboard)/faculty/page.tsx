"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  LogOut, 
  Plus, 
  User,
  X,
  Camera,
  PlayCircle,
  BookOpen
} from 'lucide-react';

// استيراد المكونات المقسمة والمجاورة فوراُ
import ResourceCarousel from './ResourceCarousel';
import StudentRosterTable from './StudentRosterTable';

const departmentNamesMap: { [key: number]: string } = {
  1: 'هندسة الحاسبات والتحكم', 2: 'الهندسة المدنية', 3: 'الهندسة المعمارية', 4: 'هندسة الاتصالات',
  5: 'الطب البشري', 6: 'المختبرات الطبية', 7: 'التمريض', 8: 'طب وجراحة الفم والأسنان',
  9: 'الشريعة والقانون', 10: 'إدارة الأعمال', 11: 'المحاسبة', 12: 'العلوم المالية والمصرفية'
};

const levelNamesMap: { [key: number]: string } = {
  1: 'المستوى الأول', 2: 'المستوى الثاني', 3: 'المستوى الثالث', 4: 'المستوى الرابع', 5: 'المستوى الخامس'
};

export default function AdvancedFacultyDashboard() {
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  
  const [instructorInfo, setInstructorInfo] = useState<any>({ id: "", name: "جاري جلب الاسم...", college_name: "جامعة إب", avatar_url: null });
  const [myResources, setMyResources] = useState<any[]>([]);
  
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [studentsRoster, setStudentsRoster] = useState<any[]>([]);

  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [cellData, setCellData] = useState<{[studentId: string]: {[colName: string]: string}}>({});

  // 🎬 حالات شاشة العرض السينمائية العائمة الفخمة لمعاينة الملفات
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchInstructorDataAndResources = async () => {
    setLoading(true);
    try {
      const loggedInInstructor = localStorage.getItem('university_username') || '101010';

      const { data: instData, error: instError } = await supabase
        .from('instructors')
        .select('*')
        .eq('id', loggedInInstructor)
        .single();

      if (!instError && instData) setInstructorInfo(instData);
      else setInstructorInfo({ id: loggedInInstructor, name: `دكتور رقم (${loggedInInstructor})`, college_name: "كلية الهندسة والعمارة", avatar_url: null });

      const { data: resourcesData, error: resError } = await supabase
        .from('resources')
        .select('*')
        .eq('instructor_id', loggedInInstructor)
        .order('created_at', { ascending: false });

      if (!resError && resourcesData) {
        setMyResources(resourcesData);
        if (resourcesData.length > 0 && !selectedResource) {
          handleSelectResource(resourcesData[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorDataAndResources();
  }, []);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdatingAvatar(true);
    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${instructorInfo.id}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('university-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('instructors')
        .update({ avatar_url: publicUrl })
        .eq('id', instructorInfo.id);

      if (dbError) throw dbError;

      setInstructorInfo((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      alert('📸 تم تحديث صورتك الشخصية بنجاح فخم بداخل خوادم الجامعة الموحدة!');
    } catch (err: any) {
      alert('❌ فشل تحديث الصورة: ' + err.message);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleSelectResource = async (resource: any) => {
    setSelectedResource(resource);
    setStudentsRoster([]);
    setCustomColumns(resource.custom_columns || []);
    setCellData({});
    
    try {
      const targetDepartmentName = departmentNamesMap[resource.dept_id];
      const targetLevelBaseName = levelNamesMap[resource.level_id];

      if (targetDepartmentName && targetLevelBaseName) {
        const { data: currentStudents, error: stdError } = await supabase
          .from('students')
          .select('*')
          .eq('department', targetDepartmentName)
          .ilike('level', `${targetLevelBaseName}%`);

        if (!stdError && currentStudents) {
          setStudentsRoster(currentStudents);

          const { data: savedGrades, error: gradeError } = await supabase
            .from('resource_grades')
            .select('*')
            .eq('resource_id', resource.id);

          if (!gradeError && savedGrades) {
            const formattedCells: any = {};
            savedGrades.forEach((row: any) => {
              if (!formattedCells[row.student_id]) formattedCells[row.student_id] = {};
              formattedCells[row.student_id][row.column_name] = row.grade_value || "";
            });
            setCellData(formattedCells);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAllData = async () => {
    if (!selectedResource) return;
    setIsSaving(true);
    try {
      await supabase
        .from('resources')
        .update({ custom_columns: customColumns })
        .eq('id', selectedResource.id);

      const rowsToUpsert: any[] = [];
      Object.keys(cellData).forEach((studentId) => {
        Object.keys(cellData[studentId]).forEach((colName) => {
          rowsToUpsert.push({
            resource_id: selectedResource.id,
            student_id: studentId,
            column_name: colName,
            grade_value: cellData[studentId][colName]
          });
        });
      });

      if (rowsToUpsert.length > 0) {
        const { error } = await supabase
          .from('resource_grades')
          .upsert(rowsToUpsert, { onConflict: 'resource_id,student_id,column_name' });
        
        if (error) throw error;
      }

      alert('💾 تم حفظ ورصد كافة الدرجات والأعمدة بنجاح تام داخل قاعدة البيانات المركزية!');
    } catch (err: any) {
      alert('❌ حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResource = async (resourceId: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm('⚠️ هل أنت متأكد تماماً من حذف هذا المرجع نهائياً؟ سيتم مسح كافة كشوفات الدرجات المرتبطة به فوراً!')) return;

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (!error) {
        alert('🗑️ تم إزالة المرجع بنجاح وسرعة.');
        if (selectedResource?.id === resourceId) setSelectedResource(null);
        fetchInstructorDataAndResources(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportToExcel = () => {
    if (!selectedResource || studentsRoster.length === 0) return;

    let csvContent = "\uFEFF"; 
    csvContent += `جمهورية اليمن,, جامعة إب,, كشف رصد درجات رسمي\n`;
    csvContent += `اسم الأستاذ:, ${instructorInfo.name},, الكلية:, ${instructorInfo.college_name}\n`;
    csvContent += `المادة الدراسية:, ${selectedResource.title},, القسم والفرع:, ${departmentNamesMap[selectedResource.dept_id]}\n`;
    csvContent += `المستوى الدراسي:, ${levelNamesMap[selectedResource.level_id]},, تاريخ الاستخراج:, ${new Date().toLocaleDateString('ar-YE')}\n\n`;

    const headers = ["الرقم الأكاديمي", "اسم الطالب", "المستوى", "الحالة", ...customColumns];
    csvContent += headers.join(",") + "\n";

    studentsRoster.forEach((student) => {
      const row = [
        student.student_id,
        student.name,
        student.level,
        student.status || "منتظم"
      ];
      customColumns.forEach((col) => {
        row.push(cellData[student.student_id]?.[col] || "");
      });
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `كشف_${selectedResource.title}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCellChange = (studentId: string, colName: string, value: string) => {
    setCellData(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [colName]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden print:bg-white print:p-0" dir="rtl">
      
      {/* طبقات الإضاءة الخلفية */}
      <div className="absolute inset-0 z-0 pointer-events-none print:hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-400/10 blur-[140px] top-[-10%] left-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-[130px] bottom-[-10%] right-[-10%]" />
      </div>

      {/* الشريط العلوي */}
      <header className="w-full bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#12422C] text-white px-6 py-4.5 flex justify-between items-center relative z-40 rounded-b-2xl shadow-xl select-none print:hidden">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <div>
            <h1 className="text-base font-black text-slate-50">بوابة الكادر الأكاديمي الذكية</h1>
            <p className="text-[10px] text-sky-300 font-mono tracking-widest uppercase">Instructor Control Panel // IBB UNI</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-sky-300 font-extrabold hidden sm:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {time || "00:00:00"}
          </div>
          <Link href="/login" className="text-xs font-bold bg-white/10 border border-white/10 px-4 py-2 rounded-xl hover:bg-rose-600/20 transition-all flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> تسجيل الخروج
          </Link>
        </div>
      </header>

      {/* ترويسة الطباعة */}
      <div className="hidden print:flex flex-col items-center text-center border-b-2 border-slate-900 pb-4 mb-6 w-full text-slate-900 select-none">
        <div className="w-full flex justify-between items-center text-xs font-bold px-4">
          <div className="text-right space-y-1">
            <p>جامعة إب</p>
            <p>{instructorInfo.college_name}</p>
            <p>قسم: {selectedResource ? departmentNamesMap[selectedResource.dept_id] : "---"}</p>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black tracking-wide border-2 border-slate-900 px-4 py-2 rounded-xl">كشف رصد ودرجات الطلاب النهائي</h2>
            <p className="text-[10px] font-mono mt-1">IBB SMART UNIVERSITY DIGITAL ROSTER</p>
          </div>
          <div className="text-left space-y-1">
            <p>أستاذ المادة: {instructorInfo.name}</p>
            <p>المادة: {selectedResource?.title}</p>
            <p>المستوى: {selectedResource ? levelNamesMap[selectedResource.level_id] : "---"}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center text-xs font-black text-[#0A2540] animate-pulse">
          🔄 جاري استدعاء الملفات وبناء الهيكل الكريستالي المقسم حديثاً...
        </div>
      ) : (
        <div className="max-w-[1500px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 flex-grow print:block">
          
          {/* الكرت الجانبي المطور بالكامل لتعديل ورفع صورة الدكتور بشكل فخم ومحدد */}
          <aside className="border border-white/90 bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm h-fit space-y-4 print:hidden">
            <div className="text-center space-y-3 border-b border-slate-200/60 pb-4">
              
              {/* إطار الصورة المكبر المخصص التفاعلي (Interactive Avatar Wrapper) */}
              <div className="relative w-24 h-24 mx-auto select-none">
                <button 
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUpdatingAvatar}
                  className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-white rounded-2xl flex items-center justify-center shadow-md overflow-hidden group/avatar cursor-pointer relative transition-transform active:scale-95"
                >
                  {instructorInfo.avatar_url ? (
                    <img 
                      src={instructorInfo.avatar_url} 
                      alt="Doctor Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}

                  {/* طبقة تحديث الصورة عند الحوم فوقها بالماوس */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-black gap-1">
                    <Camera className="w-4 h-4" />
                    <span>{isUpdatingAvatar ? "جاري الرفع..." : "تعديل الصورة"}</span>
                  </div>
                </button>

                {/* مؤشر الاتصال المتوهج الأخضر (Live Online Status Dot) */}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md animate-pulse z-10" title="الحساب متصل بالسيرفر المركزي" />
              </div>

              {/* مدخل ملف مخفي مخصص لالتقاط الصورة الشخصية */}
              <input 
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="space-y-1">
                <h2 className="text-sm font-black text-slate-900">{instructorInfo.name}</h2>
                <p className="text-[11px] font-bold text-slate-500">{instructorInfo.college_name}</p>
                <p className="text-[10px] font-mono text-slate-400 bg-slate-100 py-1 rounded-md">المعرف الأكاديمي: {instructorInfo.id}</p>
              </div>
            </div>
            <Link href="/faculty/upload" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md">
              <Plus className="w-4 h-4" /> رفع مرجع أو مادة جديدة
              
            </Link>
          </aside>

          {/* القسم الرئيسي الفعال */}
          <main className="lg:col-span-3 space-y-6 print:w-full overflow-hidden">
            
            {/* 1️⃣ استدعاء مكون العجلة الدوارة ثلاثية الأبعاد المقسم */}
            <ResourceCarousel 
              myResources={myResources}
              selectedResource={selectedResource}
              onSelectResource={handleSelectResource}
              onDeleteResource={handleDeleteResource}
              setPreviewUrl={setPreviewUrl}
              setPreviewType={setPreviewType}
              router={router}
            />

            {/* 2️⃣ استدعاء مكون كشف درجات الطلاب والتحليلات المقسم */}
            <StudentRosterTable 
              selectedResource={selectedResource}
              studentsRoster={studentsRoster}
              customColumns={customColumns}
              setCustomColumns={setCustomColumns}
              cellData={cellData}
              setCellData={setCellData}
              onCellChange={handleCellChange}
              onSaveAllData={handleSaveAllData}
              isSaving={isSaving}
              onExportToExcel={handleExportToExcel}
            />

          </main>
        </div>
      )}

      {/* 🎬 3️⃣ النافذة العائمة السينمائية الفخمة لمعاينة الملفات (Cinematic Quick Lightbox Modal) */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-950/90 z-[999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* بار التحكم العلوي بالمعاينة */}
            <div className="bg-slate-950 px-6 py-4 flex justify-between items-center border-b border-white/10 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  {previewType === 'educational_video' ? <PlayCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black">الشاشة السينمائية لمعاينة المواد والمراجع الدراسية</h4>
                  <p className="text-[10px] text-slate-400 font-mono">IBB UNI // CORE VISUAL PREVIEWER</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => { setPreviewUrl(null); setPreviewType(null); }}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* مسرح العرض الصافي */}
            <div className="flex-grow bg-slate-950 p-2 flex items-center justify-center">
              {previewType === 'educational_video' ? (
                <video 
                  src={previewUrl} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/5"
                />
              ) : (
                <iframe 
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                  className="w-full h-full rounded-2xl border-none bg-white"
                  title="PDF Viewer"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="w-full py-4 text-center text-[10px] font-mono tracking-widest z-10 border border-white bg-white/80 backdrop-blur-md rounded-xl shadow-sm text-slate-400 select-none print:hidden">
        IBB UNIVERSITY ACCREDITED PLATFORM SYSTEM NODE v3.5.0 // DYNAMIC ROSTER ENGINE
      </footer>
    </div>
  );
}