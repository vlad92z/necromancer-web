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
  soloRuneScore,
  deckCount,
  strain,
  onOpenDeck,
  onOpenOverload,
  activeArtefactIds,
  hintsEnabled,
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
        soloRuneScore={soloRuneScore}
        deckCount={deckCount}
        strain={strain}
        onOpenDeck={onOpenDeck}
        onOpenOverload={onOpenOverload}
        activeArtefactIds={activeArtefactIds}
        hintsEnabled={hintsEnabled}
      />
    </div>
  );
}
