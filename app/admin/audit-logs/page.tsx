"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Filter, 
  Clock, 
  User, 
  FileSpreadsheet, 
  ClipboardList, 
  AlertCircle,
  Activity
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('خطأ جلب سجلات الأمان:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // 🟢 تفعيل الاشتراك اللحظي Realtime للتحديث المباشر فور حدوث أي حركة
    const channel = supabase
      .channel('audit-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setLogs((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // فلترة السجلات حسب البحث ونوع الحركة
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.instructor_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'ALL' || log.action_type === filterAction;

    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'SAVE_GRADES':
        return <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 w-fit"><FileSpreadsheet className="w-3.5 h-3.5" /> حفظ درجات</span>;
      case 'UPDATE_ATTENDANCE':
        return <span className="bg-sky-500/10 text-sky-700 border border-sky-500/20 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> رصد حضور</span>;
      case 'CREATE_ASSIGNMENT':
        return <span className="bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 w-fit"><ClipboardList className="w-3.5 h-3.5" /> طرح واجب</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-700 border border-slate-500/20 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 w-fit"><Activity className="w-3.5 h-3.5" /> إجراء عام</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 font-sans dir-rtl text-right space-y-6">
      
      {/* الترويسة العلوية */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#0E3354] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-black">سجل الأمان ومراقبة حركات الكادر الأكاديمي</h1>
            <p className="text-xs text-slate-300 font-mono mt-0.5">Audit Trail System // Realtime Activity Logs</p>
          </div>
        </div>

        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث السجلات</span>
        </button>
      </div>

      {/* كروت الإحصائيات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي العمليات المسجلة</p>
            <h3 className="text-xl font-black text-[#0A2540] mt-1">{logs.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Activity className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">حفظ الدرجات اليوم</p>
            <h3 className="text-xl font-black text-emerald-700 mt-1">{logs.filter(l => l.action_type === 'SAVE_GRADES').length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileSpreadsheet className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">الواجبات المطروحة</p>
            <h3 className="text-xl font-black text-indigo-700 mt-1">{logs.filter(l => l.action_type === 'CREATE_ASSIGNMENT').length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ClipboardList className="w-5 h-5" /></div>
        </div>
      </div>

      {/* شريط أدوات البحث والفلترة */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input 
            type="text" 
            placeholder="البحث بالرقم الأكاديمي للدكتور أو بالتفاصيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="ALL">جميع الإجراءات</option>
            <option value="SAVE_GRADES">حفظ درجات</option>
            <option value="UPDATE_ATTENDANCE">رصد حضور</option>
            <option value="CREATE_ASSIGNMENT">طرح واجبات</option>
          </select>
        </div>
      </div>

      {/* جدول عرض السجلات التفاعلي */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="text-center py-12 text-xs font-bold text-slate-400 animate-pulse">
            🔄 جاري تحميل سجلات حركات الدكاترة...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-400">لا توجد عمليات مسجلة مطابقة للبحث حالياً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-600">
                  <th className="p-3.5">الوقت والتاريخ</th>
                  <th className="p-3.5">الدكتور (المعرف)</th>
                  <th className="p-3.5">نوع الإجراء</th>
                  <th className="p-3.5">تفاصيل العملية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 dir-ltr text-right">
                      {new Date(log.created_at).toLocaleString('ar-YE', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="p-3.5 font-mono text-[#0A2540] font-black">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.instructor_id}</span>
                      </div>
                    </td>
                    <td className="p-3.5">{getActionBadge(log.action_type)}</td>
                    <td className="p-3.5 text-slate-800 font-bold">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}