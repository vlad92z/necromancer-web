import React, { useEffect } from 'react';
import { COLORS, RADIUS, SHADOWS, SPACING, Z_INDEX } from '../../styles/tokens';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: number;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  style?: React.CSSProperties;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  maxWidth = 600,
  showCloseButton = true,
  closeOnBackdrop = true,
  style = {},
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay.backdrop,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Z_INDEX.modal,
    padding: `${SPACING.md}px`,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: COLORS.ui.background,
    borderRadius: `${RADIUS.lg}px`,
    boxShadow: SHADOWS.xl,
    maxWidth: `${maxWidth}px`,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    padding: `${SPACING.lg}px`,
    borderBottom: `1px solid ${COLORS.ui.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: COLORS.ui.text,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: COLORS.ui.textMuted,
    padding: `${SPACING.sm}px`,
    lineHeight: 1,
    transition: 'color 150ms ease',
  };

  const contentStyle: React.CSSProperties = {
    padding: `${SPACING.lg}px`,
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={backdropStyle} onClick={handleBackdropClick}>
      <div style={modalStyle} role="dialog" aria-modal="true">
        {(title || showCloseButton) && (
          <div style={headerStyle}>
            {title && <h2 style={titleStyle}>{title}</h2>}
            {showCloseButton && (
              <button
                style={closeButtonStyle}
                onClick={onClose}
                aria-label="Close modal"
                onMouseOver={(e) => {
                  e.currentTarget.style.color = COLORS.ui.text;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = COLORS.ui.textMuted;
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  );
};
