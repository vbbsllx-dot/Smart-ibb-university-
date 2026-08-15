"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  SlidersHorizontal, 
  Award, 
  AlertTriangle, 
  Search, 
  Save, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle,
  Pencil,
  Trash2,
  CalendarCheck,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  Lock,
  Unlock,
  AlertOctagon,
  ShieldCheck,
  Send
} from 'lucide-react';

const departmentNamesMap: { [key: string | number]: string } = {
  1: 'هندسة الحاسبات والتحكم', 2: 'الهندسة المدنية', 3: 'الهندسة المعمارية', 4: 'هندسة الاتصالات',
  5: 'الطب البشري', 6: 'المختبرات الطبية', 7: 'التمريض', 8: 'طب وجراحة الفم والأسنان',
  9: 'الشريعة والقانون', 10: 'إدارة الأعمال', 11: 'المحاسبة', 12: 'العلوم المالية والمصرفية'
};

const levelNamesMap: { [key: string | number]: string } = {
  1: 'المستوى الأول', 2: 'المستوى الثاني', 3: 'المستوى الثالث', 4: 'المستوى الرابع', 5: 'المستوى الخامس', 6: 'المستوى السادس', 7: 'المستوى السابع'
};

interface StudentRosterTableProps {
  selectedResource: any;
  studentsRoster: any[];
  activeRosterHeader?: string;
  instructorInfo?: any;
  manualSubjectName?: string;
  viewMode: 'grades' | 'attendance';
  setViewMode: React.Dispatch<React.SetStateAction<'grades' | 'attendance'>>;
  customColumns: string[];
  setCustomColumns: React.Dispatch<React.SetStateAction<string[]>>;
  cellData: any;
  setCellData: React.Dispatch<React.SetStateAction<any>>;
  onCellChange: (studentId: string, colName: string, value: string) => void;
  onSaveAllData: () => void;
  isSaving: boolean;
  onExportToExcel: () => void;
}

export default function StudentRosterTable({
  selectedResource,
  studentsRoster,
  activeRosterHeader,
  instructorInfo,
  manualSubjectName = '',
  viewMode,
  setViewMode,
  customColumns,
  setCustomColumns,
  cellData,
  setCellData,
  onCellChange,
  onSaveAllData,
  isSaving,
  onExportToExcel
}: StudentRosterTableProps) {

  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'warning' | 'deprived'>('all');
  const [newColumnName, setNewColumnName] = useState('');
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState('');

  // 📋 حالات كشف الحضور والغياب وقفل الكشف
  const [attendanceSessions, setAttendanceSessions] = useState<string[]>(['محاضرة 1', 'محاضرة 2', 'محاضرة 3']);
  const [attendanceData, setAttendanceData] = useState<{[studentId: string]: {[session: string]: string}}>({});
  const [newSessionName, setNewSessionName] = useState('');
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // 🔒 حالات الاعتماد والتسليم للكنترول
  const [isGradeLocked, setIsGradeLocked] = useState(false);
  const [isLockingLoading, setIsLockingLoading] = useState(false);
  const [isSubmittedToControl, setIsSubmittedToControl] = useState(false);
  const [isControlSending, setIsControlSending] = useState(false);

  // 📡 جلب الحضور وقفل الكشف تلقائياً فور تحديد المرجع
  useEffect(() => {
    const fetchAttendanceAndLockStatus = async () => {
      if (!selectedResource || !selectedResource.id) {
        return;
      }

      try {
        // 1. جلب سجلات الحضور المربوطة بـ resource_id
        const { data: attData } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('resource_id', selectedResource.id);

        if (attData && attData.length > 0) {
          const formatted: any = {};
          const sessionsSet = new Set<string>(attendanceSessions);

          attData.forEach((row) => {
            const cleanStudentId = String(row.student_id).trim();
            const cleanSession = String(row.session_name).trim();

            if (!formatted[cleanStudentId]) formatted[cleanStudentId] = {};
            formatted[cleanStudentId][cleanSession] = row.status || 'حاضر';
            sessionsSet.add(cleanSession);
          });

          setAttendanceData(formatted);
          setAttendanceSessions(Array.from(sessionsSet));
        }

        // 2. جلب حالة قفل الكشف والاعتماد للكنترول
        const { data: lockData } = await supabase
          .from('grade_locks')
          .select('*')
          .eq('resource_id', selectedResource.id)
          .maybeSingle();

        if (lockData) {
          setIsGradeLocked(lockData.is_locked || false);
          setIsSubmittedToControl(lockData.submitted_to_control || false);
        } else {
          setIsGradeLocked(false);
          setIsSubmittedToControl(false);
        }
      } catch (err) {
        console.error("خطأ جلب البيانات:", err);
      }
    };

    fetchAttendanceAndLockStatus();
  }, [selectedResource]);

  // 🔒 دالة تبديل الاعتماد والقفل
  const handleToggleGradeLock = async () => {
    if (!selectedResource || !selectedResource.id) {
      return alert("⚠️ يرجى حفظ الكشف لأول مرة قبل الاعتماد والإغلاق!");
    }
    const actionText = isGradeLocked ? 'فتح إمكانية التعديل' : 'اعتماد وإغلاق الكشف نهائياً';
    if (!confirm(`هل أنت متأكد من ${actionText}؟`)) return;

    setIsLockingLoading(true);
    try {
      const nextLockState = !isGradeLocked;
      const nextSubmittedState = nextLockState ? isSubmittedToControl : false;

      const { error } = await supabase
        .from('grade_locks')
        .upsert({
          resource_id: selectedResource.id,
          is_locked: nextLockState,
          submitted_to_control: nextSubmittedState,
          locked_at: new Date().toISOString(),
          locked_by: 'أستاذ المادة'
        }, { onConflict: 'resource_id' });

      if (error) throw error;

      setIsGradeLocked(nextLockState);
      setIsSubmittedToControl(nextSubmittedState);
      
      alert(`🎉 تم ${actionText} بنجاح!`);
    } catch (err: any) {
      alert("❌ حدث خطأ أثناء تغيير حالة الكشف: " + err.message);
    } finally {
      setIsLockingLoading(false);
    }
  };

  // 📞 رقم واتساب الكنترول المعتمد
  const CONTROL_WHATSAPP_NUMBER = "967770689832"; 

  const handleSendToControl = async () => {
    if (studentsRoster.length === 0) {
      return alert("⚠️ لا يوجد طلاب في الجدول لإرسالهم!");
    }

    if (!selectedResource || !selectedResource.id) {
      return alert("⚠️ يرجى حفظ الكشف أولاً قبل الإرسال للكنترول!");
    }

    if (!isGradeLocked) {
      return alert("⚠️ يجب اعتماد وإغلاق الكشف أولاً قبل تسليمه للكنترول!");
    }

    const confirmMsg = "🚀 هل أنت متأكد من استخراج ملف Excel المعتمد وإرساله للكنترول؟";
    if (!confirm(confirmMsg)) return;

    setIsControlSending(true);
    try {
      const { error } = await supabase
        .from('grade_locks')
        .upsert({
          resource_id: selectedResource.id,
          is_locked: true,
          submitted_to_control: true,
          control_submitted_at: new Date().toISOString()
        }, { onConflict: 'resource_id' });

      if (error) throw error;

      const doctorName = instructorInfo?.name || "أستاذ المادة";
      const subjectName = manualSubjectName.trim() ? manualSubjectName : "....................";
      const deptName = departmentNamesMap[Number(selectedResource?.dep_id || selectedResource?.dept_id)] || "القسم العلمي";
      const levelName = levelNamesMap[Number(selectedResource?.level_id)] || "المستوى الدراسي";
      const collegeName = instructorInfo?.college_name || "جامعة إب";
      const currentDate = new Date().toLocaleDateString('ar-YE');

      const XLSX = await import('xlsx');
      const wsData: any[][] = [
        ["🏛️ جمهورية اليمن - جامعة إب - كشف درجات معتمد للكنترول"],
        [`أستاذ المادة: ${doctorName}  |  الكلية والمؤسسة: ${collegeName}`],
        [`المادة الدراسية: ${subjectName}  |  القسم العلمي: ${deptName}`],
        [`المستوى الدراسي: ${levelName}  |  تاريخ الاستخراج: ${currentDate}`],
        [], 
        ["الرقم الأكاديمي", "اسم الطالب الرباعي", "الحالة", ...customColumns]
      ];

      studentsRoster.forEach((student) => {
        const studentName = student.name || student.student_name || student['اسم الطالب'] || "طالب غير مسمى";
        const studentId = student.student_id || student.id || "---";
        const studentStatus = student.status || "منتظم";

        const row = [studentId, studentName, studentStatus];
        customColumns.forEach((col) => {
          row.push(cellData[student.student_id]?.[col] || "");
        });
        wsData.push(row);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      worksheet['!dir'] = "rtl";
      worksheet['!views'] = [{ RTL: true }];

      const maxNameLength = studentsRoster.reduce((max, s) => {
        const name = s.name || s.student_name || s['اسم الطالب'] || "";
        return Math.max(max, name.length);
      }, 25);

      worksheet['!cols'] = [
        { wch: 20 },
        { wch: Math.max(40, maxNameLength + 6) },
        { wch: 15 },
        ...customColumns.map(col => ({ wch: Math.max(20, col.length + 5) }))
      ];

      const lastColIndex = 2 + customColumns.length;
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } },
      ];

      const workbook = XLSX.utils.book_new();
      if (!workbook.Workbook) workbook.Workbook = {};
      workbook.Workbook.Views = [{ RTL: true }];

      XLSX.utils.book_append_sheet(workbook, worksheet, "كشف الكنترول");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const safeFileName = manualSubjectName.trim() ? manualSubjectName.replace(/\s+/g, '_') : "كشف_درجات";
      const exportFileName = `كشف_كنترول_${safeFileName}.xlsx`;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", downloadUrl);
      link.setAttribute("download", exportFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const filePath = `control_rosters/roster_${selectedResource?.id || Date.now()}_${Date.now()}.xlsx`;
      await supabase.storage.from('university-files').upload(filePath, blob);
      const { data: { publicUrl } } = supabase.storage.from('university-files').getPublicUrl(filePath);

      const whatsappMessage = 
`====================================
* كشف درجات رسمي معتمد - جامعة إب *
====================================

▪ أستاذ المادة: ${doctorName}
▪ المادة الدراسية: ${subjectName}
▪ الكلية والقسم: ${deptName}
▪ المستوى الدراسي: ${levelName}
▪ إجمالي الطلاب: (${studentsRoster.length}) طالب

[+] رابط تحميل ملف Excel المنسق:
${publicUrl}

✔ تم اعتماد وتسليم الكشف بنجاح.`;

      setIsSubmittedToControl(true);

      const whatsappUrl = `https://wa.me/${CONTROL_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');

      alert("🎉 تم إرسال ملف الكشف بنجاح وفتح محادثة الواتساب!");

    } catch (err: any) {
      alert("❌ فشل عملية الإرسال للكنترول: " + err.message);
    } finally {
      setIsControlSending(false);
    }
  };

  const handleRenameColumn = (oldName: string, newName: string) => {
    if (isGradeLocked) return alert("🔒 الكشف معتمد ومغلق! لا يمكن التعديل.");
    if (!newName.trim() || oldName === newName) return;
    if (customColumns.includes(newName.trim())) {
      alert('⚠️ هذا الاسم موجود بالفعل في الكشف!');
      return;
    }

    setCustomColumns(customColumns.map(c => c === oldName ? newName.trim() : c));

    setCellData((prev: any) => {
      const updated = { ...prev };
      Object.keys(updated).forEach(studentId => {
        if (updated[studentId][oldName] !== undefined) {
          updated[studentId][newName.trim()] = updated[studentId][oldName];
          delete updated[studentId][oldName]; 
        }
      });
      return updated;
    });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGradeLocked) return alert("🔒 الكشف معتمد ومغلق! لا يمكن التعديل.");
    if (!newColumnName.trim()) return;
    if (customColumns.includes(newColumnName.trim())) return alert('هذا العمود موجود مسبقاً!');
    setCustomColumns([...customColumns, newColumnName.trim()]);
    setNewColumnName('');
  };

  const handleAddTemplateColumn = (colName: string) => {
    if (isGradeLocked) return alert("🔒 الكشف معتمد ومغلق! لا يمكن التعديل.");
    if (customColumns.includes(colName)) return;
    setCustomColumns([...customColumns, colName]);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    if (attendanceSessions.includes(newSessionName.trim())) return alert('هذه المحاضرة مضافة مسبقاً!');
    setAttendanceSessions([...attendanceSessions, newSessionName.trim()]);
    setNewSessionName('');
  };

  const handleToggleAttendance = (rawStudentId: string, rawSession: string) => {
    const studentId = String(rawStudentId).trim();
    const session = String(rawSession).trim();

    setAttendanceData((prev) => {
      const currentStatus = prev[studentId]?.[session] || 'حاضر';
      const nextStatus = currentStatus === 'حاضر' ? 'غائب' : currentStatus === 'غائب' ? 'مستأذن' : 'حاضر';
      return {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [session]: nextStatus
        }
      };
    });
  };

  const handleSetAllAttendanceForSession = (session: string, status: 'حاضر' | 'غائب') => {
    const updated: any = { ...attendanceData };
    studentsRoster.forEach((s) => {
      if (!updated[s.student_id]) updated[s.student_id] = {};
      updated[s.student_id][session] = status;
    });
    setAttendanceData(updated);
  };

  const handleSaveAttendanceRecords = async () => {
    if (studentsRoster.length === 0) return alert('⚠️ لا يوجد طلاب بجدول الحضور للرصد!');
    setIsSavingAttendance(true);

    try {
      let targetResourceId = selectedResource?.id;

      if (!targetResourceId) {
        const loggedInInstructor = String(instructorInfo?.id || localStorage.getItem('university_username') || '').trim();

        const { data: existingRes } = await supabase
          .from('resources')
          .select('id')
          .eq('instructor_id', loggedInInstructor)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingRes) {
          targetResourceId = existingRes.id;
        } else {
          const { data: newRes, error: resError } = await supabase
            .from('resources')
            .insert({
              instructor_id: loggedInInstructor,
              title: manualSubjectName.trim() || activeRosterHeader || 'كشف حضور وغياب',
              resource_type: 'saved_grade_roster',
              file_url: 'official_roster'
            })
            .select()
            .single();

          if (resError) throw resError;
          targetResourceId = newRes.id;
        }
      }

      const rowsToUpsert: any[] = [];
      Object.keys(attendanceData).forEach((studentId) => {
        const cleanStudentId = String(studentId).trim();
        Object.keys(attendanceData[studentId]).forEach((sessionName) => {
          const cleanSession = String(sessionName).trim();
          rowsToUpsert.push({
            resource_id: targetResourceId,
            student_id: cleanStudentId,
            session_name: cleanSession,
            status: String(attendanceData[studentId][sessionName]).trim()
          });
        });
      });

      if (rowsToUpsert.length > 0) {
        const { error } = await supabase
          .from('attendance_records')
          .upsert(rowsToUpsert, { onConflict: 'resource_id,student_id,session_name' });

        if (error) throw error;
      }

      alert('🎉 تم حفظ وتثبيت كشف الحضور والغياب بنجاح بداخل قاعدة البيانات!');
    } catch (err: any) {
      alert('❌ فشل حفظ كشف الحضور: ' + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const getStudentAbsenceMetrics = (rawStudentId: string) => {
    const studentId = String(rawStudentId).trim();
    const totalSessions = attendanceSessions.length;
    if (totalSessions === 0) return { absenceCount: 0, percentage: 0, status: 'regular' };

    let absenceCount = 0;
    attendanceSessions.forEach((session) => {
      const cleanSession = String(session).trim();
      if (attendanceData[studentId]?.[cleanSession] === 'غائب') {
        absenceCount++;
      }
    });

    const percentage = Math.round((absenceCount / totalSessions) * 100);
    let status: 'regular' | 'warning' | 'deprived' = 'regular';
    if (percentage >= 25) status = 'deprived';
    else if (percentage >= 15) status = 'warning';

    return { absenceCount, percentage, status };
  };

  const filteredStudents = studentsRoster.filter(student => {
    const matchesSearch = student.name.includes(searchTerm) || student.student_id.includes(searchTerm);
    if (!matchesSearch) return false;

    if (viewMode === 'attendance' && attendanceFilter !== 'all') {
      const { status } = getStudentAbsenceMetrics(student.student_id);
      if (attendanceFilter === 'warning' && status !== 'warning') return false;
      if (attendanceFilter === 'deprived' && status !== 'deprived') return false;
    }

    return true;
  });

  const computeClassStats = () => {
    if (customColumns.length === 0 || filteredStudents.length === 0) return null;
    const targetCol = customColumns[0];
    let totalScore = 0;
    let gradedCount = 0;
    let successCount = 0;
    let highest = 0;
    let lowest = 100;

    filteredStudents.forEach(s => {
      const val = cellData[s.student_id]?.[targetCol];
      if (val && !isNaN(Number(val))) {
        const score = Number(val);
        totalScore += score;
        gradedCount++;
        if (score >= 50) successCount++;
        if (score > highest) highest = score;
        if (score < lowest) lowest = score;
      }
    });

    if (gradedCount === 0) return null;
    return {
      average: (totalScore / gradedCount).toFixed(1),
      successRate: ((successCount / gradedCount) * 100).toFixed(0),
      highest,
      lowest: lowest === 100 ? 0 : lowest,
      targetCol
    };
  };

  const classStats = computeClassStats();

  const attendanceOverallStats = (() => {
    let deprivedCount = 0;
    let warningCount = 0;
    studentsRoster.forEach((s) => {
      const { status } = getStudentAbsenceMetrics(s.student_id);
      if (status === 'deprived') deprivedCount++;
      if (status === 'warning') warningCount++;
    });
    return { deprivedCount, warningCount, total: studentsRoster.length };
  })();

  return (
    <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl shadow-md overflow-hidden print:border-none print:shadow-none print:bg-white animate-in fade-in duration-300 w-full font-sans dir-rtl text-right">
      
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
            font-size: 10px !important;
          }
          th, td {
            border: 1px solid #334155 !important;
            padding: 4px 3px !important;
            text-align: center !important;
            vertical-align: middle !important;
          }
          .attendance-name-col {
            white-space: nowrap !important;
            min-width: 210px !important;
            text-align: right !important;
            padding-right: 8px !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 900 !important;
          }
        }
      `}</style>

      {/* 🔘 شريط التبويب وقفل الاعتماد والتسليم للكنترول */}
      <div className="bg-[#062c35] text-white px-6 py-3.5 flex items-center justify-between flex-wrap gap-3 border-b border-slate-700 select-none print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('grades')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'grades'
                ? 'bg-[#00bc7e] text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>كشف رصد الدرجات</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'attendance'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>كشف الحضور والغياب والإنذارات</span>
          </button>
        </div>

        {/* 🔒 أزرار شارة الاعتماد وقفل الكشف والإرسال للكنترول (تظهر فور جلب أو تعبئة الطلاب) */}
        {(studentsRoster.length > 0 || selectedResource) && viewMode === 'grades' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSendToControl}
              disabled={isControlSending}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-400 shadow-md active:scale-95 disabled:opacity-50"
            >
              {isControlSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>إرسال الكشف إلى الكنترول 📤</span>
            </button>

            <span className={`text-[11px] px-3 py-1 rounded-xl font-black border flex items-center gap-1 ${
              isGradeLocked 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isGradeLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isGradeLocked ? 'الكشف معتمد ومغلق' : 'الكشف مفتوح للتعديل'}</span>
            </span>

            <button
              type="button"
              onClick={handleToggleGradeLock}
              disabled={isLockingLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                isGradeLocked
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                  : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500'
              }`}
            >
              {isLockingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{isGradeLocked ? 'طلب فتح التعديل' : 'اعتماد وإغلاق نهائي'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 📊 لوحة الإحصائيات الفورية للمادة */}
      {viewMode === 'grades' && studentsRoster.length > 0 && classStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-slate-900 to-[#0E3354] text-white border-b border-slate-700 select-none print:hidden">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">نسبة النجاح الفورية</p>
              <p className="text-sm font-black text-emerald-400">{classStats.successRate}%</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl"><SlidersHorizontal className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">المعدل العام للدفعة</p>
              <p className="text-sm font-black text-sky-400">{classStats.average}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl"><Award className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">أعلى درجة مرصودة</p>
              <p className="text-sm font-black text-amber-400">{classStats.highest}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl"><AlertTriangle className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">أدنى درجة مرصودة</p>
              <p className="text-sm font-black text-rose-400">{classStats.lowest}</p>
            </div>
          </div>
        </div>
      )}

      {/* 📊 لوحة إحصائيات الحضور والإنذارات الحية */}
      {viewMode === 'attendance' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#0A2540] text-white border-b border-slate-700 select-none print:hidden">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي طلاب الدفعة</span>
              <span className="text-base font-black text-white font-mono">{attendanceOverallStats.total} طالب</span>
            </div>
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-400 font-bold block">المنذرون بالغياب (15% وأكثر)</span>
              <span className="text-base font-black text-amber-400 font-mono">{attendanceOverallStats.warningCount} طالب</span>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-rose-400 font-bold block">المحرومون رسمياً (25% وأكثر)</span>
              <span className="text-base font-black text-rose-400 font-mono">{attendanceOverallStats.deprivedCount} طالب</span>
            </div>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      )}

      {/* ترويسة الجدول مع محرك البحث والفلترة */}
      <div className="bg-white/80 border-b border-slate-200/60 px-6 py-4 flex flex-col gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-sky-600" />
            <h3 className="text-xs font-black text-slate-900">
              {activeRosterHeader || (selectedResource ? `كشف طلاب: [ ${departmentNamesMap[Number(selectedResource.dep_id)] || departmentNamesMap[selectedResource.dep_id] || 'قسم الكلية'} - ${levelNamesMap[Number(selectedResource.level_id)] || levelNamesMap[selectedResource.level_id]} ]` : "كشف الطلاب المرن")}
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {viewMode === 'attendance' && (
              <select
                value={attendanceFilter}
                onChange={(e: any) => setAttendanceFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-[#062c35]"
              >
                <option value="all">🌐 جميع الطلاب</option>
                <option value="warning">⚠️ المنذرون بالغياب (15% وأكثر)</option>
                <option value="deprived">🚫 المحرومون رسمياً (25% وأكثر)</option>
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="ابحث بالاسم أو الرقم الأكاديمي..."
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:border-indigo-500 shadow-inner text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 📋 أزرار القوالب السريعة + حقل إضافة عمود مخصص (تظهر دائماً فور تعبئة الكشف) */}
        {viewMode === 'grades' && studentsRoster.length > 0 && !isGradeLocked && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 select-none">
            <span className="text-[10px] font-black text-slate-500">📋 قوالب رصد سريعة:</span>
            <button type="button" onClick={() => handleAddTemplateColumn("الحضور والغياب (10 درجات)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ الحضور</button>
            <button type="button" onClick={() => handleAddTemplateColumn("الامتحان النصفي (20 درجة)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ الامتحان النصفي</button>
            <button type="button" onClick={() => handleAddTemplateColumn("الواجبات والتقارير (10 درجات)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ الواجبات</button>
            <button type="button" onClick={() => handleAddTemplateColumn("المجموع الإجمالي (100 درجة)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ المجموع النهائي</button>
            
            <form onSubmit={handleAddColumn} className="mr-auto flex items-center gap-1">
              <input 
                type="text" 
                placeholder="عمود مخصص جديد..." 
                className="p-1.5 border border-slate-200 rounded-lg text-[10px] bg-white focus:outline-none font-semibold shadow-inner text-right"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
              />
              <button type="submit" className="bg-[#0A2540] text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer hover:opacity-95">
                + إضافة
              </button>
            </form>
          </div>
        )}

        {/* أزرار إضافة محاضرات جديدة */}
        {viewMode === 'attendance' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 select-none">
            <span className="text-[10px] font-black text-slate-500">📅 إضافة لقاء/محاضرة:</span>
            <form onSubmit={handleAddSession} className="flex items-center gap-1">
              <input 
                type="text" 
                placeholder="اسم المحاضرة (مثلاً: محاضرة 4)..." 
                className="p-1.5 border border-slate-200 rounded-lg text-[10px] bg-white focus:outline-none font-semibold shadow-inner text-right"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
              />
              <button type="submit" className="bg-sky-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer hover:opacity-95">
                + إضافة محاضرة
              </button>
            </form>
          </div>
        )}
      </div>

      {/* شريط الإجراءات والملفات لكشف الدرجات */}
      {viewMode === 'grades' && studentsRoster.length > 0 && (
        <div className="bg-slate-50/80 border-b p-3 flex flex-wrap justify-between items-center gap-2 print:hidden select-none">
          <button 
            onClick={onSaveAllData} disabled={isSaving || isGradeLocked}
            className={`text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
              isGradeLocked ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Save className="w-4 h-4" /> {isSaving ? 'جاري المزامنة والحفظ...' : isGradeLocked ? 'الكشف معتمد (مغلق)' : 'حفظ الدرجات بقاعدة البيانات'}
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onExportToExcel}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> تصدير Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-600" /> طباعة كـ PDF
            </button>
          </div>
        </div>
      )}

      {/* شريط الإجراءات لكشف الحضور والغياب */}
      {viewMode === 'attendance' && (
        <div className="bg-slate-50/80 border-b p-3 flex flex-wrap justify-between items-center gap-2 print:hidden select-none">
          <button 
            onClick={handleSaveAttendanceRecords} disabled={isSavingAttendance}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isSavingAttendance ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
            <span>حفظ كشف الحضور والغياب</span>
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-600" /> طباعة كشف الحضور والإنذارات
            </button>
          </div>
        </div>
      )}

      {/* 🟢 1. جدول رصد الدرجات */}
      {viewMode === 'grades' && studentsRoster.length > 0 && (
        <div className="overflow-x-auto print:overflow-visible relative">
          
          {isGradeLocked && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 p-2 text-center text-xs font-black text-amber-800 flex items-center justify-center gap-2 print:hidden">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>هذا الكشف معتمد ومغلق نهائياً. تم تجميد الخانات لمنع أي تعديل غير مصرح به.</span>
            </div>
          )}

          <table className="w-full text-right text-xs print:text-slate-900 print:border-collapse print:border">
            <thead className="bg-white/60 text-slate-500 font-bold border-b border-slate-200/60 select-none print:bg-slate-100 print:text-slate-900">
              <tr className="print:border-b-2 print:border-slate-900">
                <th className="px-6 py-4 font-black text-slate-800 print:border print:p-2">الرقم الأكاديمي</th>
                <th className="px-6 py-4 font-black text-slate-800 print:border print:p-2 min-w-[180px]">الأسماء</th>
                <th className="px-6 py-4 text-center font-black text-slate-800 print:border print:p-2">الحالة</th>
                
                {customColumns.map((col, index) => (
                  <th key={index} className="px-4 py-3 text-center text-sky-700 font-black border-r border-slate-200/60 bg-sky-50/30 relative group print:text-slate-900 print:bg-slate-100 print:border print:p-2">
                    {editingCol === col ? (
                      <div className="flex items-center gap-1 justify-center print:hidden">
                        <input 
                          type="text"
                          value={tempColName}
                          onChange={(e) => setTempColName(e.target.value)}
                          className="p-1 text-[10px] border border-sky-400 rounded-md bg-white text-slate-800 focus:outline-none font-bold w-28 text-center shadow-inner"
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            handleRenameColumn(col, tempColName);
                            setEditingCol(null);
                          }}
                          className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-black transition-colors"
                        >
                          ✓
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingCol(null)}
                          className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-black transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="drop-shadow-sm">{col}</span>
                        {!isGradeLocked && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden">
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingCol(col);
                                setTempColName(col);
                              }}
                              className="p-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-700 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setCustomColumns(customColumns.filter(c => c !== col))}
                              className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 font-medium bg-white/20 print:bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <tr key={idx} className="hover:bg-white/60 transition-colors print:hover:bg-white print:border-b">
                    <td className="px-6 py-4 font-mono font-black text-slate-600 print:border print:p-2 print:text-slate-900">{student.student_id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 print:border print:p-2">{student.name}</td>
                    <td className="px-6 py-4 text-center print:border print:p-2">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 print:bg-white print:text-slate-900 print:border-none">
                        {student.status || 'منتظم'}
                      </span>
                    </td>

                    {customColumns.map((col, index) => {
                      const studentKey = String(student.student_id || student.academic_id || student.id || '').trim();
                      const colKey = String(col).trim();
                      const cellValue = cellData[studentKey]?.[colKey] || '';
                      
                      let heatmapClass = "bg-white text-slate-800 focus:border-sky-400";
                      if (cellValue !== '' && !isNaN(Number(cellValue))) {
                        const score = Number(cellValue);
                        if (score < 50 && score > 0) {
                          heatmapClass = "bg-rose-50/80 text-rose-700 border-rose-200 focus:border-rose-400 font-bold";
                        } else if (score >= 85) {
                          heatmapClass = "bg-emerald-50/80 text-emerald-700 border-emerald-200 focus:border-emerald-400 font-bold";
                        }
                      }

                      return (
                        <td key={index} className="px-2 py-2 border-r border-slate-200 text-center min-w-[130px] print:border print:p-2">
                          <input 
                            type="text" 
                            disabled={isGradeLocked}
                            placeholder="..."
                            className={`w-full p-1.5 border border-slate-200 rounded-lg text-center shadow-inner focus:outline-none transition-all text-[11px] print:hidden ${
                              isGradeLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-bold' : heatmapClass
                            }`}
                            value={cellValue}
                            onChange={(e) => onCellChange(studentKey, colKey, e.target.value)}
                          />
                          <span className="hidden print:block font-black text-center">{cellValue || "---"}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3 + customColumns.length} className="text-center py-8 text-slate-400 font-bold">📭 لا يوجد نتائج مطابقة للبحث الحالي.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔵 2. جدول الحضور والغياب مع الإنذارات والحرمان */}
      {viewMode === 'attendance' && (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right text-xs print:text-slate-900 print:border-collapse print:border">
            <thead className="bg-[#062c35] text-white font-bold select-none">
              <tr>
                <th className="px-6 py-4 font-black print:border print:p-2">#</th>
                <th className="px-6 py-4 font-black print:border print:p-2">الرقم الأكاديمي</th>
                <th className="px-6 py-4 font-black print:border print:p-2 attendance-name-col">اسم الطالب الرباعي</th>
                <th className="px-4 py-4 text-center font-black print:border print:p-2">حالة الإنذار</th>
                
                {attendanceSessions.map((session, index) => (
                  <th key={index} className="px-4 py-3 text-center border-r border-slate-700 bg-[#0e3a45] print:text-slate-900 print:bg-slate-100 print:border">
                    <div className="flex flex-col items-center gap-1">
                      <span>{session}</span>
                      <div className="flex items-center gap-1 text-[9px] font-normal print:hidden">
                        <button
                          type="button"
                          onClick={() => handleSetAllAttendanceForSession(session, 'حاضر')}
                          className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 rounded transition-colors cursor-pointer"
                        >
                          الكل حاضر
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const { percentage, status: absenceStatus } = getStudentAbsenceMetrics(student.student_id);

                  return (
                    <tr key={student.student_id || idx} className="hover:bg-slate-50 transition-colors print:border-b">
                      <td className="px-6 py-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-3 font-mono font-black text-[#059669]">{student.student_id}</td>
                      <td className="px-6 py-3 font-black text-slate-800 attendance-name-col">{student.name}</td>
                      <td className="px-4 py-3 text-center print:border print:p-2">
                        {absenceStatus === 'deprived' ? (
                          <span className="px-2.5 py-1 bg-rose-500/15 text-rose-700 border border-rose-500/30 rounded-xl font-black text-[10px] flex items-center justify-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                            <span>محروم ({percentage}%)</span>
                          </span>
                        ) : absenceStatus === 'warning' ? (
                          <span className="px-2.5 py-1 bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-xl font-black text-[10px] flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>إنذار ({percentage}%)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-xl font-bold text-[10px]">
                            منتظم ({percentage}%)
                          </span>
                        )}
                      </td>

                      {attendanceSessions.map((session, sIdx) => {
                        const studentKey = String(student.student_id || student.academic_id || student.id || '').trim();
                        const sessionKey = String(session).trim();
                        const status = attendanceData[studentKey]?.[sessionKey] || 'حاضر';

                        return (
                          <td key={sIdx} className="px-1 py-2 text-center border-r border-slate-100 min-w-[45px] w-12">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(studentKey, sessionKey)}
                              className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs print:hidden flex items-center justify-center gap-1 mx-auto ${
                                status === 'حاضر'
                                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                                  : status === 'غائب'
                                  ? 'bg-rose-500/15 text-rose-700 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                              }`}
                            >
                              {status === 'حاضر' && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                              {status === 'غائب' && <UserX className="w-3.5 h-3.5 text-rose-600" />}
                              {status === 'مستأذن' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              <span className="hidden sm:inline">{status}</span>
                            </button>

                            <span className={`hidden print:block font-black text-sm text-center ${
                              status === 'حاضر' ? 'text-emerald-700' : status === 'غائب' ? 'text-rose-700' : 'text-amber-700'
                            }`}>
                              {status === 'حاضر' ? '✓' : status === 'غائب' ? '✕' : '•'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4 + attendanceSessions.length} className="text-center py-10 text-slate-400 font-bold">
                    لا يوجد طلاب مسجلون بجدول الحضور.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(!selectedResource && studentsRoster.length === 0) && (
        <div className="text-center py-16 text-slate-400 bg-white/30 font-bold text-xs select-none space-y-2 print:hidden">
          <p>📥 شاشة المراقبة مغلقة حالياً.</p>
          <p className="text-[11px] text-slate-400 font-medium">الرجاء اختيار أو تحديد مادة واحدة أو استدعاء كشف طلاب لتفعيل الرصد الفوري.</p>
        </div>
      )}
    </section>
  );
}