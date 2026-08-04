"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface RequestsManagerProps {
  onStatusChange?: () => void;
}

export default function RequestsManager({ onStatusChange }: RequestsManagerProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select(`
          id, username, role, created_at,
          students(name, student_id),
          instructors(name, id)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (accountId: number, newStatus: 'approved' | 'rejected') => {
    if (!window.confirm(`هل أنت متأكد من ${newStatus === 'approved' ? 'قبول' : 'رفض'} هذا الحساب؟`)) return;
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ status: newStatus })
        .eq('id', accountId);

      if (error) throw error;
      alert(`✅ تم تحديث حالة الحساب بنجاح`);
      fetchPendingRequests();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      alert("🚨 حدث خطأ أثناء التحديث: " + err.message);
    }
  };

  return (
    <section className="bg-[#0D1629]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-sm md:text-base font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> إدارة طلبات الانضمام المعلقة
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">مراجعة واعتماد حسابات الطلاب والدكاترة الجدد</p>
        </div>
        <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-xl">
          الطلبات: {pendingRequests.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right text-slate-300">
          <thead className="text-[11px] font-black uppercase text-slate-400 bg-black/40 border-y border-white/10">
            <tr>
              <th className="px-5 py-4">الاسم الكامل</th>
              <th className="px-5 py-4">الرقم الأكاديمي/المعرف</th>
              <th className="px-5 py-4">اسم المستخدم</th>
              <th className="px-5 py-4">نوع الحساب</th>
              <th className="px-5 py-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                  <span>جاري فحص الطلبات المعلقة...</span>
                </td>
              </tr>
            ) : pendingRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                  🎉 لا توجد طلبات معلقة حالياً!
                </td>
              </tr>
            ) : (
              pendingRequests.map((req) => {
                const details = req.role === 'student' ? req.students?.[0] : req.instructors?.[0];
                return (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">{details?.name || 'غير محدد'}</td>
                    <td className="px-5 py-4 font-mono text-emerald-300">{details?.student_id || details?.id || '---'}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono">{req.username}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                        req.role === 'student' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}>
                        {req.role === 'student' ? 'طالب' : 'أكاديمي'}
                      </span>
                    </td>
                    <td className="px-5 py-4 flex justify-center gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'approved')} 
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> قبول
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'rejected')} 
                        className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> رفض
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}