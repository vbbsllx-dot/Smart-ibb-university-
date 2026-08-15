"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search, 
  Clock, 
  UserCheck, 
  GraduationCap, 
  RefreshCw,
  Building2,
  RotateCcw,
  Filter,
  Pencil,
  Printer,
  UploadCloud,
  FileText,
  FileCheck2,
  X,
  DownloadCloud,
  Trash2,
  Sparkles,
  ClipboardList
} from 'lucide-react';

// 🏛️ هيكلية الكليات والأقسام المعتمدة
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

const getCollegeName = (depId: number): string => {
  if ([1, 2, 3, 4].includes(depId)) return "كلية الهندسة";
  if ([5, 6, 7].includes(depId)) return "كلية الطب والعلوم الصحية";
  if (depId === 8) return "كلية طب الأسنان";
  if (depId === 9) return "كلية الشريعة والقانون";
  if ([10, 11, 12].includes(depId)) return "كلية التجارة والاقتصاد";
  return "جامعة إب";
};
// 🏛️ دالة جلب رقم الكلية (college_id) من رقم القسم (dep_id) كما في جدول departments
const getCollegeId = (depId: number): number => {
  if ([1, 2, 3, 4].includes(depId)) return 1;  // كلية الهندسة (college_id = 1)
  if ([5, 6, 7].includes(depId)) return 2;     // كلية الطب والعلوم الصحية (college_id = 2)
  if (depId === 8) return 3;                   // كلية طب الأسنان (college_id = 3)
  if (depId === 9) return 4;                   // كلية الشريعة والقانون (college_id = 4)
  if ([10, 11, 12].includes(depId)) return 5;  // كلية التجارة والاقتصاد (college_id = 5)
  return 1;
};


const getDeptName = (depId: number): string => {
  const names: Record<number, string> = {
    1: "هندسة الحاسبات والتحكم", 2: "الهندسة المدنية", 3: "الهندسة المعمارية", 4: "هندسة الاتصالات",
    5: "الطب البشري", 6: "المختبرات الطبية", 7: "التمريض", 8: "طب وجراحة الفم والأسنان",
    9: "الشريعة والقانون", 10: "إدارة الأعمال", 11: "المحاسبة", 12: "العلوم المالية والمصرفية"
  };
  return names[depId] || "قسم عام";
};

const levelNamesMap: Record<number, string> = {
  1: "المستوى الأول",
  2: "المستوى الثاني",
  3: "المستوى الثالث",
  4: "المستوى الرابع",
  5: "المستوى الخامس"
};

interface RequestsManagerProps {
  onStatusChange?: () => void;
}

export default function RequestsManager({ onStatusChange }: RequestsManagerProps) {
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [officialRosters, setOfficialRosters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🗂️ التبويبات الرسمية
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_students' | 'approved_instructors' | 'rosters' | 'rejected'>('pending');
  
  // 🔍 الفلاتر والبحث
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<number | 'all'>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ✏️ حالة نافذة تعديل بيانات الطالب
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editStudentIdNum, setEditStudentIdNum] = useState('');
  const [editDeptId, setEditDeptId] = useState(1);
  const [editLevelId, setEditLevelId] = useState(1);

  // 📦 حالة نافذة رفع كشف معتمد (official_rosters)
  const [showRosterUploadModal, setShowRosterUploadModal] = useState(false);
  const [rosterTitle, setRosterTitle] = useState('');
  const [rosterType, setRosterType] = useState('approved_list');
  const [rosterFile, setRosterFile] = useState<File | null>(null);
  const [isUploadingRoster, setIsUploadingRoster] = useState(false);

  // 📡 جلب الحسابات والوثائق المعتمدة
  const fetchAccountsAndRosters = async () => {
    setIsLoading(true);
    try {
      const { data: accounts, error: accErr } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (accErr) throw accErr;

      if (accounts && accounts.length > 0) {
        const { data: studentsData } = await supabase.from('students').select('*');
        const { data: instructorsData } = await supabase.from('instructors').select('*');

        const mergedAccounts = accounts.map((acc) => {
          const matchedStudent = studentsData?.find(
            (s) => s.user_id === acc.id || s.id === acc.student_id || s.user_account_id === acc.id
          );
          const matchedInstructor = instructorsData?.find(
            (i) => i.user_id === acc.id || i.id === acc.instructor_id || i.user_account_id === acc.id
          );

          return {
            ...acc,
            status: acc.status ? acc.status.toLowerCase() : 'pending',
            students: matchedStudent ? [matchedStudent] : [],
            instructors: matchedInstructor ? [matchedInstructor] : []
          };
        });

        setAllAccounts(mergedAccounts);
      } else {
        setAllAccounts([]);
      }

      const { data: rostersData } = await supabase
        .from('official_rosters')
        .select('*')
        .order('created_at', { ascending: false });

      setOfficialRosters(rostersData || []);

    } catch (err: any) {
      console.error("خطأ جلب البيانات:", err.message);
      setAllAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsAndRosters();
  }, []);

  // ⚡ التحديث الفوري للحالة
  const handleUpdateStatus = async (accountId: number, newStatus: 'approved' | 'rejected' | 'pending') => {
    const statusText = newStatus === 'approved' ? 'قبول واعتماد' : newStatus === 'rejected' ? 'رفض/تجميد' : 'إعادة للمراجعة';
    if (!window.confirm(`هل أنت متأكد من ${statusText} هذا الحساب؟`)) return;

    setAllAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, status: newStatus } : acc));

    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ status: newStatus })
        .eq('id', accountId);

      if (error) throw error;
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      alert("🚨 حدث خطأ أثناء التحديث: " + err.message);
      fetchAccountsAndRosters();
    }
  };

  // ✏️ حفظ تعديل بيانات الطالب
  const handleSaveEditedStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: editName,
          student_id: editStudentIdNum,
          dep_id: editDeptId,
          level_id: editLevelId
        })
        .eq('id', editingStudent.id);

      if (error) throw error;

      alert("🎉 تم تحديث بيانات الطالب بنجاح!");
      setEditingStudent(null);
      fetchAccountsAndRosters();
    } catch (err: any) {
      alert("❌ حدث خطأ في التحديث: " + err.message);
    }
  };

  // 📤 رفع كشف معتمد إلى جدول official_rosters
  const handleUploadRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterTitle || !rosterFile) return alert("الرجاء كتابة اسم الكشف واختيار الملف!");

    setIsUploadingRoster(true);
    try {
      const timestamp = Date.now();
      const depIdToUse = selectedDeptFilter === 'all' ? 1 : selectedDeptFilter;
      const levelIdToUse = selectedLevelFilter === 'all' ? 1 : selectedLevelFilter;
      const filePath = `rosters/${depIdToUse}_L${levelIdToUse}_${timestamp}.pdf`;

      const { error: uploadErr } = await supabase.storage
        .from('university-files')
        .upload(filePath, rosterFile);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      await supabase.from('official_rosters').insert({
        title: rosterTitle,
        dep_id: depIdToUse,
        level_id: levelIdToUse,
        roster_type: rosterType,
        file_url: publicUrl
      });

      alert("🎉 تم رفع الكشف الجامعي المعتمد بنجاح!");
      setShowRosterUploadModal(false);
      setRosterTitle('');
      setRosterFile(null);
      fetchAccountsAndRosters();
    } catch (err: any) {
      alert("❌ فشلت عملية الرفع: " + err.message);
    } finally {
      setIsUploadingRoster(false);
    }
  };

  // 🗑️ حذف كشف معتمد
  const handleDeleteRoster = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكشف المعتمد؟")) return;
    await supabase.from('official_rosters').delete().eq('id', id);
    fetchAccountsAndRosters();
  };

  // 🖨️ 1. محرك طباعة كشف أسماء الطلاب المقيدين (شؤون الطلاب)
  const handlePrintOfficialRoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('الرجاء السماح بالنوافذ المنبثقة لإتمام الطباعة!');

    const depIdToUse = selectedDeptFilter === 'all' ? 1 : selectedDeptFilter;
    const deptName = getDeptName(depIdToUse);
    const collegeName = getCollegeName(depIdToUse);
    const levelName = selectedLevelFilter === 'all' ? 'جميع المستويات الدراسية' : levelNamesMap[selectedLevelFilter as number];
    const today = new Date().toLocaleDateString('ar-YE');

    const studentsToPrint = filteredAccounts.filter(a => a.role === 'student' && a.status === 'approved');

    const studentRows = studentsToPrint.map((acc, index) => {
      const s = Array.isArray(acc.students) ? acc.students[0] : acc.students;
      return `
        <tr>
          <td style="padding: 10px; border: 1px solid #333; text-align: center;">${index + 1}</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right; font-weight: bold;">${s?.name || '---'}</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: center; font-family: monospace; font-size: 13px;">${s?.student_id || '---'}</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: center; color: #047857; font-weight: bold;">مقيد رسمياً</td>
          <td style="padding: 10px; border: 1px solid #333;"></td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>كشف رسمي - جامعة إب</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; direction: rtl; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #0F5E49; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; color: #0A2540; }
          .header h2 { margin: 6px 0; font-size: 16px; color: #0F5E49; }
          .header h3 { margin: 4px 0; font-size: 14px; color: #555; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; font-weight: bold; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          th { background-color: #0F5E49; color: white; padding: 10px; border: 1px solid #333; text-align: center; font-size: 13px; }
          .footer { display: flex; justify-content: space-between; margin-top: 60px; font-size: 13px; font-weight: bold; text-align: center; }
          .sig-box { width: 200px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>الجمهورية اليمنية - جامعة إب</h1>
          <h2>شؤون الطلاب - ${collegeName}</h2>
          <h3>كشف أسماء الطلاب المقيدين رسمياً</h3>
        </div>
        
        <div class="meta">
          <span><strong>القسم والتخصص:</strong> ${deptName}</span>
          <span><strong>المستوى الدراسي:</strong> ${levelName}</span>
          <span><strong>عدد الطلاب:</strong> ${studentsToPrint.length} طالب</span>
          <span><strong>تاريخ الطباعة:</strong> ${today}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>اسم الطالب الرباعي</th>
              <th>الرقم الأكاديمي</th>
              <th>الحالة الدراسية</th>
              <th style="width: 140px;">التوقيع / الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows || '<tr><td colspan="5" style="text-align:center; padding:30px;">لا يوجد طلاب مقيدون في هذا المستوى والقسم.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div class="sig-box"><p>مسجل القسم</p><br/><br/><p>...................................</p></div>
          <div class="sig-box"><p>رئيس القسم الأكاديمي</p><br/><br/><p>...................................</p></div>
          <div class="sig-box"><p>عميد الكلية</p><br/><br/><p>...................................</p></div>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 🖨️ 2. محرك طباعة كشف الحضور والغياب المعتمد للدكاترة والمدرسين
  const handlePrintAttendanceSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('الرجاء السماح بالنوافذ المنبثقة لإتمام الطباعة!');

    const depIdToUse = selectedDeptFilter === 'all' ? 1 : selectedDeptFilter;
    const deptName = getDeptName(depIdToUse);
    const collegeName = getCollegeName(depIdToUse);
    const levelName = selectedLevelFilter === 'all' ? 'جميع المستويات' : levelNamesMap[selectedLevelFilter as number];
    const today = new Date().toLocaleDateString('ar-YE');

    const studentsToPrint = filteredAccounts.filter(a => a.role === 'student' && a.status === 'approved');

    const studentRows = studentsToPrint.map((acc, index) => {
      const s = Array.isArray(acc.students) ? acc.students[0] : acc.students;
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #333; text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #333; text-align: right; font-weight: bold; font-size: 11px;">${s?.name || '---'}</td>
          <td style="padding: 8px; border: 1px solid #333; text-align: center; font-family: monospace; font-size: 11px;">${s?.student_id || '---'}</td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="border: 1px solid #333;"></td>
          <td style="padding: 8px; border: 1px solid #333; text-align: center;"></td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>كشف الحضور والغياب - جامعة إب</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; direction: rtl; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #0A2540; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 22px; color: #0A2540; }
          .header h2 { margin: 4px 0; font-size: 15px; color: #0F5E49; }
          .header h3 { margin: 2px 0; font-size: 13px; color: #444; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; font-weight: bold; background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th { background-color: #0A2540; color: white; padding: 8px; border: 1px solid #333; text-align: center; font-size: 11px; }
          .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; font-weight: bold; text-align: center; }
          .sig-box { width: 250px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>الجمهورية اليمنية - جامعة إب</h1>
          <h2>الشؤون الأكاديمية - ${collegeName}</h2>
          <h3>كشف الحضور والغياب للمحاضرات والدروس العلمية (خاص بالكادر الأكاديمي)</h3>
        </div>
        
        <div class="meta">
          <span><strong>القسم والتخصص:</strong> ${deptName}</span>
          <span><strong>المستوى:</strong> ${levelName}</span>
          <span><strong>اسم المادة الدراسية:</strong> .................................................</span>
          <span><strong>أستاذ المادة:</strong> .................................................</span>
          <span><strong>العام الدراسي:</strong> 2026/2025</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">م</th>
              <th style="width: 200px;">اسم الطالب الرباعي</th>
              <th style="width: 90px;">الرقم الأكاديمي</th>
              <th style="width: 35px;">أ1</th>
              <th style="width: 35px;">أ2</th>
              <th style="width: 35px;">أ3</th>
              <th style="width: 35px;">أ4</th>
              <th style="width: 35px;">أ5</th>
              <th style="width: 35px;">أ6</th>
              <th style="width: 35px;">أ7</th>
              <th style="width: 35px;">أ8</th>
              <th style="width: 35px;">أ9</th>
              <th style="width: 35px;">أ10</th>
              <th>المجموع / ملاحظات المدرس</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows || '<tr><td colspan="14" style="text-align:center; padding:30px;">لا يوجد طلاب مسجلون في هذا القسم والمستوى.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div class="sig-box"><p>توقيع أستاذ / مدرس المادة</p><br/><br/><p>.......................................................</p></div>
          <div class="sig-box"><p>توقيع رئيس القسم الأكاديمي</p><br/><br/><p>.......................................................</p></div>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 📊 حساب الإحصائيات
  const stats = {
    pending: allAccounts.filter(a => a.status === 'pending').length,
    approvedStudents: allAccounts.filter(a => a.status === 'approved' && a.role === 'student').length,
    approvedInstructors: allAccounts.filter(a => a.status === 'approved' && (a.role === 'instructor' || a.role === 'academic')).length,
    rejected: allAccounts.filter(a => a.status === 'rejected').length
  };
  // 🔍 الفلترة والبحث الشامل لجميع الحسابات
  const filteredAccounts = allAccounts.filter((acc) => {
    const studentInfo = Array.isArray(acc.students) ? acc.students[0] : acc.students;
    const instructorInfo = Array.isArray(acc.instructors) ? acc.instructors[0] : acc.instructors;
    const details = acc.role === 'student' ? studentInfo : instructorInfo;

    const depId = details?.dep_id || 1;
    const levelId = details?.level_id || 1;
    const fullName = details?.name || '';
    const academicId = details?.student_id || details?.id || '';
    const q = searchQuery.toLowerCase().trim();

    // 🌟 1. في حال كتابة شيء بداخل مربع البحث: يبحث فوراً ويتجاهل الفلاتر
    if (q) {
      const matchesSearch = (
        fullName.toLowerCase().includes(q) ||
        academicId.toString().toLowerCase().includes(q) ||
        acc.username?.toLowerCase().includes(q)
      );

      if (activeTab === 'pending') return acc.status === 'pending' && matchesSearch;
      if (activeTab === 'approved_students') return acc.status === 'approved' && acc.role === 'student' && matchesSearch;
      if (activeTab === 'approved_instructors') return acc.status === 'approved' && acc.role !== 'student' && matchesSearch;
      if (activeTab === 'rejected') return acc.status === 'rejected' && matchesSearch;

      return matchesSearch;
    }

    // 📌 2. فلترة التبويب النشط
    if (activeTab === 'pending') {
      if (acc.status !== 'pending') return false;
    } else if (activeTab === 'approved_students') {
      if (acc.status !== 'approved' || acc.role !== 'student') return false;
    } else if (activeTab === 'approved_instructors') {
      if (acc.status !== 'approved' || acc.role === 'student') return false;
    } else if (activeTab === 'rejected') {
      if (acc.status !== 'rejected') return false;
    }

    // 📌 3. فلترة القسم والكلية بناءً على رقم الكلية (college_id) 👈 الكود الخاص بك هنا
    if (selectedDeptFilter !== 'all') {
      if (acc.role === 'student') {
        // الطالب: تطابق برقم القسم الفعلي (dep_id)
        if (depId !== selectedDeptFilter) return false;
      } else {
        // الأكاديمي: تطابق برقم الكلية (college_id = 1 لكلية الهندسة)
        const selectedCollegeId = getCollegeId(selectedDeptFilter);
        const instructorCollegeId = getCollegeId(depId);
        if (selectedCollegeId !== instructorCollegeId) return false;
      }
    }

    // 📌 4. فلترة المستوى الدراسي (للطلاب فقط)
    if (acc.role === 'student' && selectedLevelFilter !== 'all' && levelId !== selectedLevelFilter) return false;

    return true;
  });

  // 📦 2. البحث والفلترة الشاملة للوثائق والكشوفات المعتمدة (official_rosters)
  const filteredRosters = officialRosters.filter((ros) => {
    const q = searchQuery.toLowerCase().trim();
    
    // إذا كُتب شيء في مربع البحث، يبحث في أسماء جميع الكشوفات المرفوعة ويطنش فلاتر القسم والمستوى
    if (q) {
      return ros.title?.toLowerCase().includes(q);
    }

    if (selectedDeptFilter !== 'all' && ros.dep_id !== selectedDeptFilter) return false;
    if (selectedLevelFilter !== 'all' && ros.level_id !== selectedLevelFilter) return false;
    return true;
  });

  return (
    <section className="bg-[#0D1629]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl max-w-6xl mx-auto dir-rtl text-right">
      
      {/* 🏛 الشريط العلوي والعنوان */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              إدارة طلبات الانضمام ودليل الحسابات الأكاديمية
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              اعتماد، تعديل وطباعة كشوفات الحضور والقيد للطلاب والدكاترة بحسب القسم والمستوى
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={fetchAccountsAndRosters}
          className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-400 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث السجلات</span>
        </button>
      </div>

      {/* 📊 الكروت الإحصائية التفاعلية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div 
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'pending' 
              ? 'bg-amber-500/20 border-amber-500/50 shadow-lg scale-[1.02]' 
              : 'bg-black/40 border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">طلبات انضمام معلقة</span>
            <h3 className="text-xl font-black text-white mt-1 font-mono">{stats.pending}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('approved_students')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'approved_students' 
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg scale-[1.02]' 
              : 'bg-black/40 border-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">طلاب معتمدون ومقيدون</span>
            <h3 className="text-xl font-black text-white mt-1 font-mono">{stats.approvedStudents}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('approved_instructors')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'approved_instructors' 
              ? 'bg-sky-500/20 border-sky-500/50 shadow-lg scale-[1.02]' 
              : 'bg-black/40 border-sky-500/20 hover:border-sky-500/40'
          }`}
        >
          <div>
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider block">كادر أكاديمي معتمد</span>
            <h3 className="text-xl font-black text-white mt-1 font-mono">{stats.approvedInstructors}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 🏛 محدد تصفية القسم والمستوى الدراسي + أزرار الطباعة الرسمية الخصيصية */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
            <Filter className="w-4 h-4" />
            <span>تصفية العرض بحسب الكلية، القسم والمستوى الدراسي:</span>
          </div>

          {/* 🖨️ أزرار الطباعة الرسمية المزدوجة */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOfficialRoster}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md cursor-pointer"
              title="طباعة كشف أسماء الطلاب المقيدين رسمياً"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>كشف القيد الرسمى</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAttendanceSheet}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition-all shadow-md cursor-pointer"
              title="طباعة كشف الحضور والغياب الخاص بأستاذ المادة والدكاترة"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>كشف الحضور والغياب للدكاترة</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">الكلية والقسم:</label>
            <select 
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#070D19] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">🌐 جميع الكليات والأقسام</option>
              {universityStructure.map((college) => (
                <optgroup key={college.name} label={`🏛️ ${college.name}`} className="bg-[#0D1629] text-emerald-300 font-bold">
                  {college.departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-[#070D19] text-white">
                      ➔ {dept.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">المستوى الدراسي (للطلاب):</label>
            <select 
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#070D19] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">🎓 جميع المستويات الدراسية</option>
              <option value="1">المستوى الأول</option>
              <option value="2">المستوى الثاني</option>
              <option value="3">المستوى الثالث</option>
              <option value="4">المستوى الرابع</option>
              <option value="5">المستوى الخامس</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🗂️ التبويبات الرسمية والبحث */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 bg-black/30 p-2 rounded-2xl border border-white/10">
          
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>طلبات الانضمام ({stats.pending})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('approved_students')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'approved_students'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>الطلاب المقيدون ({stats.approvedStudents})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('approved_instructors')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'approved_instructors'
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>الكادر الأكاديمي ({stats.approvedInstructors})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rosters')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rosters'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              <span>الكشوفات المعتمدة (PDF) ({filteredRosters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rejected'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>المرفوضة ({stats.rejected})</span>
            </button>

          </div>

          <div className="relative flex-1 max-w-xs">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الأكاديمي..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

        </div>
      </div>

      {/* 📄 حالة العرض بحسب التبويب النشط */}
      {activeTab === 'rosters' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-black/30 p-3 rounded-2xl border border-white/10">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> الوثائق والكشوفات المرفوعة للقسم والمستوى المختار
            </span>
            <button
              onClick={() => setShowRosterUploadModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> رفع كشف معتمد (PDF)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRosters.length > 0 ? (
              filteredRosters.map((ros) => (
                <div key={ros.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{ros.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">التخصص: {getDeptName(ros.dep_id)} | المستوى: {ros.level_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a href={ros.file_url} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">
                      <DownloadCloud className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDeleteRoster(ros.id)} className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-500 font-bold bg-black/20 rounded-2xl border border-white/5">
                لا توجد كشوفات معتمدة مرفوعة لهذا القسم أو المستوى المختار.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="w-full text-xs text-right text-slate-300">
            <thead className="text-[11px] font-black uppercase text-slate-400 bg-black/60 border-b border-white/10">
              <tr>
                <th className="px-5 py-4">الاسم الكامل والصفة</th>
                <th className="px-5 py-4">الكلية / التخصص الأكاديمي</th>
                <th className="px-5 py-4">الرقم الأكاديمي</th>
                <th className="px-5 py-4">اسم المستخدم</th>
                <th className="px-5 py-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>جاري استدعاء سجلات الطلاب والدكاترة...</span>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-bold">
                    لا توجد سجلات مطابقة لهذه الفلترة المحددة حالياً.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((req) => {
                  const studentInfo = Array.isArray(req.students) ? req.students[0] : req.students;
                  const instructorInfo = Array.isArray(req.instructors) ? req.instructors[0] : req.instructors;
                  const details = req.role === 'student' ? studentInfo : instructorInfo;

                  const fullName = details?.name || 'غير محدد';
                  const academicId = details?.student_id || details?.id || '---';
                  const depId = details?.dep_id || 1;
                  const levelId = details?.level_id || 1;
                  const isStudent = req.role === 'student';

                  return (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                      
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isStudent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}>
                            {isStudent ? <GraduationCap className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-black text-white block">{fullName}</span>
                            <span className="text-[10px] text-slate-400">{isStudent ? 'طالب جامعي' : 'عضو كادر أكاديمي'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <div>
                            {isStudent ? (
                              <>
                                <span className="text-white font-bold block">{getDeptName(depId)}</span>
                                <span className="text-[10px] text-amber-300 font-bold block">{levelNamesMap[levelId] || "المستوى الأول"}</span>
                              </>
                            ) : (
                              <span className="text-sky-300 font-black block text-xs">{getCollegeName(depId)}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-emerald-300">{academicId}</td>
                      <td className="px-5 py-4 text-slate-300 font-mono">@{req.username}</td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-1.5">
                          
                          {isStudent && details && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(details);
                                setEditName(details.name || '');
                                setEditStudentIdNum(details.student_id || '');
                                setEditDeptId(details.dep_id || 1);
                                setEditLevelId(details.level_id || 1);
                              }}
                              className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 cursor-pointer"
                              title="تعديل بيانات الطالب"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {req.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(req.id, 'approved')} 
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> قبول
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(req.id, 'rejected')} 
                                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> رفض
                              </button>
                            </>
                          )}

                          {req.status === 'approved' && (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'rejected')} 
                              className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                            >
                              تجميد الحساب
                            </button>
                          )}

                          {req.status === 'rejected' && (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'approved')} 
                              className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> إعادة قبول
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 🛑 نافذة تعديل بيانات الطالب (Modal Edit) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
          <div className="bg-[#0D1629] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" /> تعديل بيانات الطالب المأرشفة
              </h4>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleSaveEditedStudent} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم الطالب الرباعي:</label>
                <input type="text" value={editName} onChange={(e)=>setEditName(e.target.value)} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white"/>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الرقم الأكاديمي:</label>
                <input type="text" value={editStudentIdNum} onChange={(e)=>setEditStudentIdNum(e.target.value)} className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono"/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">القسم والتخصص:</label>
                  <select value={editDeptId} onChange={(e)=>setEditDeptId(parseInt(e.target.value))} className="w-full p-2.5 rounded-xl bg-[#070D19] border border-white/10 text-xs text-white">
                    {universityStructure.map((c) => c.departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    )))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">المستوى الدراسي:</label>
                  <select value={editLevelId} onChange={(e)=>setEditLevelId(parseInt(e.target.value))} className="w-full p-2.5 rounded-xl bg-[#070D19] border border-white/10 text-xs text-white">
                    <option value="1">المستوى الأول</option>
                    <option value="2">المستوى الثاني</option>
                    <option value="3">المستوى الثالث</option>
                    <option value="4">المستوى الرابع</option>
                    <option value="5">المستوى الخامس</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs mt-2 cursor-pointer shadow-lg">
                حفظ البيانات والتعديلات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 نافذة رفع كشف معتمد (official_rosters Modal) */}
      {showRosterUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
          <div className="bg-[#0D1629] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" /> رفع كشف معتمد لجدول (official_rosters)
              </h4>
              <button onClick={() => setShowRosterUploadModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleUploadRoster} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم/عنوان الوثيقة أو الكشف:</label>
                <input type="text" value={rosterTitle} onChange={(e)=>setRosterTitle(e.target.value)} placeholder="مثال: كشف الدرجات النهائي المعتمد..." className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white"/>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">تصنيف الوثيقة:</label>
                <select value={rosterType} onChange={(e)=>setRosterType(e.target.value)} className="w-full p-3 rounded-xl bg-[#070D19] border border-white/10 text-xs text-white">
                  <option value="approved_list">كشف مقيدين معتمد</option>
                  <option value="grade_sheet">كشف درجات نهائي</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">اختيار ملف الـ PDF:</label>
                <input type="file" accept=".pdf" onChange={(e)=>setRosterFile(e.target.files?.[0] || null)} className="w-full p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-400 cursor-pointer"/>
              </div>

              <button type="submit" disabled={isUploadingRoster} className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                {isUploadingRoster ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
                <span>رفع وتوثيق الكشف الجامعي</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}