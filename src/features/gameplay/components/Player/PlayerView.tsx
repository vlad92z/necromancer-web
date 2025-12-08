/**
 * PlayerView component - displays the human player's board
 */

import type { Player, RuneType } from '../../../../types/game';
import type { ArtefactId } from '../../../../types/artefacts';
import { PlayerBoard } from './PlayerBoard';

interface PlayerViewProps {
  player: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType: RuneType | null;
  canPlace: boolean;
  onCancelSelection: () => void;
  lockedPatternLines?: number[];
  hiddenSlotKeys?: Set<string>;
  game: number;
  runeScore?: {
    currentScore: number;
    targetScore: number;
  };
  deckCount?: number;
  strain?: number;
  onOpenDeck?: () => void;
  onOpenOverload?: () => void;
  onOpenSettings?: () => void;
  arcaneDust?: number;
  activeArtefactIds: ArtefactId[];
}

export function PlayerView({
  player,
  isActive,
  onPlaceRunes,
  onPlaceRunesInFloor,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  lockedPatternLines,
  hiddenSlotKeys,
  game,
  runeScore,
  deckCount,
  strain,
  onOpenDeck,
  onOpenOverload,
  onOpenSettings,
  arcaneDust,
  activeArtefactIds,
}: PlayerViewProps) {
  return (
    <div>
      <PlayerBoard
        player={player}
        isActive={isActive}
        onPlaceRunes={onPlaceRunes}
        onPlaceRunesInFloor={onPlaceRunesInFloor}
        selectedRuneType={selectedRuneType}
        canPlace={canPlace}
        onCancelSelection={onCancelSelection}
        lockedLineIndexes={lockedPatternLines}
        hiddenSlotKeys={hiddenSlotKeys}
        game={game}
        runeScore={runeScore}
        deckCount={deckCount}
        strain={strain}
        onOpenDeck={onOpenDeck}
        onOpenOverload={onOpenOverload}
        onOpenSettings={onOpenSettings}
        arcaneDust={arcaneDust}
        activeArtefactIds={activeArtefactIds}
      />
    </div>
  );
}
