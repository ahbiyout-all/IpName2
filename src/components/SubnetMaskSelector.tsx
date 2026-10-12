import React, { useState, useRef, useEffect, memo } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface SubnetPreset {
  mask: string;
  cidr: string;
  descKo: string;
  descEn: string;
  isDefault?: boolean;
}

export const SUBNET_PRESETS: SubnetPreset[] = [
  { mask: '255.255.255.0', cidr: '/24', descKo: 'Class C (기본 256 IP)', descEn: 'Class C (Default 256 IPs)', isDefault: true },
  { mask: '255.255.255.128', cidr: '/25', descKo: '128 IP (서브넷 분할)', descEn: '128 IPs (Subnetting)' },
  { mask: '255.255.255.192', cidr: '/26', descKo: '64 IP', descEn: '64 IPs' },
  { mask: '255.255.255.224', cidr: '/27', descKo: '32 IP', descEn: '32 IPs' },
  { mask: '255.255.255.240', cidr: '/28', descKo: '16 IP', descEn: '16 IPs' },
  { mask: '255.255.255.248', cidr: '/29', descKo: '8 IP', descEn: '8 IPs' },
  { mask: '255.255.255.252', cidr: '/30', descKo: '4 IP (P2P / 게이트웨이)', descEn: '4 IPs (Point-to-Point)' },
  { mask: '255.255.0.0', cidr: '/16', descKo: 'Class B (65,536 IP)', descEn: 'Class B (65,536 IPs)' },
  { mask: '255.0.0.0', cidr: '/8', descKo: 'Class A (16,777,216 IP)', descEn: 'Class A (16,777,216 IPs)' },
];

interface SubnetMaskSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const SubnetMaskSelector: React.FC<SubnetMaskSelectorProps> = memo(({
  value,
  onChange,
  disabled = false,
  placeholder = '255.255.255.0'
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (mask: string) => {
    onChange(mask);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => !disabled && setIsOpen(true)}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className="input-field font-mono py-1 pl-2 pr-7 text-[10px] w-full"
          placeholder={placeholder}
          spellCheck={false}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-1 text-text-muted hover:text-primary transition-colors p-1 focus:outline-none cursor-pointer disabled:opacity-50"
          title={t('presetSubnetMasks')}
        >
          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </button>
      </div>

      {isOpen && !disabled && (
        <div 
          className="absolute left-0 top-full mt-1 w-[260px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="p-2 border-b border-[var(--border)] bg-[var(--input-bg)] flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              {t('presetSubnetMasks')}
            </span>
            <span className="text-[9px] text-text-muted">
              {language === 'ko' ? '클릭 시 즉시 적용' : 'Click to select'}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
            {SUBNET_PRESETS.map((preset) => {
              const isSelected = value.trim() === preset.mask;
              return (
                <button
                  key={preset.mask}
                  type="button"
                  onClick={() => handleSelect(preset.mask)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] flex items-center justify-between transition-colors mb-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-[var(--input-bg)] text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[11px]">{preset.mask}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-primary/10 text-primary rounded font-mono font-semibold">
                      {preset.cidr}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-text-muted truncate max-w-[85px]">
                      {language === 'ko' ? preset.descKo : preset.descEn}
                    </span>
                    {isSelected ? (
                      <Check size={12} className="text-primary shrink-0" />
                    ) : preset.isDefault ? (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 rounded font-medium">
                        {language === 'ko' ? '기본' : 'Def'}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

SubnetMaskSelector.displayName = 'SubnetMaskSelector';
