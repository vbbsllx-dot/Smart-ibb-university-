"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Users, 
  ImageIcon, 
  BookOpen, 
  GraduationCap, 
  FolderGit2, 
  LogOut,
  FileText,
  UserPlus
} from 'lucide-react';

import RequestsManager from '../../components/admin/RequestsManager';
import AdsManager from '../../components/admin/AdsManager';
import ResourcesManager from '../../components/admin/ResourcesManager';
import ThesesManager from '../../components/admin/ThesesManager';
import ProjectsManager from '../../components/admin/ProjectsManager';
import StudentTransactions from '../../components/admin/StudentTransactions';

export type AdminTab = 'requests' | 'ads' | 'resources' | 'theses' | 'projects' | 'transactions';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>('جاري التحميل...');
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isMaster, setIsMaster] = useState(true);

  // حالة النافذة المنبثقة لإضافة مشرف فرعي
  const [isSubAdminModalOpen, setIsSubAdminModalOpen] = useState(false);
  const [subAdminForm, setSubAdminForm] = useState({
    name: '',
    job_title: '',
    username: '',
    password: '',
    can_requests: false,
    can_transactions: false,
    can_ads: false,
    can_resources: false,
    can_projects: false,
    can_theses: false,
  });

  const [permissions, setPermissions] = useState({
    can_requests: true,
    can_transactions: true,
    can_ads: true,
    can_resources: true,
    can_projects: true,
    can_theses: true,
  });

  useEffect(() => {
    const activeAdmin = localStorage.getItem('admin_username');
    const adminType = localStorage.getItem('admin_type');

    if (!activeAdmin) {
      router.push('/admin');
    } else {
      setAdminName(activeAdmin);
      if (adminType === 'subadmin') {
        setIsMaster(false);
        fetchSubAdminPermissions(activeAdmin);
      } else {
        setIsMaster(true);
      }
      fetchPendingCount();
    }
  }, [router]);

  const fetchSubAdminPermissions = async (username: string) => {
    const { data } = await supabase.from('subadmins').select('*').eq('username', username).single();
    if (data) {
      setPermissions({
        can_requests: data.can_requests,
        can_transactions: data.can_transactions,
        can_ads: data.can_ads,
        can_resources: data.can_resources,
        can_projects: data.can_projects,
        can_theses: data.can_theses,
      });
      if (data.can_requests) setActiveTab('requests');
      else if (data.can_transactions) setActiveTab('transactions');
      else if (data.can_ads) setActiveTab('ads');
      else if (data.can_resources) setActiveTab('resources');
      else if (data.can_projects) setActiveTab('projects');
      else if (data.can_theses) setActiveTab('theses');
    }
  };

  const fetchPendingCount = async () => {
    const { count } = await supabase.from('user_accounts').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    if (count !== null) setPendingCount(count);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_type');
    router.push('/admin');
  };

  const hasPermission = (key: keyof typeof permissions) => isMaster || permissions[key];

  // حفظ المشرف الفرعي الجديد في قاعدة البيانات
  const handleSaveSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // جلب ID الأدمن الرئيسي الحالي لربطه بـ created_by
      const { data: adminData } = await supabase.from('user_accounts').select('id').eq('username', adminName).single();
      
      const { error } = await supabase.from('subadmins').insert([{
        name: subAdminForm.name,
        job_title: subAdminForm.job_title,
        username: subAdminForm.username,
        password: subAdminForm.password,
        can_requests: subAdminForm.can_requests,
        can_transactions: subAdminForm.can_transactions,
        can_ads: subAdminForm.can_ads,
        can_resources: subAdminForm.can_resources,
        can_projects: subAdminForm.can_projects,
        can_theses: subAdminForm.can_theses,
        created_by: adminData ? adminData.id : null
      }]);

      if (error) throw error;
      alert('تم إنشاء المشرف الفرعي بنجاح!');
      setIsSubAdminModalOpen(false);
      setSubAdminForm({ name: '', job_title: '', username: '', password: '', can_requests: false, can_transactions: false, can_ads: false, can_resources: false, can_projects: false, can_theses: false });
    } catch (err: any) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2ee] text-slate-800 font-sans select-none relative overflow-hidden" dir="rtl">
      
      <header className="bg-[#062c35] border-b border-[#0d4e5d] px-6 py-4 sticky top-0 z-50 backdrop-blur-xl shadow-lg flex flex-col xl:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#00bc7e]/15 border border-[#00bc7e]/30 flex items-center justify-center text-[#00bc7e] shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-white tracking-wide flex items-center gap-2">
              الكنترول المركزي لجامعة إب الذكية
              <span className="text-[9px] font-mono font-black bg-[#00bc7e]/20 text-[#00bc7e] border border-[#00bc7e]/40 px-2.5 py-0.5 rounded-md">
                {isMaster ? 'MASTER ADMIN' : 'SUB-ADMIN'}
              </span>
            </h1>
            <p className="text-xs font-bold text-slate-300 mt-0.5">المسؤول: <span className="text-[#00bc7e]">{adminName}</span></p>
          </div>
        </div>

        {/* 🎛️ شريط التنقل والأيقونة الإضافية للمشرف الرئيسي */}
        <div className="flex items-center gap-3">
          {/* زر إضافة مشرف فرعي يظهر فقط للمشرف الرئيسي */}
          {isMaster && (
            <button
              onClick={() => setIsSubAdminModalOpen(true)}
              className="px-4 py-2.5 bg-[#00bc7e]/20 hover:bg-[#00bc7e] text-[#00bc7e] hover:text-slate-950 border border-[#00bc7e]/40 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مشرف فرعي</span>
            </button>
          )}

          <nav className="flex items-center gap-1.5 bg-[#041a21]/70 p-1.5 rounded-2xl border border-[#0d4e5d] overflow-x-auto max-w-full">
            {hasPermission('can_requests') && (
              <button onClick={() => setActiveTab('requests')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'requests' ? 'bg-gradient-to-r from-[#059669] to-[#00bc7e] text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
                <Users className="w-4 h-4 text-[#00bc7e]" />
                <span>طلبات الانضمام</span>
                {pendingCount > 0 && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">{pendingCount}</span>}
              </button>
            )}
            {hasPermission('can_transactions') && (
              <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'transactions' ? 'bg-gradient-to-r from-[#059669] to-[#00bc7e] text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
                <FileText className="w-4 h-4 text-[#00bc7e]" />
                <span>معاملات الطلاب</span>
              </button>
            )}
            {hasPermission('can_ads') && (
              <button onClick={() => setActiveTab('ads')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'ads' ? 'bg-gradient-to-r from-[#059669] to-[#00bc7e] text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
                <ImageIcon className="w-4 h-4 text-[#00bc7e]" />
                <span>الإعلانات</span>
              </button>
            )}
            {hasPermission('can_resources') && (
              <button onClick={() => setActiveTab('resources')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'resources' ? 'bg-gradient-to-r from-[#059669] to-[#00bc7e] text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
                <BookOpen className="w-4 h-4 text-[#00bc7e]" />
                <span>المراجع</span>
              </button>
            )}
            {hasPermission('can_theses') && (
              <button onClick={() => setActiveTab('theses')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'theses' ? 'bg-gradient-to-r from-[#059669] to-[#00bc7e] text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
                <GraduationCap className="w-4 h-4 text-[#00bc7e]" />
                <span>الماجستير</span>
              </button>
            )}
            {hasPermission('can_projects') && (
              <button onClick={() => setActiveTab('projects')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'projects' ? 'bg-gradient-to-r from-[#059669] to-[#00bc7e] text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
                <FolderGit2 className="w-4 h-4 text-[#00bc7e]" />
                <span>مشاريع التخرج</span>
              </button>
            )}
          </nav>
        </div>

        <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج</span>
        </button>
      </header>

      <main className="p-4 md:p-8 max-w-[1550px] mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
            {activeTab === 'requests' && hasPermission('can_requests') && <RequestsManager onStatusChange={fetchPendingCount} />}
            {activeTab === 'transactions' && hasPermission('can_transactions') && <StudentTransactions />}
            {activeTab === 'ads' && hasPermission('can_ads') && <AdsManager />}
            {activeTab === 'resources' && hasPermission('can_resources') && <ResourcesManager adminName={adminName} />}
            {activeTab === 'theses' && hasPermission('can_theses') && <ThesesManager />}
            {activeTab === 'projects' && hasPermission('can_projects') && <ProjectsManager />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 🏛️ النافذة المنبثقة لإضافة مشرف فرعي وصلاحياته */}
      {isSubAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#062c35] border border-[#00bc7e]/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white">
            <div className="flex justify-between items-center mb-4 border-b border-[#0d4e5d] pb-3">
              <h3 className="font-black text-base text-[#00bc7e]">إنشاء مشرف فرعي جديد</h3>
              <button onClick={() => setIsSubAdminModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveSubAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الشخص</label>
                  <input type="text" required value={subAdminForm.name} onChange={(e) => setSubAdminForm({...subAdminForm, name: e.target.value})} className="w-full bg-[#041a21] border border-[#0d4e5d] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00bc7e]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">المسمى الوظيفي</label>
                  <input type="text" required value={subAdminForm.job_title} onChange={(e) => setSubAdminForm({...subAdminForm, job_title: e.target.value})} className="w-full bg-[#041a21] border border-[#0d4e5d] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00bc7e]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم المستخدم</label>
                  <input type="text" required value={subAdminForm.username} onChange={(e) => setSubAdminForm({...subAdminForm, username: e.target.value})} className="w-full bg-[#041a21] border border-[#0d4e5d] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00bc7e]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور</label>
                  <input type="text" required value={subAdminForm.password} onChange={(e) => setSubAdminForm({...subAdminForm, password: e.target.value})} className="w-full bg-[#041a21] border border-[#0d4e5d] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00bc7e]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00bc7e] mb-2">تحديد الصلاحيات المسموحة (اختر ما يناسبه):</label>
                <div className="grid grid-cols-2 gap-2 bg-[#041a21] p-3 rounded-2xl border border-[#0d4e5d] text-xs">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={subAdminForm.can_requests} onChange={(e) => setSubAdminForm({...subAdminForm, can_requests: e.target.checked})} className="rounded text-[#00bc7e]" /> طلبات الانضمام</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={subAdminForm.can_transactions} onChange={(e) => setSubAdminForm({...subAdminForm, can_transactions: e.target.checked})} className="rounded text-[#00bc7e]" /> معاملات الطلاب</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={subAdminForm.can_ads} onChange={(e) => setSubAdminForm({...subAdminForm, can_ads: e.target.checked})} className="rounded text-[#00bc7e]" /> شريط الإعلانات</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={subAdminForm.can_resources} onChange={(e) => setSubAdminForm({...subAdminForm, can_resources: e.target.checked})} className="rounded text-[#00bc7e]" /> رفع المراجع</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={subAdminForm.can_projects} onChange={(e) => setSubAdminForm({...subAdminForm, can_projects: e.target.checked})} className="rounded text-[#00bc7e]" /> مشاريع التخرج</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={subAdminForm.can_theses} onChange={(e) => setSubAdminForm({...subAdminForm, can_theses: e.target.checked})} className="rounded text-[#00bc7e]" /> رسائل الماجستير</label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsSubAdminModalOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold cursor-pointer">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-[#059669] to-[#00bc7e] text-slate-950 font-black rounded-xl text-xs shadow-lg cursor-pointer">حفظ وحفظ الصلاحيات</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}