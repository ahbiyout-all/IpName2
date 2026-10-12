import React, { memo } from 'react';
import { Globe, RefreshCw, Building2, MapPin, Radio, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRealIp } from '../hooks/useRealIp';
import { CopyButton } from './CopyButton';

export const RealIpSection = memo(() => {
  const { t } = useLanguage();
  const { realIp, isLoading, refreshRealIp } = useRealIp();

  const isOnline = realIp.status === 'success' || (Boolean(realIp.ip) && realIp.status !== 'error');

  // Error state when no IP is found
  if (realIp.status === 'error' && !realIp.ip) {
    return (
      <div className="card px-3 py-1.5 flex items-center justify-between gap-2 border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <AlertCircle size={13} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-red-700 dark:text-red-300">{t('lookupFailed')}</span>
            <span className="text-[9px] text-red-600/80 dark:text-red-400 truncate">({t('privateVsPublicTip')})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshRealIp}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-60"
        >
          <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? t('checking') : t('retryLookup')}</span>
        </button>
      </div>
    );
  }

  // Ultra-compact single-row Real IP bar (fits within 600px width and ~36px height)
  return (
    <div className="card px-2.5 py-1.5 border border-[var(--border)] transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        {/* Left Part: Globe, Label, IP, Copy */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <div
            className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 relative"
            title={t('privateVsPublicTip')}
          >
            <Globe size={13} />
            <span
              className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-card ${
                isLoading
                  ? 'bg-amber-500 animate-ping'
                  : isOnline
                  ? 'bg-emerald-500'
                  : 'bg-red-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0" title={t('privateVsPublicTip')}>
            <span className="text-xs font-bold text-foreground leading-none">{t('realIpShort')}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
              WAN
            </span>
          </div>

          {/* Real IP Display Pill */}
          <div className="flex items-center gap-1.5 bg-[var(--input-bg)] border border-[var(--border)] px-2 py-0.5 rounded shadow-2xs">
            <Radio size={10} className={`shrink-0 ${isOnline ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'}`} />
            <span className="font-mono text-xs font-bold text-primary tracking-wide select-all">
              {realIp.ip || (isLoading ? t('checking') : '---')}
            </span>
            {realIp.ip && (
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[var(--border)] text-text-muted font-bold shrink-0">
                {realIp.ip.includes(':') ? 'IPv6' : 'IPv4'}
              </span>
            )}
            {realIp.ip && (
              <CopyButton textToCopy={realIp.ip} className="p-0.5 text-text-muted hover:text-primary shrink-0" />
            )}
          </div>
        </div>

        {/* Right Part: ISP, Location, Refresh Button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {realIp.isp && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--input-bg)] border border-[var(--border)] text-[10px] text-foreground font-medium shrink-0"
              title={`${t('ispProvider')}: ${realIp.isp}`}
            >
              <Building2 size={10} className="text-primary shrink-0" />
              <span className="max-w-[130px] truncate">{realIp.isp}</span>
            </div>
          )}

          {realIp.country && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--input-bg)] border border-[var(--border)] text-[10px] text-foreground font-medium shrink-0"
              title={`${t('location')}: ${realIp.city ? `${realIp.city}, ` : ''}${realIp.country}`}
            >
              <MapPin size={10} className="text-primary shrink-0" />
              <span className="max-w-[100px] truncate">
                {realIp.city ? `${realIp.city}, ` : ''}{realIp.country}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={refreshRealIp}
            disabled={isLoading}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[var(--input-bg)] hover:bg-[var(--card-hover)] border border-[var(--border)] text-foreground transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title={t('refreshRealIp')}
          >
            <RefreshCw size={10} className={isLoading ? 'animate-spin text-primary' : 'text-text-muted'} />
            <span className="text-[9px]">{isLoading ? t('checking') : t('retryLookup')}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

RealIpSection.displayName = 'RealIpSection';
