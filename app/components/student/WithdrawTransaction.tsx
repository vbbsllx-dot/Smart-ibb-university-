"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

interface TransactionProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: any;
}

export default function WithdrawTransaction({ isOpen, onClose, studentData }: TransactionProps) {
  const t = useTranslations('StudentDashboard');

  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
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

  // 🖨️ دالة الطباعة الخاصة بسحب الملف
  const handlePrint = () => {
    const enrollmentYear = calculateEnrollmentYear();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة.');

    const htmlContent = `
      <html dir="rtl" lang="ar">
      <head>
        <title>طباعة استمارة إخلاء طرف وسحب ملف</title>
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
        
        <div class="title">استمارة طلب إخلاء طرف وسحب ملف أكاديمي</div>
        
        <div class="to-section">
          الأخ الدكتور / ${deanName || '........................................'} المحترم<br>
          عميد كلية ${studentData?.college_name || '................'}
        </div>
        <div style="margin-bottom: 8px; font-weight: bold;">بعد التحية،،،</div>
        
        <div class="content">
          أنا الطالب <strong>${studentData?.name || '................................'}</strong>، جنسيتي <strong>يمني</strong>، تخصص <strong>${studentData?.department || '................'}</strong>، المستوى <strong>${studentData?.level || '................'}</strong>، رقم القيد (الرقم الأكاديمي) <strong>${academicId}</strong>.<br>
          أتقدم إليكم بطلب <strong>إخلاء طرفي وسحب ملفي الأكاديمي</strong> من الجامعة نهائياً اعتباراً من العام الجامعي <strong>${academicYear || '................'}</strong>.<br>
          <strong>وذلك للأسباب التالية:</strong> ${reason || '................................................................................................'}<br>
          <strong>والمرفقات:</strong> ${attachmentFile ? attachmentFile.name : 'لا توجد'} لديكم.<br>
          وأرجو التكرم بالموافقة على استكمال إجراءات إخلاء الطرف وإغلاق سجلي الأكاديمي.
        </div>
        
        <div class="signature">
          اسم الطالب: ${studentData?.name || '................................'}<br>
          التوقيع: ........................................
        </div>
        
        <div class="divider"></div>
        
        <div class="status-section">
          <div class="status-title">بيان حالة الطالب:</div>
          <div class="content">
            الطالب <strong>${studentData?.name || '................................'}</strong>، الرقم الأكاديمي <strong>${academicId}</strong>، التحق بكلية <strong>${studentData?.college_name || '................'}</strong> في عام <strong>${enrollmentYear}</strong>.<br>
            وحالياً مقيد في تخصص <strong>${studentData?.department || '................'}</strong> المستوى <strong>${studentData?.level || '................'}</strong>، الحالة: <strong>مستجد</strong>، للعام الجامعي الحالي <strong>${academicYear}</strong>.
          </div>
        </div>
        
        <div class="footer">
          وتفضلوا بقبول خالص التحية والتقدير.
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
        const fileName = `withdraw_${academicId}_${Date.now()}.${fileExt}`;
        const filePath = `attachment files for transction/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('university_files')
          .upload(filePath, attachmentFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('university_files')
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
        academic_year: academicYear,
        dean_name: deanName,
        reason: reason
      };

      const { error: insertError } = await supabase
        .from('student_transactions')
        .insert([{
          student_id: parseInt(studentData.db_id), 
          transaction_type: 'withdraw', // 👈 تغيير نوع المعاملة
          attachment_url: fileUrl,              
          details: transactionDetails           
        }]);

      if (insertError) throw insertError;

      alert(t('msgWithdrawSuccess'));
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
        
        <div className="bg-rose-500 p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-lg">{t('modalWithdrawTitle')}</h3>
            <p className="text-xs text-rose-100 mt-1">{t('modalWithdrawSubtitle')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-slate-900 transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {message.text && (
              <div className={`p-3 rounded-xl text-xs font-bold ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblDeanName')} <span className="text-rose-500">*</span></label>
                <input 
                  type="text" required value={deanName} onChange={(e) => setDeanName(e.target.value)} placeholder={t('lblDeanPlaceholder')}
                  className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all text-xs outline-none" 
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblAcademicYear')} <span className="text-rose-500">*</span></label>
                <input 
                  type="text" required value= {academicYear} onChange={(e) => setAcademicYear(e.target.value)} 
                  className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all text-xs outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblWithdrawReason')} <span className="text-rose-500">*</span></label>
              <textarea 
                required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اذكر سبب طلبك لسحب الملف..."
                className="w-full bg-white border border-slate-200 text-slate-800 font-medium p-2.5 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all text-xs outline-none resize-none" 
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-700 block mb-1.5">{t('lblWithdrawAttachment')} <span className="text-slate-400 font-normal">{t('lblOptional')}</span></label>
              <input 
                type="file" onChange={(e) => setAttachmentFile(e.target.files ? e.target.files[0] : null)}
                className="w-full bg-white text-slate-600 font-medium p-2 rounded-xl border border-slate-200 text-xs outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer" 
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="submit" disabled={isSubmitting}
                className={`flex-1 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white hover:shadow-lg'}`}
              >
                {isSubmitting ? t('msgUploading') : t('btnSubmitWithdraw')}
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