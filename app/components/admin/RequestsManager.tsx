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
  ClipboardList,
  FileSpreadsheet,
  CheckSquare,
  Square
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

const getCollegeId = (depId: number): number => {
  if ([1, 2, 3, 4].includes(depId)) return 1;
  if ([5, 6, 7].includes(depId)) return 2;
  if (depId === 8) return 3;
  if (depId === 9) return 4;
  if ([10, 11, 12].includes(depId)) return 5;
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

// 1️⃣ خريطة مسميات المستويات
const levelNamesMap: Record<number, string> = {
  1: "المستوى الأول",
  2: "المستوى الثاني",
  3: "المستوى الثالث",
  4: "المستوى الرابع",
  5: "المستوى الخامس",
  6: "المستوى السادس",
  7: "المستوى السابع"
};

// 2️⃣ دالة تحديد أقصى عدد مستويات بحسب القسم
const getMaxLevels = (depId: number | string): number => {
  if (depId === 'all' || !depId) return 7;
  const numId = Number(depId);
  if ([1, 2, 3, 4].includes(numId)) return 5;
  if (numId === 8) return 5;
  if (numId === 5) return 7;
  return 4;
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

  // ☑️ التحديد الجماعي
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);

  // ✏️ حالة نافذة تعديل بيانات الطالب
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editStudentIdNum, setEditStudentIdNum] = useState('');
  const [editDeptId, setEditDeptId] = useState(1);
  const [editLevelId, setEditLevelId] = useState(1);

  // 📦 حالة نافذة رفع كشف معتمد (PDF أو Excel)
  const [showRosterUploadModal, setShowRosterUploadModal] = useState(false);
  const [rosterTitle, setRosterTitle] = useState('');
  const [rosterType, setRosterType] = useState('approved_list');
  const [rosterDeptId, setRosterDeptId] = useState<number>(1);
  const [rosterLevelId, setRosterLevelId] = useState<number>(1);
  const [rosterSemester, setRosterSemester] = useState<number>(1);
  const [rosterFile, setRosterFile] = useState<File | null>(null);
  const [isUploadingRoster, setIsUploadingRoster] = useState(false);

  // 📡 جلب البيانات المدمجة
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

      const { data: rostersData, error: rosErr } = await supabase
        .from('official_rosters')
        .select('*')
        .order('created_at', { ascending: false });

      if (rosErr) console.error("خطأ جلب الكشوفات المعتمدة:", rosErr.message);
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

  // ⚡ التحديث الفوري للحالة (فردي)
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

  // ⚡ الإجراءات الجماعية
  const handleBulkUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    if (selectedAccountIds.length === 0) return;
    const actionText = newStatus === 'approved' ? 'قبول واعتماد' : 'رفض/تجميد';
    if (!window.confirm(`هل أنت متأكد من ${actionText} عدد (${selectedAccountIds.length}) من الحسابات المحددة؟`)) return;

    setAllAccounts(prev => prev.map(acc => selectedAccountIds.includes(acc.id) ? { ...acc, status: newStatus } : acc));

    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ status: newStatus })
        .in('id', selectedAccountIds);

      if (error) throw error;
      alert(`🎉 تم ${actionText} عدد (${selectedAccountIds.length}) حساب بنجاح!`);
      setSelectedAccountIds([]);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      alert("🚨 حدث خطأ أثناء التحديث الجماعي: " + err.message);
      fetchAccountsAndRosters();
    }
  };

  // 📊 تصدير شيت Excel/CSV
  const handleExportToExcel = () => {
    const studentsToExport = filteredAccounts.filter(a => a.role === 'student' && a.status === 'approved');
    
    if (studentsToExport.length === 0) {
      return alert("لا توجد سجلات طلاب معتمدة قابلة للتصدير حالياً بناءً على الفلاتر المحددة.");
    }

    const depIdToUse = selectedDeptFilter === 'all' ? 1 : selectedDeptFilter;
    const deptName = getDeptName(depIdToUse);
    const levelName = selectedLevelFilter === 'all' ? 'جميع_المستويات' : levelNamesMap[selectedLevelFilter as number];

    let csvContent = "\uFEFFالرقم,اسم الطالب الرباعي,الرقم الأكاديمي,القسم والتخصص,المستوى الدراسي,اسم المستخدم,الحالة الرسمية\n";

    studentsToExport.forEach((acc, index) => {
      const s = Array.isArray(acc.students) ? acc.students[0] : acc.students;
      const row = [
        index + 1,
        `"${s?.name || '---'}"`,
        `"${s?.student_id || '---'}"`,
        `"${getDeptName(s?.dep_id || depIdToUse)}"`,
        `"${levelNamesMap[s?.level_id || 1] || '---'}"`,
        `"${acc.username || '---'}"`,
        "مقيد رسمياً"
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `كشف_الطلاب_${deptName.replace(/\s+/g, '_')}_${levelName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✏️ حفظ تعديل الطالب
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

  // 📤 رفع كشف معتمد (يدعم PDF و Excel) مع فحص أخطاء الإدخال
  const handleUploadRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterTitle || !rosterFile) return alert("الرجاء كتابة اسم الكشف واختيار الملف أولاً!");

    setIsUploadingRoster(true);
    try {
      const timestamp = Date.now();
      const fileExt = rosterFile.name.split('.').pop() || 'pdf';
      const filePath = `rosters/${rosterDeptId}_L${rosterLevelId}_S${rosterSemester}_${timestamp}.${fileExt}`;

      // 1. رفع الملف إلى Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('university-files')
        .upload(filePath, rosterFile);

      if (uploadErr) throw uploadErr;

      // 2. الحصول على رابط التحميل المباشر
      const { data: { publicUrl } } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      // 3. محاولة الإدخال الأساسية مع فحص الاستجابة صراحة
      const rosterDataToInsert: any = {
        title: rosterTitle,
        dep_id: rosterDeptId,
        level_id: rosterLevelId,
        roster_type: rosterType,
        file_url: publicUrl
      };

      // إضافة الأعمدة الاختيارية في حال وجودها
      if (rosterSemester) rosterDataToInsert.semester = rosterSemester;
      const collegeId = getCollegeId(rosterDeptId);
      if (collegeId) rosterDataToInsert.college_id = collegeId;

      const { error: dbErr } = await supabase
        .from('official_rosters')
        .insert(rosterDataToInsert);

      // إذا حدث خطأ بسبب أعمدة اختيارية مثل semester أو college_id، نعيد المحاولة بالأعمدة الأساسية فقط
      if (dbErr) {
        console.warn("إعادة المحاولة بالأعمدة الأساسية لجدول official_rosters:", dbErr.message);
        const { error: fallbackErr } = await supabase
          .from('official_rosters')
          .insert({
            title: rosterTitle,
            dep_id: rosterDeptId,
            level_id: rosterLevelId,
            roster_type: rosterType,
            file_url: publicUrl
          });

        if (fallbackErr) throw fallbackErr;
      }

      alert("🎉 تم رفع وتوثيق الكشف الجامعي المعتمد بنجاح!");
      setShowRosterUploadModal(false);
      setRosterTitle('');
      setRosterFile(null);

      // إعادة الفلاتر لتطابق الكشف المرفوع ليظهر أمام المستخدم فوراً
      setSelectedDeptFilter(rosterDeptId);
      setSelectedLevelFilter(rosterLevelId);

      await fetchAccountsAndRosters();
    } catch (err: any) {
      alert("❌ فشلت عملية الرفع: " + err.message);
    } finally {
      setIsUploadingRoster(false);
    }
  };

  // 🗑️ حذف كشف
  const handleDeleteRoster = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكشف المعتمد؟")) return;
    await supabase.from('official_rosters').delete().eq('id', id);
    fetchAccountsAndRosters();
  };

  // 🖨️ طباعة كشف القيد (PDF)
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
          .header { text-align: center; border-bottom: 2px solid #062c35; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; color: #062c35; }
          .header h2 { margin: 6px 0; font-size: 16px; color: #059669; }
          .header h3 { margin: 4px 0; font-size: 14px; color: #555; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; font-weight: bold; background: #f4f8f5; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          th { background-color: #062c35; color: white; padding: 10px; border: 1px solid #333; text-align: center; font-size: 13px; }
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

  // 🖨️ طباعة كشف الحضور والغياب (PDF)
  const handlePrintAttendanceSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('الرجاء السماح بالنوافذ المنبثقة لإتمام الطباعة!');

    const depIdToUse = selectedDeptFilter === 'all' ? 1 : selectedDeptFilter;
    const deptName = getDeptName(depIdToUse);
    const collegeName = getCollegeName(depIdToUse);
    const levelName = selectedLevelFilter === 'all' ? 'جميع المستويات' : levelNamesMap[selectedLevelFilter as number];

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
          .header { text-align: center; border-bottom: 2px solid #062c35; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 22px; color: #062c35; }
          .header h2 { margin: 4px 0; font-size: 15px; color: #059669; }
          .header h3 { margin: 2px 0; font-size: 13px; color: #444; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; font-weight: bold; background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th { background-color: #062c35; color: white; padding: 8px; border: 1px solid #333; text-align: center; font-size: 11px; }
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

  // 📊 حساب الإحصائيات الحية
  const stats = {
    pending: allAccounts.filter(a => a.status === 'pending' && a.role !== 'admin' && a.role !== 'superadmin' && a.username !== 'admin123').length,
    approvedStudents: allAccounts.filter(a => a.status === 'approved' && a.role === 'student').length,
    approvedInstructors: allAccounts.filter(a => a.status === 'approved' && (a.role === 'instructor' || a.role === 'academic')).length,
    rejected: allAccounts.filter(a => a.status === 'rejected' && a.role !== 'admin').length
  };

  // 🔍 1. الفلترة المتقدمة للحسابات
  const filteredAccounts = allAccounts.filter((acc) => {
    if (acc.role === 'admin' || acc.role === 'superadmin' || acc.username === 'admin123') {
      return false;
    }

    const studentInfo = Array.isArray(acc.students) ? acc.students[0] : acc.students;
    const instructorInfo = Array.isArray(acc.instructors) ? acc.instructors[0] : acc.instructors;
    const details = acc.role === 'student' ? studentInfo : instructorInfo;

    const depId = details?.dep_id || 1;
    const levelId = details?.level_id || 1;
    const fullName = details?.name || '';
    const academicId = details?.student_id || details?.id || '';
    const q = searchQuery.toLowerCase().trim();

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

    if (activeTab === 'pending') {
      if (acc.status !== 'pending') return false;
    } else if (activeTab === 'approved_students') {
      if (acc.status !== 'approved' || acc.role !== 'student') return false;
    } else if (activeTab === 'approved_instructors') {
      if (acc.status !== 'approved' || acc.role === 'student') return false;
    } else if (activeTab === 'rejected') {
      if (acc.status !== 'rejected') return false;
    }

    if (selectedDeptFilter !== 'all') {
      if (acc.role === 'student') {
        if (Number(depId) !== Number(selectedDeptFilter)) return false;
      } else {
        const selectedCollegeId = getCollegeId(Number(selectedDeptFilter));
        const instructorCollegeId = getCollegeId(Number(depId));
        if (selectedCollegeId !== instructorCollegeId) return false;
      }
    }

    if (acc.role === 'student' && selectedLevelFilter !== 'all' && Number(levelId) !== Number(selectedLevelFilter)) return false;

    return true;
  });

  // 📦 2. الفلترة المنضبطة للكشوفات المعتمدة
  const filteredRosters = officialRosters.filter((ros: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !ros.title?.toLowerCase().includes(q)) return false;

    if (selectedDeptFilter !== 'all' && Number(ros.dep_id) !== Number(selectedDeptFilter)) return false;
    if (selectedLevelFilter !== 'all' && Number(ros.level_id) !== Number(selectedLevelFilter)) return false;

    return true;
  });

  const handleSelectAll = () => {
    if (selectedAccountIds.length === filteredAccounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(filteredAccounts.map(a => a.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedAccountIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <section className="bg-[#edf2ee] border border-[#d2ded6] rounded-[2.5rem] p-6 md:p-8 shadow-xl max-w-6xl mx-auto dir-rtl text-right font-sans">
      
      {/* 🏛 الشريط العلوي */}
      <div className="bg-[#062c35] text-white rounded-3xl p-5 md:p-6 mb-6 flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#00bc7e]/15 border border-[#00bc7e]/30 flex items-center justify-center text-[#00bc7e]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black tracking-tight">
                إدارة طلبات الانضمام ودليل الحسابات
              </h2>
              <span className="text-[10px] font-mono font-bold bg-[#00bc7e]/20 text-[#00bc7e] border border-[#00bc7e]/40 px-2.5 py-0.5 rounded-full">
                SYSTEM CORE
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              منظومة شؤون الطلاب والاعتمادات الكلية بجامعة إب الذكية
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={fetchAccountsAndRosters}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#00bc7e] ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث السجلات</span>
        </button>
      </div>

      {/* 📊 الكروت الإحصائية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => { setActiveTab('pending'); setSelectedAccountIds([]); }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'pending' 
              ? 'bg-amber-500/10 border-amber-500/40 shadow-md scale-[1.01]' 
              : 'bg-white border-[#d8e3dd] hover:border-amber-500/30'
          }`}
        >
          <div>
            <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider block">طلبات انضمام معلقة</span>
            <h3 className="text-2xl font-black text-[#062c35] mt-1 font-mono">{stats.pending}</h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => { setActiveTab('approved_students'); setSelectedAccountIds([]); }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'approved_students' 
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md scale-[1.01]' 
              : 'bg-white border-[#d8e3dd] hover:border-emerald-500/30'
          }`}
        >
          <div>
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider block">طلاب معتمدون ومقيدون</span>
            <h3 className="text-2xl font-black text-[#062c35] mt-1 font-mono">{stats.approvedStudents}</h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => { setActiveTab('approved_instructors'); setSelectedAccountIds([]); }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'approved_instructors' 
              ? 'bg-sky-500/10 border-sky-500/40 shadow-md scale-[1.01]' 
              : 'bg-white border-[#d8e3dd] hover:border-sky-500/30'
          }`}
        >
          <div>
            <span className="text-[11px] font-black text-sky-700 uppercase tracking-wider block">كادر أكاديمي معتمد</span>
            <h3 className="text-2xl font-black text-[#062c35] mt-1 font-mono">{stats.approvedInstructors}</h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center border border-sky-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 🏛 محدد تصفية القسم والمستوى */}
      <div className="bg-white border border-[#d8e3dd] rounded-3xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-[#062c35]">
            <Filter className="w-4 h-4 text-[#059669]" />
            <span>تصفية العرض بحسب الكلية، القسم والمستوى الدراسي:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportToExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#062c35] hover:bg-[#093d49] text-white font-black text-xs transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00bc7e]" />
              <span>تصدير شيت Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrintOfficialRoster}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-black text-xs transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>كشف القيد الرسمى</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAttendanceSheet}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs transition-all shadow-sm cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>كشف الحضور والغياب</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">الكلية والقسم:</label>
            <select 
              value={selectedDeptFilter}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                setSelectedDeptFilter(val);
                setSelectedLevelFilter('all');
              }}
              className="w-full p-3 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] focus:outline-none focus:border-[#059669] cursor-pointer"
            >
              <option value="all">🌐 جميع الكليات والأقسام</option>
              {universityStructure.map((college) => (
                <optgroup key={college.name} label={`🏛️ ${college.name}`} className="bg-white text-[#059669] font-bold">
                  {college.departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-white text-slate-800">
                      ➔ {dept.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">المستوى الدراسي (للطلاب):</label>
            <select 
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full p-3 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35] focus:outline-none focus:border-[#059669] cursor-pointer"
            >
              <option value="all">🎓 جميع المستويات الدراسية</option>
              {Array.from({ length: getMaxLevels(selectedDeptFilter) }, (_, i) => i + 1).map((lvl) => (
                <option key={lvl} value={lvl}>{levelNamesMap[lvl]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🗂️ التبويبات والبحث المباشر */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2.5 rounded-3xl border border-[#d8e3dd] shadow-sm">
          
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setActiveTab('pending'); setSelectedAccountIds([]); }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-[#062c35]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>طلبات الانضمام ({stats.pending})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('approved_students'); setSelectedAccountIds([]); }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'approved_students'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-[#062c35]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>الطلاب المقيدون ({stats.approvedStudents})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('approved_instructors'); setSelectedAccountIds([]); }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'approved_instructors'
                  ? 'bg-sky-500/15 border border-sky-500/40 text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-[#062c35]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>الكادر الأكاديمي ({stats.approvedInstructors})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('rosters'); setSelectedAccountIds([]); }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rosters'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-[#062c35]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
              <span>الكشوفات المعتمدة ({filteredRosters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('rejected'); setSelectedAccountIds([]); }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rejected'
                  ? 'bg-rose-500/15 border border-rose-500/40 text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-[#062c35]'
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
              className="w-full bg-[#f4f7f5] border border-[#cde0d5] rounded-2xl px-3.5 py-2 text-xs text-[#062c35] placeholder-slate-400 focus:outline-none focus:border-[#059669]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

        </div>
      </div>

      {/* ⚡ شريط الإجراءات الجماعية العائم */}
      {selectedAccountIds.length > 0 && activeTab !== 'rosters' && (
        <div className="bg-[#062c35] text-white rounded-2xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-black">
            <CheckSquare className="w-4 h-4 text-[#00bc7e]" />
            <span>تم تحديد <strong className="text-[#00bc7e] font-mono text-sm px-2 py-0.5 bg-white/10 rounded-lg">{selectedAccountIds.length}</strong> حساب من القائمة</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkUpdateStatus('approved')}
              className="px-4 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              قبول واعتماد المحددين
            </button>

            <button
              type="button"
              onClick={() => handleBulkUpdateStatus('rejected')}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              رفض / تجميد المحددين
            </button>

            <button
              type="button"
              onClick={() => setSelectedAccountIds([])}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 📄 حالة العرض بحسب التبويب النشط */}
      {activeTab === 'rosters' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-[#d8e3dd] shadow-sm">
            <span className="text-xs font-black text-[#062c35] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" /> الكشوفات والوثائق المرفوعة للقسم والمستوى المختار
            </span>
            <button
              onClick={() => setShowRosterUploadModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> رفع كشف معتمد (PDF / Excel)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRosters.length > 0 ? (
              filteredRosters.map((ros: any) => {
                const isExcel = ros.file_url?.match(/\.(xlsx|xls|csv)$/i) || ros.title?.match(/(excel|csv|شيت|جدول)/i);
                
                return (
                  <div key={ros.id} className="p-4 rounded-2xl bg-white border border-[#d8e3dd] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        isExcel 
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                      }`}>
                        {isExcel ? <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> : <FileText className="w-5 h-5 text-amber-600" />}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-black text-[#062c35] truncate">{ros.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          التخصص: {getDeptName(ros.dep_id)} | المستوى: {ros.level_id} {ros.semester ? `| الترم: ${ros.semester === 2 ? 'الثاني' : 'الأول'}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={ros.file_url} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20">
                        <DownloadCloud className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleDeleteRoster(ros.id)} className="p-2 rounded-xl bg-rose-500/10 text-rose-700 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-500 font-bold bg-white rounded-3xl border border-[#d8e3dd]">
                لا توجد كشوفات معتمدة مرفوعة لهذا القسم أو المستوى المختار حالياً.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#d8e3dd] bg-white shadow-sm">
          <table className="w-full text-xs text-right text-slate-700">
            <thead className="text-[11px] font-black uppercase text-[#062c35] bg-[#e4ede8] border-b border-[#cde0d5]">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <button 
                    type="button" 
                    onClick={handleSelectAll}
                    className="text-slate-500 hover:text-[#062c35] cursor-pointer"
                  >
                    {filteredAccounts.length > 0 && selectedAccountIds.length === filteredAccounts.length ? (
                      <CheckSquare className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-4">الاسم الكامل والصفة</th>
                <th className="px-5 py-4">الكلية / التخصص الأكاديمي</th>
                <th className="px-5 py-4">الرقم الأكاديمي</th>
                <th className="px-5 py-4">اسم المستخدم</th>
                <th className="px-5 py-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#059669] mb-2" />
                    <span>جاري استدعاء سجلات الطلاب والدكاترة...</span>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-bold">
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
                  const isSelected = selectedAccountIds.includes(req.id);

                  return (
                    <tr key={req.id} className={`hover:bg-[#f4f8f5] transition-colors ${isSelected ? 'bg-emerald-500/10' : ''}`}>
                      
                      <td className="px-4 py-4 text-center">
                        <button 
                          type="button" 
                          onClick={() => handleToggleSelectOne(req.id)}
                          className="text-slate-400 hover:text-[#062c35] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#059669]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isStudent ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-700 border border-sky-500/20'
                          }`}>
                            {isStudent ? <GraduationCap className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-black text-[#062c35] block">{fullName}</span>
                            <span className="text-[10px] text-slate-500">{isStudent ? 'طالب جامعي' : 'عضو كادر أكاديمي'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                          <div>
                            {isStudent ? (
                              <>
                                <span className="text-[#062c35] font-bold block">{getDeptName(depId)}</span>
                                <span className="text-[10px] text-amber-700 font-bold block">{levelNamesMap[levelId] || "المستوى الأول"}</span>
                              </>
                            ) : (
                              <span className="text-sky-800 font-black block text-xs">{getCollegeName(depId)}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-[#059669]">{academicId}</td>
                      <td className="px-5 py-4 text-slate-600 font-mono">@{req.username}</td>

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
                              className="p-1.5 rounded-xl bg-sky-500/10 text-sky-700 border border-sky-500/20 hover:bg-sky-500/20 cursor-pointer"
                              title="تعديل بيانات الطالب"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {req.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(req.id, 'approved')} 
                                className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> قبول
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(req.id, 'rejected')} 
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> رفض
                              </button>
                            </>
                          )}

                          {req.status === 'approved' && (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'rejected')} 
                              className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                            >
                              تجميد الحساب
                            </button>
                          )}

                          {req.status === 'rejected' && (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'approved')} 
                              className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
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

      {/* 🛑 نافذة تعديل بيانات الطالب */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white border border-[#d8e3dd] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-[#062c35] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#059669]" /> تعديل بيانات الطالب
              </h4>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleSaveEditedStudent} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">اسم الطالب الرباعي:</label>
                <input type="text" value={editName} onChange={(e)=>setEditName(e.target.value)} className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35]"/>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">الرقم الأكاديمي:</label>
                <input type="text" value={editStudentIdNum} onChange={(e)=>setEditStudentIdNum(e.target.value)} className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35] font-mono"/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">القسم والتخصص:</label>
                  <select value={editDeptId} onChange={(e)=>setEditDeptId(parseInt(e.target.value))} className="w-full p-2.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35]">
                    {universityStructure.map((c) => c.departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    )))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-slate-600 block mb-1">المستوى الدراسي:</label>
                  <select 
                    value={editLevelId} 
                    onChange={(e) => setEditLevelId(parseInt(e.target.value))} 
                    className="w-full p-2.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35]"
                  >
                    {Array.from({ length: getMaxLevels(editDeptId) }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl}>{levelNamesMap[lvl]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-black rounded-xl text-xs mt-2 cursor-pointer shadow-md">
                حفظ التعديلات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 نافذة رفع كشف معتمد (PDF / Excel) */}
      {showRosterUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white border border-[#d8e3dd] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-[#062c35] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-600" /> رفع وتوثيق كشف معتمد (PDF / Excel)
              </h4>
              <button onClick={() => setShowRosterUploadModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleUploadRoster} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">عنوان أو اسم الوثيقة الكاشفة:</label>
                <input type="text" value={rosterTitle} onChange={(e)=>setRosterTitle(e.target.value)} placeholder="مثال: كشف الدرجات النهائي المعتمد..." className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35]"/>
              </div>

              {/* 🏛️ تحديد الكلية والقسم */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">الكلية والقسم العلمي المستهدف:</label>
                <select 
                  value={rosterDeptId} 
                  onChange={(e) => {
                    const newDept = parseInt(e.target.value);
                    setRosterDeptId(newDept);
                    if (rosterLevelId > getMaxLevels(newDept)) {
                      setRosterLevelId(1);
                    }
                  }} 
                  className="w-full p-2.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35]"
                >
                  {universityStructure.map((college) => (
                    <optgroup key={college.name} label={`🏛️ ${college.name}`}>
                      {college.departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>➔ {dept.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 🎓 تحديد المستوى الدراسي */}
                <div>
                  <label className="text-xs text-slate-600 block mb-1">المستوى الدراسي:</label>
                  <select 
                    value={rosterLevelId} 
                    onChange={(e) => setRosterLevelId(parseInt(e.target.value))} 
                    className="w-full p-2.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35]"
                  >
                    {Array.from({ length: getMaxLevels(rosterDeptId) }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl}>{levelNamesMap[lvl]}</option>
                    ))}
                  </select>
                </div>

                {/* 📅 تحديد الفصل / الترم الدراسي */}
                <div>
                  <label className="text-xs text-slate-600 block mb-1">الفصل (الترم) الدراسي:</label>
                  <select 
                    value={rosterSemester} 
                    onChange={(e) => setRosterSemester(parseInt(e.target.value))} 
                    className="w-full p-2.5 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs font-bold text-[#062c35]"
                  >
                    <option value={1}>الترم الأول (1)</option>
                    <option value={2}>الترم الثاني (2)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">تصنيف وثيقة الكشف:</label>
                <select value={rosterType} onChange={(e)=>setRosterType(e.target.value)} className="w-full p-3 rounded-xl bg-[#f4f7f5] border border-[#cde0d5] text-xs text-[#062c35]">
                  <option value="approved_list">كشف طلاب مقيدين معتمد</option>
                  <option value="grade_sheet">كشف درجات واعتمادات نهائي</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">اختيار ملف الكشف (PDF أو Excel / CSV):</label>
                <input 
                  type="file" 
                  accept=".pdf,.xlsx,.xls,.csv" 
                  onChange={(e)=>setRosterFile(e.target.files?.[0] || null)} 
                  className="w-full p-2 bg-[#f4f7f5] border border-[#cde0d5] rounded-xl text-xs text-slate-600 cursor-pointer"
                />
              </div>

              <button type="submit" disabled={isUploadingRoster} className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-md">
                {isUploadingRoster ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
                <span>توثيق ورفع الكشف الجامعي</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}