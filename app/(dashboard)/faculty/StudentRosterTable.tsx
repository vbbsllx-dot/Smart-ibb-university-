"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('StudentRosterTable');
  const tGlobal = useTranslations('RegistrationDetails');

  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'warning' | 'deprived'>('all');
  const [newColumnName, setNewColumnName] = useState('');
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState('');

  // 📋 حالات كشف الحضور والغياب وقفل الكشف
  const [attendanceSessions, setAttendanceSessions] = useState<string[]>([
    t('defaultLecture1'), 
    t('defaultLecture2'), 
    t('defaultLecture3')
  ]);
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
            formatted[cleanStudentId][cleanSession] = row.status || t('statusPresent');
            sessionsSet.add(cleanSession);
          });

          setAttendanceData(formatted);
          setAttendanceSessions(Array.from(sessionsSet));
        }

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
        console.error("Error fetching attendance & lock data:", err);
      }
    };

    fetchAttendanceAndLockStatus();
  }, [selectedResource]);

  // 🔒 دالة تبديل الاعتماد والقفل
  const handleToggleGradeLock = async () => {
    if (!selectedResource || !selectedResource.id) {
      return alert(t('alertSaveFirstLock'));
    }
    const actionText = isGradeLocked ? t('actionUnlockText') : t('actionLockText');
    if (!confirm(t('confirmToggleLock', { action: actionText }))) return;

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
          locked_by: t('instructorDefault')
        }, { onConflict: 'resource_id' });

      if (error) throw error;

      setIsGradeLocked(nextLockState);
      setIsSubmittedToControl(nextSubmittedState);
      
      alert(t('alertToggleLockSuccess', { action: actionText }));
    } catch (err: any) {
      alert(t('alertToggleLockError') + err.message);
    } finally {
      setIsLockingLoading(false);
    }
  };
const CONTROL_WHATSAPP_NUMBER = "967770689832"; 

  const handleSendToControl = async () => {
    if (studentsRoster.length === 0) {
      return alert(t('alertNoStudentsToSend'));
    }

    if (!selectedResource || !selectedResource.id) {
      return alert(t('alertSaveFirstSend'));
    }

    if (!isGradeLocked) {
      return alert(t('alertLockFirstSend'));
    }

    if (!confirm(t('confirmSendControl'))) return;

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

      // 1. استخراج المتغيرات والبيانات الحية للكشف
      const doctorName = instructorInfo?.name || t('instructorDefault');
      const subjectName = manualSubjectName.trim() ? manualSubjectName : "....................";
      const deptName = tGlobal(`departments.${selectedResource?.dep_id || selectedResource?.dept_id}` as any) || departmentNamesMap[Number(selectedResource?.dep_id || selectedResource?.dept_id)] || "القسم العلمي";
      const levelName = tGlobal(`levels.${selectedResource?.level_id}` as any) || levelNamesMap[Number(selectedResource?.level_id)] || "المستوى الدراسي";
      const collegeName = instructorInfo?.college_name || "جامعة إب";
      const currentDate = new Date().toLocaleDateString('ar-YE');

      /// 🎯 2. تحديد الترم الدراسي ديناميكياً
      const rawSemester = selectedResource?.semester ?? selectedResource?.semester_id ?? selectedResource?.term ?? 1;
      const isSecondSem = String(rawSemester) === '2' || String(rawSemester).toLowerCase() === 'second';
      const semesterName = isSecondSem 
        ? (t?.('semester2') || "الترم الثاني") 
        : (t?.('semester1') || "الترم الأول");

      // 3. بناء جدول الإكسل وتضمين الترم في الترويسة
      const XLSX = await import('xlsx');
      const wsData: any[][] = [
        ["🏛️ جمهورية اليمن - جامعة إب - كشف درجات معتمد للكنترول"],
        [`أستاذ المادة: ${doctorName}  |  الكلية والمؤسسة: ${collegeName}`],
        [`المادة الدراسية: ${subjectName}  |  القسم العلمي: ${deptName}`],
        [`المستوى الدراسي: ${levelName}  |  الفصل الدراسي: ${semesterName}  |  تاريخ الاستخراج: ${currentDate}`],
        [], 
        [t('thAcademicId'), t('thFullName'), t('thStatus'), ...customColumns]
      ];

      studentsRoster.forEach((student) => {
        const studentName = student.name || student.student_name || student['اسم الطالب'] || "طالب غير مسمى";
        const studentId = student.student_id || student.id || "---";
        const studentStatus = student.status || t('statusEnrolled');

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
      const exportFileName = `كشف_كنترول_${safeFileName}_${rawSemester == 2 ? 'ترم2' : 'ترم1'}.xlsx`;
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

      // 4. رسالة الواتساب المتضمنة الترم الدراسي
      const whatsappMessage = 
`🏛️ *كشف درجات رسمي معتمد - جامعة إب*
━━━━━━━━━━━━━━━━━━━━
▪ *أستاذ المادة:* ${doctorName}
▪ *المادة الدراسية:* ${subjectName}
▪ *الكلية والقسم:* ${deptName}
▪ *المستوى والترم:* ${levelName} - (${semesterName})
▪ *إجمالي الطلاب:* (${studentsRoster.length}) طالب

📥 *رابط تحميل ملف Excel المنسق:*
${publicUrl}

✅ *تم التوقيع والاعتماد الرقمي للكشف.*`;

      setIsSubmittedToControl(true);

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONTROL_WHATSAPP_NUMBER}&text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      alert(t('alertSendControlSuccess'));

    } catch (err: any) {
      alert(t('alertSendControlError') + err.message);
    } finally {
      setIsControlSending(false);
    }
  };
  const handleRenameColumn = (oldName: string, newName: string) => {
    if (isGradeLocked) return alert(t('alertLockedCantEdit'));
    if (!newName.trim() || oldName === newName) return;
    if (customColumns.includes(newName.trim())) {
      alert(t('alertColExists'));
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
    if (isGradeLocked) return alert(t('alertLockedCantEdit'));
    if (!newColumnName.trim()) return;
    if (customColumns.includes(newColumnName.trim())) return alert(t('alertColExists'));
    setCustomColumns([...customColumns, newColumnName.trim()]);
    setNewColumnName('');
  };

  const handleAddTemplateColumn = (colName: string) => {
    if (isGradeLocked) return alert(t('alertLockedCantEdit'));
    if (customColumns.includes(colName)) return;
    setCustomColumns([...customColumns, colName]);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    if (attendanceSessions.includes(newSessionName.trim())) return alert(t('alertSessionExists'));
    setAttendanceSessions([...attendanceSessions, newSessionName.trim()]);
    setNewSessionName('');
  };

  const handleToggleAttendance = (rawStudentId: string, rawSession: string) => {
    const studentId = String(rawStudentId).trim();
    const session = String(rawSession).trim();

    setAttendanceData((prev) => {
      const currentStatus = prev[studentId]?.[session] || t('statusPresent');
      const nextStatus = currentStatus === t('statusPresent') ? t('statusAbsent') : currentStatus === t('statusAbsent') ? t('statusExcused') : t('statusPresent');
      return {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [session]: nextStatus
        }
      };
    });
  };

  const handleSetAllAttendanceForSession = (session: string, status: string) => {
    const updated: any = { ...attendanceData };
    studentsRoster.forEach((s) => {
      if (!updated[s.student_id]) updated[s.student_id] = {};
      updated[s.student_id][session] = status;
    });
    setAttendanceData(updated);
  };

  const handleSaveAttendanceRecords = async () => {
    if (studentsRoster.length === 0) return alert(t('alertNoAttendanceToSave'));
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

      alert(t('alertAttendanceSaved'));
    } catch (err: any) {
      alert(t('alertAttendanceSaveError') + err.message);
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
      if (attendanceData[studentId]?.[cleanSession] === t('statusAbsent') || attendanceData[studentId]?.[cleanSession] === 'غائب') {
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
    <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl shadow-md overflow-hidden print:border-none print:shadow-none print:bg-white animate-in fade-in duration-300 w-full font-sans">
      
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
            text-align: start !important;
            padding-inline-start: 8px !important;
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
            <span>{t('tabGrades')}</span>
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
            <span>{t('tabAttendance')}</span>
          </button>
        </div>

        {/* 🔒 أزرار شارة الاعتماد وقفل الكشف والإرسال للكنترول */}
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
              <span>{t('sendToControlBtn')}</span>
            </button>

            <span className={`text-[11px] px-3 py-1 rounded-xl font-black border flex items-center gap-1 ${
              isGradeLocked 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isGradeLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isGradeLocked ? t('statusLocked') : t('statusUnlocked')}</span>
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
              <span>{isGradeLocked ? t('btnRequestUnlock') : t('btnFinalLock')}</span>
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
              <p className="text-[10px] font-bold text-slate-400">{t('statSuccessRate')}</p>
              <p className="text-sm font-black text-emerald-400">{classStats.successRate}%</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl"><SlidersHorizontal className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">{t('statAverage')}</p>
              <p className="text-sm font-black text-sky-400">{classStats.average}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl"><Award className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">{t('statHighest')}</p>
              <p className="text-sm font-black text-amber-400">{classStats.highest}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl"><AlertTriangle className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">{t('statLowest')}</p>
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
              <span className="text-[10px] text-slate-400 font-bold block">{t('statTotalStudents')}</span>
              <span className="text-base font-black text-white font-mono">{attendanceOverallStats.total} {t('studentsCountUnit')}</span>
            </div>
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-400 font-bold block">{t('statWarningStudents')}</span>
              <span className="text-base font-black text-amber-400 font-mono">{attendanceOverallStats.warningCount} {t('studentsCountUnit')}</span>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-rose-400 font-bold block">{t('statDeprivedStudents')}</span>
              <span className="text-base font-black text-rose-400 font-mono">{attendanceOverallStats.deprivedCount} {t('studentsCountUnit')}</span>
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
              {activeRosterHeader || (selectedResource ? t('rosterPrefix', {
                dept: tGlobal(`departments.${selectedResource.dep_id}` as any) || departmentNamesMap[Number(selectedResource.dep_id)] || 'قسم الكلية',
                level: tGlobal(`levels.${selectedResource.level_id}` as any) || levelNamesMap[Number(selectedResource.level_id)]
              }) : t('flexibleRoster'))}
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {viewMode === 'attendance' && (
              <select
                value={attendanceFilter}
                onChange={(e: any) => setAttendanceFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-[#062c35]"
              >
                <option value="all">{t('filterAll')}</option>
                <option value="warning">{t('filterWarning')}</option>
                <option value="deprived">{t('filterDeprived')}</option>
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full ps-8 pe-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:border-indigo-500 shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 📋 أزرار القوالب السريعة + حقل إضافة عمود مخصص */}
        {viewMode === 'grades' && studentsRoster.length > 0 && !isGradeLocked && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 select-none">
            <span className="text-[10px] font-black text-slate-500">{t('quickTemplates')}</span>
            <button type="button" onClick={() => handleAddTemplateColumn(t('templateAttendanceCol'))} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">{t('templateAttendance')}</button>
            <button type="button" onClick={() => handleAddTemplateColumn(t('templateMidtermCol'))} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">{t('templateMidterm')}</button>
            <button type="button" onClick={() => handleAddTemplateColumn(t('templateAssignmentsCol'))} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">{t('templateAssignments')}</button>
            <button type="button" onClick={() => handleAddTemplateColumn(t('templateTotalCol'))} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">{t('templateTotal')}</button>
            
            <form onSubmit={handleAddColumn} className="ms-auto flex items-center gap-1">
              <input 
                type="text" 
                placeholder={t('customColumnPlaceholder')} 
                className="p-1.5 border border-slate-200 rounded-lg text-[10px] bg-white focus:outline-none font-semibold shadow-inner"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
              />
              <button type="submit" className="bg-[#0A2540] text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer hover:opacity-95">
                {t('btnAdd')}
              </button>
            </form>
          </div>
        )}

        {/* أزرار إضافة محاضرات جديدة */}
        {viewMode === 'attendance' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 select-none">
            <span className="text-[10px] font-black text-slate-500">{t('addSessionLabel')}</span>
            <form onSubmit={handleAddSession} className="flex items-center gap-1">
              <input 
                type="text" 
                placeholder={t('sessionPlaceholder')} 
                className="p-1.5 border border-slate-200 rounded-lg text-[10px] bg-white focus:outline-none font-semibold shadow-inner"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
              />
              <button type="submit" className="bg-sky-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer hover:opacity-95">
                {t('btnAddSession')}
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
            <Save className="w-4 h-4" /> {isSaving ? t('savingGrades') : isGradeLocked ? t('gradesLockedNotice') : t('saveGradesBtn')}
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onExportToExcel}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> {t('exportExcel')}
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-600" /> {t('printPdf')}
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
            <span>{t('saveAttendanceBtn')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-600" /> {t('printAttendancePdf')}
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
              <span>{t('lockedBannerNotice')}</span>
            </div>
          )}

          <table className="w-full text-start text-xs print:text-slate-900 print:border-collapse print:border">
            <thead className="bg-white/60 text-slate-500 font-bold border-b border-slate-200/60 select-none print:bg-slate-100 print:text-slate-900">
              <tr className="print:border-b-2 print:border-slate-900">
                <th className="px-6 py-4 font-black text-slate-800 print:border print:p-2">{t('thAcademicId')}</th>
                <th className="px-6 py-4 font-black text-slate-800 print:border print:p-2 min-w-[180px]">{t('thStudentName')}</th>
                <th className="px-6 py-4 text-center font-black text-slate-800 print:border print:p-2">{t('thStatus')}</th>
                
                {customColumns.map((col, index) => (
                  <th key={index} className="px-4 py-3 text-center text-sky-700 font-black border-s border-slate-200/60 bg-sky-50/30 relative group print:text-slate-900 print:bg-slate-100 print:border print:p-2">
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
                        {student.status || t('statusEnrolled')}
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
                        <td key={index} className="px-2 py-2 border-s border-slate-200 text-center min-w-[130px] print:border print:p-2">
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
                  <td colSpan={3 + customColumns.length} className="text-center py-8 text-slate-400 font-bold">
                    {t('noMatchingResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>



          {/* 🖨️ 👇 هنا يوضع الكود رقم 5: التوقيع الرقمي والـ QR Code المخصص للطباعة فقط */}
          {viewMode === 'grades' && (
            <div className="hidden print:flex justify-between items-end mt-8 pt-4 border-t-2 border-slate-800 text-xs w-full text-slate-900">
              
              {/* جهة اليمين: توقيع الدكتور المعتمد تحت اسمه */}
              <div className="space-y-1 text-start">
                <p className="font-black">أستاذ المادة المعتمد: {instructorInfo?.name || "د. ...................."}</p>
                <p className="text-[10px] font-mono text-slate-600">المعرف الأكاديمي: {instructorInfo?.id}</p>
                
                {instructorInfo?.signature_url ? (
                  <div className="pt-1">
                    <p className="text-[9px] font-bold text-slate-500">التوقيع الرقمي المعتمد:</p>
                    <img 
                      src={instructorInfo.signature_url} 
                      alt="Doctor Signature" 
                      className="h-12 max-w-[140px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-10 border-b border-dashed border-slate-400 w-36 pt-4 text-[9px] text-slate-400">
                    (التوقيع اليدوي)
                  </div>
                )}
              </div>

              {/* الوسط: ختم النظام وتاريخ الرصد */}
              <div className="text-center space-y-0.5">
                <div className="border border-slate-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-50">
                  وثيقة درجات رسمية معتمدة
                </div>
                <p className="text-[8px] font-mono text-slate-500">
                  تاريخ الاعتماد: {new Date().toLocaleString('ar-YE')}
                </p>
              </div>
{/* جهة اليسار: رمز التحقق الذكي QR Code المباشر */}
<div className="flex flex-col items-center space-y-1">
  <img 
    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
`🏛️ جامعة إب - وثيقة درجات معتمدة
━━━━━━━━━━━━━━━━━━━━
👤 أستاذ المادة: ${instructorInfo?.name || 'د. غير معروف'}
🆔 الرقم الأكاديمي: ${instructorInfo?.id || '---'}
🔒 الاعتماد: موقع وموثق رقمياً
🕒 تاريخ التوثيق: ${new Date().toLocaleDateString('ar-YE')}
━━━━━━━━━━━━━━━━━━━━`
    )}`}
    alt="Verification QR"
    className="w-16 h-16 border border-slate-300 p-1 rounded-lg bg-white shadow-xs"
  />
  <span className="text-[8px] font-mono text-slate-500 font-bold">SCAN TO VERIFY</span>
</div>

            </div>
          )}

        </div>
      )}

      {/* 🔵 2. جدول الحضور والغياب مع الإنذارات والحرمان */}
      {viewMode === 'attendance' && (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-start text-xs print:text-slate-900 print:border-collapse print:border">
            <thead className="bg-[#062c35] text-white font-bold select-none">
              <tr>
                <th className="px-6 py-4 font-black print:border print:p-2">#</th>
                <th className="px-6 py-4 font-black print:border print:p-2">{t('thAcademicId')}</th>
                <th className="px-6 py-4 font-black print:border print:p-2 attendance-name-col">{t('thFullName')}</th>
                <th className="px-4 py-4 text-center font-black print:border print:p-2">{t('thWarningStatus')}</th>
                
                {attendanceSessions.map((session, index) => (
                  <th key={index} className="px-4 py-3 text-center border-s border-slate-700 bg-[#0e3a45] print:text-slate-900 print:bg-slate-100 print:border">
                    <div className="flex flex-col items-center gap-1">
                      <span>{session}</span>
                      <div className="flex items-center gap-1 text-[9px] font-normal print:hidden">
                        <button
                          type="button"
                          onClick={() => handleSetAllAttendanceForSession(session, t('statusPresent'))}
                          className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 rounded transition-colors cursor-pointer"
                        >
                          {t('setAllPresent')}
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
                            <span>{t('badgeDeprived')} ({percentage}%)</span>
                          </span>
                        ) : absenceStatus === 'warning' ? (
                          <span className="px-2.5 py-1 bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-xl font-black text-[10px] flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{t('badgeWarning')} ({percentage}%)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-xl font-bold text-[10px]">
                            {t('badgeRegular')} ({percentage}%)
                          </span>
                        )}
                      </td>

                      {attendanceSessions.map((session, sIdx) => {
                        const studentKey = String(student.student_id || student.academic_id || student.id || '').trim();
                        const sessionKey = String(session).trim();
                        const status = attendanceData[studentKey]?.[sessionKey] || t('statusPresent');

                        return (
                          <td key={sIdx} className="px-1 py-2 text-center border-s border-slate-100 min-w-[45px] w-12">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(studentKey, sessionKey)}
                              className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs print:hidden flex items-center justify-center gap-1 mx-auto ${
                                status === t('statusPresent') || status === 'حاضر'
                                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                                  : status === t('statusAbsent') || status === 'غائب'
                                  ? 'bg-rose-500/15 text-rose-700 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                              }`}
                            >
                              {(status === t('statusPresent') || status === 'حاضر') && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                              {(status === t('statusAbsent') || status === 'غائب') && <UserX className="w-3.5 h-3.5 text-rose-600" />}
                              {(status === t('statusExcused') || status === 'مستأذن') && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              <span className="hidden sm:inline">{status}</span>
                            </button>

                            <span className={`hidden print:block font-black text-sm text-center ${
                              status === t('statusPresent') || status === 'حاضر' ? 'text-emerald-700' : status === t('statusAbsent') || status === 'غائب' ? 'text-rose-700' : 'text-amber-700'
                            }`}>
                              {status === t('statusPresent') || status === 'حاضر' ? '✓' : status === t('statusAbsent') || status === 'غائب' ? '✕' : '•'}
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
                    {t('noAttendanceStudents')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      

      {(!selectedResource && studentsRoster.length === 0) && (
        <div className="text-center py-16 text-slate-400 bg-white/30 font-bold text-xs select-none space-y-2 print:hidden">
          <p>{t('emptyDashboardTitle')}</p>
          <p className="text-[11px] text-slate-400 font-medium">{t('emptyDashboardDesc')}</p>
        </div>
      )}
    </section>
  );
}