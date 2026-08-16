"use client";

import React from 'react';
import { useI18nToggle } from './I18nProvider';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, toggleLocale } = useI18nToggle();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-emerald-500/50 text-slate-200 hover:text-white transition-all duration-300 shadow-inner backdrop-blur-md cursor-pointer select-none active:scale-95"
      title={locale === 'ar' ? "Switch to English" : "التحويل للغة العربية"}
    >
      <Globe className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
      <span className="text-xs font-mono font-bold text-emerald-300 group-hover:text-emerald-200">
        {locale === 'ar' ? 'EN' : 'عربي'}
      </span>
    </button>
  );
}