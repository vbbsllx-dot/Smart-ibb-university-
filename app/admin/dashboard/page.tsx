"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>('جاري التحميل...');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const username = localStorage.getItem('admin_username');
    if (!username) {
      router.push('/admin');
    } else {
      setAdminName(username);
      fetchPendingRequests();
    }
  }, [router]);

  // 🚀 دالة الجلب المحدثة لربط الجداول (Joins)
  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      // نقوم بجلب الحسابات + بيانات الطالب المرتبطة + بيانات المعلم المرتبطة
      const { data, error } = await supabase
        .from('user_accounts')
        .select(`
          id, username, role, created_at,
          students(name, student_id),
          instructors(name, id)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("خطأ في جلب البيانات:", error);
      } else if (data) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error("حدث خطأ غير متوقع:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (accountId: number, newStatus: 'approved' | 'rejected') => {
    if (!window.confirm(`هل أنت متأكد؟`)) return;
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ status: newStatus })
        .eq('id', accountId);

      if (error) throw error;
      alert(`✅ تم تحديث الطلب بنجاح`);
      fetchPendingRequests();
    } catch (err) {
      alert("🚨 حدث خطأ.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_username');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" dir="rtl">
      {/* ... (الـ Header يبقى كما هو) ... */}
      
      <main className="p-8">
        <div className="bg-white rounded-2xl border border-slate-200 min-h-[600px] p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">طلبات الانضمام المعلقة</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-6 py-4">الاسم الكامل</th>
                  <th className="px-6 py-4">الرقم الأكاديمي</th>
                  <th className="px-6 py-4">اسم المستخدم</th>
                  <th className="px-6 py-4">نوع الحساب</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center">جاري التحميل...</td></tr>
                ) : pendingRequests.map((request) => {
                  // استخراج البيانات بناءً على الرتبة (Student أو Instructor)
                  const details = request.role === 'student' ? request.students?.[0] : request.instructors?.[0];
                  
                  return (
                    <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{details?.name || 'غير محدد'}</td>
                      <td className="px-6 py-4 font-mono">{details?.student_id || details?.id || '---'}</td>
                      <td className="px-6 py-4 text-slate-600">{request.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${request.role === 'student' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {request.role === 'student' ? 'طالب' : 'أكاديمي'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button onClick={() => handleUpdateStatus(request.id, 'approved')} className="px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 text-xs font-bold">قبول</button>
                        <button onClick={() => handleUpdateStatus(request.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-bold">رفض</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}