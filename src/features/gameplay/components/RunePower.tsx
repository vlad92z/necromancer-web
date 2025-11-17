/**
 * RunePower component - displays player stats and projected power calculation
 */

import type { Player } from '../../../types/game';
import { calculateProjectedPower } from '../../../utils/scoring';

interface RunePowerProps {
  player: Player;
  damageTaken: number;
  nameColor: string;
}

export function RunePower({ player, damageTaken, nameColor }: RunePowerProps) {
  const isMobile = window.innerWidth < 768;
  
  // Find completed pattern lines
  const completedPatternLines = player.patternLines
    .map((line, index) => ({ line, row: index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null)
    .map(({ line, row }) => ({ row, runeType: line.runeType! }));
  
  const floorPenaltyCount = player.floorLine.runes.length;
  
  const { essence, focus, totalPower } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount
  );
  const hasPenalty = floorPenaltyCount > 0;
  
  return (
    <div style={{
      backgroundColor: 'rgba(191, 219, 254, 0.3)',
      border: '2px solid rgba(59, 130, 246, 0.5)',
      borderRadius: isMobile ? '6px' : '8px',
      padding: isMobile ? '6px 8px' : '8px 12px',
      marginBottom: isMobile ? '4px' : '8px'
    }}>
      <div style={{
        fontSize: isMobile ? '12px' : '18px',
        color: '#0c4a6e',
        fontWeight: 'bold',
        textAlign: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isMobile ? '4px' : '8px'
      }}>
        <span style={{ color: nameColor }}>
          {player.name}
        </span>
        <span>|</span>
        <span>Damage Taken: {damageTaken}</span>
        <span>|</span>
        {essence > 0 ? (
          <>
            <span>Essence: {essence}</span>
            <span>|</span>
            <span style={{ color: hasPenalty ? '#dc2626' : '#78350f' }}>Focus: {focus}</span>
            <span>|</span>
            <span>Spellpower: {totalPower}</span>
          </>
        ) : (
          <>
            <span>Essence: 0</span>
            <span>|</span>
            <span>Focus: 0</span>
            <span>|</span>
            <span>Spellpower: 0</span>
          </>
        )}
      </div>
    </div>
  );
}
