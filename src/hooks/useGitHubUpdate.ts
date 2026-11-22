import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { safeStorage } from '../lib/storage';
import { useLanguage } from '../contexts/LanguageContext';

export const CURRENT_VERSION = '1.13.13';
export const GITHUB_OWNER = 'AhBiYout-all';
export const GITHUB_REPO = 'IpName2';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubReleaseInfo {
  version: string;
  tagName: string;
  name: string;
  body: string;
  htmlUrl: string;
  downloadUrl?: string;
  publishedAt?: string;
  publishedAtIso?: string;
}

type UpdateStatusKey = 'no_releases' | 'up_to_date' | 'connect_failed' | null;

// Compare semantic version numbers (e.g. "1.10.0" vs "1.9.0")
export function isNewerVersion(remoteVer: string, currentVer: string): boolean {
  const cleanRemote = remoteVer.replace(/^v/i, '').split('-')[0].trim();
  const cleanCurrent = currentVer.replace(/^v/i, '').split('-')[0].trim();

  const rParts = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
  const cParts = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);

  const len = Math.max(rParts.length, cParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export function useGitHubUpdate() {
  const { language, t } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [rawRelease, setRawRelease] = useState<GitHubReleaseInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState<UpdateStatusKey>(null);

  const isMountedRef = useRef(true);
  const checkGenRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    };
  }, []);

  const checkUpdate = useCallback(async (manual = false) => {
    const gen = ++checkGenRef.current;
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setIsChecking(true);
    setStatusKey(null);
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!isMountedRef.current || checkGenRef.current !== gen) return;

      if (!response.ok) {
        // If 404 (no releases published yet), handle gracefully
        if (response.status === 404) {
          if (manual) {
            setStatusKey('no_releases');
            setIsModalOpen(true);
          }
          return;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      if (!isMountedRef.current || checkGenRef.current !== gen) return;

      const tagName: string = data.tag_name || '';
      const remoteVersion = tagName.replace(/^v/i, '');

      // Prioritize primary Setup installer (*Setup*.exe / .msi) over portable executables
      let downloadUrl = data.html_url;
      if (Array.isArray(data.assets) && data.assets.length > 0) {
        const installerAsset =
          data.assets.find((a: ReleaseAsset) => /setup.*\.exe$/i.test(a.name)) ||
          data.assets.find((a: ReleaseAsset) =>
            (a.name.endsWith('.exe') && !/portable/i.test(a.name)) || a.name.endsWith('.msi')
          ) ||
          data.assets.find((a: ReleaseAsset) => a.name.endsWith('.exe'));
        if (installerAsset?.browser_download_url) {
          downloadUrl = installerAsset.browser_download_url;
        }
      }

      const releaseInfo: GitHubReleaseInfo = {
        version: remoteVersion,
        tagName: tagName,
        name: data.name || `IpName2 ${tagName}`,
        body: data.body || '',
        htmlUrl: data.html_url || GITHUB_REPO_URL,
        downloadUrl,
        publishedAtIso: data.published_at || undefined
      };

      setRawRelease(releaseInfo);
      setLastCheckedTime(new Date().toLocaleTimeString());

      const hasNewVersion = isNewerVersion(remoteVersion, CURRENT_VERSION);

      if (hasNewVersion) {
        setUpdateAvailable(true);
        // Check if user skipped this specific version
        const skippedVersion = safeStorage.getItem('ipname_skipped_update_version');
        if (manual || skippedVersion !== remoteVersion) {
          setIsModalOpen(true);
        }
      } else {
        setUpdateAvailable(false);
        if (manual) {
          setStatusKey('up_to_date');
          setIsModalOpen(true);
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current || checkGenRef.current !== gen) return;
      console.warn('[GitHub Update Check] Failed to check for updates:', err?.message || err);
      if (manual) {
        setStatusKey('connect_failed');
        setIsModalOpen(true);
      }
    } finally {
      clearTimeout(timeoutId);
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
      if (isMountedRef.current && checkGenRef.current === gen) {
        setIsChecking(false);
      }
    }
  }, []);

  const dismissUpdate = useCallback((skipCurrent = false) => {
    setIsModalOpen(false);
    if (skipCurrent && rawRelease?.version) {
      safeStorage.setItem('ipname_skipped_update_version', rawRelease.version);
    }
  }, [rawRelease]);

  // Initial background check deferred until after first paint and Win32 startup
  useEffect(() => {
    let idleHandle: number | null = null;
    const timer = setTimeout(() => {
      const win = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (typeof win.requestIdleCallback === 'function') {
        idleHandle = win.requestIdleCallback(() => {
          checkUpdate(false);
        }, { timeout: 2000 });
      } else {
        checkUpdate(false);
      }
    }, 2200);
    return () => {
      clearTimeout(timer);
      const win = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (idleHandle !== null && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleHandle);
      }
    };
  }, [checkUpdate]);

  const localeTag = language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';

  const latestRelease = useMemo<GitHubReleaseInfo | null>(() => {
    if (!rawRelease) return null;
    return {
      ...rawRelease,
      publishedAt: rawRelease.publishedAtIso
        ? new Date(rawRelease.publishedAtIso).toLocaleDateString(localeTag)
        : undefined
    };
  }, [rawRelease, localeTag]);

  const statusMessage = useMemo<string | null>(() => {
    if (statusKey === 'no_releases') return t('updateNoReleases');
    if (statusKey === 'up_to_date') return t('updateUpToDate').replace('{ver}', CURRENT_VERSION);
    if (statusKey === 'connect_failed') return t('updateConnectFailed');
    return null;
  }, [statusKey, t]);

  return {
    currentVersion: CURRENT_VERSION,
    isChecking,
    updateAvailable,
    latestRelease,
    isModalOpen,
    setIsModalOpen,
    checkUpdate,
    dismissUpdate,
    lastCheckedTime,
    statusMessage,
    repoUrl: GITHUB_REPO_URL
  };
}
