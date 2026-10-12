import React, { memo, useState } from 'react';
import { Network, Wifi, Save, RefreshCw, Sparkles, Power, PowerOff, Layers, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NetworkAdapter, NativeIpConflictResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CopyButton } from './CopyButton';
import { SubnetMaskSelector } from './SubnetMaskSelector';
import { isVirtualAdapter } from '../hooks/useSystemConfig';
import { isTauriEnv } from '../lib/powershell';

interface AdapterItemProps {
  adapter: NetworkAdapter;
  isSaving: boolean;
  onUpdate: (id: string, field: keyof NetworkAdapter | Partial<NetworkAdapter>, value?: any) => void;
  onSave: () => void;
  onRequestToggleEnabled?: (id: string, targetState: boolean, adapterName: string) => void;
}

export const AdapterItem = memo(({ adapter, isSaving, onUpdate, onSave, onRequestToggleEnabled }: AdapterItemProps) => {
  const { t } = useLanguage();

  // Smart IP helper enabled by default on app start, persisted in localStorage
  const [smartHelperEnabled, setSmartHelperEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ipname_smart_helper_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Pure Native DLL (ipname_core) ARP IP Conflict state
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<NativeIpConflictResult | null>(null);

  const handleCheckConflict = async () => {
    if (!adapter.ipAddress || isCheckingConflict) return;
    setIsCheckingConflict(true);
    setConflictResult(null);

    if (isTauriEnv()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<NativeIpConflictResult>('check_ip_conflict', {
          targetIp: adapter.ipAddress.trim(),
          sourceIp: null
        });
        setConflictResult(res);
      } catch (err: any) {
        setConflictResult({
          is_conflict: false,
          conflicting_mac: '',
          message: err?.message || '검사 완료'
        });
      } finally {
        setIsCheckingConflict(false);
      }
    } else {
      // Mock for web preview
      setTimeout(() => {
        const isConflict = adapter.ipAddress.endsWith('.99');
        setConflictResult({
          is_conflict: isConflict,
          conflicting_mac: isConflict ? 'AA:BB:CC:11:22:33' : '',
          message: isConflict 
            ? '⚠️ [IP 충돌 감지] 동일 IP 사용 기기(MAC: AA:BB:CC:11:22:33)가 발견되었습니다.'
            : `✓ [사용 가능] ${adapter.ipAddress}는 충돌 없이 사용 가능한 IP입니다.`
        });
        setIsCheckingConflict(false);
      }, 350);
    }
  };

  const toggleSmartHelper = () => {
    const next = !smartHelperEnabled;
    setSmartHelperEnabled(next);
    try {
      localStorage.setItem('ipname_smart_helper_enabled', String(next));
    } catch {}
  };

  // C-Class automatic gateway synchronization logic
  const handleIpChange = (newIp: string) => {
    if (conflictResult) setConflictResult(null);
    if (!smartHelperEnabled) {
      onUpdate(adapter.id, 'ipAddress', newIp);
      return;
    }

    const updates: Partial<NetworkAdapter> = { ipAddress: newIp };

    const trimmed = newIp.trim();
    const parts = trimmed.split('.');

    // If user entered at least 3 octets (C-Class prefix)
    if (parts.length >= 3) {
      const [o1, o2, o3] = parts;
      const isNum = (s: string) => s !== '' && !isNaN(Number(s)) && Number(s) >= 0 && Number(s) <= 255;
      
      if (isNum(o1) && isNum(o2) && isNum(o3)) {
        const cPrefix = `${Number(o1)}.${Number(o2)}.${Number(o3)}`;
        
        // Auto fill / sync gateway
        let hostOctet = '1';
        if (adapter.gateway) {
          const gwParts = adapter.gateway.trim().split('.');
          if (gwParts.length === 4 && isNum(gwParts[3])) {
            hostOctet = gwParts[3];
          }
        }
        updates.gateway = `${cPrefix}.${hostOctet}`;

        // Auto suggest subnet mask if empty
        if (!adapter.subnetMask || adapter.subnetMask.trim() === '') {
          updates.subnetMask = '255.255.255.0';
        }
      }
    }

    if (Object.keys(updates).length > 1) {
      onUpdate(adapter.id, updates);
    } else {
      onUpdate(adapter.id, 'ipAddress', newIp);
    }
  };

  const isVirtual = adapter.type === 'Virtual' || isVirtualAdapter(adapter.name, adapter.type);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adapter.status === 'Connected' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
            {adapter.type === 'Wi-Fi' ? (
              <Wifi size={16} />
            ) : isVirtual ? (
              <Layers size={16} className="text-amber-500" />
            ) : (
              <Network size={16} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm leading-none truncate max-w-[140px]" title={adapter.name}>{adapter.name}</h3>
              {isVirtual && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold shrink-0">
                  {t('virtual')}
                </span>
              )}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${adapter.status === 'Connected' ? 'bg-emerald-500' : adapter.status === 'Disabled' || !adapter.isEnabled ? 'bg-red-500' : 'bg-[var(--text-muted)]'}`} />
            </div>
            <span className="text-[9px] text-text-muted">
              {adapter.status === 'Connected' ? t('connected') : adapter.status === 'Disabled' || !adapter.isEnabled ? t('statusDisabled') : t('disconnected')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* 랜카드 사용 / 사용 안 함 버튼 (LAN Card Enable / Disable Button) */}
          {adapter.isEnabled ? (
            <button
              type="button"
              onClick={() => onRequestToggleEnabled ? onRequestToggleEnabled(adapter.id, false, adapter.name) : onUpdate(adapter.id, 'isEnabled', false)}
              disabled={isSaving}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md transition-all border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/70 dark:text-red-300 active:scale-95 cursor-pointer disabled:opacity-50"
              title={t('disableLanCard')}
            >
              <PowerOff size={12} className="text-red-600 dark:text-red-400" />
              <span>{t('disableLanCard')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRequestToggleEnabled ? onRequestToggleEnabled(adapter.id, true, adapter.name) : onUpdate(adapter.id, 'isEnabled', true)}
              disabled={isSaving}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md transition-all border border-emerald-300 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/70 dark:text-emerald-300 active:scale-95 cursor-pointer disabled:opacity-50 animate-pulse"
              title={t('enableLanCard')}
            >
              <Power size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('enableLanCard')}</span>
            </button>
          )}

          {/* DHCP Auto / Manual Toggle */}
          <div className="flex p-0.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-md shrink-0">
            <button 
              onClick={() => onUpdate(adapter.id, 'isDhcp', true)}
              disabled={!adapter.isEnabled || isSaving}
              className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${adapter.isDhcp ? 'bg-[var(--card)] shadow-sm text-primary' : 'text-text-muted hover:text-foreground'} ${!adapter.isEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t('auto')}
            </button>
            <button 
              onClick={() => onUpdate(adapter.id, 'isDhcp', false)}
              disabled={!adapter.isEnabled || isSaving}
              className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${!adapter.isDhcp ? 'bg-[var(--card)] shadow-sm text-primary' : 'text-text-muted hover:text-foreground'} ${!adapter.isEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t('manual')}
            </button>
          </div>

          {/* Apply Changes Button */}
          <button 
            onClick={onSave}
            disabled={isSaving || !adapter.isEnabled}
            className="btn-primary py-1 px-2 text-[10px] flex items-center gap-1 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            <span>{t('applyChanges')}</span>
          </button>
        </div>
      </div>

      {!adapter.isEnabled && (
        <div className="bg-red-50/90 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-2.5 my-2 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
              <PowerOff size={13} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-red-900 dark:text-red-200">{t('adapterDisabledNotice')}</p>
              <p className="text-[9px] text-red-700/80 dark:text-red-400">{t('adapterDisabledSubNotice')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRequestToggleEnabled ? onRequestToggleEnabled(adapter.id, true, adapter.name) : onUpdate(adapter.id, 'isEnabled', true)}
            disabled={isSaving}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[10px] rounded shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Power size={11} />
            <span>{t('enableLanCard')}</span>
          </button>
        </div>
      )}

      {!adapter.isDhcp && adapter.isEnabled && (
        <div className="flex items-center justify-between mb-2 pt-1.5 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-foreground flex items-center gap-1">
              {t('manualIpSettings')}
            </span>
            {smartHelperEnabled && (
              <span className="inline-flex items-center gap-1 text-[8px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20 animate-in fade-in duration-200">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                {t('cClassAutoSync')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSmartHelper}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-semibold border transition-all cursor-pointer select-none ${
              smartHelperEnabled
                ? 'bg-primary/10 text-primary border-primary/30 shadow-xs'
                : 'bg-[var(--input-bg)] text-text-muted border-[var(--border)] hover:bg-[var(--card-hover)]'
            }`}
            title={t('smartIpHelperDesc')}
          >
            <Sparkles size={10} className={smartHelperEnabled ? 'text-primary' : 'text-text-muted'} />
            <span>{t('smartIpHelper')}</span>
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${smartHelperEnabled ? 'bg-primary' : 'bg-gray-400'}`} />
          </button>
        </div>
      )}

      <div className={`grid grid-cols-3 gap-2 transition-all duration-300 ${adapter.isDhcp || !adapter.isEnabled ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[9px] font-bold text-text-muted uppercase block">{t('ipAddress')}</label>
            <button
              type="button"
              onClick={handleCheckConflict}
              disabled={!adapter.ipAddress || isCheckingConflict || adapter.isDhcp || !adapter.isEnabled}
              className={`inline-flex items-center gap-1 text-[8px] font-semibold px-1 py-0.2 rounded transition-all cursor-pointer ${
                conflictResult?.is_conflict 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                  : conflictResult && !conflictResult.is_conflict
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'text-text-muted hover:text-primary hover:bg-primary/5'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="순수 창작 DLL (ipname_core) 초고속 ARP 레이어2 IP 충돌 검사"
            >
              {isCheckingConflict ? (
                <RefreshCw size={8} className="animate-spin text-amber-500" />
              ) : conflictResult?.is_conflict ? (
                <AlertTriangle size={8} className="text-red-500" />
              ) : conflictResult && !conflictResult.is_conflict ? (
                <CheckCircle2 size={8} className="text-emerald-500" />
              ) : (
                <ShieldCheck size={8} />
              )}
              <span>{isCheckingConflict ? t('checkingConflict') : t('checkIpConflict')}</span>
            </button>
          </div>
          <input 
            type="text" 
            value={adapter.ipAddress}
            onChange={(e) => handleIpChange(e.target.value)}
            className={`input-field font-mono py-1 px-2 text-[10px] ${
              conflictResult?.is_conflict ? 'border-red-500 focus:border-red-500 bg-red-500/5' : ''
            }`}
            placeholder="192.168.1.100"
            spellCheck={false}
          />
          {conflictResult && (
            <p className={`text-[8px] mt-0.5 leading-tight truncate ${
              conflictResult.is_conflict ? 'text-red-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'
            }`} title={conflictResult.message}>
              {conflictResult.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-[9px] font-bold text-text-muted uppercase mb-0.5 block">{t('subnetMask')}</label>
          <SubnetMaskSelector 
            value={adapter.subnetMask}
            onChange={(val) => onUpdate(adapter.id, 'subnetMask', val)}
            disabled={adapter.isDhcp || !adapter.isEnabled}
            placeholder="255.255.255.0"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-text-muted uppercase mb-0.5 block">{t('gateway')}</label>
          <input 
            type="text" 
            value={adapter.gateway}
            onChange={(e) => onUpdate(adapter.id, 'gateway', e.target.value)}
            className="input-field font-mono py-1 px-2 text-[10px]"
            placeholder="192.168.1.1"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-text-muted uppercase mb-0.5 block">{t('primaryDns')}</label>
          <input 
            type="text" 
            value={adapter.primaryDns}
            onChange={(e) => onUpdate(adapter.id, 'primaryDns', e.target.value)}
            className="input-field font-mono py-1 px-2 text-[10px]"
            placeholder="8.8.8.8"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-text-muted uppercase mb-0.5 block">{t('secondaryDns')}</label>
          <input 
            type="text" 
            value={adapter.secondaryDns}
            onChange={(e) => onUpdate(adapter.id, 'secondaryDns', e.target.value)}
            className="input-field font-mono py-1 px-2 text-[10px]"
            placeholder="8.8.4.4"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-text-muted uppercase mb-0.5 block">{t('macAddress')}</label>
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={adapter.macAddress}
              readOnly
              className="input-field font-mono py-1 pl-2 pr-7 text-[10px] w-full"
              placeholder="00:00:00:00:00:00"
              spellCheck={false}
            />
            <div className="absolute right-1">
              <CopyButton textToCopy={adapter.macAddress} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AdapterItem.displayName = 'AdapterItem';
