/**
 * Zustand selector hooks for gameplay, artefact, selection, and UI state.
 */

import { useShallow } from 'zustand/react/shallow';
import { useArtefactStore } from '../state/stores/artefactStore';
import { useGameplayStore } from '../state/stores/gameplayStore';
import { useSelectionStore } from '../state/stores/selectionStore';
import { useUIStore } from '../state/stores/uiStore';

export function useFactories() {
  return useGameplayStore(
    useShallow((state) => ({
      runeforges: state.runeforges,
    })),
  );
}

export function useTurnPhase() {
  return useGameplayStore((state) => state.turnPhase);
}

export function useSelectedRunes() {
  return useSelectionStore((state) => state.selectedRunes);
}

export function useGame() {
  return useGameplayStore((state) => state.gameIndex);
}

export function useGameStarted() {
  return useGameplayStore((state) => state.gameStarted);
}

export function useGameIndex() {
  return useGameplayStore((state) => state.gameIndex);
}

export function useArcaneDust() {
  return useArtefactStore((state) => state.arcaneDust);
}

export function useSelectedArtefactIds() {
  return useArtefactStore((state) => state.selectedArtefactIds);
}

export function useActiveElement() {
  return useSelectionStore((state) => state.activeElement);
}

export function useSoundVolume() {
  return useUIStore((state) => state.soundVolume);
}

export function useShowSettingsOverlay() {
  return useUIStore((state) => state.showSettingsOverlay);
}

export function useIsPlacementAnimating() {
  return useUIStore((state) => state.isPlacementAnimating);
}

export function useSelectionState() {
  return useSelectionStore(
    useShallow((state) => ({
      selectedRunes: state.selectedRunes,
      draftSource: state.draftSource,
      activeElement: state.activeElement,
    })),
  );
}

export function useTooltipSelectionState() {
  return useSelectionStore(
    useShallow((state) => ({
      selectedRunes: state.selectedRunes,
      activeElement: state.activeElement,
    })),
  );
}

export function useArtefactInventoryState() {
  return useArtefactStore(
    useShallow((state) => ({
      selectedArtefactIds: state.selectedArtefactIds,
      ownedArtefactIds: state.ownedArtefactIds,
      arcaneDust: state.arcaneDust,
    })),
  );
}

export function useSoloStartArtefactState() {
  return useArtefactStore(
    useShallow((state) => ({
      arcaneDust: state.arcaneDust,
      selectedArtefactIds: state.selectedArtefactIds,
    })),
  );
}

export function useAppAudioState() {
  return useUIStore(
    useShallow((state) => ({
      isMusicMuted: state.isMusicMuted,
      soundVolume: state.soundVolume,
      hasMusicSessionStarted: state.hasMusicSessionStarted,
    })),
  );
}

export function useMenuSettingsState() {
  return useUIStore(
    useShallow((state) => ({
      showSettingsOverlay: state.showSettingsOverlay,
      soundVolume: state.soundVolume,
      isMusicMuted: state.isMusicMuted,
    })),
  );
}

export function useUIOverlayState() {
  return useUIStore(
    useShallow((state) => ({
      showSettingsOverlay: state.showSettingsOverlay,
      showDeckOverlay: state.showDeckOverlay,
      showOverloadOverlay: state.showOverloadOverlay,
    })),
  );
}

export function useUIAnimationState() {
  return useUIStore(
    useShallow((state) => ({
      animatingRuneIds: state.animatingRuneIds,
      isPlacementAnimating: state.isPlacementAnimating,
      playerHiddenPatternSlots: state.playerHiddenPatternSlots,
    })),
  );
}

export function useGameplayContainerState() {
  return useGameplayStore(
    useShallow((state) => ({
      shouldTriggerEndRound: state.shouldTriggerEndRound,
      player: state.player,
      scoringSequence: state.scoringSequence,
      channelSoundPending: state.channelSoundPending,
      overloadSoundPending: state.overloadSoundPending,
    })),
  );
}

export function useGameplayTooltipState() {
  return useGameplayStore(
    useShallow((state) => ({
      tooltipCards: state.tooltipCards,
      tooltipOverrideActive: state.tooltipOverrideActive,
    })),
  );
}

export function useGameplayPatternLineState() {
  return useGameplayStore(
    useShallow((state) => ({
      lockedPatternLines: state.lockedPatternLines,
      wall: state.player.wall,
      patternLines: state.player.patternLines,
      overloadDamage: state.overloadDamage,
    })),
  );
}

export function useGameplayWallState() {
  return useGameplayStore(
    useShallow((state) => ({
      wall: state.player.wall,
      patternLines: state.player.patternLines,
      scoringSequence: state.scoringSequence,
    })),
  );
}

export function useGameplayRuneforgeState() {
  return useGameplayStore(
    useShallow((state) => ({
      draftStage: state.runeforgeDraftStage,
      runeforges: state.runeforges,
      runesPerRuneforge: state.runesPerRuneforge,
    })),
  );
}

export function useGameplayDeckState() {
  return useGameplayStore(
    useShallow((state) => ({
      deck: state.player.deck,
      isDrafting: state.deckDraftState !== null,
    })),
  );
}

export function useGameplayOverloadState() {
  return useGameplayStore(
    useShallow((state) => ({
      overloadDamage: state.overloadDamage,
      overloadRunes: state.overloadRunes,
      overloadedRuneCount: state.overloadRunes.length,
      playerName: state.player.name,
    })),
  );
}

export function useGameplayHealthState() {
  return useGameplayStore(
    useShallow((state) => ({
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      armor: state.player.armor,
      scoringSequence: state.scoringSequence,
    })),
  );
}

export function useGameplayScoreState() {
  return useGameplayStore(
    useShallow((state) => ({
      currentScore: state.runePowerTotal,
      targetScore: state.targetScore,
    })),
  );
}

export function useGameplayStatusState() {
  return useGameplayStore(
    useShallow((state) => ({
      isDefeat: state.isDefeat,
      deckDraftState: state.deckDraftState,
    })),
  );
}

export function useGameplaySummaryState() {
  return useGameplayStore(
    useShallow((state) => ({
      runeScore: state.runePowerTotal,
      targetScore: state.targetScore,
      gameIndex: state.gameIndex,
    })),
  );
}
