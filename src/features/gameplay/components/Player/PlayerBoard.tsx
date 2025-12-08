/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../../types/game';
import type { ArtefactId } from '../../../../types/artefacts';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { ArtefactsRow } from '../../../../components/ArtefactsRow';
import { StatsView } from './StatsView';

interface PlayerBoardProps {
  player: Player;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  lockedLineIndexes?: number[];
  hiddenSlotKeys?: Set<string>;
  game: number;
  runeScore: {
    currentScore: number;
    targetScore: number;
  };
  deckCount?: number;
  strain?: number;
  onOpenDeck?: () => void;
  onOpenOverload?: () => void;
  onOpenSettings?: () => void;
  activeArtefactIds: ArtefactId[];
  arcaneDust?: number;
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
  runeScore,
  deckCount,
  strain,
  onOpenDeck,
  onOpenOverload,
  onOpenSettings,
  game,
  activeArtefactIds,
  arcaneDust,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };
  const deckValue = deckCount ?? player.deck.length ?? 0;
  const fatigueValue = strain ?? 0;
  const deckRemaining = deckValue - 20;

  const handleFatigueClick = () => {
    if (canPlace && onPlaceRunesInFloor) {
      // If runes are selected, overload them
      onPlaceRunesInFloor();
    } else if (!canPlace && onOpenOverload) {
      // If no runes are selected, open the overload overlay
      onOpenOverload();
    }
  };

  return (
    <div
      onClick={handleBoardClick}
      className={ "w-full h-full p-[min(1.2vmin,16px)] rounded-[28px]"}
    >
      <div className="flex items-stretch justify-between gap-[min(1.5vmin,18px)] w-full h-full">
        <div className="flex-1 flex flex-col gap-[min(1.2vmin,12px)]">
          <StatsView
            playerId={player.id}
            deckRemaining={deckRemaining}
            strainValue={fatigueValue}
            canOverload={Boolean(canPlace)}
            onDeckClick={onOpenDeck}
            onStrainClick={handleFatigueClick}
            runeScore={runeScore}
            health={player.health}
            maxHealth={player.maxHealth ?? player.health}
            onOpenSettings={onOpenSettings}
            gameNumber={game}
            arcaneDust={arcaneDust}
          />
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
            {activeArtefactIds.length > 0 && (
            <div className="flex justify-left mt-2 mb-4">
              <ArtefactsRow selectedArtefactIds={activeArtefactIds} />
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
