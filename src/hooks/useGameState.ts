/**
 * Zustand selector hooks for gameplay, artefact, selection, and UI state.
 */

import { useShallow } from 'zustand/react/shallow';
import { useArtefactStore } from '../state/stores/artefactStore';
import { useBoardStore } from '../state/stores/boardStore';
import { useCombatStore } from '../state/stores/combatStore';
import { useResolutionStore } from '../state/stores/resolutionStore';
import { useRunStore } from '../state/stores/runStore';
import { useSelectionStore } from '../state/stores/selectionStore';
import { useUIStore } from '../state/stores/uiStore';

export function useFactories() {
  return useBoardStore(
    useShallow((state) => ({
      runeforges: state.runeforges,
    })),
  );
}

export function useTurnPhase() {
  return useResolutionStore((state) => state.turnPhase);
}

export function useSelectedRunes() {
  return useSelectionStore((state) => state.selectedRunes);
}

export function useGame() {
  return useRunStore((state) => state.gameIndex);
}

export function useGameStarted() {
  return useRunStore((state) => state.gameStarted);
}

export function useGameIndex() {
  return useRunStore((state) => state.gameIndex);
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

export function useTooltipState() {
  return useUIStore(
    useShallow((state) => ({
      tooltipCards: state.tooltipCards,
      tooltipOverrideActive: state.tooltipOverrideActive,
    })),
  );
}

export function useGameplayContainerState() {
  const channelSoundPending = useResolutionStore((state) => state.channelSoundPending);
  const overloadSoundPending = useResolutionStore((state) => state.overloadSoundPending);
  const player = useBoardStore((state) => state.player);

  return { player, channelSoundPending, overloadSoundPending };
}

export function useCombatEnemyState() {
  return useCombatStore(
    useShallow((state) => ({
      enemy: state.enemy,
      combatPhase: state.combatPhase,
    })),
  );
}

export function useCombatZoneState() {
  return useCombatStore(
    useShallow((state) => ({
      hand: state.hand,
      discardPile: state.discardPile,
      selectedHandRuneId: state.selectedHandRuneId,
    })),
  );
}

export function useGameplayPatternLineState() {
  return useBoardStore(
    useShallow((state) => ({
      lockedPatternLines: state.lockedPatternLines,
      wall: state.player.wall,
      patternLines: state.player.patternLines,
      overloadDamage: state.overloadDamage,
    })),
  );
}

export function useGameplayWallState() {
  const board = useBoardStore(
    useShallow((state) => ({
      wall: state.player.wall,
      patternLines: state.player.patternLines,
    })),
  );
  const scoringSequence = useResolutionStore((state) => state.scoringSequence);

  return { ...board, scoringSequence };
}

export function useGameplayRuneforgeState() {
  const board = useBoardStore(
    useShallow((state) => ({
      draftStage: state.runeforgeDraftStage,
      runeforges: state.runeforges,
    })),
  );
  const runesPerRuneforge = useRunStore((state) => state.runesPerRuneforge);

  return { ...board, runesPerRuneforge };
}

export function useGameplayDeckState() {
  const deck = useBoardStore((state) => state.player.deck);
  const isDrafting = useRunStore((state) => state.deckDraftState !== null);

  return { deck, isDrafting };
}

export function useGameplayOverloadState() {
  return useBoardStore(
    useShallow((state) => ({
      overloadDamage: state.overloadDamage,
      overloadRunes: state.overloadRunes,
      overloadedRuneCount: state.overloadRunes.length,
      playerName: state.player.name,
    })),
  );
}

export function useGameplayHealthState() {
  const board = useBoardStore(
    useShallow((state) => ({
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      armor: state.player.armor,
    })),
  );
  const scoringSequence = useResolutionStore((state) => state.scoringSequence);

  return { ...board, scoringSequence };
}

export function useGameplayScoreState() {
  return useRunStore(
    useShallow((state) => ({
      currentScore: state.runePowerTotal,
      targetScore: state.targetScore,
    })),
  );
}

export function useGameplayStatusState() {
  return useRunStore(
    useShallow((state) => ({
      isDefeat: state.isDefeat,
      deckDraftState: state.deckDraftState,
    })),
  );
}

export function useGameplaySummaryState() {
  return useRunStore(
    useShallow((state) => ({
      runeScore: state.runePowerTotal,
      targetScore: state.targetScore,
      gameIndex: state.gameIndex,
    })),
  );
}
