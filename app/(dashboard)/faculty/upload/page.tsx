"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// 🏛️ الهيكلية التنظيمية المعتمدة لكليات وأقسام جامعة إب
const universityStructure = [
  {
    name: "كلية الهندسة",
    departments: [
      { id: 1, name: "هندسة الحاسبات والتحكم" },
      { id: 2, name: "الهندسة المدنية" },
      { id: 3, name: "الهندسة المعمارية" },
      { id: 4, name: "هندسة الاتصالات" }
    ]
  },
  {
    name: "كلية الطب والعلوم الصحية",
    departments: [
      { id: 5, name: "الطب البشري" },
      { id: 6, name: "المختبرات الطبية" },
      { id: 7, name: "التمريض" }
    ]
  },
  {
    name: "كلية طب الأسنان",
    departments: [
      { id: 8, name: "طب وجراحة الفم والأسنان" }
    ]
  },
  {
    name: "كلية الشريعة والقانون",
    departments: [
      { id: 9, name: "الشريعة والقانون" }
    ]
  },
  {
    name: "كلية التجارة والاقتصاد",
    departments: [
      { id: 10, name: "إدارة الأعمال" },
      { id: 11, name: "المحاسبة" },
      { id: 12, name: "العلوم المالية والمصرفية" }
    ]
  }
];

export default function FacultyUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('accredited_book');
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  
  // 👁️ حالة التحكم في العرض داخل مكتبة الطلاب (تكون نعم تلقائياً)
  const [isVisible, setIsVisible] = useState(true);
  
  // 🔐 حالة مخصصة لحفظ الرقم الأكاديمي للدكتور المتصل حالياً
  const [currentInstructorId, setCurrentInstructorId] = useState('101010');
  const router = useRouter();

  // التقاط الرقم الأكاديمي للدكتور المتصل فور فتح واجهة الرفع
  useEffect(() => {
    const loggedInInstructorId = localStorage.getItem('university_username') || '101010';
    setCurrentInstructorId(loggedInInstructorId);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return alert('الرجاء تعبئة جميع الحقول واختيار الملف!');

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${resourceType}/${uniqueFileName}`;

      // 1. الرفع السحابي لـ Storage
      const { error: uploadError } = await supabase.storage
        .from('university-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. axتخراج الرابط العام للملف
      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      // 3. الحفظ في جدول resources مع حقل الرؤية الجديد بالملّي
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: title,
          file_url: publicUrl,
          resource_type: resourceType,
          level_id: selectedLevel,
          dept_id: selectedDeptId, 
          instructor_id: currentInstructorId,
          is_visible: isVisible // حقن حالة العرض/الإخفاء المحددة هنا حياً!
        });

      if (dbError) throw dbError;

      alert(isVisible ? '🚀 تم رفع المرجع وبثه مباشرة إلى مكتبة الطلاب!' : '📥 تم حفظ المرجع كمسودة مخفية بنجاح ولم يظهر للطلاب.');
      router.push('/faculty'); 
    } catch (err: any) {
      alert('❌ فشلت عملية الرفع: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 flex items-center justify-center" dir="rtl">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="border-b border-slate-100 pb-4 text-right">
          <h1 className="text-xl font-black text-[#0A2540]">الرفع الأكاديمي المطور</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            يتم الرفع بواسطة الحساب الأكاديمي: <span className="font-mono text-indigo-600 font-black">{currentInstructorId}</span>
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-5 text-right">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">عنوان المرجع أو المحاضرة:</label>
            <input 
              type="text" placeholder="مثال: هندسة البرمجيات - الشابتر الأول" 
              className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none bg-white shadow-inner"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">الكلية والفرع الأكاديمي المستهدف:</label>
              <select 
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
              >
                {universityStructure.map((college) => (
                  <optgroup key={college.name} label={`🏛️ ${college.name}`}>
                    {college.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        ➔ {dept.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">المستوى الدراسي:</label>
              <select 
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
              >
                <option value="1">المستوى الأول</option>
                <option value="2">المستوى الثاني</option>
                <option value="3">المستوى الثالث</option>
                <option value="4">المستوى الرابع</option>
                <option value="5">المستوى الخامس</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">تصنيف المرجع الرقمي:</label>
            <select 
              className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
              value={resourceType} onChange={(e) => setResourceType(e.target.value)}
            >
              <option value="accredited_book">📚 كتاب معتمد مراجع</option>
              <option value="summary_pdf">📄 ملخص PDF محاضرات</option>
              <option value="educational_video">🎥 فيديو تعليمي مسجل</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">الملف الفعلي:</label>
            <input 
              type="file" accept=".pdf,.mp4,.png,.jpg"
              className="w-full p-3 rounded-xl border-2 border-dashed border-slate-200 text-xs bg-slate-50/50 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* 👁️ خيار التحكم الذكي في العرض والإخفاء الفوري للمكتبة */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between select-none">
            <div className="text-right">
              <span className="text-xs font-black block text-slate-800">تفعيل العرض الفوري في المكتبة للطلاب؟</span>
              <span className="text-[10px] text-slate-500 font-medium">إذا تم إيقافه، سيحفظ الملف في حسابك كمسودة ولن يظهر للطالب.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <button 
            type="submit" disabled={isUploading}
            className="w-full bg-[#0A2540] text-white font-black py-4 rounded-xl text-xs cursor-pointer transition-all active:scale-[0.99]"
          >
            {isUploading ? '⏳ جاري معالجة البيانات وبث خيارات الرؤية...' : '🚀 بث المرجع إلى السيرفر المركزي'}
          </button>
        </form>
      </div>
    </div>
  );
}