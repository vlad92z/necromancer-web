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
  
  const { segments, totalPower, floorPenalty } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount
  );
  
  // If no completed lines and no floor penalties, don't show anything
  if (segments.length === 0 && floorPenaltyCount === 0) {
    return null;
  }
  
  return (
    <div style={{
      backgroundColor: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: isMobile ? '6px' : '8px',
      padding: isMobile ? '8px' : '12px',
      marginTop: isMobile ? '8px' : '12px'
    }}>
      
      {segments.length > 0 ? (
        <div style={{
          fontSize: isMobile ? '11px' : '14px',
          color: '#78350f',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontWeight: '500' }}>
            {segments.map((seg, index) => (
              <span key={index}>
                {index > 0 && ' + '}
                {seg.size}×{seg.multiplier}
              </span>
            ))}
            {' = '}
            <span style={{ fontWeight: 'bold', color: '#92400e' }}>
              {totalPower}
            </span>
          </div>
          
          {floorPenaltyCount > 0 && (
            <div style={{ color: '#991b1b', fontWeight: '500' }}>
              Floor: {floorPenalty}
            </div>
          )}
          
          <div style={{
            paddingTop: '6px',
            borderTop: '1px solid #fbbf24',
            fontWeight: 'bold',
            color: '#92400e'
          }}>
            Turn Power: {totalPower + floorPenalty}
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: isMobile ? '11px' : '14px',
          color: '#991b1b',
          fontWeight: '500'
        }}>
          Floor penalty: {floorPenalty}
        </div>
      )}
    </div>
  );
}
