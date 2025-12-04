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
      className={
        "w-full h-full " +
        "p-[min(1.2vmin,16px)] rounded-[28px] " +
        "bg-[rgba(14,6,32,0.92)] shadow-[0_10px_40px_rgba(3,0,18,0.65)] transition-shadow duration-200"
      }
    >
      <div className="flex items-stretch justify-between gap-[min(1.5vmin,18px)] w-full h-full">
        <div className="flex-1 flex flex-col gap-[min(1.2vmin,12px)]">
          <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
            <div className="w-full max-w-[640px] flex flex-col gap-[10px]">
              <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'stretch' }}>
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
              <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'stretch' }}>
                <StatBadge
                  label="Fatigue"
                  value={fatigueValue}
                  color="#fa6060ff"
                  borderColor="rgba(96, 165, 250, 0.35)"
                  tooltip={`Overloading runes immediately deals ${fatigueValue} damage`}
                  image={fatigueSvg}
                />
                <SoloHealthTracker health={player.health} maxHealth={player.maxHealth} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 items-start gap-[min(1.2vmin,14px)]">
            {/* Pattern Lines */}
            <div className="col-start-1" onClick={(e) => e.stopPropagation()}>
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
            <div className="col-start-2 flex flex-col items-center gap-[min(0.7vmin,12px)]">
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
