/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../../types/game';
import type { ArtefactId } from '../../../../types/artefacts';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { SoloRuneScoreOverlay } from '../SoloRuneScoreOverlay';
import { SoloHealthTracker } from '../SoloHealthTracker';
import { StatBadge } from '../../../../components/StatBadge';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import { ArtefactsRow } from '../../../../components/ArtefactsRow';
import { HintBox } from '../../../../components/HintBox';

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
  game: number;
  soloRuneScore?: {
    currentScore: number;
    targetScore: number;
  };
  deckCount?: number;
  strain?: number;
  onOpenDeck?: () => void;
  onOpenOverload?: () => void;
  activeArtefactIds: ArtefactId[];
  hintsEnabled?: boolean;
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
  soloRuneScore,
  deckCount,
  strain,
  onOpenDeck,
  onOpenOverload,
  activeArtefactIds,
  hintsEnabled = false,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };
  const deckValue = deckCount ?? player.deck.length ?? 0;
  const fatigueValue = strain ?? 0;

  const handleFatigueClick = () => {
    if (canPlace && onPlaceRunesInFloor) {
      // If runes are selected, overload them
      onPlaceRunesInFloor();
    } else if (!canPlace && onOpenOverload) {
      // If no runes are selected, open the overload overlay
      onOpenOverload();
    }
  };

  // Determine which hint to display
  const getHintText = (): string | null => {
    if (!hintsEnabled) return null;

    // Check if any pattern line is complete
    const hasCompletedLine = player.patternLines.some(
      (line) => line.count === line.tier && line.count > 0
    );
    if (hasCompletedLine) {
      return "Completing a pattern line will cast the rune onto the Spell-Wall";
    }

    // Check if wall has runes with effects (for segment scoring)
    const wallHasEffects = player.wall.some(
      (row) => row.some((cell) => cell.effects && cell.effects.length > 0)
    );
    if (wallHasEffects) {
      return "Every rune from the active segment will trigger its effect";
    }

    // Check if player is placing runes and they have effects
    if (canPlace && selectedRuneType) {
      // Check if any pattern line has runes with effects (firstRuneEffects)
      const hasRuneWithEffect = player.patternLines.some(
        (line) => line.firstRuneEffects && line.firstRuneEffects.length > 0
      );
      if (hasRuneWithEffect) {
        return "Only your chosen rune's effect will be applied; the other runes will be destroyed upon casting";
      }
    }

    // Check for recent damage (strain > 0)
    if (strain && strain > 0) {
      return "When you place too many runes or directly overload runes, you will take damage for every overloaded rune. This damage increases every round";
    }

    return null;
  };

  const hintText = getHintText();

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
          {hintText && <HintBox text={hintText} />}
          <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
            <div className="w-full max-w-[640px] flex flex-col gap-[10px]">
              <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'stretch' }}>
                <StatBadge
                  label="Deck"
                  value={deckValue - 20}
                  color="#60a5fa"
                  borderColor="rgba(96, 165, 250, 0.35)"
                  tooltip={`Runes left in deck: ${deckValue - 20}`}
                  image={deckSvg}
                  onClick={onOpenDeck}
                />
                <SoloRuneScoreOverlay
                  currentScore={soloRuneScore?.currentScore ?? 0}
                  targetScore={soloRuneScore?.targetScore ?? 0}
                />
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'stretch' }}>
                <div data-player-id={player.id} data-strain-counter="true">
                  <StatBadge
                    label="Fatigue"
                    value={fatigueValue}
                    color="#fa6060ff"
                    borderColor="rgba(96, 165, 250, 0.35)"
                    tooltip={`Overloading runes immediately deals ${fatigueValue} damage`}
                    image={overloadSvg}
                    onClick={handleFatigueClick}
                    canOverload={canPlace}
                  />
                </div>
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


          {activeArtefactIds.length > 0 && (
            <div className="flex justify-center mt-2">
              <ArtefactsRow selectedArtefactIds={activeArtefactIds} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
