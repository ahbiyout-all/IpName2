import React, { useState } from 'react';
import { Settings, AlertCircle, User, Building, Globe, ShieldCheck, ExternalLink, FileText, Github } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Modal } from './Modal';

interface FooterProps {
  onCheckUpdate?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onCheckUpdate }) => {
  const { t } = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const openSourceLicenses = [
    { name: 'React', version: 'v19.0.0', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.', url: 'https://react.dev' },
    { name: 'Vite', version: 'v6.2.0', license: 'MIT', copyright: 'Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors.', url: 'https://vite.dev' },
    { name: 'Tauri', version: 'v2.11.1', license: 'MIT / Apache-2.0', copyright: 'Copyright (c) 2017-present, Tauri Apps Contributors.', url: 'https://tauri.app' },
    { name: 'Tailwind CSS', version: 'v4.1.14', license: 'MIT', copyright: 'Copyright (c) Tailwind Labs, Inc.', url: 'https://tailwindcss.com' },
    { name: 'IpNameCore Native DLL', version: 'v1.0.0 (ipname_core.dll)', license: 'MIT', copyright: 'Copyright (c) 2026 AhBiYout (Pure Creative Native Engine)', url: 'https://github.com/AhBiYout-all' },
    { name: 'Lucide React', version: 'v0.546.0', license: 'ISC', copyright: 'Copyright (c) 2020, Lucide Contributors', url: 'https://lucide.dev' },
    { name: 'Better-SQLite3', version: 'v12.4.1', license: 'MIT', copyright: 'Copyright (c) 2017-present Joshua Wise', url: 'https://github.com/WiseLibs/better-sqlite3' },
    { name: 'Motion', version: 'v12.23.24', license: 'MIT', copyright: 'Copyright (c) 2018 Framer B.V.', url: 'https://motion.dev' },
    { name: 'Jimp', version: 'v0.22.10', license: 'MIT', copyright: 'Copyright (c) 2018 Oliver Moran', url: 'https://github.com/jimp-dev/jimp' },
    { name: 'Serde (Rust)', version: 'v1.0', license: 'MIT / Apache-2.0', copyright: 'Copyright (c) 2014-2017 Erick Tryzelaar and David Tolnay', url: 'https://serde.rs' },
    { name: 'Base64 (Rust)', version: 'v0.22', license: 'MIT / Apache-2.0', copyright: 'Copyright (c) 2015 Alice Ryhl', url: 'https://github.com/marshallpierce/rust-base64' },
    { name: 'Log (Rust)', version: 'v0.4', license: 'MIT / Apache-2.0', copyright: 'Copyright (c) 2015-2018 rust-lang-nursery', url: 'https://github.com/rust-lang/log' }
  ];

  return (
    <>
      <footer className="mt-2 pt-2 border-t border-border flex flex-wrap justify-between items-center gap-3 text-muted-foreground text-[10px] tracking-wide font-medium shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors focus:outline-none font-bold"
            title="About / Licenses"
          >
            <Settings size={11} className="animate-pulse text-primary" />
            <span>v1.12-STABLE</span>
          </button>
          <div className="flex items-center gap-1 text-foreground/80" title={`${t('author')}: AhBiYout`}>
            <User size={11} className="text-primary/70" />
            <span className="font-semibold">AhBiYout</span>
          </div>
          <div className="flex items-center gap-1" title="GitHub: https://github.com/AhBiYout-all">
            <Github size={11} className="text-primary/70" />
            <a 
              href="https://github.com/AhBiYout-all" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors font-medium text-foreground/70"
            >
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-1" title={`${t('blog')}: https://ahbiyoutvibe.blogspot.com/`}>
            <Globe size={11} className="text-primary/70" />
            <a 
              href="https://ahbiyoutvibe.blogspot.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors font-medium text-foreground/70"
            >
              ahbiyoutvibe.blogspot.com
            </a>
          </div>
          <div className="flex items-center gap-1" title={`${t('affiliation')}: http://www.cisnet.co.kr/`}>
            <Building size={11} className="text-primary/70" />
            <a 
              href="http://www.cisnet.co.kr/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors font-medium text-foreground/70"
            >
              www.cisnet.co.kr
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {onCheckUpdate && (
            <button
              onClick={onCheckUpdate}
              className="text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {t('checkForUpdates')}
            </button>
          )}
          <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[9px] uppercase tracking-wider">
            <AlertCircle size={11} />
            <span>REBOOT REQUIRED</span>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        title={t('aboutTitle')}
        footer={
          <button
            onClick={() => setIsAboutOpen(false)}
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg text-xs transition-colors shadow-sm focus:outline-none cursor-pointer"
          >
            {t('close')}
          </button>
        }
      >
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {/* Main App Info Section */}
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
              <Settings size={24} className="animate-spin-slow" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base text-foreground leading-tight">IpName2 v1.12.7</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{t('appDesc')}</p>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-2.5 border-t border-border/40 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Settings size={12} className="text-primary/70 shrink-0" />
                  <span>{t('version')}: <strong className="text-foreground font-medium">v1.12.7 (STABLE)</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User size={12} className="text-primary/70 shrink-0" />
                  <span>{t('author')}: <strong className="text-foreground font-medium">AhBiYout</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Github size={12} className="text-primary/70 shrink-0" />
                  <span>GitHub: </span>
                  <a
                    href="https://github.com/AhBiYout-all"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium flex items-center gap-0.5"
                  >
                    github.com/AhBiYout-all
                    <ExternalLink size={9} />
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe size={12} className="text-primary/70 shrink-0" />
                  <span>{t('blog')}: </span>
                  <a
                    href="https://ahbiyoutvibe.blogspot.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium flex items-center gap-0.5"
                  >
                    ahbiyoutvibe.blogspot.com
                    <ExternalLink size={9} />
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                  <Building size={12} className="text-primary/70 shrink-0" />
                  <span>{t('affiliation')}: </span>
                  <a
                    href="http://www.cisnet.co.kr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium flex items-center gap-0.5"
                  >
                    www.cisnet.co.kr
                    <ExternalLink size={9} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & License Notice Section */}
          <div className="flex flex-col gap-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText size={14} className="text-primary" />
              {t('licenseNoticeTitle')}
            </h5>
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/60 flex flex-col gap-2 text-[11px] text-muted-foreground leading-relaxed">
              <p>{t('termsPoint1')}</p>
              <p>{t('termsPoint2')}</p>
              <p>{t('termsPoint3')}</p>
            </div>
          </div>

          {/* License Info Section */}
          <div className="flex flex-col gap-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              {t('openSourceLicenses')}
            </h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('licenseDesc')}
            </p>

            {/* Scrollable list of dependencies */}
            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 border border-border rounded-xl p-2 bg-card-hover/20">
              {openSourceLicenses.map((lib, idx) => (
                <div 
                  key={idx} 
                  className="p-2 rounded-lg bg-card border border-border hover:border-primary/30 hover:bg-secondary/10 transition-all text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between font-bold text-[12px]">
                    <span className="text-foreground">{lib.name} <span className="text-[10px] text-muted-foreground font-medium">{lib.version}</span></span>
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] rounded font-bold uppercase tracking-wide">
                      {lib.license}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {lib.copyright}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <Globe size={10} className="text-muted-foreground/70" />
                    <a 
                      href={lib.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-primary/80 hover:text-primary hover:underline flex items-center gap-0.5 transition-colors"
                    >
                      {lib.url.replace(/^https?:\/\//, '')}
                      <ExternalLink size={8} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Removed bottom credit tag */}
        </div>
      </Modal>
    </>
  );
};

