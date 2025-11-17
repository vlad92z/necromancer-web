/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

import type { Rune, RuneType } from '../../../types/game';
import fireRune from '../../../assets/runes/fire_rune.svg';
import frostRune from '../../../assets/runes/frost_rune.svg';
import poisonRune from '../../../assets/runes/poison_rune.svg';
import voidRune from '../../../assets/runes/void_rune.svg';
import windRune from '../../../assets/runes/wind_rune.svg';

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Poison: poisonRune,
  Void: voidRune,
  Wind: windRune,
};

interface CenterPoolProps {
  centerPool: Rune[];
  onDraftFromCenter: (runeType: RuneType) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
}

export function CenterPool({ 
  centerPool, 
  onDraftFromCenter, 
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn 
}: CenterPoolProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        backgroundColor: '#dbeafe',
        borderRadius: isMobile ? '4px' : '12px',
        padding: isMobile ? '6px' : '16px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: isMobile ? '4px' : '8px',
        maxWidth: '90%'
      }}>
        {centerPool.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: isMobile ? '10px' : '14px', textAlign: 'center', padding: isMobile ? '8px' : '16px' }}>Empty</div>
        ) : (
          centerPool.map((rune) => (
            <button
              key={rune.id}
              onClick={() => onDraftFromCenter(rune.runeType)}
              disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
              style={{
                outline: 'none',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: (!isDraftPhase || hasSelectedRunes || isAITurn) ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                padding: 0
              }}
              onMouseEnter={(e) => !(!isDraftPhase || hasSelectedRunes || isAITurn) && (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label={`Select ${rune.runeType} runes from center`}
            >
              <img 
                src={RUNE_ASSETS[rune.runeType]} 
                alt={`${rune.runeType} rune`}
                style={{ width: isMobile ? '40px' : '60px', height: isMobile ? '40px' : '60px', objectFit: 'contain' }}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
