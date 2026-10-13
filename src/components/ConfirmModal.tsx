import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  confirmText,
  cancelText,
  isDestructive = false
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card-hover)]">
          <h3 className="font-bold text-sm flex items-center gap-2">
            {isDestructive && <AlertTriangle size={16} className="text-red-500" />}
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 text-sm text-text-muted">
          {description}
        </div>
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--card-hover)] flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {cancelText || t('confirmNo')}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md text-white transition-colors ${
              isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmText || t('confirmYes')}
          </button>
        </div>
      </div>
    </div>
  );
};
