/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { RuneToken } from '../../../components/RuneToken';

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
        border: isActive ? '2px solid rgba(59, 130, 246, 0.5)' : 'white',
        backgroundColor: isActive ? 'rgba(140, 233, 254, 0.5)' : 'white',
      }}
    >
      <div style={{ marginBottom: window.innerWidth < 768 ? '4px' : '16px' }}>
        <h3 style={{ fontSize: window.innerWidth < 768 ? '7px' : '18px', fontWeight: 'bold', color: 'white' }}>{player.name}</h3>
        <div style={{ fontSize: window.innerWidth < 768 ? '6px' : '14px', color: '#9ca3af' }}>
          Score: {player.score} | Deck: {player.deck.length} runes
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: window.innerWidth < 768 ? '6px' : '24px', justifyContent: 'space-between', width: '100%' }}>
        {/* Pattern Lines */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <h4 style={{ fontSize: window.innerWidth < 768 ? '6px' : '14px', fontWeight: '600', color: '#d1d5db', marginBottom: window.innerWidth < 768 ? '3px' : '8px' }}>Spell-casting Lines</h4>
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
          <h4 style={{ fontSize: window.innerWidth < 768 ? '6px' : '14px', fontWeight: '600', color: '#d1d5db', marginBottom: window.innerWidth < 768 ? '3px' : '8px' }}>Rune Wall</h4>
          <ScoringWall wall={player.wall} />
        </div>
      </div>
      
      {/* Floor Line */}
      <div style={{ marginTop: window.innerWidth < 768 ? '4px' : '16px' }} onClick={(e) => e.stopPropagation()}>
        <h4 style={{ fontSize: window.innerWidth < 768 ? '6px' : '14px', fontWeight: '600', color: '#d1d5db', marginBottom: window.innerWidth < 768 ? '3px' : '8px' }}>Overcharged</h4>
        <button
          onClick={onPlaceRunesInFloor}
          disabled={!canPlace || !onPlaceRunesInFloor}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: window.innerWidth < 768 ? '4px' : '8px',
            width: '100%',
            cursor: (canPlace && onPlaceRunesInFloor) ? 'pointer' : 'default',
            backgroundColor: (canPlace && onPlaceRunesInFloor) ? 'rgba(127, 29, 29, 0.2)' : 'transparent',
            border: (canPlace && onPlaceRunesInFloor) ? '2px solid rgba(239, 68, 68, 0.5)' : '2px solid transparent',
            padding: window.innerWidth < 768 ? '4px' : '8px',
            borderRadius: window.innerWidth < 768 ? '6px' : '8px',
            transition: 'all 0.2s',
            justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start'
          }}
          onMouseEnter={(e) => (canPlace && onPlaceRunesInFloor) && (e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)')}
          onMouseLeave={(e) => (canPlace && onPlaceRunesInFloor) && (e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.2)')}
          aria-label="Place runes in floor line (take penalties)"
        >
          {Array(player.floorLine.maxCapacity)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                style={{
                  width: window.innerWidth < 768 ? '45px' : '60px',
                  height: window.innerWidth < 768 ? '45px' : '60px',
                  border: '2px solid #7f1d1d',
                  borderRadius: window.innerWidth < 768 ? '6px' : '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1f2937'
                }}
              >
                {player.floorLine.runes[index] ? (
                  <RuneToken rune={player.floorLine.runes[index]} size="small" />
                ) : (
                  <div style={{fontSize: window.innerWidth < 768 ? '7px' : '20px'}}>-{index + 1}</div>
                )}
              </div>
            ))}
        </button>
        {canPlace && onPlaceRunesInFloor && (
          <div style={{ fontSize: window.innerWidth < 768 ? '5px' : '12px', color: '#9ca3af', marginTop: '4px', textAlign: 'center' }}>
            Click to discard runes here (penalties)
          </div>
        )}
      </div>
    </div>
  );
}
