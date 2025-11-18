/**
 * SelectedRunesOverlay component - displays selected runes over the runeforges area
 */

import type { Rune } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface SelectedRunesOverlayProps {
  selectedRunes: Rune[];
  onCancel: () => void;
}

export function SelectedRunesOverlay({ selectedRunes, onCancel }: SelectedRunesOverlayProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div 
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, pointerEvents: 'auto' }}
      onClick={onCancel}
    >
      <div style={{
        backgroundColor: 'rgba(219, 234, 254, 0.95)',
        border: '2px solid #3b82f6',
        borderRadius: isMobile ? '4px' : '12px',
        padding: isMobile ? '6px' : '16px',
        maxWidth: '36rem',
        width: isMobile ? '90vw' : 'auto'
      }}>
        <h3 style={{ fontSize: isMobile ? '12px' : '24px', fontWeight: '600', color: '#1e40af', marginBottom: '8px', textAlign: 'center' }}>
          Selected Runes ({selectedRunes.length})
        </h3>
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
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: isMobile ? '10px' : '18px', color: '#475569' }}>
          Place runes in the casting lines.
        </div>
      </div>
    </div>
  );
}
