/**
 * RunePower component - displays projected power calculation for end of turn
 */

import type { Player } from '../../../types/game';
import { calculateProjectedPower } from '../../../utils/scoring';

interface RunePowerProps {
  player: Player;
}

export function RunePower({ player }: RunePowerProps) {
  const isMobile = window.innerWidth < 768;
  
  // Find completed pattern lines
  const completedPatternLines = player.patternLines
    .map((line, index) => ({ line, row: index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null)
    .map(({ line, row }) => ({ row, runeType: line.runeType! }));
  
  const floorPenaltyCount = player.floorLine.runes.length;
  
  const { essence, focus, totalPower, floorPenalty } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount
  );
  
  const netPower = totalPower + floorPenalty;
  const hasPenalty = floorPenaltyCount > 0;
  
  return (
    <div style={{
      backgroundColor: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: isMobile ? '6px' : '8px',
      padding: isMobile ? '8px' : '12px',
      marginTop: isMobile ? '8px' : '12px'
    }}>
      <div style={{
        fontSize: isMobile ? '14px' : '20px',
        color: '#78350f',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        Current Spellpower: {essence > 0 ? (
          <>
            {essence}×<span style={{ color: hasPenalty ? '#dc2626' : '#78350f' }}>{focus}</span>
            {' = '}
            <span style={{ fontWeight: 'bold', color: '#92400e' }}>
              {netPower}
            </span>
          </>
        ) : (
          <span style={{ fontWeight: 'bold', color: '#92400e' }}>0</span>
        )}
      </div>
    </div>
  );
}
