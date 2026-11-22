import React, { useEffect, useState } from 'react';
import { Shield, Globe, Power, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { safeStorage } from '../lib/storage';

import type { Language } from '../i18n/translations';

interface HeaderProps {
  isAdmin: boolean;
  onReboot: () => void;
  onCheckUpdate?: () => void;
  updateAvailable?: boolean;
}

const LANGUAGE_CYCLE: readonly Language[] = ['ko', 'en', 'ja', 'zh'];

const THEMES = [
  { id: 'default', color: '#0067c0', labelKey: 'themeDefault' as const },
  { id: 'dark', color: '#0f172a', labelKey: 'themeDark' as const },
  { id: 'emerald', color: '#10b981', labelKey: 'themeEmerald' as const },
  { id: 'sunset', color: '#f97316', labelKey: 'themeSunset' as const }
];

export const Header: React.FC<HeaderProps> = ({ isAdmin, onReboot, onCheckUpdate, updateAvailable }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const savedTheme = safeStorage.getItem('app-theme') || 'dark';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    safeStorage.setItem('app-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const toggleLanguage = () => {
    const idx = LANGUAGE_CYCLE.indexOf(language);
    const nextLang = LANGUAGE_CYCLE[(idx + 1) % LANGUAGE_CYCLE.length];
    setLanguage(nextLang);
  };

  return (
    <header className="mb-2 flex justify-between items-center shrink-0">
      <div>
        <div className={`flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-wider mb-0.5 ${isAdmin ? 'text-primary' : 'text-text-muted'}`}>
          <Shield size={12} />
          <span>{isAdmin ? t('adminMode') : t('standardMode')}</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight leading-none">{t('appTitle')}</h1>
        <p className="text-[10px] text-text-muted mt-1">{t('appDesc')}</p>
      </div>
      
      <div className="flex items-center gap-1.5">
        {onCheckUpdate && (
          <button
            type="button"
            onClick={onCheckUpdate}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm transition-all cursor-pointer ${
              updateAvailable
                ? 'bg-primary text-white border border-primary animate-pulse'
                : 'bg-card border border-border text-text-muted hover:text-primary hover:border-primary/40'
            }`}
            title={t('checkForUpdates')}
          >
            <Sparkles size={11} className={updateAvailable ? 'text-white' : 'text-primary'} />
            <span>{updateAvailable ? t('updateAvailableBadge') : t('checkForUpdates')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReboot}
          className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full shadow-sm text-[10px] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
          title={t('rebootSystem')}
        >
          <Power size={12} />
          {t('rebootSystem')}
        </button>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1 bg-card border border-border px-2 py-1 rounded-full shadow-sm text-[10px] font-bold text-text-muted hover:text-primary transition-colors cursor-pointer"
          title={t('toggleLanguage')}
        >
          <Globe size={12} />
          {language.toUpperCase()}
        </button>

        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-full shadow-sm">
          {THEMES.map(theme => (
            <button
              type="button"
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${currentTheme === theme.id ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-bg' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
              style={{ backgroundColor: theme.color }}
              title={t(theme.labelKey)}
            />
          ))}
        </div>
      </div>
    </header>
  );
};
