/**
 * SoloGameBoard - solo mode game board layout
 */

import { GameMetadataView } from './Center/GameMetadataView';
import { PlayerHandView } from './PlayerHandView';
import { EndRoundButton } from './Player/EndRoundButton';
import { PatternLines } from './Player/PatternLines';
import { SpellWallView } from './Player/SpellWallView';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { useUIStore } from '../../../state/stores/uiStore';

export function SoloGameView() {
  const animatingRunes = useUIStore((state) => state.animatingRunes);
  const clearAnimatingRunes = useUIStore((state) => state.clearAnimatingRunes);

  /**
   * handlePlacementAnimationComplete - clears overlay runes after placement animations finish.
   */
  const handlePlacementAnimationComplete = () => {
    clearAnimatingRunes();
  };

  return (
    <div className="flex flex-col h-full relative">
      <GameMetadataView/>
      <div className="flex h-full items-center justify-center flex-row p-5 gap-5">
        <div className="flex h-full items-start">
          <EndRoundButton />
        </div>
        <PatternLines />
        <SpellWallView />
      </div>
      <PlayerHandView />
      <RuneAnimation
        animatingRunes={animatingRunes}
        onAnimationComplete={handlePlacementAnimationComplete}
      />
      {/* TODO: Cleanup */}
      {/* {isDeckDrafting && deckDraftState && onSelectDeckDraftRuneforge && onOpenDeckOverlay && startNextSoloGame && arcaneDustReward != null && ( */}
{/* 
        <DeckDraftingModal
          draftState={deckDraftState}
          onSelectRuneforge={onSelectDeckDraftRuneforge}
          onOpenDeckOverlay={onOpenDeckOverlay}
          totalDeckSize={totalDeckSize}
          arcaneDustReward={arcaneDustReward}
          startNextSoloGame={startNextSoloGame}
        />
      )}

      { isGameOver && (<SoloGameOverModal/>)} */}
    </div>
  );
}
