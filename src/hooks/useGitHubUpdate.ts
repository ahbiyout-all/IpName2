import { useState, useEffect, useCallback } from 'react';

export const CURRENT_VERSION = '1.12.7';
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
}

// Compare semantic version numbers (e.g. "1.10.0" vs "1.9.0")
export function isNewerVersion(remoteVer: string, currentVer: string): boolean {
  const cleanRemote = remoteVer.replace(/^v/i, '').trim();
  const cleanCurrent = currentVer.replace(/^v/i, '').trim();

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
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestRelease, setLatestRelease] = useState<GitHubReleaseInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkUpdate = useCallback(async (manual = false) => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        // If 404 (no releases published yet), handle gracefully
        if (response.status === 404) {
          if (manual) {
            setStatusMessage('현재 등록된 릴리스가 없습니다 (최신 빌드 상태).');
            setIsModalOpen(true);
          }
          return;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const tagName: string = data.tag_name || '';
      const remoteVersion = tagName.replace(/^v/i, '');

      // Find primary installer asset if available (.exe / .msi)
      let downloadUrl = data.html_url;
      if (Array.isArray(data.assets) && data.assets.length > 0) {
        const installerAsset = data.assets.find((a: ReleaseAsset) => 
          a.name.endsWith('.exe') || a.name.endsWith('.msi')
        );
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
        publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : undefined
      };

      setLatestRelease(releaseInfo);
      setLastCheckedTime(new Date().toLocaleTimeString());

      const hasNewVersion = isNewerVersion(remoteVersion, CURRENT_VERSION);

      if (hasNewVersion) {
        setUpdateAvailable(true);
        // Check if user skipped this specific version
        const skippedVersion = localStorage.getItem('ipname_skipped_update_version');
        if (manual || skippedVersion !== remoteVersion) {
          setIsModalOpen(true);
        }
      } else {
        setUpdateAvailable(false);
        if (manual) {
          setStatusMessage('현재 최신 버전(v' + CURRENT_VERSION + ')을 사용하고 있습니다.');
          setIsModalOpen(true);
        }
      }
    } catch (err: any) {
      console.warn('[GitHub Update Check] Failed to check for updates:', err?.message || err);
      if (manual) {
        setStatusMessage('GitHub 릴리스 서버 연결 실패. 잠시 후 다시 시도해 주세요.');
        setIsModalOpen(true);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const dismissUpdate = useCallback((skipCurrent = false) => {
    setIsModalOpen(false);
    if (skipCurrent && latestRelease?.version) {
      localStorage.setItem('ipname_skipped_update_version', latestRelease.version);
    }
  }, [latestRelease]);

  // Initial background check on application mount
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUpdate(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [checkUpdate]);

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
