"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';

interface StudentAssignmentsProps {
  studentData: any;
}

export default function StudentAssignments({ studentData }: StudentAssignmentsProps) {
  const t = useTranslations('StudentAssignments');
  const locale = useLocale(); // لمعرفة اللغة الحالية لتنسيق التاريخ

  const [assignments, setAssignments] = useState<any[]>([]);
  const [submittedAssignments, setSubmittedAssignments] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 🌟 حالات (States) النافذة المنبثقة للتسليم
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      // التأكد من وجود بيانات الطالب
      if (!studentData?.dep_id || !studentData?.level_id || !studentData?.id) {
        setErrorMsg(t('incompleteStudentData'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. جلب التكاليف + اسم الدكتور من جدول instructors
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            instructors (
              name
            )
          `)
          .eq('dept_id', studentData.dep_id)
          .eq('level_id', studentData.level_id)
          .order('due_date', { ascending: true });
          
        if (assignmentsError) throw assignmentsError;
        
        // 2. جلب التكاليف التي قام هذا الطالب بتسليمها مسبقاً (لتعطيل الزر)
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .eq('student_id', studentData.id);

        if (submissionsError) throw submissionsError;

        // استخراج أرقام (ID) التكاليف المسلمة ووضعها في مصفوفة
        const submittedIds = submissionsData?.map(sub => sub.assignment_id) || [];

        setAssignments(assignmentsData || []);
        setSubmittedAssignments(submittedIds);
      } catch (error: any) {
        console.error("Database Error:", error);
        setErrorMsg(t('dbConnectionError'));
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [studentData, t]);

  // دالة لتنسيق التاريخ ليظهر بشكل أنيق للطالب (متوافقة مع اللغات)
  const formatDate = (dateString: string) => {
    if (!dateString) return t('unspecified');
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-YE' : 'en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ⏱️ دالة حساب الوقت المتبقي بالأشهر والأيام
  const calculateTimeRemaining = (dueDateString: string) => {
    const now = new Date();
    const due = new Date(dueDateString);
    const diffTime = due.getTime() - now.getTime();
    
    if (diffTime <= 0) return t('timeUp');
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return days > 0 
        ? t('remainingMonthsAndDays', { months, days }) 
        : t('remainingMonths', { months });
    } else if (diffDays === 0) {
       return t('endsToday');
    }
    return t('remainingDays', { diffDays });
  };

  // 🚀 دالة إرسال التكليف (الرفع إلى Storage والربط بقاعدة البيانات)
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionFile || !selectedAssignment) {
      alert(t('attachFileAlert'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. رفع الملف إلى Supabase Storage 
      const fileExt = submissionFile.name.split('.').pop();
      const fileName = `student_${studentData.id}_assign_${selectedAssignment.id}_${Date.now()}.${fileExt}`;
      const filePath = `assignments_submissions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('university-files')
        .upload(filePath, submissionFile);

      if (uploadError) throw uploadError;

      // 2. الحصول على الرابط العام للملف
      const { data: publicUrlData } = supabase.storage
        .from('university-files')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 3. إدراج بيانات التسليم في قاعدة البيانات
      const { error: insertError } = await supabase
        .from('assignment_submissions')
        .insert([{
          assignment_id: selectedAssignment.id,
          student_id: parseInt(studentData.id),
          file_url: fileUrl,
          notes: submissionNotes 
        }]);

      if (insertError) throw insertError;

      // 4. تحديث الواجهة 
      alert(t('submitSuccess'));
      setSubmittedAssignments((prev) => [...prev, selectedAssignment.id]);
      closeModal();

    } catch (error: any) {
      console.error("Database Error:", error);
      alert(t('dbErrorPrefix') + (error.message || JSON.stringify(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // إغلاق النافذة المنبثقة وتفريغ الحقول
  const closeModal = () => {
    setSelectedAssignment(null);
    setSubmissionFile(null);
    setSubmissionNotes('');
  };

  return (
    <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.01)] h-full min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500 relative rtl:text-right ltr:text-left">
      
      {/* 📌 الترويسة */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-cyan-500" />
          <div>
            <h3 className="text-xl font-black text-slate-900">{t('academicAssignmentsTitle')}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {t('assignedTo')} {studentData?.department} - {studentData?.level}
            </p>
          </div>
        </div>
        <div className="bg-cyan-50 text-cyan-600 px-4 py-2 rounded-xl font-bold text-xs border border-cyan-100 shadow-sm hidden sm:block">
          {t('totalAssignments')} {assignments.length}
        </div>
      </div>

      {/* 📋 منطقة عرض التكاليف */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-cyan-600 animate-pulse">
            <span className="text-4xl mb-3">⏳</span>
            <p className="font-bold text-sm">{t('searchingAssignments')}</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-6 rounded-2xl text-center font-bold text-sm">
            ❌ {errorMsg}
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-slate-50/80 border border-slate-200/60 p-12 rounded-3xl text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm mb-4 border border-slate-100">
              🎉
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2">{t('noAssignments')}</h4>
            <p className="text-xs font-medium text-slate-500">{t('noAssignmentsDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {assignments.map((assignment) => {
              // التحقق من حالة الموعد والتسليم
              const isOverdue = new Date(assignment.due_date) < new Date();
              const hasSubmitted = submittedAssignments.includes(assignment.id);
              const isButtonDisabled = isOverdue || hasSubmitted;

              return (
                <div key={assignment.id} className="bg-white/80 border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                  {/* خط ملون جانبي لمعرفة حالة التكليف */}
                  <div className={`absolute top-0 rtl:right-0 ltr:left-0 w-1.5 h-full ${isOverdue ? 'bg-red-500' : hasSubmitted ? 'bg-emerald-500' : 'bg-cyan-400'}`} />
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* بيانات التكليف */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-800">{assignment.title}</h4>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                          {assignment.description || t('noAdditionalNotes')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {t('professor')} {assignment.instructors?.name || t('unspecified')}
                        </span>
                        <span className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg border border-cyan-100">
                          {t('maxScore')} {assignment.max_score} {t('gradesUnit')}
                        </span>
                      </div>
                    </div>

                    {/* بيانات الموعد والتسليم */}
                    <div className="flex flex-col items-end justify-between min-w-[200px] border-t md:border-t-0 md:rtl:border-r md:ltr:border-l border-slate-200 pt-4 md:pt-0 md:rtl:pr-4 md:ltr:pl-4">
                      <div className="rtl:text-right ltr:text-left w-full mt-1">
                        <p className="text-[10px] font-bold text-red-600 mb-1 flex items-center justify-center w-full gap-1">
                          {t('deadline')}
                        </p>
                        <div className="text-center w-full">
                          <span className={`text-xs font-black inline-block px-3 py-1 rounded-xl ${isOverdue ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'text-slate-700 bg-slate-100 border border-slate-200'}`}>
                            {formatDate(assignment.due_date)}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedAssignment(assignment)}
                        disabled={isButtonDisabled}
                        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          hasSubmitted 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed'
                            : isOverdue 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-slate-900 text-white hover:bg-cyan-600 hover:shadow-lg'
                        }`}
                      >
                        {hasSubmitted ? t('alreadySubmitted') : isOverdue ? t('deadlinePassed') : t('submitAssignmentBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌟 النافذة المنبثقة (Modal) لرفع التكليف */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 rtl:dir-rtl ltr:dir-ltr">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* رأس النافذة */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">{t('submitAssignmentTitle')}</h3>
                <p className="text-xs text-slate-300 mt-1">{selectedAssignment.title}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-5">
              
              {/* معلومات الطالب والدكتور والوقت */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 mb-1">{t('studentNameLabel')}</span>
                  <strong className="text-slate-800">{studentData?.name || t('notAvailable')}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 mb-1">{t('universityIdLabel')}</span>
                  <strong className="text-slate-800">{studentData?.university_id || studentData?.id || t('notAvailable')}</strong>
                </div>
                <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-100">
                  <span className="block text-cyan-600/70 mb-1">{t('professorLabel')}</span>
                  <strong className="text-cyan-800">{selectedAssignment.instructors?.name || t('unspecified')}</strong>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <span className="block text-orange-600/70 mb-1">{t('timeRemainingLabel')}</span>
                  <strong className="text-orange-800">{calculateTimeRemaining(selectedAssignment.due_date)}</strong>
                </div>
              </div>

              {/* رسالة تحذيرية */}
              <div className="bg-amber-50 rtl:border-r-4 ltr:border-l-4 border-amber-500 text-amber-700 p-3 rtl:rounded-l-lg ltr:rounded-r-lg text-xs font-bold flex gap-2 items-center">
                <span>⚠️</span>
                <span>{t('submissionWarning')}</span>
              </div>

              {/* رفع الملف */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-2">{t('attachFileLabel')} <span className="text-red-500">*</span></label>
                <input 
                  type="file" 
                  required
                  onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-slate-50 text-slate-600 font-medium p-2 rounded-xl border border-slate-200 text-xs outline-none file:rtl:mr-4 file:ltr:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-cyan-50 file:text-cyan-600 hover:file:bg-cyan-100 cursor-pointer" 
                />
              </div>

              {/* ملاحظات الطالب */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-2">{t('additionalNotesLabel')}</label>
                <textarea 
                  rows={2}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="w-full bg-slate-50 focus:bg-white text-slate-800 font-medium p-3 rounded-xl border border-slate-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-xs outline-none resize-none" 
                />
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-300 text-slate-500' : 'bg-slate-900 text-white hover:bg-cyan-600 shadow-md'}`}
                >
                  {isSubmitting ? t('uploadingStatus') : t('confirmSubmitBtn')}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-xs"
                >
                  {t('cancelBtn')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </section>
  );
}