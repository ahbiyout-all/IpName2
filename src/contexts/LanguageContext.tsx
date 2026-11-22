import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, Language } from '../i18n/translations';
import { safeStorage } from '../lib/storage';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['ko']) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectBrowserLanguage(): Language {
  try {
    const langs = navigator.languages || [navigator.language || 'en'];
    for (const l of langs) {
      if (!l) continue;
      const lower = l.toLowerCase();
      if (lower.startsWith('ko')) return 'ko';
      if (lower.startsWith('ja')) return 'ja';
      if (lower.startsWith('zh')) return 'zh';
      if (lower.startsWith('en')) return 'en';
    }
  } catch {
    // fallback
  }
  return 'en';
}

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = safeStorage.getItem('app-lang') as Language;
    if (savedLang && ['ko', 'en', 'ja', 'zh'].includes(savedLang)) {
      return savedLang;
    }
    return detectBrowserLanguage();
  });

  useEffect(() => {
    try {
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
    } catch {
      // ignore in non-DOM environments
    }
  }, [language]);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    safeStorage.setItem('app-lang', lang);
  }, []);

  const t = useCallback((key: keyof typeof translations['ko']) => {
    const dict = translations[language] || translations['ko'];
    return dict[key] || translations['ko'][key] || key;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage: handleSetLanguage, t }),
    [language, handleSetLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
