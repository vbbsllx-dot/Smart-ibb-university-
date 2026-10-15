import React from 'react';
import SmartMCQGenerator from '@/app/components/SmartMCQGenerator';

export const metadata = {
  title: 'توليد الاختبارات الذكية | بوابة الطالب',
};

export default function StudentMCQPage() {
  return (
    <div className="min-h-screen pt-20 pb-10">
      {/* استدعاء المكون مع الثيم الزمردي الخاص بالطالب */}
      <SmartMCQGenerator theme="emerald" />
    </div>
  );
}