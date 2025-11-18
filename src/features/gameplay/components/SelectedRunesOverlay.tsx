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
        backgroundColor: 'rgba(219, 234, 254, 0.95)',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '36rem',
        width: 'auto'
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
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '16px', color: '#475569' }}>
            {getRuneEffectDescription(runeType, isClassicMode)}
          </div>
        )}
      </div>
    </div>
  );
}
