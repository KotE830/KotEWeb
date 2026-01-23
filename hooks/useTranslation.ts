'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { translations } from '../locales';

export type Language = 'ko' | 'en' | 'ja';

export const LANGUAGE_OPTIONS: Array<{
  code: Language;
  label: string;
  flag: string;
}> = [
  { code: 'ko', label: '한국어', flag: 'https://flagcdn.com/w40/kr.png' },
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'ja', label: '日本語', flag: 'https://flagcdn.com/w40/jp.png' },
];

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Type guard function to check if a string is a valid Language
function isValidLanguage(lang: string | null): lang is Language {
  return lang !== null && LANGUAGE_OPTIONS.some(opt => opt.code === lang);
}

export function TranslationProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language');
      if (isValidLanguage(savedLang)) {
        setLanguageState(savedLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return React.createElement(
    TranslationContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

