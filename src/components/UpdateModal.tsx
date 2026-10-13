import React from 'react';
import { Sparkles, Download, ExternalLink, CheckCircle, Github, AlertTriangle, X } from 'lucide-react';
import { Modal } from './Modal';
import { GitHubReleaseInfo } from '../hooks/useGitHubUpdate';
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
  isChecking,
  statusMessage,
  repoUrl,
  onSkipVersion
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const openUrl = async (url: string) => {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    const url = latestRelease?.downloadUrl || latestRelease?.htmlUrl || repoUrl;
    openUrl(url);
  };

  const handleOpenRepo = () => {
    const url = latestRelease?.htmlUrl || `${repoUrl}/releases`;
    openUrl(url);
  };

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
            {updateAvailable ? '새로운 버전 업데이트 알림' : '소프트웨어 업데이트 확인'}
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
              이 버전 건너뛰기
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
              닫기
            </button>
            {updateAvailable && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Download size={13} />
                <span>업데이트 다운로드</span>
              </button>
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
                  NEW UPDATE
                </span>
                <span className="text-xs font-bold text-foreground">
                  {latestRelease.name || `v${latestRelease.version}`}
                </span>
              </div>
              {latestRelease.publishedAt && (
                <span className="text-[10px] text-muted-foreground">
                  출시일: {latestRelease.publishedAt}
                </span>
              )}
            </div>

            {/* Version Diff Comparison */}
            <div className="grid grid-cols-2 gap-2 text-center py-2 bg-card/60 rounded-lg border border-border/50">
              <div className="border-r border-border/40 pr-2">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">현재 버전</span>
                <span className="font-mono text-xs font-bold text-foreground">v{currentVersion}</span>
              </div>
              <div className="pl-2">
                <span className="text-[9px] uppercase font-bold text-primary block">최신 버전</span>
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
                {statusMessage || '현재 최신 버전을 사용 중입니다.'}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                현재 설치 버전: <strong>v{currentVersion}</strong> (최신 안정 빌드)
              </p>
            </div>
          </div>
        )}

        {/* GitHub Path & Repository Link Info */}
        <div className="p-2.5 rounded-lg bg-card/50 border border-border text-[11px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-foreground/90">
              <Github size={13} className="text-primary" />
              <span>공식 GitHub 저장소 경로</span>
            </div>
            <button
              type="button"
              onClick={handleOpenRepo}
              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>저장소 방문</span>
              <ExternalLink size={10} />
            </button>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground break-all bg-input-bg p-1.5 rounded border border-border/40 select-all">
            {latestRelease?.htmlUrl || repoUrl}
          </p>
        </div>

        {/* Changelog / Release Notes */}
        {latestRelease?.body && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              변경 내역 (Release Notes)
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
