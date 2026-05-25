/**
 * Zustand selector hooks for gameplay, artefact, selection, and UI state.
 */

import { useShallow } from 'zustand/react/shallow';
import { useArtefactStore } from '../state/stores/artefactStore';
import { useBoardStore } from '../state/stores/boardStore';
import { useCombatStore } from '../state/stores/combatStore';
import { useRunStore } from '../state/stores/runStore';
import { useUIStore } from '../state/stores/uiStore';

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
  return useUIStore((state) => state.activeElement);
}

export function useSoundVolume() {
  return useUIStore((state) => state.soundVolume);
}

export function useShowSettingsOverlay() {
  return useUIStore((state) => state.showSettingsOverlay);
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
      activeRuneZoneOverlay: state.activeRuneZoneOverlay,
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

export function useGameplayWallState() {
  const wall = useBoardStore((state) => state.player.wall);
  const wallCharges = useCombatStore((state) => state.wallCharges);

  return { wall, wallCharges };
}

export function useGameplayDeckState() {
  const deck = useBoardStore((state) => state.player.deck);
  const isDrafting = useRunStore((state) => state.deckDraftState !== null);

  return { deck, isDrafting };
}

export function useGameplayHealthState() {
  return useBoardStore(
    useShallow((state) => ({
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      armor: state.player.armor,
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

export function useRuneSoundSignals() {
  return useRunStore((state) => state.runeSoundSignals);
}

export function useWallChargeSoundSignal() {
  return useRunStore((state) => state.wallChargeSoundSignal);
}

export function useEnemyAttackSoundSignal() {
  return useRunStore((state) => state.enemyAttackSoundSignal);
}

export function useShieldSoundSignal() {
  return useRunStore((state) => state.shieldSoundSignal);
}

export function useGameplaySummaryState() {
  return useRunStore(
    useShallow((state) => ({
      gameIndex: state.gameIndex,
      enemyMaxHealth: state.enemyMaxHealth,
    })),
  );
}
