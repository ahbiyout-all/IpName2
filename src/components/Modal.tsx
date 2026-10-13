import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card-hover)]">
          <h3 className="font-bold text-sm">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 text-sm">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--card-hover)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
