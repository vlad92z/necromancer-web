/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

import { useState } from 'react';
import type { Rune, RuneType } from '../../../types/game';
import fireRune from '../../../assets/runes/fire_rune.svg';
import frostRune from '../../../assets/runes/frost_rune.svg';
import lifeRune from '../../../assets/runes/life_rune.svg';
import voidRune from '../../../assets/runes/void_rune.svg';
import windRune from '../../../assets/runes/wind_rune.svg';

interface CenterPoolProps {
  centerPool: Rune[];
  onRuneClick?: (runeType: RuneType) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
}

export function CenterPool({ 
  centerPool, 
  onRuneClick,
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn
}: CenterPoolProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const totalRunes = centerPool.length;
  
  const handleRuneClick = (e: React.MouseEvent, runeType: RuneType) => {
    e.stopPropagation();
    if (isDraftPhase && !hasSelectedRunes && !isAITurn && onRuneClick) {
      onRuneClick(runeType);
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
          gap: `12px`,
          padding: '0 8px'
        }}>
          {centerPool.map((rune) => {
            const disabled = !isDraftPhase || hasSelectedRunes || isAITurn;
            const isHighlighted = hoveredRuneType === rune.runeType;
            const scale = isHighlighted ? 1.08 : 1;

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
              <div
                key={rune.id}
                style={{
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  transition: 'transform 0.16s ease, filter 0.16s ease',
                  transform: `scale(${scale})`,
                }}
                onClick={(e) => handleRuneClick(e, rune.runeType)}
                onMouseEnter={() => !disabled && setHoveredRuneType(rune.runeType)}
                onMouseLeave={() => setHoveredRuneType(null)}
              >
                <img
                    src={runeImage}
                    alt={`${rune.runeType} rune`}
                    style={{width: '35px', height: '35px'}}
                  />
              </div>
            );
          })}
        </div>
      
    </div>
  );
}
