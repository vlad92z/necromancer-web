/**
 * RuneCell component - unified cell display for runes across all game areas
 * Supports: Wall cells, Pattern lines, Floor line, Factories, Center pool
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

export type RuneCellVariant = 'wall' | 'pattern' | 'floor' | 'factory' | 'center' | 'selected';

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
}

const SIZE_CONFIG = {
  small: { width: 30, height: 30, fontSize: 10, padding: 2 },
  medium: { width: 35, height: 35, fontSize: 14, padding: 2 },
  large: { width: 60, height: 60, fontSize: 20, padding: 4 },
};

const VARIANT_STYLES: Record<RuneCellVariant, {
  border: string;
  background: string;
  emptyOpacity?: number;
}> = {
  wall: {
    border: '2px solid #cbd5e1',
    background: '#f8fafc',
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
  factory: {
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
}: RuneCellProps) {
  const isMobile = window.innerWidth < 768;
  const sizeKey = isMobile ? (size === 'large' ? 'medium' : 'small') : size;
  const config = SIZE_CONFIG[sizeKey];
  const variantStyle = VARIANT_STYLES[variant];
  
  const runeType = rune?.runeType || placeholder?.runeType;
  const runeImage = runeType ? RUNE_ASSETS[runeType] : null;
  
  const isWallPlaceholder = variant === 'wall' && !rune && placeholder?.type === 'rune';
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  
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
        border: variantStyle.border,
        borderRadius: isMobile ? '6px' : '8px',
        backgroundColor: variantStyle.background,
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
