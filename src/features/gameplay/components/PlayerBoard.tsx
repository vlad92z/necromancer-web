/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { FloorLine } from './FloorLine';
import { RunePower } from './RunePower';

interface PlayerBoardProps {
  player: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
}

export function PlayerBoard({ player, isActive, onPlaceRunes, onPlaceRunesInFloor, selectedRuneType, canPlace, onCancelSelection }: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };

  return (
    <div
      onClick={handleBoardClick}
      style={{
        padding: window.innerWidth < 768 ? '4px' : '16px',
        borderRadius: window.innerWidth < 768 ? '6px' : '8px',
        border: isActive ? '2px solid rgba(59, 130, 246, 0.5)' : '2px solid #e2e8f0',
        backgroundColor: isActive ? 'rgba(191, 219, 254, 0.3)' : '#ffffff',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap: window.innerWidth < 768 ? '6px' : '24px', justifyContent: 'space-between', width: '100%' }}>
        {/* Pattern Lines */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <PatternLines 
            patternLines={player.patternLines}
            wall={player.wall}
            onPlaceRunes={onPlaceRunes}
            selectedRuneType={selectedRuneType}
            canPlace={canPlace}
          />
        </div>
        
        {/* Wall */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoringWall wall={player.wall} patternLines={player.patternLines} />
        </div>
      </div>
      
      {/* Floor Line */}
      <FloorLine 
        floorLine={player.floorLine}
        onPlaceRunesInFloor={onPlaceRunesInFloor}
        canPlace={canPlace}
      />
      
      {/* Rune Power Calculation */}
      <RunePower player={player} />
    </div>
  );
}
