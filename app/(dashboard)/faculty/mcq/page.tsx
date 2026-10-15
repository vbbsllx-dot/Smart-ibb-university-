import React from 'react';
import SmartMCQGenerator from '@/app/components/SmartMCQGenerator';

export const metadata = {
  title: 'توليد الاختبارات الذكية | بوابة الأكاديمي',
};

export default function FacultyMCQPage() {
  return (
    <div className="min-h-screen pt-20 pb-10">
      {/* استدعاء المكون مع الثيم الأزرق الخاص بالدكتور */}
      <SmartMCQGenerator theme="blue" />
    </div>
  );
}