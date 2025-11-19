/**
 * SelectedRunesOverlay component - displays selected runes over the runeforges area
 */

import type { Rune } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getRuneEffectDescription } from '../../../utils/runeHelpers';

interface SelectedRunesOverlayProps {
  selectedRunes: Rune[];
  onCancel: () => void;
  isClassicMode?: boolean;
}

export function SelectedRunesOverlay({ selectedRunes, onCancel, isClassicMode = false }: SelectedRunesOverlayProps) {
  const runeType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  
  return (
    <div 
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, pointerEvents: 'auto' }}
      onClick={onCancel}
    >
      <div style={{
        background: 'rgba(17, 7, 31, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '20px',
        padding: 'min(2vmin, 24px)',
        maxWidth: '36rem',
        width: 'auto',
        boxShadow: '0 30px 80px rgba(5, 0, 15, 0.8)',
        color: '#f5f3ff'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {selectedRunes.map((rune) => (
            <RuneCell
              key={rune.id}
              rune={rune}
              variant="selected"
              size="large"
              showEffect={true}
            />
          ))}
        </div>
        {runeType && (
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '16px', color: '#c9c2ff' }}>
            {getRuneEffectDescription(runeType, isClassicMode)}
          </div>
        )}
      </div>
    </div>
  );
}
