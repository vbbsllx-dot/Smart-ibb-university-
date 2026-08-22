"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

interface TransactionProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: any;
}

export default function AbsenceTransaction({ isOpen, onClose, studentData }: TransactionProps) {
  const t = useTranslations('StudentDashboard');

  const [courseName, setCourseName] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [absenceLevel, setAbsenceLevel] = useState('المستوى الأول'); 
  const [reason, setReason] = useState('');
  const [deanName, setDeanName] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const academicId = studentData?.student_id || studentData?.id || 'غير متوفر';

  const calculateEnrollmentYear = () => {
    const currentYear = 2026;
    let levelNum = 1;
    const lvlStr = studentData?.level || '';
    if (lvlStr.includes('الثاني') || lvlStr.includes('2')) levelNum = 2;
    else if (lvlStr.includes('الثالث') || lvlStr.includes('3')) levelNum = 3;
    else if (lvlStr.includes('الرابع') || lvlStr.includes('4')) levelNum = 4;
    else if (lvlStr.includes('الخامس') || lvlStr.includes('5')) levelNum = 5;
    
    const startYear = currentYear - levelNum;
    return `${startYear}/${startYear + 1}`;
  };

  // 🖨️ دالة الطباعة (بعد تحسين التنسيقات لتناسب صفحة واحدة تماماً)
  const handlePrint = () => {
    const enrollmentYear = calculateEnrollmentYear();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة.');

    const htmlContent = `
      <html dir="rtl" lang="ar">
      <head>
        <title>طباعة استمارة العذر</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 10mm; }
            @page { size: A4; margin: 0; }
          }
          body { font-family: 'Arial', sans-serif; padding: 15px; line-height: 1.4; color: #000; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; text-align: center; }
          .header-right { text-align: right; width: 33%; font-weight: bold; font-size: 13px; line-height: 1.5; }
          .header-center { width: 33%; }
          .header-center img { width: 75px; height: 75px; object-fit: contain; }
          .header-left { text-align: left; width: 33%; font-size: 12px; line-height: 1.5; }
          .divider { border-top: 1.5px solid #000; margin: 10px 0; }
          .title { text-align: center; font-size: 17px; font-weight: bold; margin: 12px 0; }
          .to-section { font-weight: bold; margin-bottom: 8px; font-size: 13px; }
          .content { text-align: justify; margin-bottom: 12px; line-height: 1.6; font-size: 13px; }
          .signature { text-align: left; font-weight: bold; margin-top: 15px; margin-bottom: 15px; padding-left: 30px; font-size: 13px; }
          .status-section { margin-top: 10px; }
          .status-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; text-decoration: underline; }
          .footer { margin-top: 10px; font-weight: bold; font-size: 13px; }
        </style>
      </head>
      <body>
        <!-- الأكليشة -->
        <div class="header">
          <div class="header-right">
            الجمهورية اليمنية<br>
            جامعة إب<br>
            كلية ${studentData?.college_name || '................'}
          </div>
          <div class="header-center">
            <img src="https://upload.wikimedia.org/wikipedia/ar/a/a2/Ibb_University_logo.png" alt="شعار جامعة إب">
          </div>
          <div class="header-left">
            التاريخ: ${new Date().toLocaleDateString('ar-YE')}<br>
            المرفقات: ${attachmentFile ? attachmentFile.name : 'لا توجد'}
          </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- العنوان -->
        <div class="title">استمارة طلب قبول عذر غياب طالب</div>
        
        <!-- التوجيه -->
        <div class="to-section">
          الأخ الدكتور / ${deanName || '........................................'} المحترم
        </div>
        <div style="margin-bottom: 8px; font-weight: bold;">بعد التحية،،،</div>
        
        <!-- جسم الطلب -->
        <div class="content">
          أنا الطالب <strong>${studentData?.name || '................................'}</strong>، جنسيتي <strong>يمني</strong>، تخصص <strong>${studentData?.department || '................'}</strong>، المستوى <strong>${studentData?.level || '................'}</strong>، رقم القيد (الرقم الأكاديمي) <strong>${academicId}</strong>.<br>
          أتقدم إليكم بطلب قبول عذري في عدم دخول اختبار مقرر <strong>${courseName || '................................'}</strong> للمستوى <strong>${absenceLevel || '................'}</strong> من العام الجامعي <strong>${academicYear || '................'}</strong>.<br>
          <strong>وذلك للأسباب التالية:</strong> ${reason || '................................................................................................'}<br>
          <strong>والمرفقات:</strong> ${attachmentFile ? attachmentFile.name : 'لا توجد'} لديكم.
        </div>
        
        <!-- التوقيع -->
        <div class="signature">
          اسم الطالب: ${studentData?.name || '................................'}<br>
          التوقيع: ........................................
        </div>
        
        <div class="divider"></div>
        
        <!-- بيان حالة الطالب -->
        <div class="status-section">
          <div class="status-title">بيان حالة الطالب:</div>
          <div class="content">
            الطالب <strong>${studentData?.name || '................................'}</strong>، الرقم الأكاديمي <strong>${academicId}</strong>، التحق بكلية <strong>${studentData?.college_name || '................'}</strong> في عام <strong>${enrollmentYear}</strong>.<br>
            وحالياً مقيد في تخصص <strong>${studentData?.department || '................'}</strong> المستوى <strong>${studentData?.level || '................'}</strong>، الحالة: <strong>مستجد</strong>، للعام الجامعي الحالي <strong>${academicYear}</strong>.
          </div>
        </div>
        
        <!-- الخاتمة -->
        <div class="footer">
          وتقبلوا خالص التحية، ويرجى التكرم بالاطلاع على ملفي بأسرع وقت ممكن.
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      let fileUrl = null;

      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `absence_${academicId}_${Date.now()}.${fileExt}`;
        const filePath = `attachment files for transction/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('university-files')
          .upload(filePath, attachmentFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('university-files')
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
      }

      const transactionDetails = {
        student_name: studentData.name,
        nationality: t('valYemeni'),
        college: studentData.college_name,
        department: studentData.department,
        level: studentData.level,
        academic_id: academicId, 
        course_name: courseName,
        academic_year: academicYear,
        absence_level: absenceLevel,
        dean_name: deanName,
        reason: reason
      };

      // 3. الإدراج في قاعدة البيانات
      const { error: insertError } = await supabase
        .from('student_transactions')
        .insert([{
          student_id: parseInt(studentData.db_id), // 👈 التعديل هنا: استخدمنا المفتاح الأساسي الحقيقي
          transaction_type: 'absence',          
          attachment_url: fileUrl,              
          details: transactionDetails           
        }]);

      if (insertError) throw insertError;

      alert(t('msgAbsenceSuccess'));
      onClose();

    } catch (error: any) {
      console.error("خطأ:", error);
      setMessage({ type: 'error', text: "حدث خطأ أثناء الإرسال: " + (error.message || "") });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 rtl:text-right ltr:text-left dir-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        
        {/* الترويسة */}
        <div className="bg-amber-500 p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-lg">{t('modalAbsenceTitle')}</h3>
            <p className="text-xs text-amber-100 mt-1">{t('modalAbsenceSubtitle')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-rose-500 transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* قسم البيانات الثابتة */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-inner">
            <h4 className="text-xs font-black text-slate-700 mb-3 border-b border-slate-200 pb-2">بيانات الطالب (تلقائية)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
              <div><span className="text-slate-400 block mb-1">اسم الطالب:</span><strong className="text-slate-900">{studentData?.name || '---'}</strong></div>
              <div><span className="text-slate-400 block mb-1">{t('lblAcademicId')}:</span><strong className="text-slate-900 font-mono">{academicId}</strong></div>
              <div><span className="text-slate-400 block mb-1">{t('lblNationality')}:</span><strong className="text-slate-900">{t('valYemeni')}</strong></div>
              <div><span className="text-slate-400 block mb-1">{t('collegeLabel')}:</span><strong className="text-slate-900">{studentData?.college_name || '---'}</strong></div>
              <div><span className="text-slate-400 block mb-1">{t('deptLabel')}:</span><strong className="text-slate-900">{studentData?.department || '---'}</strong></div>
              <div><span className="text-slate-400 block mb-1">{t('levelLabel')}:</span><strong className="text-slate-900">{studentData?.level || '---'}</strong></div>
            </div>
          </div>

          {/* نموذج الإدخال (Form) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {message.text && (
              <div className={`p-3 rounded-xl text-xs font-bold ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblCourseName')} <span className="text-amber-500">*</span></label>
                <input 
                  type="text" required value={courseName} onChange={(e) => setCourseName(e.target.value)} 
                  className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-xs outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblDeanName')} <span className="text-amber-500">*</span></label>
                <input 
                  type="text" required value={deanName} onChange={(e) => setDeanName(e.target.value)} placeholder={t('lblDeanPlaceholder')}
                  className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-xs outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblAcademicYear')} <span className="text-amber-500">*</span></label>
                <input 
                  type="text" required value= {academicYear} onChange={(e) => setAcademicYear(e.target.value)} 
                  className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-xs outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblAbsenceLevel')} <span className="text-amber-500">*</span></label>
                <select 
                  required value={absenceLevel} onChange={(e) => setAbsenceLevel(e.target.value)} 
                  className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-xs outline-none cursor-pointer" 
                >
                  <option value={t('level1')}>{t('level1')}</option>
                  <option value={t('level2')}>{t('level2')}</option>
                  <option value={t('level3')}>{t('level3')}</option>
                  <option value={t('level4')}>{t('level4')}</option>
                  <option value={t('level5')}>{t('level5')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblReason')} <span className="text-amber-500">*</span></label>
              <textarea 
                required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} 
                className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-xs outline-none resize-none" 
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblAttachment')} <span className="text-slate-400 font-normal">{t('lblOptional')}</span></label>
              <input 
                type="file" onChange={(e) => setAttachmentFile(e.target.files ? e.target.files[0] : null)}
                className="w-full bg-white text-slate-600 font-medium p-2 rounded-xl border border-slate-200 text-xs outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer" 
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="submit" disabled={isSubmitting}
                className={`flex-1 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-lg'}`}
              >
                {isSubmitting ? t('msgUploading') : t('btnSubmitAbsence')}
              </button>
              
              <button 
                type="button" onClick={handlePrint}
                className="flex-1 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md bg-slate-800 hover:bg-slate-900 text-white hover:shadow-lg"
              >
                {t('btnPrint')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}