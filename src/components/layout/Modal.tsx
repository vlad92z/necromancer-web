import React, { useEffect } from 'react';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: number;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  closeButtonClassName?: string;
  closeButtonDataActive?: string;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  maxWidth = 600,
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
  closeButtonClassName = '',
  closeButtonDataActive,
}) => {
  useEffect(() => {

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(0,0,0,0.7)] px-4 py-4"
      onClick={handleBackdropClick}
    >
      <div
        style={{ maxWidth: `${maxWidth}px` }}
        className={`relative max-h-[90vh] w-full overflow-auto rounded-2xl bg-[#0c051c] text-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.6)] ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            {title && <h2 className="text-2xl font-bold text-slate-50">{title}</h2>}
            {showCloseButton && (
              <button
                data-active={closeButtonDataActive}
                className={`rounded-lg p-2 text-2xl leading-none text-slate-400 transition hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 ${closeButtonClassName}`.trim()}
                onClick={onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
