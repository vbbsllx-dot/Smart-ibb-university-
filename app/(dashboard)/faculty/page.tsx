"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import SignatureModal from './SignatureModal';
import { PenTool } from 'lucide-react';
import { 
  Clock, 
  LogOut, 
  Plus, 
  User,
  X,
  Camera,
  PlayCircle,
  BookOpen,
  ExternalLink,
  GraduationCap,
  FileCheck2,
  Search,
  DownloadCloud,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  Calendar,
  ClipboardList,
  Send,
  Building2,
  Check,
  FolderGit2
} from 'lucide-react';

import ResourceCarousel from './ResourceCarousel';
import StudentRosterTable from './StudentRosterTable';
import ProjectsManager from '@/app/components/admin/ProjectsManager';
import ThesesManager from '@/app/components/admin/ThesesManager';

const departmentNamesMap: { [key: number]: string } = {
  1: 'هندسة الحاسبات والتحكم', 2: 'الهندسة المدنية', 3: 'الهندسة المعمارية', 4: 'هندسة الاتصالات',
  5: 'الطب البشري', 6: 'المختبرات الطبية', 7: 'التمريض', 8: 'طب وجراحة الفم والأسنان',
  9: 'الشريعة والقانون', 10: 'إدارة الأعمال', 11: 'المحاسبة', 12: 'العلوم المالية والمصرفية'
};

const levelNamesMap: { [key: number]: string } = {
  1: 'المستوى الأول', 2: 'المستوى الثاني', 3: 'المستوى الثالث', 4: 'المستوى الرابع', 5: 'المستوى الخامس', 6: 'المستوى السادس', 7: 'المستوى السابع'
};

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

const getMaxLevels = (depId: number): number => {
  if ([1, 2, 3, 4, 8].includes(depId)) return 5;
  if (depId === 5) return 7;
  return 4;
};

export default function AdvancedFacultyDashboard() {
  const t = useTranslations('FacultyDashboard');
  const tGlobal = useTranslations('RegistrationDetails');
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  
  const [instructorInfo, setInstructorInfo] = useState<any>({ 
    id: "", 
    name: t('fetchingName'), 
    college_name: t('ibbUniversity'), 
    avatar_url: null 
  });
  const [myResources, setMyResources] = useState<any[]>([]);
  
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [studentsRoster, setStudentsRoster] = useState<any[]>([]);

  // 📌 حالات التحكم بالجدول والطباعة
  const [activeRosterHeader, setActiveRosterHeader] = useState<string>('');
  const [manualSubjectName, setManualSubjectName] = useState<string>('');
  const [activeSemester, setActiveSemester] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grades' | 'attendance'>('grades');

  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [cellData, setCellData] = useState<{[studentId: string]: {[colName: string]: string}}>({});

  // 📦 حالات أداة استدعاء كشوفات المقيدين
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [searchDeptId, setSearchDeptId] = useState<number>(1);
  const [searchLevelId, setSearchLevelId] = useState<number>(1);
  const [searchSemester, setSearchSemester] = useState<number>(1);
  const [fetchedRosters, setFetchedRosters] = useState<any[]>([]);
  const [isSearchingRosters, setIsSearchingRosters] = useState(false);

  // 📝 حالات لوحة التكاليف والواجبات
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignScore, setNewAssignScore] = useState(10);

  // حالات التحكم بالنوافذ الجديدة
const [showProjectsModal, setShowProjectsModal] = useState(false);
const [showThesesModal, setShowThesesModal] = useState(false);
const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

// حالات استلام الواجبات
const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState<any>(null);
const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);

// حالات إضافة واجب متقدم
const [newAssignDeptId, setNewAssignDeptId] = useState<number>(1);
const [newAssignLevelId, setNewAssignLevelId] = useState<number>(1);
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
};
const [newAssignDueDate, setNewAssignDueDate] = useState(getCurrentDateTimeLocal());
const [newAssignDescription, setNewAssignDescription] = useState('');

  // 🎬 حالات شاشة العرض السينمائية
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

      const { data: instData } = await supabase
        .from('instructors')
        .select('*')
        .eq('id', loggedInInstructor)
        .single();

      if (instData) setInstructorInfo(instData);
      else setInstructorInfo({ id: loggedInInstructor, name: `دكتور رقم (${loggedInInstructor})`, college_name: t('ibbUniversity'), avatar_url: null });

      const { data: resourcesData } = await supabase
        .from('resources')
        .select('*')
        .eq('instructor_id', loggedInInstructor)
        .neq('file_url', 'official_roster')
        .order('created_at', { ascending: false });

      if (resourcesData) {
        setMyResources(resourcesData);
      }

      const { data: assignData } = await supabase
        .from('assignments')
        .select('*')
        .eq('instructor_id', loggedInInstructor);

      setAssignmentsList(assignData || []);

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
    
    // مسار الرفع الخاص بك
    const filePath = `doctor's images/${instructorInfo.id}_${timestamp}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('university-files')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('university-files')
      .getPublicUrl(filePath);
      
    // المعالجة الآمنة للمعرف الخاصة بك
    const cleanInstructorId = !isNaN(Number(instructorInfo.id)) ? Number(instructorInfo.id) : instructorInfo.id;
    
    const { data: updateData, error: dbError } = await supabase
      .from('instructors')
      .update({ avatar_url: publicUrl, image_url: publicUrl })
      .eq('id', cleanInstructorId)
      .select(); 
      
    if (dbError) throw dbError;
    
 if (!updateData || updateData.length === 0) {
  throw new Error(t('doctorRecordNotFound'));
}
    
    setInstructorInfo((prev: any) => ({ ...prev, avatar_url: publicUrl, image_url: publicUrl }));
    alert(t('alertPhotoUpdated'));
  } catch (err: any) {
    alert(t('alertPhotoFailed') + " " + err.message);
  } finally {
    setIsUpdatingAvatar(false);
  }
};
  const handleSelectResource = async (resource: any) => {
    setSelectedResource(resource);
    if (studentsRoster.length > 0) return;
    setCustomColumns(resource.custom_columns || []);
    
    try {
      const targetDepartmentName = departmentNamesMap[resource.dep_id || resource.dept_id];
      const targetLevelBaseName = levelNamesMap[resource.level_id];

      if (targetDepartmentName && targetLevelBaseName) {
        const { data: currentStudents } = await supabase
          .from('students')
          .select('*')
          .eq('department', targetDepartmentName)
          .ilike('level', `${targetLevelBaseName}%`);

        if (currentStudents) {
          const parsed = currentStudents.map((s: any) => ({
            ...s,
            student_id: String(s.student_id || s.academic_id || s.id || '').trim(),
            name: String(s.name || s.student_name || 'طالب غير معروف').trim(),
            status: s.status || 'منتظم'
          }));
          setStudentsRoster(parsed);

          const { data: savedGrades } = await supabase
            .from('resource_grades')
            .select('*')
            .eq('resource_id', resource.id);

          if (savedGrades && savedGrades.length > 0) {
            const formattedCells: any = {};
            const extractedCols = new Set<string>(resource.custom_columns || []);

            savedGrades.forEach((row: any) => {
              const studentKey = String(row.student_id).trim();
              const colKey = String(row.column_name).trim();

              if (!formattedCells[studentKey]) formattedCells[studentKey] = {};
              formattedCells[studentKey][colKey] = String(row.grade_value || "").trim();
              
              if (colKey) extractedCols.add(colKey);
            });

            setCustomColumns(Array.from(extractedCols));
            setCellData(formattedCells);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSignatureBlob = async (blob: Blob) => {
  try {
    const timestamp = Date.now();
    const filePath = `signatures/${instructorInfo.id}_${timestamp}.png`;

    const { error: uploadError } = await supabase.storage
      .from('university-files')
      .upload(filePath, blob, { contentType: 'image/png', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('university-files')
      .getPublicUrl(filePath);

    await supabase
      .from('instructors')
      .update({ signature_url: publicUrl })
      .eq('id', instructorInfo.id);

    setInstructorInfo((prev: any) => ({ ...prev, signature_url: publicUrl }));
    alert(t('alertSignatureSaved'));
  } catch (err: any) {
    alert('❌ فشل حفظ التوقيع: ' + err.message);
  }
};

  const handleFetchApprovedRosters = async () => {
    setIsSearchingRosters(true);
    try {
      let { data, error } = await supabase
        .from('official_rosters')
        .select('*')
        .eq('dep_id', searchDeptId)
        .eq('level_id', searchLevelId)
        .eq('semester', searchSemester)
        .eq('roster_type', 'approved_list')
        .order('created_at', { ascending: false });

      if (error && error.message.includes('semester')) {
        const fallback = await supabase
          .from('official_rosters')
          .select('*')
          .eq('dep_id', searchDeptId)
          .eq('level_id', searchLevelId)
          .eq('roster_type', 'approved_list')
          .order('created_at', { ascending: false });
        
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;

      if (!data || data.length === 0) {
        alert(t('alertNoRostersFound'));
        setFetchedRosters([]);
      } else {
        setFetchedRosters(data);
      }
    } catch (err: any) {
      alert(t('alertRosterFetchError') + err.message);
    } finally {
      setIsSearchingRosters(false);
    }
  };

  const handleApplyRosterToTable = async (ros: any) => {
    try {
      const isExcel = ros.file_url?.match(/\.(xlsx|xls|csv)$/i);
      let parsedStudents: any[] = [];

      if (isExcel) {
        const response = await fetch(ros.file_url);
        const arrayBuffer = await response.arrayBuffer();
        
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) return alert(t('alertExcelEmpty'));

        parsedStudents = jsonData.map((row: any) => ({
          student_id: String(row['رقم القيد'] || row['الرقم الأكاديمي'] || row['ID'] || '').trim(),
          name: String(row['اسم الطالب'] || row['الاسم'] || 'طالب غير معروف').trim(),
          department: departmentNamesMap[searchDeptId],
          level: levelNamesMap[searchLevelId],
          status: 'منتظم'
        })).filter(s => s.student_id && s.name);
      } else {
        const targetDeptName = departmentNamesMap[searchDeptId];
        const targetLevelName = levelNamesMap[searchLevelId];

        const { data: currentStudents } = await supabase
          .from('students')
          .select('*')
          .eq('department', targetDeptName)
          .ilike('level', `${targetLevelName}%`);

        if (currentStudents && currentStudents.length > 0) {
          parsedStudents = currentStudents.map((s: any) => ({
            ...s,
            student_id: String(s.student_id || s.academic_id || s.id || '').trim(),
            name: String(s.name || s.student_name || 'طالب غير معروف').trim(),
            status: s.status || 'منتظم'
          }));
        }
      }

      if (parsedStudents.length === 0) {
        return alert(t('alertNoStudents'));
      }

      setStudentsRoster(parsedStudents);
      setActiveSemester(ros.semester || searchSemester || 1);

      const fullRosterTitle = `كشف معتمد: [ ${departmentNamesMap[searchDeptId]} - ${levelNamesMap[searchLevelId]} ]${ros.title ? ` - (${ros.title})` : ''}`;
      setActiveRosterHeader(fullRosterTitle);

      const loggedInInstructor = String(instructorInfo.id || localStorage.getItem('university_username') || '').trim();

      const { data: existingRes } = await supabase
        .from('resources')
        .select('*')
        .eq('instructor_id', loggedInInstructor)
        .eq('dep_id', searchDeptId)
        .eq('level_id', searchLevelId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRes) {
        setSelectedResource(existingRes);

        const { data: savedGrades } = await supabase
          .from('resource_grades')
          .select('*')
          .eq('resource_id', existingRes.id);

        if (savedGrades && savedGrades.length > 0) {
          const formattedCells: any = {};
          const extractedCols = new Set<string>(existingRes.custom_columns || []);

          savedGrades.forEach((row: any) => {
            const studentKey = String(row.student_id).trim();
            const colKey = String(row.column_name).trim();

            if (!formattedCells[studentKey]) formattedCells[studentKey] = {};
            formattedCells[studentKey][colKey] = String(row.grade_value || "").trim();

            if (colKey) extractedCols.add(colKey);
          });

          setCustomColumns(Array.from(extractedCols));
          setCellData(formattedCells);
        } else {
          setCustomColumns(existingRes.custom_columns || []);
          setCellData({});
        }
      } else {
        const { data: newRes } = await supabase
          .from('resources')
          .insert({
            instructor_id: loggedInInstructor,
            dep_id: searchDeptId || 1,
            level_id: searchLevelId || 1,
            title: fullRosterTitle,
            resource_type: 'accredited_book',
            file_url: 'official_roster'
          })
          .select()
          .single();

        if (newRes) setSelectedResource(newRes);
        setCustomColumns([]);
        setCellData({});
      }

      setShowRosterModal(false);
      alert(t('alertRosterSuccess', { count: parsedStudents.length }));

    } catch (err: any) {
      alert(t('alertRosterApplyFailed') + err.message);
    }
  };

const handleCreateAssignment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newAssignTitle) return alert(t('alertEnterAssignTitle'));
 if (!newAssignDueDate) return alert(t('alertEnterDueDate'));

  try {
    const { error } = await supabase
      .from('assignments')
      .insert({
        instructor_id: instructorInfo.id,
        dept_id: newAssignDeptId,
        level_id: newAssignLevelId,
        title: newAssignTitle,
        description: newAssignDescription,
        max_score: newAssignScore,
        due_date: newAssignDueDate
      });

    if (error) throw error;
    
    alert(t('alertAssignSuccess'));
    setNewAssignTitle('');
    setNewAssignDescription('');
    setNewAssignDueDate('');
    fetchInstructorDataAndResources();
  } catch (err: any) {
    alert(t('alertAssignFailed') + " " + err.message);
  }
};

  const handleSaveAllData = async () => {
    if (studentsRoster.length === 0) {
      return alert(t('alertNoStudentsInTable'));
    }

    setIsSaving(true);
    try {
      const loggedInInstructor = String(instructorInfo.id || localStorage.getItem('university_username') || '').trim();

      if (!loggedInInstructor) {
        setIsSaving(false);
        return alert(t('alertDoctorNotRecognized'));
      }

      let currentResourceId = selectedResource?.id;

      if (!currentResourceId) {
        const { data: existingRes } = await supabase
          .from('resources')
          .select('id')
          .eq('instructor_id', loggedInInstructor)
          .eq('dep_id', searchDeptId)
          .eq('level_id', searchLevelId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingRes) {
          currentResourceId = existingRes.id;
        } else {
          const subjectTitle = manualSubjectName.trim() ? manualSubjectName : (activeRosterHeader || "كشف درجات معتمد");
          
          const { data: newRes, error: resError } = await supabase
            .from('resources')
            .insert({
              instructor_id: loggedInInstructor,
              dep_id: searchDeptId || 1,
              level_id: searchLevelId || 1,
              title: subjectTitle,
              resource_type: 'accredited_book',
              custom_columns: customColumns,
              file_url: 'official_roster'
            })
            .select()
            .single();

          if (resError) throw resError;
          currentResourceId = newRes.id;
          setSelectedResource(newRes);
        }
      }

      if (currentResourceId) {
        await supabase
          .from('resources')
          .update({ 
            custom_columns: customColumns,
            title: manualSubjectName.trim() ? manualSubjectName : (activeRosterHeader || selectedResource?.title || "كشف درجات")
          })
          .eq('id', currentResourceId);
      }

      const rowsToUpsert: any[] = [];
      Object.keys(cellData).forEach((studentId) => {
        const cleanStudentId = String(studentId).trim();
        Object.keys(cellData[studentId]).forEach((colName) => {
          const cleanColName = String(colName).trim();
          const val = cellData[studentId][colName];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            rowsToUpsert.push({
              resource_id: currentResourceId,
              student_id: cleanStudentId,
              column_name: cleanColName,
              grade_value: String(val).trim()
            });
          }
        });
      });

      if (rowsToUpsert.length > 0) {
        const { error: gradeError } = await supabase
          .from('resource_grades')
          .upsert(rowsToUpsert, { onConflict: 'resource_id,student_id,column_name' });

        if (gradeError) throw gradeError;
      }

      await fetchInstructorDataAndResources();
      alert(t('alertGradesSaved', { count: rowsToUpsert.length }));
    } catch (err: any) {
      alert(t('alertSaveFailed') + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResource = async (resourceId: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm(t('confirmDeleteResource'))) return;

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (!error) {
        alert(t('alertResourceDeleted'));
        if (selectedResource?.id === resourceId) setSelectedResource(null);
        fetchInstructorDataAndResources(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportToExcel = () => {
    if (studentsRoster.length === 0) return;

    let csvContent = "\uFEFF"; 
    csvContent += `جمهورية اليمن,, جامعة إب,, كشف رسمي\n`;
    csvContent += `اسم الأستاذ:, ${instructorInfo.name},, الكلية:, ${instructorInfo.college_name}\n`;
    csvContent += `الكشف:, ${activeRosterHeader || selectedResource?.title || "كشف طلاب"},, تاريخ الاستخراج:, ${new Date().toLocaleDateString('ar-YE')}\n\n`;
    csvContent += `المادة:, ${manualSubjectName.trim() ? manualSubjectName : "...................."},, تاريخ الاستخراج:, ${new Date().toLocaleDateString('ar-YE')}\n\n`;

    const headers = ["الرقم الأكاديمي", "اسم الطالب", "الحالة", ...customColumns];
    csvContent += headers.join(",") + "\n";

    studentsRoster.forEach((student) => {
      const row = [
        student.student_id,
        student.name,
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
    link.setAttribute("download", `كشف_الطلاب.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCellChange = (studentId: string, colName: string, value: string) => {
    const cleanStudentId = String(studentId).trim();
    const cleanColName = String(colName).trim();
    setCellData(prev => ({
      ...prev,
      [cleanStudentId]: { ...(prev[cleanStudentId] || {}), [cleanColName]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden print:bg-white print:p-0">
      
      {/* طبقات الإضاءة */}
      <div className="absolute inset-0 z-0 pointer-events-none print:hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-400/10 blur-[140px] top-[-10%] start-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-[130px] bottom-[-10%] end-[-10%]" />
      </div>

      {/* الشريط العلوي */}
      <header className="w-full bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#12422C] text-white px-6 py-4.5 flex justify-between items-center relative z-40 rounded-b-2xl shadow-xl select-none print:hidden">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <div>
            <h1 className="text-base font-black text-slate-50">{t('title')}</h1>
            <p className="text-[10px] text-sky-300 font-mono tracking-widest uppercase">Instructor Control Panel // IBB UNI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="font-mono text-xs border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-sky-300 font-extrabold hidden sm:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {time || "00:00:00"}
          </div>
          <Link href="/login" className="text-xs font-bold bg-white/10 border border-white/10 px-4 py-2 rounded-xl hover:bg-rose-600/20 transition-all flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> {t('logout')}
          </Link>
        </div>
      </header>

      {/* ترويسة الطباعة الرسمية */}
      <div className="hidden print:flex flex-col items-center text-center border-b-2 border-slate-900 pb-4 mb-6 w-full text-slate-900 select-none">
        <div className="w-full flex justify-between items-center text-xs font-bold px-4">
          <div className="text-start space-y-1">
            <p>{t('ibbUniversity')}</p>
            <p>{instructorInfo.college_name}</p>
            <p className="text-emerald-800 font-black">
              {activeRosterHeader || (selectedResource ? `قسم: ${departmentNamesMap[selectedResource.dep_id || selectedResource.dept_id]}` : "---")}
            </p>
            <p className="font-black text-slate-800">
              {t('semesterLabel')} {activeSemester === 2 ? t('semester2') : t('semester1')}
            </p>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-black tracking-wide border-2 border-slate-900 px-4 py-2 rounded-xl">
              {viewMode === 'grades' ? t('finalGradesTitle') : t('attendanceTitle')}
            </h2>
            <p className="text-[10px] font-mono mt-1">IBB SMART UNIVERSITY DIGITAL ROSTER</p>
          </div>

          <div className="text-end space-y-1">
            <p>{t('instructorLabel')} {instructorInfo.name || "د. ...................."}</p>
            <p>{t('subjectLabel')} {manualSubjectName.trim() ? manualSubjectName : "...................."}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center text-xs font-black text-[#0A2540] animate-pulse">
          {t('loadingData')}
        </div>
      ) : (
        <div className="max-w-[1500px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 flex-grow print:block">
          
          {/* الكرت الجانبي للدكتور والوظائف المتقدمة */}
          <aside className="border border-white/90 bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm h-fit space-y-4 print:hidden">
            <div className="text-center space-y-3 border-b border-slate-200/60 pb-4">
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

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-black gap-1">
                    <Camera className="w-4 h-4" />
                    <span>{isUpdatingAvatar ? t('uploadingPhoto') : t('editPhoto')}</span>
                  </div>
                </button>
                

                <span className="absolute -bottom-1 -end-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md animate-pulse z-10" />
              </div>
              

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
                <p className="text-[10px] font-mono text-slate-400 bg-slate-100 py-1 rounded-md">
                  {t('academicIdLabel')} {instructorInfo.id}
                </p>
              </div>
            </div>
            {/* ✍️ زر إعداد وتعديل التوقيع الإلكتروني */}
<button
  type="button"
  onClick={() => setShowSignatureModal(true)}
  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-black text-xs transition-all flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm cursor-pointer"
>
  <PenTool className="w-4 h-4 text-emerald-400" />
  <span>{t('digitalSignatureBtn')}</span>
</button>

            <Link href="/faculty/upload" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md">
              <Plus className="w-4 h-4" /> {t('uploadNewResource')}
            </Link>

            <button
              type="button"
              onClick={() => setShowRosterModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#00bc7e]/10 hover:bg-[#00bc7e]/20 border border-[#00bc7e]/30 text-[#059669] font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FileCheck2 className="w-4 h-4 text-[#059669]" />
              <span>{t('fetchRosterBtn')}</span>
            </button>

            {/* 📝 زر لوحة التكاليف والواجبات */}
            <button
              type="button"
              onClick={() => setShowAssignmentsModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-800 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <span>{t('manageAssignmentsBtn')} ({assignmentsList.length})</span>
            </button>

           <button
  type="button"
  onClick={() => setShowSubmissionsModal(true)}
  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
>
  <FileText className="w-4 h-4 text-amber-600" />
  <span>{t('receiveStudentSubmissions')}</span>
</button>

<button
  type="button"
  onClick={() => setShowProjectsModal(true)}
  className="w-full py-2.5 px-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-800 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
>
  <FolderGit2 className="w-4 h-4 text-teal-600" />
  <span>{t('engineeringProjectsArchive')}</span>
</button>

<button
  type="button"
  onClick={() => setShowThesesModal(true)}
  className="w-full py-2.5 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-800 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
>
  <GraduationCap className="w-4 h-4 text-purple-600" />
  <span>{t('thesesArchive')}</span>
</button>


            <a
              href="https://ibbunivsas.net/Default.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              title={t('dedicatedRosterPlatform')}
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('dedicatedRosterPlatform')}</span>
            </a>
          </aside>

          {/* القسم الرئيسي */}
          <main className="lg:col-span-3 space-y-6 print:w-full overflow-hidden">

            {/* 1. الكاروسيل العائم لعرض ومراجعة المواد المرفوعة */}
            <ResourceCarousel 
              myResources={myResources}
              selectedResource={selectedResource}
              onSelectResource={handleSelectResource}
              onDeleteResource={handleDeleteResource}
              setPreviewUrl={setPreviewUrl}
              setPreviewType={setPreviewType}
              router={router}
            />

            {/* ✏️ 2. حقل كتابة اسم المادة يدويًا للطباعة */}
            <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs print:hidden">
              <label className="text-xs font-black text-[#062c35] whitespace-nowrap">{t('courseNameLabel')}</label>
              <input 
                type="text"
                placeholder={t('courseNamePlaceholder')}
                value={manualSubjectName}
                onChange={(e) => setManualSubjectName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#062c35] bg-[#f4f7f5] focus:outline-none focus:border-[#059669]"
              />
            </div>

            {/* 3. جدول الطلاب المستدعى المطور كامل المزايا والوظائف */}
            <StudentRosterTable 
              selectedResource={selectedResource}
              studentsRoster={studentsRoster}
              activeRosterHeader={activeRosterHeader}
              instructorInfo={instructorInfo}          
              manualSubjectName={manualSubjectName}    
              viewMode={viewMode}
              setViewMode={setViewMode}
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

      {/* 🛑 1. نافذة استدعاء كشوفات الطلاب */}
      {showRosterModal && (
        <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#d8e3dd] rounded-3xl w-full max-w-xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#059669]" />
                <h4 className="text-sm font-black text-[#062c35]">{t('modalRosterTitle')}</h4>
              </div>
              <button 
                onClick={() => setShowRosterModal(false)}
                className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f4f7f5] p-3.5 rounded-2xl border border-[#cde0d5]">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('modalDeptLabel')}</label>
                <select 
                  value={searchDeptId}
                  onChange={(e) => setSearchDeptId(parseInt(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white border border-[#cde0d5] text-xs font-bold text-[#062c35]"
                >
                  {universityStructure.flatMap(c => c.departments).map(dept => (
                    <option key={dept.id} value={dept.id}>➔ {tGlobal(`departments.${dept.id}` as any) || dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('modalLevelLabel')}</label>
                <select 
                  value={searchLevelId}
                  onChange={(e) => setSearchLevelId(parseInt(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white border border-[#cde0d5] text-xs font-bold text-[#062c35]"
                >
                  {Array.from({ length: getMaxLevels(searchDeptId) }, (_, i) => i + 1).map((lvl) => (
                    <option key={lvl} value={lvl}>{tGlobal(`levels.${lvl}` as any) || levelNamesMap[lvl]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('modalSemesterLabel')}</label>
                <select 
                  value={searchSemester}
                  onChange={(e) => setSearchSemester(parseInt(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white border border-[#cde0d5] text-xs font-bold text-[#062c35]"
                >
                  <option value={1}>{t('modalSemester1')}</option>
                  <option value={2}>{t('modalSemester2')}</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFetchApprovedRosters}
              disabled={isSearchingRosters}
              className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSearchingRosters ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{t('searchRosterBtn')}</span>
            </button>

            {fetchedRosters.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 max-h-[40vh] overflow-y-auto pe-1">
                <span className="text-[11px] font-black text-[#062c35] block mb-2">{t('availableRosters')}</span>
                {fetchedRosters.map((ros) => {
                  const isExcel = ros.file_url?.match(/\.(xlsx|xls|csv)$/i);
                  return (
                    <div key={ros.id} className="p-3 rounded-2xl bg-[#f4f7f5] border border-[#cde0d5] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isExcel ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                        }`}>
                          {isExcel ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-black text-[#062c35] truncate">{ros.title}</h5>
                          <span className="text-[10px] text-[#059669] font-black block mt-0.5">
                            {t('approvedRosterBadge')} • {ros.semester === 2 ? t('semester2') : t('semester1')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a 
                          href={ros.file_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all"
                          title={t('previewFileTooltip')}
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleApplyRosterToTable(ros)}
                          className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('fillInTableBtn')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}
      <SignatureModal
  isOpen={showSignatureModal}
  onClose={() => setShowSignatureModal(false)}
  onSave={handleSaveSignatureBlob}
  existingSignatureUrl={instructorInfo?.signature_url}
/>

      {/* 📝 3. نافذة إدارة التكاليف والواجبات */}
      {showAssignmentsModal && (
        <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#d8e3dd] rounded-3xl w-full max-w-xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-black text-[#062c35]">{t('modalAssignmentsTitle')}</h4>
              </div>
              <button onClick={() => setShowAssignmentsModal(false)} className="p-1 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

           <form onSubmit={handleCreateAssignment} className="space-y-3 bg-[#f4f7f5] p-4 rounded-2xl border border-[#cde0d5]">
  <span className="text-xs font-black text-[#062c35] block border-b border-slate-200 pb-2 mb-2">{t('newAssignmentHeading')}</span>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('targetDepartment')}</label>
      <select
        value={newAssignDeptId}
        onChange={(e) => {
          const newDept = parseInt(e.target.value);
          setNewAssignDeptId(newDept);
          if (newAssignLevelId > getMaxLevels(newDept)) setNewAssignLevelId(1);
        }}
        className="w-full p-2 bg-white border border-[#cde0d5] rounded-xl text-xs font-bold text-[#062c35]"
      >
        {universityStructure.flatMap(c => c.departments).map(dept => (
          <option key={dept.id} value={dept.id}>➔ {dept.name}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('modalLevelLabel')}</label>
      <select
        value={newAssignLevelId}
        onChange={(e) => setNewAssignLevelId(parseInt(e.target.value))}
        className="w-full p-2 bg-white border border-[#cde0d5] rounded-xl text-xs font-bold text-[#062c35]"
      >
        {Array.from({ length: getMaxLevels(newAssignDeptId) }, (_, i) => i + 1).map((lvl) => (
          <option key={lvl} value={lvl}>{levelNamesMap[lvl]}</option>
        ))}
      </select>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
    <div className="sm:col-span-2">
      <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('assignTitlePlaceholder')}</label>
      <input type="text" placeholder={t('assignTitlePlaceholder')} value={newAssignTitle} onChange={(e) => setNewAssignTitle(e.target.value)} className="w-full p-2 bg-white border border-[#cde0d5] rounded-xl text-xs font-bold text-[#062c35]" />
    </div>
    <div>
      <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('deadline')}</label>
      <input type="datetime-local" value={newAssignDueDate} onChange={(e) => setNewAssignDueDate(e.target.value)} dir="ltr" lang="en" className="w-full p-2 bg-white border border-[#cde0d5] rounded-xl text-xs font-bold text-[#062c35] text-left" />
    </div>
    <div>
      <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('score')}</label>
      <input type="number" placeholder={t('maxScorePlaceholder')} value={newAssignScore} onChange={(e) => setNewAssignScore(parseInt(e.target.value) || 10)} className="w-full p-2 bg-white border border-[#cde0d5] rounded-xl text-xs font-bold text-[#062c35]" />
    </div>
  </div>

  <div>
    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('assignmentDescription')}</label>
    <textarea placeholder={t('descriptionPlaceholder')} value={newAssignDescription} onChange={(e) => setNewAssignDescription(e.target.value)} rows={2} className="w-full p-2 bg-white border border-[#cde0d5] rounded-xl text-xs font-bold text-[#062c35] resize-none" ></textarea>
  </div>

  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
    <Send className="w-3.5 h-3.5" />
    <span>{t('publishAssignmentBtn')}</span>
  </button>
</form>
            <div className="space-y-2 max-h-[35vh] overflow-y-auto pe-1">
              <span className="text-xs font-black text-[#062c35] block">{t('activeAssignmentsHeading')}</span>
              {assignmentsList.length > 0 ? (
                assignmentsList.map((assign) => (
                  <div key={assign.id} className="p-3 bg-[#f4f7f5] border border-[#cde0d5] rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-[#062c35]">{assign.title}</h5>
                      <span className="text-[10px] text-indigo-700 font-bold block">{t('scoreLabel')} {assign.max_score} {t('gradesUnit')}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-[#059669] border border-emerald-500/20 px-2 py-1 rounded-xl font-bold">
                      {t('activeStatus')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-400 font-bold text-xs">{t('noAssignments')}</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 🎬 4. المعاينة السينمائية */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-950/90 z-[999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-slate-950 px-6 py-4 flex justify-between items-center border-b border-white/10 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  {previewType === 'educational_video' ? <PlayCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black">{t('previewModalTitle')}</h4>
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
            <div className="flex-grow bg-slate-950 p-2 flex items-center justify-center">
              {previewType === 'educational_video' ? (
                <video src={previewUrl} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/5"/>
              ) : (
                <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} className="w-full h-full rounded-2xl border-none bg-white" title="PDF Viewer"/>
              )}
            </div>
          </div>
        </div>
      )}
      {showSubmissionsModal && (
  <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm dir-rtl text-right">
    <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-200">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-sm text-[#062c35]">{t('submissionsReviewPanel')}</h3>
        <button onClick={() => { setShowSubmissionsModal(false); setSelectedAssignmentForReview(null); }} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
      </div>
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/3 border-l overflow-y-auto p-3 space-y-2">
          {assignmentsList.map(assign => (
            <button 
              key={assign.id}
              onClick={async () => {
                setSelectedAssignmentForReview(assign);
                const { data } = await supabase
                  .from('assignment_submissions')
                  .select('*, students(name, student_id)')
                  .eq('assignment_id', assign.id);
                setStudentSubmissions(data || []);
              }}
              className={`w-full p-3 rounded-xl text-xs font-bold text-right transition-all ${selectedAssignmentForReview?.id === assign.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              {assign.title}
              <span className="block text-[9px] opacity-70 mt-1">{departmentNamesMap[assign.dept_id]} - {levelNamesMap[assign.level_id]}</span>
            </button>
          ))}
        </div>
        <div className="w-2/3 p-4 overflow-y-auto">
          {selectedAssignmentForReview ? (
            <div className="space-y-4">
              <h4 className="font-black text-indigo-800 border-b pb-2">{selectedAssignmentForReview.title}</h4>
              {studentSubmissions.length > 0 ? studentSubmissions.map((sub, idx) => (
                <div key={idx} className="p-4 border rounded-2xl flex items-center justify-between bg-slate-50">
                  <div>
                    <p className="font-black text-sm">{sub.students?.name || t('unknownStudent')}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {sub.students?.student_id}</p>
                  </div>
                  <a href={sub.file_url} target="_blank" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-emerald-700">
                    {t('downloadAssignment')}
                  </a>
                </div>
              )) : <p className="text-center text-slate-400 py-10">{t('noSubmissionsYet')}</p>}
            </div>
          ) : <p className="text-center text-slate-400 py-10">{t('selectAssignmentToViewStudents')}</p>}
        </div>
      </div>
    </div>
  </div>
)}

{showProjectsModal && (
  <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm dir-rtl text-right">
    <div className="bg-[#edf2ee] border border-[#d2ded6] rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
      <div className="p-4 border-b border-[#d8e3dd] flex justify-between items-center bg-white/60">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-[#059669]" />
          <h3 className="font-black text-sm text-[#062c35]">{t('manageGraduationProjects')}</h3>
        </div>
        <button onClick={() => setShowProjectsModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-all">
          <X className="w-5 h-5"/>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4 md:p-6">
        <ProjectsManager />
      </div>
    </div>
  </div>
)}

{showThesesModal && (
  <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm dir-rtl text-right">
    <div className="bg-[#edf2ee] border border-[#d2ded6] rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
      <div className="p-4 border-b border-[#d8e3dd] flex justify-between items-center bg-white/60">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-600" />
          <h3 className="font-black text-sm text-[#062c35]">{t('manageTheses')}</h3>
        </div>
        <button onClick={() => setShowThesesModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-all">
          <X className="w-5 h-5"/>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4 md:p-6">
        <ThesesManager />
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