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
  Sparkles,
  ChevronLeft
} from 'lucide-react';

// 📦 استدعاء المكونات المستقلة للأقسام (سننشئ ملفاتها خطوة بخطوة)
import RequestsManager from '../../components/admin/RequestsManager';
import AdsManager from '../../components/admin/AdsManager';
import ResourcesManager from '../../components/admin/ResourcesManager';
import ThesesManager from '../../components/admin/ThesesManager';
import ProjectsManager from '../../components/admin/ProjectsManager';

export type AdminTab = 'requests' | 'ads' | 'resources' | 'theses' | 'projects';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>('جاري التحميل...');
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // 🛡️ فحص حماية الجلسة عند التشغيل
  useEffect(() => {
    const activeAdmin = localStorage.getItem('admin_username');
    if (!activeAdmin) {
      router.push('/admin');
    } else {
      setAdminName(activeAdmin);
      fetchPendingCount();
    }
  }, [router]);

  // 🔢 جلب عدد الطلبات المعلقة للشارة
  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!error && count !== null) {
        setPendingCount(count);
      }
    } catch (err) {
      console.error("خطأ في جلب السجلات المعلقة:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_username');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#060B14] text-slate-100 font-sans select-none relative overflow-hidden" dir="rtl">
      
      {/* 🌟 الهالات الخلفية الخاصة بالهوية البصرية */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[#0F5E49]/15 blur-[160px] -top-32 -right-32" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#0A2540]/30 blur-[150px] bottom-0 left-0" />
      </div>

      {/* 🏛️ 1. الهيدر السيادي العلوي */}
      <header className="bg-gradient-to-r from-[#0A2540] via-[#0E3354] to-[#0F5E49] border-b border-white/10 px-6 py-4 sticky top-0 z-50 backdrop-blur-xl shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* الشعار والبيانات */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-black/30 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner backdrop-blur-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-white tracking-wide flex items-center gap-2">
              الكنترول المركزي لجامعة إب
              <span className="text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                MASTER ADMIN NODE
              </span>
            </h1>
            <p className="text-xs font-bold text-slate-300 mt-0.5 flex items-center gap-1.5">
              <span>المسؤول المصرح:</span>
              <span className="text-emerald-300 font-mono font-black">{adminName}</span>
            </p>
          </div>
        </div>

        {/* 🎛️ 2. شريط التنقل بين المكونات الخمسة */}
        <nav className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner overflow-x-auto max-w-full">
          
          {/* تبويب 1: طلبات الحسابات */}
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'requests' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-300" />
            <span>طلبات الانضمام</span>
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          {/* تبويب 2: الإعلانات */}
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'ads' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-300" />
            <span>شريط الإعلانات</span>
          </button>

          {/* تبويب 3: المراجع والملازم */}
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'resources' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span>المراجع والملازم</span>
          </button>

          {/* تبويب 4: رسائل الماجستير */}
          <button
            onClick={() => setActiveTab('theses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'theses' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>رسائل الماجستير</span>
          </button>

          {/* تبويب 5: مشاريع التخرج */}
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'projects' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-emerald-300" />
            <span>مشاريع التخرج</span>
          </button>

        </nav>

        {/* زر تسجيل الخروج */}
        <button
          onClick={handleLogout}
          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج</span>
        </button>
      </header>

      {/* 📥 3. منطقة عرض المكون المستقل المختار */}
      <main className="p-4 md:p-8 max-w-[1550px] mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {activeTab === 'requests' && <RequestsManager onStatusChange={fetchPendingCount} />}
            {activeTab === 'ads' && <AdsManager />}
            {activeTab === 'resources' && <ResourcesManager adminName={adminName} />}
            {activeTab === 'theses' && <ThesesManager />}
            {activeTab === 'projects' && <ProjectsManager />}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}