import React, { memo } from 'react';
import { Monitor, HardDrive, Save, RefreshCw } from 'lucide-react';
import { SystemInfo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CopyButton } from './CopyButton';

interface SystemSectionProps {
  info: SystemInfo;
  originalInfo?: SystemInfo | null;
  isSaving: boolean;
  onUpdate: (field: keyof SystemInfo, value: string) => void;
  onSave: () => void;
}

export const SystemSection = memo(({ info, originalInfo, isSaving, onUpdate, onSave }: SystemSectionProps) => {
  const { t } = useLanguage();
  
  const isComputerNameChanged = originalInfo && info.computerName !== originalInfo.computerName;
  const isWorkgroupChanged = originalInfo && info.workgroup !== originalInfo.workgroup;
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="card p-3 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Monitor size={16} />
            </div>
            <h3 className="font-bold text-sm">{t('systemInfo')}</h3>
          </div>
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="btn-primary py-1 px-2 text-[10px] flex items-center gap-1 disabled:opacity-70"
          >
            {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            <span>{t('applyChanges')}</span>
          </button>
        </div>

        <div className="space-y-2 flex-1">
          <div>
            <label className="text-[9px] font-bold text-text-muted uppercase mb-0.5 flex items-center gap-1">
              <span>{t('computerName')}</span>
              {isComputerNameChanged && (
                <span className="text-red-600 normal-case tracking-normal">
                  → {info.computerName}
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={info.computerName}
                onChange={(e) => onUpdate('computerName', e.target.value)}
                className="input-field py-1 pl-2 pr-7 text-xs w-full"
                spellCheck={false}
              />
              <div className="absolute right-1">
                <CopyButton textToCopy={info.computerName} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-text-muted uppercase mb-0.5 flex items-center gap-1">
              <span>{t('workgroup')}</span>
              {isWorkgroupChanged && (
                <span className="text-red-600 normal-case tracking-normal">
                  → {info.workgroup}
                </span>
              )}
            </label>
            <input 
              type="text" 
              value={info.workgroup}
              onChange={(e) => onUpdate('workgroup', e.target.value)}
              className="input-field py-1 px-2 text-xs w-full"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-primary text-white rounded-[24px] overflow-hidden relative transition-all duration-300" style={{ boxShadow: '0 2px 12px var(--shadow-color)' }}>
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
            <HardDrive size={16} />
          </div>
          <h3 className="font-bold text-sm">{t('osInfo')}</h3>
        </div>
        <div className="space-y-1.5 relative z-10 text-xs">
          <div className="flex justify-between items-center py-0.5 border-b border-white/10">
            <span className="text-[10px] text-white/70">{t('edition')}</span>
            <span className="font-semibold text-[10px]">{info.osVersion}</span>
          </div>
          <div className="flex justify-between items-start py-0.5 border-b border-white/10 gap-2">
            <span className="text-[10px] text-white/70 shrink-0">{t('processor')}</span>
            <span className="font-semibold text-right text-[10px] break-words leading-tight" title={info.processor}>{info.processor}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-[10px] text-white/70">RAM</span>
            <span className="font-semibold text-[10px]">{info.ram}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

SystemSection.displayName = 'SystemSection';
