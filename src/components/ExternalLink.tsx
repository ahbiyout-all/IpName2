import React, { useRef } from 'react';
import { isTauriEnv } from '../lib/powershell';

interface ExternalLinkProps {
  href: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

const lastOpenedMap = new Map<string, number>();

export const ExternalLink: React.FC<ExternalLinkProps> = ({
  href,
  className = '',
  title,
  children,
}) => {
  const isOpeningRef = useRef(false);

  const handleTauriOpen = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const lastOpened = lastOpenedMap.get(href) ?? 0;
    if (isOpeningRef.current || now - lastOpened < 600) {
      return;
    }

    isOpeningRef.current = true;
    lastOpenedMap.set(href, now);
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(href);
    } catch (err) {
      console.error('Failed to open external URL in Tauri:', err);
    } finally {
      isOpeningRef.current = false;
    }
  };

  if (isTauriEnv()) {
    return (
      <button
        type="button"
        onClick={handleTauriOpen}
        title={title || href}
        className={`bg-transparent border-0 p-0 text-left cursor-pointer focus:outline-none ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title || href}
      className={className}
    >
      {children}
    </a>
  );
};
