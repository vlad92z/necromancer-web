/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Rune, RuneType } from '../../../types/game';
import fireRune from '../../../assets/runes/fire_rune.svg';
import frostRune from '../../../assets/runes/frost_rune.svg';
import lifeRune from '../../../assets/runes/life_rune.svg';
import voidRune from '../../../assets/runes/void_rune.svg';
import windRune from '../../../assets/runes/wind_rune.svg';

interface CenterPoolProps {
  centerPool: Rune[];
  onRuneClick?: (runeType: RuneType) => void;
  onVoidRuneSelect?: (runeId: string) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
  canDraftFromCenter: boolean;
  voidEffectPending?: boolean;
  selectedRunes: Rune[];
  selectionFromCenter: boolean;
  pendingRunesFromRuneforge?: Rune[];
  onCancelSelection?: () => void;
}

export function CenterPool({ 
  centerPool, 
  onRuneClick,
  onVoidRuneSelect,
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn,
  canDraftFromCenter,
  voidEffectPending = false,
  selectedRunes,
  selectionFromCenter,
  pendingRunesFromRuneforge = [],
  onCancelSelection
}: CenterPoolProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const pendingRunesFromRuneforgeIds = new Set(pendingRunesFromRuneforge.map((rune) => rune.id));
  const filteredCenterRunes = centerPool.filter((rune) => !pendingRunesFromRuneforgeIds.has(rune.id));
  const centerRuneIds = new Set(filteredCenterRunes.map((rune) => rune.id));
  const displayRunes = [
    ...filteredCenterRunes.map((rune) => ({ rune, isSelected: false })),
    ...(selectionFromCenter
      ? selectedRunes
          .filter((rune) => !centerRuneIds.has(rune.id))
          .map((rune) => ({ rune, isSelected: true }))
      : [])
  ];
  const totalRunes = displayRunes.length;
  const voidSelectionActive = Boolean(voidEffectPending && onVoidRuneSelect && !isAITurn);
  const centerDisabled = voidSelectionActive ? false : (!isDraftPhase || hasSelectedRunes || isAITurn || !canDraftFromCenter);
  
  const handleRuneClick = (e: React.MouseEvent, rune: Rune, isSelectedDisplay: boolean) => {
    e.stopPropagation();
    if (isSelectedDisplay && onCancelSelection) {
      onCancelSelection();
      return;
    }
    if (voidSelectionActive && onVoidRuneSelect) {
      onVoidRuneSelect(rune.id);
      return;
    }
    if (!centerDisabled && onRuneClick) {
      onRuneClick(rune.runeType);
    }
  };
  
  // Determine if center pool is selectable (used for visual hints)
  // note: kept for clarity, not used directly in current layout

  // Layout: simple centered horizontal row for all runes in the center pool
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: totalRunes === 0 ? 'none' : 'auto' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'min(1.8vmin, 30px)',
          padding: 'min(1vmin, 16px)',
          borderRadius: '28px',
          background: totalRunes === 0 ? 'transparent' : 'rgba(12, 6, 29, 0.85)',
          border: totalRunes === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: totalRunes === 0 ? 'none' : '0 25px 45px rgba(2, 6, 23, 0.6)',
        }}>
          {displayRunes.map(({ rune, isSelected }) => {
            const isHighlighted = hoveredRuneType === rune.runeType && !isSelected;
            const glowStyle = voidSelectionActive
              ? '0 0 14px rgba(139, 92, 246, 0.85), 0 0 26px rgba(167, 139, 250, 0.45)'
              : (isSelected ? '0 0 14px rgba(255, 255, 255, 0.28)' : 'none');
            const runeSize = 'min(4.4vmin, 46px)';
            const motionProps = isSelected
              ? {
                  animate: { scale: [1.08, 1.16, 1.08], y: [-1.5, 1.5, -1.5], rotate: [-1.8, 1.8, -1.8] },
                  transition: { duration: 1, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }
                }
              : {
                  animate: { scale: isHighlighted ? 1.08 : 1, y: 0, rotate: 0 },
                  transition: { duration: 0.2 }
                };

            // Map rune types to assets (kept local to avoid changing RuneCell)
            const RUNE_ASSETS: Record<string, string> = {
              Fire: fireRune,
              Frost: frostRune,
              Life: lifeRune,
              Void: voidRune,
              Wind: windRune,
            };

            const runeImage = RUNE_ASSETS[rune.runeType];

            return (
              <motion.div
                key={`${rune.id}-${isSelected ? 'selected' : 'pool'}`}
                style={{
                  width: runeSize,
                  height: runeSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSelected
                    ? 'pointer'
                    : voidSelectionActive
                      ? 'crosshair'
                      : (centerDisabled ? 'not-allowed' : 'pointer'),
                  opacity: (centerDisabled && !voidSelectionActive && !isSelected) ? 0.5 : 1,
                  boxShadow: glowStyle,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(9, 4, 30, 0.82)',
                  pointerEvents: isSelected ? 'auto' : (centerDisabled ? 'none' : 'auto')
                }}
                onClick={(e) => handleRuneClick(e, rune, isSelected)}
                onMouseEnter={() => !centerDisabled && !voidSelectionActive && !isSelected && setHoveredRuneType(rune.runeType)}
                onMouseLeave={() => setHoveredRuneType(null)}
                {...motionProps}
              >
                <img
                    src={runeImage}
                    alt={`${rune.runeType} rune`}
                    style={{width: runeSize, height: runeSize}}
                  />
              </motion.div>
            );
          })}
        </div>
      
    </div>
  );
}
