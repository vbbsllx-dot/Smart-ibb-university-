"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw, 
  FileText, 
  Clock, 
  GraduationCap, 
  Users, 
  Search, 
  Download, 
  Eye, 
  Printer,
  Settings,
  Lock,
  Unlock,
  Save
} from 'lucide-react';

interface Student {
  name: string;
  student_id: string;
  level_id: number;
  dep_id: number;
}

interface Transaction {
  id: number;
  student_id: number;
  transaction_type: string;
  attachment_url: string | null;
  details: Record<string, any>;
  created_at: string;
  students: Student;
}

interface TransactionSetting {
  type: string;
  label: string;
  is_active: boolean;
  closed_message: string;
}

export default function StudentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  
  // حالات الفلترة والبحث والإعدادات
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all', 'absence', 'withdraw', 'suspend', 'resume', 'settings'
  const [searchTerm, setSearchTerm] = useState<string>('');

  // إعدادات المعاملات (فتح/غلق والرسائل)
  const [settings, setSettings] = useState<TransactionSetting[]>([
    { type: 'absence', label: 'عذر غياب', is_active: true, closed_message: 'عذراً، قد اكتمل الوقت المتاح لعملية الغياب بعذر.' },
    { type: 'withdraw', label: 'سحب ملف', is_active: true, closed_message: 'عذراً، عملية سحب الملف ليست متاحة في الوقت الحالي.' },
    { type: 'suspend', label: 'وقف قيد', is_active: true, closed_message: 'عذراً، خدمة وقف القيد مغلقة مؤقتاً.' },
    { type: 'resume', label: 'فتح قيد', is_active: true, closed_message: 'عذراً، خدمة فتح القيد غير متاحة حالياً.' },
  ]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // جلب البيانات والإعدادات
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. جلب المعاملات
      const { data: txData, error: txError } = await supabase
        .from('student_transactions')
        .select(`*, students (name, student_id, level_id, dep_id)`)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

      // 2. جلب الإعدادات من قاعدة البيانات (إن وجدت)
      const { data: setDa, error: setError } = await supabase
        .from('transaction_settings')
        .select('*');

      if (!setError && setDa && setDa.length > 0) {
        setSettings(prev => prev.map(s => {
          const found = setDa.find((d: any) => d.type === s.type);
          return found ? { ...s, is_active: found.is_active, closed_message: found.closed_message || s.closed_message } : s;
        }));
      }
    } catch (err: any) {
      setNotification('حدث خطأ أثناء جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // حفظ التعديلات في جدول الإعدادات
// مثال عند حفظ الإعدادات لربطها بالـ admin الحالي:
const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      for (const s of settings) {
        // تحديث السطر مباشرة بناءً على نوع المعاملة (type)
        const { error } = await supabase
          .from('transaction_settings')
          .update({ 
            is_active: s.is_active, 
            closed_message: s.closed_message,
            updated_at: new Date()
          })
          .eq('type', s.type); // التحديث باستخدام المفتاح الأساسي type

        if (error) {
          console.error("خطأ أثناء تحديث:", s.type, error.message);
          throw error;
        }
      }
      setNotification('تم حفظ الإعدادات ونشر التحديثات بنجاح.');
    } catch (err: any) {
      setNotification('فشل الحفظ: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const updateSettingField = (type: string, field: 'is_active' | 'closed_message', value: any) => {
    setSettings(prev => prev.map(s => s.type === type ? { ...s, [field]: value } : s));
  };

  const getTransactionName = (type: string) => {
    const found = settings.find(s => s.type === type);
    return found ? found.label : type;
  };

  // ⬇️ التنزيل والطباعة
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const urlParts = url.split('.');
      const ext = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'pdf';
      link.download = `${fileName}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const handlePrint = (tx: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('يرجى السماح بالنوافذ المنبثقة للطباعة.');

    const typeName = getTransactionName(tx.transaction_type);
    const details = tx.details || {};
    
    const studentName = tx.students?.name || '................................';
    const studentId = tx.students?.student_id || '................';
    const collegeName = details.college || '................';
    const department = details.department || '................';
    const level = details.level || '................';
    const deanName = details.dean_name || '........................................';
    const courseName = details.course_name || '........................................';
    const absenceLevel = details.absence_level || '................';
    const academicYear = details.academic_year || new Date().getFullYear().toString();
    const reason = details.reason || '........................................................................';
    const hasAttachment = !!tx.attachment_url;

    let startYear = parseInt(academicYear.split('/')[0] || new Date().getFullYear().toString());
    const lvlStr = level;
    if (lvlStr.includes('الثاني') || lvlStr.includes('2')) startYear -= 1;
    else if (lvlStr.includes('الثالث') || lvlStr.includes('3')) startYear -= 2;
    else if (lvlStr.includes('الرابع') || lvlStr.includes('4')) startYear -= 3;
    else if (lvlStr.includes('الخامس') || lvlStr.includes('5')) startYear -= 4;
    const enrollmentYear = `${startYear}/${startYear + 1}`;

    let actionSentence = tx.transaction_type === 'absence'
      ? `أتقدم إليكم بطلب قبول عذري في عدم دخول اختبار مقرر <strong>${courseName}</strong> للمستوى <strong>${absenceLevel}</strong> من العام الجامعي <strong>${academicYear}</strong>.`
      : `أتقدم إليكم بطلب <strong>${typeName}</strong> للعام الجامعي <strong>${academicYear}</strong>.`;

    const attachmentHtml = hasAttachment 
      ? `<div style="page-break-before: always; padding-top: 20px;"><h3 style="text-align:center;">المرفقات</h3><img src="${tx.attachment_url}" style="max-width: 100%; max-height: 90vh; object-fit: contain; display: block; margin: auto;" alt="مرفق" onerror="this.style.display='none';"/></div>` 
      : '';

    const htmlContent = `
      <html dir="rtl" lang="ar">
      <head>
        <title>استمارة طلب ${typeName}</title>
        <style>
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 15mm; } @page { size: A4; margin: 0; } }
          body { font-family: 'Arial', sans-serif; padding: 20px; line-height: 1.8; color: #000; font-size: 14px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
          .header-right { width: 33%; font-weight: bold; font-size: 14px; line-height: 1.6; }
          .header-center { width: 33%; text-align: center; }
          .header-center img { width: 90px; height: 90px; object-fit: contain; }
          .header-left { width: 33%; font-size: 13px; line-height: 1.6; text-align: left; }
          .header-left-content { display: inline-block; text-align: right; }
          .divider { border-top: 1.5px solid #000; margin: 15px 0; }
          .title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
          .to-section { font-weight: bold; margin-bottom: 15px; font-size: 14px; }
          .content { text-align: justify; margin-bottom: 15px; font-size: 14px; }
          .signature-box { width: 40%; float: left; text-align: right; margin-top: 20px; margin-bottom: 40px; font-weight: bold; }
          .clear { clear: both; }
          .status-title { font-weight: bold; font-size: 15px; text-decoration: underline; margin-bottom: 10px; }
          .footer { margin-top: 25px; font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-right">الجمهورية اليمنية<br>جامعة إب<br>كلية ${collegeName}</div>
          <div class="header-center"><img src="https://upload.wikimedia.org/wikipedia/ar/a/a2/Ibb_University_logo.png" alt="شعار جامعة إب"></div>
          <div class="header-left"><div class="header-left-content">التاريخ: ${new Date(tx.created_at).toLocaleDateString('ar-EG')}<br>المرفقات: ${hasAttachment ? 'مرفق' : 'لا توجد'}</div></div>
        </div>
        <div class="divider"></div>
        <div class="title">استمارة طلب ${typeName}</div>
        <div class="to-section">الأخ الدكتور / ${deanName} المحترم<br>بعد التحية،،،</div>
        <div class="content">أنا الطالب <strong>${studentName}</strong>، جنسيتي <strong>يمني</strong>، تخصص <strong>${department}</strong>، المستوى <strong>${level}</strong>، رقم القيد (الرقم الأكاديمي) <strong>${studentId}</strong>.<br>${actionSentence}<br><strong>وذلك للأسباب التالية:</strong> ${reason}<br><strong>والمرفقات:</strong> ${hasAttachment ? 'مرفق (انظر الصفحة التالية)' : 'لا توجد لديكم.'}</div>
        <div class="signature-box">اسم الطالب: <strong>${studentName}</strong><br><br>التوقيع: ........................................</div>
        <div class="clear"></div>
        <div class="divider"></div>
        <div>
          <div class="status-title">بيان حالة الطالب:</div>
          <div class="content">الطالب <strong>${studentName}</strong>، الرقم الأكاديمي <strong>${studentId}</strong>، التحق بكلية <strong>${collegeName}</strong> في عام <strong>${enrollmentYear}</strong>.<br>وحالياً مقيد في تخصص <strong>${department}</strong> المستوى <strong>${level}</strong>، الحالة: <strong>مستجد</strong>، للعام الجامعي الحالي <strong>${academicYear}</strong>.</div>
          <div class="footer">وتقبلوا خالص التحية، ويرجى التكرم بالاطلاع على ملفي بأسرع وقت ممكن.</div>
        </div>
        ${attachmentHtml}
        <script>window.onload = function() { setTimeout(() => { window.print(); }, 800); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.students?.name.includes(searchTerm) || tx.students?.student_id.includes(searchTerm);
      const matchesTab = activeTab === 'all' || tx.transaction_type === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [transactions, searchTerm, activeTab]);

  return (
    <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] border border-white p-6 md:p-8 shadow-[0_8px_40px_rgb(0,0,0,0.04)] min-h-[85vh]">
      
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-[#062c35] text-white border border-[#00bc7e]/40 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00bc7e] animate-ping" />
          <p className="text-xs font-bold">{notification}</p>
          <button onClick={() => setNotification(null)} className="mr-3 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 1. البانر العلوي */}
      <div className="bg-[#062c35] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-xl shadow-[#062c35]/10 mb-8">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#00bc7e]/20 border border-[#00bc7e]/30 flex items-center justify-center text-[#00bc7e] shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">إدارة المعاملات الإلكترونية</h1>
            <p className="text-sm text-slate-300 font-medium mt-1">التحكم بالمعاملات، الحالات، ورسائل الإغلاق الخاصة بالطلاب</p>
          </div>
        </div>

        <button 
          onClick={fetchData}
          className="mt-4 md:mt-0 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative z-10"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث السجلات
        </button>
      </div>

      {/* 2. شريط التبويبات (شملنا تبويب الإعدادات هنا) */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-white border border-slate-200 p-2 rounded-2xl mb-6 shadow-sm gap-4">
        <div className="flex items-center overflow-x-auto w-full lg:w-auto hide-scrollbar gap-1 p-1">
          {[
            { id: 'all', label: 'كل المعاملات' },
            { id: 'absence', label: 'عذر غياب' },
            { id: 'withdraw', label: 'سحب ملف' },
            { id: 'suspend', label: 'وقف قيد' },
            { id: 'resume', label: 'فتح قيد' },
            { id: 'settings', label: '⚙️ إعدادات فتح وغلق المعاملات' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-[#062c35] text-white shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'settings' && (
          <div className="relative w-full lg:w-[300px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الرقم الأكاديمي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-slate-700 outline-none focus:border-[#00bc7e]"
            />
          </div>
        )}
      </div>

      {/* 3. محتوى التبويبات: إما الجدول أو لوحة الإعدادات */}
      {activeTab === 'settings' ? (
        /* --- لوحة تحكم إعدادات الفتح والإغلاق والرسائل --- */
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-800">إعدادات حالة المعاملات (فتح وإغلاق ورسائل التنبيه)</h2>
            <p className="text-xs text-slate-500 mt-1">من هنا يمكنك إغلاق أو فتح أي معاملة للطلاب فوراً، وتخصيص رسالة الاعتذار التي ستظهر للطالب عند محاولته تقديم الطلب وهي مغلقة.</p>
          </div>

          <div className="space-y-6">
            {settings.map((s) => (
              <div key={s.type} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${s.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {s.is_active ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{s.label}</h3>
                    <p className={`text-[11px] font-bold mt-0.5 ${s.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {s.is_active ? 'الحالة حالياً: مفتوحة ومتاحة للطلاب' : 'الحالة حالياً: مغلقة'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full md:max-w-md">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">رسالة الاعتذار التي ستظهر للطالب عند إغلاقها:</label>
                  <input 
                    type="text" 
                    value={s.closed_message}
                    onChange={(e) => updateSettingField(s.type, 'closed_message', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#00bc7e]"
                  />
                </div>

                <div>
                  <button
                    onClick={() => updateSettingField(s.type, 'is_active', !s.is_active)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      s.is_active 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {s.is_active ? 'إغلاق المعاملة' : 'فتح المعاملة'}
                  </button>
                </div>

              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="px-8 py-3.5 bg-[#062c35] hover:bg-[#00bc7e] text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSavingSettings ? 'جاري الحفظ...' : 'حفظ ونشر التحديثات للطلاب'}
            </button>
          </div>
        </div>
      ) : (
        /* --- جدول عرض المعاملات الواردة --- */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#edf2ee] border-b border-slate-200 text-xs font-black text-slate-600">
                  <th className="p-5 w-12 text-center"><input type="checkbox" className="w-4 h-4 rounded text-[#00bc7e] border-slate-300" /></th>
                  <th className="p-5">الاسم الكامل والصفة</th>
                  <th className="p-5">الكلية / التخصص</th>
                  <th className="p-5 text-center">نوع المعاملة</th>
                  <th className="p-5 text-center">المرفقات</th>
                  <th className="p-5 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-slate-400 font-bold text-sm">جاري تحميل السجلات...</td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan5 className="p-16 text-center text-slate-400 font-bold text-sm" colSpan={6}>لا توجد معاملات تطابق بحثك.</td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 text-center">
                        <input type="checkbox" className="w-4 h-4 rounded text-[#00bc7e] border-slate-300" />
                      </td>
                      
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#00bc7e]/10 text-[#00bc7e] flex items-center justify-center font-bold text-sm">
                            {tx.students?.name?.charAt(0) || 'ط'}
                          </div>
                          <div>
                            <div className="font-black text-sm text-slate-800">{tx.students?.name || 'غير معروف'}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{tx.students?.student_id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="font-bold text-sm text-slate-700">{tx.details?.college || '---'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{tx.details?.department || '---'}</div>
                      </td>
                      
                      <td className="p-5 text-center">
                        <span className="inline-block px-3 py-1 text-[11px] font-black rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
                          {getTransactionName(tx.transaction_type)}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(tx.created_at).toLocaleDateString('ar-EG')}</div>
                      </td>
                      
                      <td className="p-5 text-center">
                        {tx.attachment_url ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <a href={tx.attachment_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors border border-sky-100" title="عرض">
                              <Eye className="w-4 h-4" />
                            </a>
                            <button onClick={() => handleDownload(tx.attachment_url!, `مرفق_${tx.students?.student_id}`)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-100" title="تنزيل">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">لا يوجد</span>
                        )}
                      </td>
                      
                      <td className="p-5 text-center">
                        <button 
                          onClick={() => handlePrint(tx)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#062c35] hover:bg-[#00bc7e] text-white rounded-xl transition-all text-xs font-bold"
                        >
                          <Printer className="w-4 h-4" />
                          طباعة الاستمارة
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}