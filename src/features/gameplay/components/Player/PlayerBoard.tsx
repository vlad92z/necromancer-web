/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { FloorLine } from './FloorLine';
import { SoloRuneScoreOverlay } from '../SoloRuneScoreOverlay';
import { SoloHealthTracker } from '../SoloHealthTracker';
import { StatBadge } from '../../../../components/StatBadge';
import deckSvg from '../../../../assets/stats/deck.svg';
import fatigueSvg from '../../../../assets/stats/fatigue.svg';

interface PlayerBoardProps {
  player: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  lockedLineIndexes?: number[];
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
  round: number;
  soloRuneScore?: {
    currentScore: number;
    targetScore: number;
  };
  deckCount?: number;
  strain?: number;
  onOpenDeck?: () => void;
}

export function PlayerBoard({
  player,
  onPlaceRunes,
  onPlaceRunesInFloor,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  lockedLineIndexes,
  hiddenSlotKeys,
  hiddenFloorSlotIndexes,
  soloRuneScore,
  deckCount,
  strain,
  onOpenDeck,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };
  const deckValue = deckCount ?? player.deck.length ?? 0;
  const fatigueValue = strain ?? 0;

  return (
    <div
      onClick={handleBoardClick}
      style={{
        width: '100%',
        height: '100%',
        padding: 'min(1.2vmin, 16px)',
        borderRadius: '28px',
        background: 'rgba(14, 6, 32, 0.92)',
        boxShadow: '0 10px 40px rgba(3, 0, 18, 0.65)',
        transition: 'box-shadow 0.2s ease'
      }}
    >
      <div style={{ 
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: 'min(1.5vmin, 18px)',
        width: '100%',
        height: '100%'
      }}>
        <div style={{ 
          flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'min(1.2vmin, 12px)'
      }}>
          <div
              style={{ display: 'flex', justifyContent: 'center' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '640px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '10px',
                    alignItems: 'stretch'
                  }}
                >
                  <StatBadge
                    label="Deck"
                    value={deckValue}
                    color="#60a5fa"
                    borderColor="rgba(96, 165, 250, 0.35)"
                    tooltip={`Runes left in deck: ${deckValue}`}
                    image={deckSvg}
                    onClick={onOpenDeck}
                  />
                  <SoloRuneScoreOverlay
                    currentScore={soloRuneScore?.currentScore ?? 0}
                    targetScore={soloRuneScore?.targetScore ?? 0}
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '10px',
                    alignItems: 'stretch'
                  }}
                >
                  <StatBadge
                    label="Fatigue"
                    value={fatigueValue}
                    color="#fa6060ff"
                    borderColor="rgba(154, 147, 23, 0.35)"
                    tooltip={`Overloading runes immediately deals ${fatigueValue} damage`}
                    image={fatigueSvg}
                  />
                  <SoloHealthTracker health={player.health} maxHealth={player.maxHealth} />
                </div>
              </div>
            </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto auto',
              gridTemplateRows: 'auto auto',
              alignItems: 'start',
              gap: 'min(1.2vmin, 14px)'
            }}
          >
            {/* Pattern Lines */}
            <div
              style={{ gridColumn: 1, gridRow: 2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PatternLines 
                patternLines={player.patternLines}
                wall={player.wall}
                onPlaceRunes={onPlaceRunes}
                selectedRuneType={selectedRuneType}
                canPlace={canPlace}
                playerId={player.id}
                hiddenSlotKeys={hiddenSlotKeys}
                lockedLineIndexes={lockedLineIndexes}
              />
            </div>
            
            {/* Wall */}
            <div
              style={{
                gridColumn: 2,
                gridRow: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'min(0.7vmin, 12px)'
              }}
            >
              <ScoringWall wall={player.wall} patternLines={player.patternLines} />
            </div>
          </div>

          {/* Floor Line - spans beneath pattern lines and wall */}
          <div onClick={(e) => e.stopPropagation()}>
            <FloorLine 
              floorLine={player.floorLine}
              onPlaceRunesInFloor={onPlaceRunesInFloor}
              canPlace={canPlace}
              mitigatedSlots={0}
              playerId={player.id}
              hiddenSlotIndexes={hiddenFloorSlotIndexes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
