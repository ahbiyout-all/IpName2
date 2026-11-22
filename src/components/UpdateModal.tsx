import React from 'react';
import { Sparkles, Download, ExternalLink as ExternalLinkIcon, CheckCircle, Github } from 'lucide-react';
import { Modal } from './Modal';
import { GitHubReleaseInfo } from '../hooks/useGitHubUpdate';
import { ExternalLink } from './ExternalLink';
import { useLanguage } from '../contexts/LanguageContext';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  latestRelease: GitHubReleaseInfo | null;
  updateAvailable: boolean;
  isChecking: boolean;
  statusMessage?: string | null;
  repoUrl: string;
  onSkipVersion?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  latestRelease,
  updateAvailable,
  statusMessage,
  repoUrl,
  onSkipVersion
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const downloadTargetUrl = latestRelease?.downloadUrl || latestRelease?.htmlUrl || repoUrl;
  const repoTargetUrl = latestRelease?.htmlUrl || `${repoUrl}/releases`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-foreground">
          {updateAvailable ? (
            <div className="p-1 rounded bg-primary/10 text-primary">
              <Sparkles size={16} className="animate-pulse" />
            </div>
          ) : (
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-500">
              <CheckCircle size={16} />
            </div>
          )}
          <span className="font-bold text-sm">
            {updateAvailable ? t('updateModalTitleNew') : t('updateModalTitleCheck')}
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          {updateAvailable && onSkipVersion ? (
            <button
              type="button"
              onClick={onSkipVersion}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {t('skipThisVersion')}
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer"
            >
              {t('close')}
            </button>
            {updateAvailable && (
              <ExternalLink
                href={downloadTargetUrl}
                className="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Download size={13} />
                <span>{t('downloadUpdate')}</span>
              </ExternalLink>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {/* Status Banner */}
        {updateAvailable && latestRelease ? (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {t('newUpdateBadge')}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {latestRelease.name || `v${latestRelease.version}`}
                </span>
              </div>
              {latestRelease.publishedAt && (
                <span className="text-[10px] text-muted-foreground">
                  {t('releaseDateLabel')}: {latestRelease.publishedAt}
                </span>
              )}
            </div>

            {/* Version Diff Comparison */}
            <div className="grid grid-cols-2 gap-2 text-center py-2 bg-card/60 rounded-lg border border-border/50">
              <div className="border-r border-border/40 pr-2">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">{t('currentVersionLabel')}</span>
                <span className="font-mono text-xs font-bold text-foreground">v{currentVersion}</span>
              </div>
              <div className="pl-2">
                <span className="text-[9px] uppercase font-bold text-primary block">{t('latestVersionLabel')}</span>
                <span className="font-mono text-xs font-extrabold text-primary animate-pulse">
                  v{latestRelease.version}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle size={18} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-foreground">
                {statusMessage || t('upToDateTitle')}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t('currentVersionLabel')}: <strong>v{currentVersion}</strong> ({t('upToDateStableDesc')})
              </p>
            </div>
          </div>
        )}

        {/* GitHub Path & Repository Link Info */}
        <div className="p-2.5 rounded-lg bg-card/50 border border-border text-[11px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-foreground/90">
              <Github size={13} className="text-primary" />
              <span>{t('officialGithubRepoPath')}</span>
            </div>
            <ExternalLink
              href={repoTargetUrl}
              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{t('visitRepository')}</span>
              <ExternalLinkIcon size={10} />
            </ExternalLink>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground break-all bg-input-bg p-1.5 rounded border border-border/40 select-all">
            {latestRelease?.htmlUrl || repoUrl}
          </p>
        </div>

        {/* Changelog / Release Notes */}
        {latestRelease?.body && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              {t('releaseNotesLabel')}
            </label>
            <div className="p-2.5 rounded-lg bg-card border border-border text-[11px] leading-relaxed text-foreground/80 max-h-36 overflow-y-auto whitespace-pre-line font-sans custom-scrollbar">
              {latestRelease.body}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
