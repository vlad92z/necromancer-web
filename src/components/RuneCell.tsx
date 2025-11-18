/**
 * RuneCell component - unified cell display for runes across all game areas
 * Supports: Wall cells, Pattern lines, Floor line, Runeforges, Center pool
 */

import { motion } from 'framer-motion';
import type { Rune, RuneType } from '../types/game';
import fireRune from '../assets/runes/fire_rune.svg';
import frostRune from '../assets/runes/frost_rune.svg';
import poisonRune from '../assets/runes/poison_rune.svg';
import voidRune from '../assets/runes/void_rune.svg';
import windRune from '../assets/runes/wind_rune.svg';

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Poison: poisonRune,
  Void: voidRune,
  Wind: windRune,
};

export type RuneCellVariant = 'wall' | 'pattern' | 'floor' | 'runeforge' | 'center' | 'selected';

export interface RuneCellProps {
  rune?: Rune | null;
  variant: RuneCellVariant;
  size?: 'small' | 'medium' | 'large';
  placeholder?: {
    type: 'rune' | 'text';
    runeType?: RuneType; // For wall cells
    text?: string; // For pattern/floor cells
  };
  clickable?: boolean;
  onClick?: () => void;
  showEffect?: boolean;
  isPending?: boolean; // For wall cells with full pattern lines
}

const SIZE_CONFIG = {
  small: { width: 30, height: 30, fontSize: 10, padding: 2 },
  medium: { width: 35, height: 35, fontSize: 14, padding: 2 },
  large: { width: 35, height: 35, fontSize: 20, padding: 4 },
};

const VARIANT_STYLES: Record<RuneCellVariant, {
  border: string;
  background: string;
  backgroundOccupied?: string;
  emptyOpacity?: number;
}> = {
  wall: {
    border: '2px solid #cbd5e1',
    background: '#f8fafc',
    backgroundOccupied: '#fed7aa',
    emptyOpacity: 0.3,
  },
  pattern: {
    border: '2px solid #cbd5e1',
    background: '#f8fafc',
  },
  floor: {
    border: '2px solid #fca5a5',
    background: '#fef2f2',
  },
  runeforge: {
    border: 'none',
    background: 'transparent',
  },
  center: {
    border: 'none',
    background: 'transparent',
  },
  selected: {
    border: '2px solid #3b82f6',
    background: '#dbeafe',
  },
};

export function RuneCell({
  rune,
  variant,
  size = 'medium',
  placeholder,
  clickable = false,
  onClick,
  showEffect = false,
  isPending = false,
}: RuneCellProps) {
  const config = SIZE_CONFIG[size];
  const variantStyle = VARIANT_STYLES[variant];
  
  const runeType = rune?.runeType || placeholder?.runeType;
  const runeImage = runeType ? RUNE_ASSETS[runeType] : null;
  
  const isWallPlaceholder = variant === 'wall' && !rune && placeholder?.type === 'rune';
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  
  // Special background for Wind runes in floor line (green to indicate mitigation)
  const isWindInFloor = variant === 'floor' && rune?.runeType === 'Wind';
  
  // Use occupied background for wall cells that have runes OR are pending placement
  let backgroundColor = (variant === 'wall' && (rune || isPending) && variantStyle.backgroundOccupied) 
    ? variantStyle.backgroundOccupied 
    : variantStyle.background;
  
  // Override background for Wind runes in floor line
  if (isWindInFloor) {
    backgroundColor = '#d1fae5'; // Light green background for Wind mitigation
  }
  
  // Override border for Wind runes in floor line
  let borderStyle = variantStyle.border;
  if (isWindInFloor) {
    borderStyle = '2px solid #86efac'; // Green border for Wind mitigation
  }
  
  // Animate when rune appears in pattern lines, scoring wall, or floor line
  const shouldAnimate = (variant === 'pattern' || variant === 'wall' || variant === 'floor') && rune;
  
  const animationProps = shouldAnimate ? {
    initial: { scale: 0, opacity: 0 } as const,
    animate: { scale: 1, opacity: 1 } as const,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  } : {};
  
  const Container = shouldAnimate ? motion.div : 'div';
  
  return (
    <Container
      {...animationProps}
      onClick={clickable ? onClick : undefined}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        border: borderStyle,
        borderRadius: '8px',
        backgroundColor: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${config.padding}px`,
        cursor: clickable ? 'pointer' : 'default',
        transition: shouldAnimate ? undefined : 'transform 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e: any) => clickable && (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e: any) => clickable && (e.currentTarget.style.transform = 'scale(1)')}
    >
      {runeImage && (
        <img 
          src={runeImage} 
          alt={`${runeType} rune`}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            opacity: isWallPlaceholder ? variantStyle.emptyOpacity : 1,
          }}
        />
      )}
      
      {hasTextPlaceholder && (
        <div style={{ 
          fontSize: `${config.fontSize}px`, 
          color: variant === 'floor' ? '#991b1b' : '#64748b',
          fontWeight: variant === 'floor' ? 'bold' : 'normal',
        }}>
          {placeholder.text}
        </div>
      )}
      
      {/* Effect indicator - will be expanded when effects are implemented */}
      {showEffect && rune?.effect.type !== 'None' && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#eab308',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }} />
      )}
    </Container>
  );
}
