/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, Rune, RuneType } from '../../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { TooltipView } from './TooltipView';
import type { ActiveElement } from '../keyboardNavigation';

interface PlayerBoardProps {
  player: Player;
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  lockedLineIndexes?: number[];
  hiddenSlotKeys?: Set<string>;
  selectedRunes: Rune[];
  overloadDamage: number;
  activeElement?: ActiveElement | null;
}

export function PlayerBoard({
  player,
  onPlaceRunes,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  lockedLineIndexes,
  hiddenSlotKeys,
  selectedRunes,
  overloadDamage,
  activeElement,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };

  const activePatternLineIndex = activeElement?.type === 'pattern-line' ? activeElement.lineIndex : null;

  return (
    <div
      onClick={handleBoardClick}
      className="w-full h-full p-5"
    >
      <div className="flex flex-col gap-[min(1.2vmin,12px)] h-full">
        <div className="flex flex-row gap-5">
          <PatternLines
            wall={player.wall}
            onPlaceRunes={onPlaceRunes}
            selectedRuneType={selectedRuneType}
            canPlace={canPlace}
            playerId={player.id}
            hiddenSlotKeys={hiddenSlotKeys}
            lockedLineIndexes={lockedLineIndexes}
            selectedRunes={selectedRunes}
            overloadDamage={overloadDamage}
            activePatternLineIndex={activePatternLineIndex}
          />
          <ScoringWall/>
        </div>
        <TooltipView/>
      </div>
    </div>
  );
}
