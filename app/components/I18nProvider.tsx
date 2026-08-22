"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import arMessages from './../messages/ar.json';
import enMessages from './../messages/en.json';

type Locale = 'ar' | 'en';

interface I18nContextType {
  locale: Locale;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ar');

  useEffect(() => {
    const savedLocale = localStorage.getItem('app_locale') as Locale;
    if (savedLocale === 'ar' || savedLocale === 'en') {
      setLocale(savedLocale);
      document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLocale;
    }
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    setLocale(nextLocale);
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLocale;
    localStorage.setItem('app_locale', nextLocale);
  };

  const messages = locale === 'ar' ? arMessages : enMessages;

  return (
    <I18nContext.Provider value={{ locale, toggleLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}

export const useI18nToggle = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nToggle must be used within an I18nProvider');
  }
  return context;
};