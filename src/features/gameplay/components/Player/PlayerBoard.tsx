/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { StatsView } from './StatsView';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';

interface PlayerBoardProps {
  player: Player;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  lockedLineIndexes?: number[];
  hiddenSlotKeys?: Set<string>;
  runeScore: {
    currentScore: number;
    targetScore: number;
  };
  deckCount?: number;
  strain?: number;
  overloadedRuneCount?: number;
  onOpenDeck?: () => void;
  onOpenOverload?: () => void;
  onOpenSettings?: () => void;
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
  overloadedRuneCount,
  onOpenDeck,
  onOpenOverload,
  onOpenSettings,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };
  const deckValue = deckCount ?? player.deck.length ?? 0;
  const fatigueValue = strain ?? 0;
  const overloadedRunes = overloadedRuneCount ?? 0;
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
      className={ "relative w-full h-full p-[min(1.2vmin,16px)]"}
    >
      <div className="flex items-stretch justify-between gap-[min(1.5vmin,18px)] w-full h-full">
        <div className="flex-1 flex flex-col gap-[min(1.2vmin,12px)]">
          <StatsView
            deckRemaining={deckRemaining}
            strainValue={fatigueValue}
            overloadedRuneCount={overloadedRunes}
            canOverload={Boolean(canPlace)}
            onDeckClick={onOpenDeck}
            onStrainClick={handleFatigueClick}
            runeScore={runeScore}
            health={player.health}
            maxHealth={player.maxHealth ?? player.health}
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
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-[min(1.2vmin,16px)] right-[min(1.2vmin,16px)]"
        onClick={(event) => event.stopPropagation()}
      >
        <ClickSoundButton
          title="⚙ Settings"
          action={() => {
            if (onOpenSettings) {
              onOpenSettings();
            }
          }}
          className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        />
      </div>
    </div>
  );
}
