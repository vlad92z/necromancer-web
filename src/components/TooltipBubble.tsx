/**
 * TooltipBubble - rune-style floating tooltip anchored to a target rect.
 */
import type { CSSProperties } from 'react';
import { COLORS, SHADOWS } from '../styles/tokens';

export type TooltipAnchorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export interface TooltipBubbleProps {
  text: string;
  anchorRect: TooltipAnchorRect | null;
  placement?: 'top' | 'bottom';
  maxWidth?: number;
}

export function TooltipBubble({ text, anchorRect, placement = 'top', maxWidth = 280 }: TooltipBubbleProps) {
  if (!anchorRect) {
    return null;
  }

  const baseStyle: CSSProperties = {
    position: 'fixed',
    padding: '8px 12px',
    background: 'rgba(8, 7, 16, 0.95)',
    borderRadius: '10px',
    border: `1px solid ${COLORS.ui.borderLight}`,
    color: COLORS.ui.text,
    fontSize: '12px',
    minWidth: '100px',
    lineHeight: 1.5,
    textAlign: 'center',
    whiteSpace: 'pre-line',
    boxShadow: SHADOWS.md,
    zIndex: 50,
    pointerEvents: 'none',
    left: anchorRect.left + anchorRect.width / 2,
  };

  const positionStyle: CSSProperties = placement === 'bottom'
    ? {
        top: anchorRect.top + anchorRect.height,
        transform: 'translate(-50%, 8px)',
      }
    : {
        top: anchorRect.top,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      };

  return (
    <div
      style={{
        ...baseStyle,
        ...positionStyle,
        maxWidth,
      }}
    >
      {text}
    </div>
  );
}
