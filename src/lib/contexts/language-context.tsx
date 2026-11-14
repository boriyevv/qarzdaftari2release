'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { AppLanguage, TranslationDictionary, translations } from '@/lib/i18n/translations'

interface LanguageContextType {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  dict: TranslationDictionary
  t: (path: string, fallback?: string) => string
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  locale: string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LOCALE_MAP: Record<AppLanguage, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('uz')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('qd_preferred_lang') || localStorage.getItem('qd_language')
      if (savedLang === 'ru' || savedLang === 'en' || savedLang === 'uz') {
        setLanguageState(savedLang)
        document.documentElement.lang = savedLang
      }
    }
  }, [])

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('qd_preferred_lang', lang)
      localStorage.setItem('qd_language', lang)
      document.documentElement.lang = lang
      window.dispatchEvent(new CustomEvent('qarzdaftari:language-changed', { detail: { lang } }))
    }
  }

  const dict = useMemo(() => {
    return translations[language] || translations.uz
  }, [language])

  const t = (path: string, fallback?: string): string => {
    try {
      const parts = path.split('.')
      let current: any = dict
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part]
        } else {
          return fallback || path
        }
      }
      return typeof current === 'string' ? current : fallback || path
    } catch {
      return fallback || path
    }
  }

  const locale = LOCALE_MAP[language] || 'uz-UZ'

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString(locale, options || { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return '-'
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict, t, formatDate, locale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Graceful fallback outside provider
    return {
      language: 'uz' as AppLanguage,
      setLanguage: () => {},
      dict: translations.uz,
      t: (path: string, fallback?: string) => fallback || path,
      formatDate: (date: Date | string) => (typeof date === 'string' ? date : date.toLocaleDateString('uz-UZ')),
      locale: 'uz-UZ',
    }
  }
  return context
}
