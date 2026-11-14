import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface QuickDnsSettingsProps {
  selectedAdapterId: string;
  disabled?: boolean;
  onApply: (adapterId: string, primary: string, secondary: string) => void;
}

export const QuickDnsSettings: React.FC<QuickDnsSettingsProps> = ({ selectedAdapterId, disabled = false, onApply }) => {
  const { t } = useLanguage();

  const handleApply = (primary: string, secondary: string) => {
    if (selectedAdapterId && !disabled) {
      onApply(selectedAdapterId, primary, secondary);
    }
  };

  return (
    <div className={`card p-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <h2 className="text-sm font-bold flex items-center gap-1.5 mb-2">
        <Globe size={14} className="text-primary" />
        {t('quickDns')}
      </h2>
      <div className="grid grid-cols-3 gap-2">
        <button 
          type="button"
          disabled={disabled || !selectedAdapterId}
          onClick={() => handleApply('168.126.63.1', '168.126.63.2')}
          className="p-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="font-bold text-xs mb-0.5 group-hover:text-primary transition-colors">KT</div>
          <div className="text-[9px] text-text-muted leading-tight">
            <div>168.126.63.1</div>
            <div>168.126.63.2</div>
          </div>
        </button>
        
        <button 
          type="button"
          disabled={disabled || !selectedAdapterId}
          onClick={() => handleApply('219.250.36.130', '210.220.163.82')}
          className="p-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="font-bold text-xs mb-0.5 group-hover:text-primary transition-colors">SKT</div>
          <div className="text-[9px] text-text-muted leading-tight">
            <div>219.250.36.130</div>
            <div>210.220.163.82</div>
          </div>
        </button>

        <button 
          type="button"
          disabled={disabled || !selectedAdapterId}
          onClick={() => handleApply('164.124.101.2', '203.248.252.2')}
          className="p-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="font-bold text-xs mb-0.5 group-hover:text-primary transition-colors">LG U+</div>
          <div className="text-[9px] text-text-muted leading-tight">
            <div>164.124.101.2</div>
            <div>203.248.252.2</div>
          </div>
        </button>
      </div>
    </div>
  );
};
