/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, GameOutcome, Runeforge, ScoringSequenceState, ScoringStep } from '../../types/game';
import { fillRuneforges, nextGame, createRuneforges, createDefaultTooltipCards } from '../../utils/gameInitialization';
import { resolveSegment, getWallColumnForRune } from '../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType, getRuneRarity } from '../../utils/runeEffects';
import { createDeckDraftState, advanceDeckDraftState, mergeDeckWithRuneforge, applyDeckDraftEffectToPlayer } from '../../utils/deckDrafting';
import { addArcaneDust, getArcaneDustReward } from '../../utils/arcaneDust';
import { useArtefactStore } from './artefactStore';
import {
  applyIncomingDamageModifiers,
  applyOutgoingDamageModifiers,
  applyOutgoingHealingModifiers,
  getArmorGainMultiplier,
  getDeckDraftSelectionLimit,
} from '../../utils/artefactEffects';
import { saveSoloState, clearSoloState } from '../../utils/soloPersistence';
import { findBestPatternLineForAutoPlacement } from '../../utils/patternLineHelpers';
import { trackDefeatEvent, trackNewGameEvent } from '../../utils/mixpanel';
import { getOverloadDamageForRound } from '../../utils/overload';

function areAllRuneforgesDisabled(runeforges: Runeforge[]): boolean {
  return runeforges.every((runeforge) => runeforge.disabled ?? false);
}

//TODO: Extract to helpers
function sortPrimaryRuneFirst(runes: Rune[], primaryRuneId?: string | null): Rune[] {
  if (!primaryRuneId) {
    return runes;
  }
  const primaryRune = runes.find((rune) => rune.id === primaryRuneId);
  if (!primaryRune) {
    return runes;
  }
  return [primaryRune, ...runes.filter((rune) => rune.id !== primaryRuneId)];
}

//TODO: Extract to helpers
function buildRuneTypeCountMap(runes: Rune[]): Map<RuneType, number> {
  const counts = new Map<RuneType, number>();
  runes.forEach((rune) => {
    counts.set(rune.runeType, (counts.get(rune.runeType) ?? 0) + 1);
  });
  return counts;
}

function enterDeckDraftMode(state: GameState): GameState {
  const selectionLimit = getDeckDraftSelectionLimit(state.activeArtefacts);
  const deckDraftState = createDeckDraftState(
    state.player.id,
    state.victoryDraftPicks,
    state.gameIndex,
    state.activeArtefacts,
    selectionLimit
  );
  const arcaneDustReward = getArcaneDustReward(state.gameIndex);
  const nextTargetScore = state.targetScore + 999; //TODO: should come from config

  if (arcaneDustReward > 0) {
    const newDustTotal = addArcaneDust(arcaneDustReward);
    useArtefactStore.getState().updateArcaneDust(newDustTotal);
  }

  return {
    ...state,
    deckDraftState,
    deckDraftReadyForNextGame: false,
    turnPhase: 'deck-draft' as const,
    runeforges: [],
    runeforgeDraftStage: 'single' as const,
    selectedRunes: [],
    overloadRunes: [],
    scoringSequence: null,
    selectionTimestamp: null,
    draftSource: null,
    shouldTriggerEndRound: false,
    overloadSoundPending: false,
    channelSoundPending: state.channelSoundPending,
    outcome: 'victory',
    targetScore: nextTargetScore,
    baseTargetScore: state.baseTargetScore || nextTargetScore,
  };
}

// Navigation callback registry for routing integration
let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null) {
  navigationCallback = callback;
}

const SCORING_DELAY_BASE_MS = 420;
const SCORING_DELAY_MIN_MS = 140;
const SCORING_DELAY_DECAY_MS = 22;

const scoringTimeoutRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };

function getRuneResolutionDelayMs(segmentSize: number): number {
  const normalizedSize = Math.max(1, segmentSize);
  const scaledDelay = SCORING_DELAY_BASE_MS - (normalizedSize - 1) * SCORING_DELAY_DECAY_MS;
  return Math.max(SCORING_DELAY_MIN_MS, Math.round(scaledDelay));
}

function clearScoringTimeout(): void {
  if (scoringTimeoutRef.current !== null) {
    clearTimeout(scoringTimeoutRef.current);
    scoringTimeoutRef.current = null;
  }
}

function accumulateScoringDeltas(steps: ScoringStep[]): {
  damage: number;
  healing: number;
  armor: number;
  arcaneDust: number;
} {
  return steps.reduce(
    (totals, step) => ({
      damage: totals.damage + step.damageDelta,
      healing: totals.healing + step.healingDelta,
      armor: totals.armor + step.armorDelta,
      arcaneDust: totals.arcaneDust + step.arcaneDustDelta,
    }),
    { damage: 0, healing: 0, armor: 0, arcaneDust: 0 }
  );
}

function getDisplayTotalsForIndex(sequence: ScoringSequenceState, activeIndex: number): {
  health: number;
  armor: number;
  runePowerTotal: number;
  arcaneDust: number;
} {
  const clampedIndex = Math.max(0, Math.min(activeIndex, sequence.steps.length - 1));
  const partialDeltas = accumulateScoringDeltas(sequence.steps.slice(0, clampedIndex + 1));
  const nextHealth = Math.min(sequence.maxHealth, sequence.startHealth + partialDeltas.healing);
  const nextArmor = Math.max(0, sequence.startArmor + partialDeltas.armor);
  const nextRunePowerTotal = sequence.startRunePowerTotal + partialDeltas.damage;
  const nextArcaneDust = Math.max(0, sequence.startArcaneDust + partialDeltas.arcaneDust);

  return {
    health: nextHealth,
    armor: nextArmor,
    runePowerTotal: nextRunePowerTotal,
    arcaneDust: nextArcaneDust,
  };
}

function isRoundExhausted(runeforges: GameState['runeforges']): boolean { //TODO: Not needed
  const allRuneforgesEmpty = runeforges.every((runeforge) => runeforge.runes.length === 0);
  return allRuneforgesEmpty;
}

function getChannelScoreBonusFromOverloadedRunes(
  newlyOverloadedRunes: Rune[]
): { scoreBonus: number; triggered: boolean } {
  if (newlyOverloadedRunes.length === 0) {
    return { scoreBonus: 0, triggered: false };
  }

  let bonus = 0;
  let triggered = false;
  newlyOverloadedRunes.forEach((rune) => {
    rune.effects.forEach((effect) => {
      if (effect.type === 'Channel') {
        bonus += effect.amount;
        triggered = true;
      }
    });
  });

  return { scoreBonus: bonus, triggered };
}

function getOverloadResult(
  currentHealth: number,
  currentArmor: number,
  newlyOverloadedRunes: Rune[],
  state: GameState
): { overloadDamage: number; nextHealth: number; nextArmor: number; scoreBonus: number; channelTriggered: boolean } {
  const strain = state.strain;
  const overloadRunesPlaced = newlyOverloadedRunes.length;
  const baseDamage = overloadRunesPlaced > 0 ? overloadRunesPlaced * strain : 0;
  const { scoreBonus: channelScoreBonus, triggered: channelTriggered } =
    getChannelScoreBonusFromOverloadedRunes(newlyOverloadedRunes);

  // Apply artefact modifiers to incoming damage (Potion triples, Rod converts to score)
  const { damage: modifiedDamage, scoreBonus: rodScoreBonus } = applyIncomingDamageModifiers(baseDamage, state);
  const armorAbsorbed = Math.min(currentArmor, modifiedDamage);
  const remainingDamage = modifiedDamage - armorAbsorbed;
  const nextArmor = currentArmor - armorAbsorbed;
  const nextHealth = remainingDamage > 0 ? Math.max(0, currentHealth - remainingDamage) : currentHealth;
  return {
    overloadDamage: remainingDamage,
    nextHealth,
    nextArmor,
    scoreBonus: rodScoreBonus + channelScoreBonus,
    channelTriggered,
  };
}

function handlePlayerDefeat(
  state: GameState,
  updatedPlayer: Player,
  overloadDamage: number,
  channelTriggered: boolean
): GameState {
  console.log('gameplayStore: handlePlayerDefeat');

  trackDefeatEvent({
    gameIndex: state.gameIndex,
    deck: updatedPlayer.deck,
    runePowerTotal: state.runePowerTotal,
    activeArtefacts: state.activeArtefacts,
    cause: 'overload',
    strain: state.strain,
    health: updatedPlayer.health,
    targetScore: state.targetScore,
  });

  return {
    ...state,
    player: updatedPlayer,
    selectedRunes: [],
    overloadRunes: [],
    selectionTimestamp: null,
    draftSource: null,
    turnPhase: 'game-over' as const,
    shouldTriggerEndRound: false,
    outcome: 'defeat' as GameOutcome,
    overloadSoundPending: overloadDamage > 0,
    channelSoundPending: channelTriggered || state.channelSoundPending,
  };
}

function runScoringSequence(sequence: ScoringSequenceState, set: StoreApi<GameplayStore>['setState']): void {
  clearScoringTimeout();

  if (sequence.steps.length === 0) {
    set((state) => {
      if (!state.scoringSequence || state.scoringSequence.sequenceId !== sequence.sequenceId) {
        return state;
      }
      return { ...state, scoringSequence: null };
    });
    return;
  }

  const executeStep = (index: number) => {
    const step = sequence.steps[index];
    const nextDisplays = getDisplayTotalsForIndex(sequence, index);

    set((state) => {
      const activeSequence = state.scoringSequence;
      if (!activeSequence || activeSequence.sequenceId !== sequence.sequenceId) {
        return state;
      }

      return {
        ...state,
        scoringSequence: {
          ...activeSequence,
          activeIndex: index,
          displayHealth: nextDisplays.health,
          displayArmor: nextDisplays.armor,
          displayRunePowerTotal: nextDisplays.runePowerTotal,
          displayArcaneDust: nextDisplays.arcaneDust,
        },
      };
    });

    const hasNextStep = index + 1 < sequence.steps.length;
    const delay = step.delayMs;

    scoringTimeoutRef.current = setTimeout(() => {
      if (hasNextStep) {
        executeStep(index + 1);
        return;
      }

      set((state) => {
        const activeSequence = state.scoringSequence;
        if (!activeSequence || activeSequence.sequenceId !== sequence.sequenceId) {
          return state;
        }
        return state;
      });

      scoringTimeoutRef.current = setTimeout(() => {
        set((state) => {
          if (!state.scoringSequence || state.scoringSequence.sequenceId !== sequence.sequenceId) {
            return state;
          }
          return { ...state, scoringSequence: null };
        });
      }, delay);
    }, delay);
  };

  executeStep(0);
}

function prepareRoundReset(state: GameState): GameState {
  console.log('gameplayStore: prepareRoundReset');
  const player = state.player;
  const currentStrain = state.strain;
  const nextRound = state.round + 1;
  const nextStrain = getOverloadDamageForRound(state.gameIndex, nextRound);
  const runesNeededForRound = 20; //TODO: should come from config
  const playerHasEnough = player.deck.length >= runesNeededForRound;

  if (!playerHasEnough) {
    // Defeat
    trackDefeatEvent({
      gameIndex: state.gameIndex,
      deck: player.deck,
      runePowerTotal: state.runePowerTotal,
      activeArtefacts: state.activeArtefacts,
      cause: 'deck-empty',
      strain: currentStrain,
      health: player.health,
      targetScore: state.targetScore,
    });

    return {
      ...state,
      player: player,
      runeforges: [],
      turnPhase: 'game-over',
      gameIndex: state.gameIndex,
      outcome: 'defeat' as GameOutcome,
      shouldTriggerEndRound: false,
      selectedRunes: [],
      selectionTimestamp: null,
      draftSource: null,
      scoringSequence: null,
      pendingPlacement: null,
      animatingRunes: [],
      overloadSoundPending: false,
      channelSoundPending: state.channelSoundPending,
      runeforgeDraftStage: 'single',
    };
  }

  const emptyFactories = createRuneforges();
  const { runeforges: filledRuneforges, updatedDeck } = fillRuneforges(emptyFactories, player.deck);

  const updatedPlayer: Player = {
    ...player,
    deck: updatedDeck,
  };

  return {
    ...state,
    player: updatedPlayer,
    runeforges: filledRuneforges.map((runeforge) => ({ ...runeforge, disabled: false })),
    turnPhase: 'select',
    gameIndex: state.gameIndex,
    round: nextRound,
    strain: nextStrain,
    outcome: null,
    lockedPatternLines: [],
    shouldTriggerEndRound: false,
    selectedRunes: [],
    selectionTimestamp: null,
    draftSource: null,
    scoringSequence: null,
    pendingPlacement: null,
    animatingRunes: [],
    overloadSoundPending: false,
    runeforgeDraftStage: 'single',
  };
}

export interface GameplayStore extends GameState {
  // Actions
  startSoloRun: () => void;
  prepareSoloMode: () => void;
  forceSoloVictory: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  startNextSoloGame: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId?: string) => void;
  placeRunes: (patternLineIndex: number) => void;
  moveRunesToWall: () => void;
  placeRunesInFloor: () => void;
  cancelSelection: () => void;
  autoPlaceSelection: () => void;
  acknowledgeOverloadSound: () => void;
  acknowledgeChannelSound: () => void;
  endRound: () => void;
  resetGame: () => void;
  selectDeckDraftRuneforge: (runeforgeId: string) => void;
  disenchantRuneFromDeck: (runeId: string) => number;
  setTooltipCards: (cards: GameState['tooltipCards'], overrideSelection?: boolean) => void;
  resetTooltipCards: () => void;
}

function cancelSelectionState(state: GameplayStore): GameplayStore {
  if (state.turnPhase === 'deck-draft' || state.selectedRunes.length === 0 || !state.draftSource) {
    return state;
  }

  const runeforgeId = state.draftSource.runeforgeId;
  const originalRunes = state.draftSource.originalRunes;
  const affectedRuneforges = state.draftSource.affectedRuneforges ?? [{ runeforgeId, originalRunes }];
  const previousDisabledRuneforgeIds = state.draftSource.previousDisabledRuneforgeIds ?? [];
  const previousRuneforgeDraftStage = state.draftSource.previousRuneforgeDraftStage ?? state.runeforgeDraftStage;

  const updatedRuneforges = state.runeforges.map((f) => {
    const match = affectedRuneforges.find((target) => target.runeforgeId === f.id);
    if (match) {
      return {
        ...f,
        runes: match.originalRunes,
        disabled: previousDisabledRuneforgeIds.includes(f.id),
      };
    }
    return {
      ...f,
      disabled: previousDisabledRuneforgeIds.includes(f.id),
    };
  });

  return {
    ...state,
    runeforges: updatedRuneforges,
    runeforgeDraftStage: previousRuneforgeDraftStage,
    selectedRunes: [],
    selectionTimestamp: null,
    draftSource: null,
    turnPhase: 'select' as const,
  };
}

function placeSelectionOnPatternLine(state: GameplayStore, patternLineIndex: number): GameplayStore {
  if (state.turnPhase !== 'place') {
    return state;
  }

  const { selectedRunes } = state;
  if (selectedRunes.length === 0) return state;

  const currentPlayer = state.player;
  const patternLine = currentPlayer.patternLines[patternLineIndex];
  if (!patternLine) {
    return state;
  }

  const lockedLinesForPlayer = state.lockedPatternLines;
  if (lockedLinesForPlayer.includes(patternLineIndex)) {
    console.log(`Pattern line ${patternLineIndex + 1} is unavailable - cannot place runes`);
    return state;
  }

  const runeType = selectedRunes[0].runeType;

  if (patternLine.runeType !== null && patternLine.runeType !== runeType) {
    return state;
  }

  if (patternLine.count >= patternLine.tier) {
    return state;
  }

  const row = patternLineIndex;
  const wallSize = currentPlayer.wall.length;
  const col = getWallColumnForRune(row, runeType, wallSize);
  if (currentPlayer.wall[row][col].runeType !== null) {
    return state;
  }

  const availableSpace = patternLine.tier - patternLine.count;
  const runesToPlace = Math.min(selectedRunes.length, availableSpace);
  const overflowRunes = selectedRunes.slice(runesToPlace);

  const primaryRune = selectedRunes[0];
  const nextFirstRuneId = patternLine.firstRuneId ?? primaryRune.id;
  const nextFirstRuneEffects = patternLine.firstRuneEffects ?? copyRuneEffects(primaryRune.effects);

  const updatedPatternLines = [...currentPlayer.patternLines];
  updatedPatternLines[patternLineIndex] = {
    ...patternLine,
    runeType,
    count: patternLine.count + runesToPlace,
    firstRuneId: nextFirstRuneId,
    firstRuneEffects: nextFirstRuneEffects,
  };

  const { overloadDamage, nextHealth, nextArmor, scoreBonus, channelTriggered } = getOverloadResult(
    currentPlayer.health,
    currentPlayer.armor,
    overflowRunes,
    state
  );
  const nextChannelSoundPending = channelTriggered || state.channelSoundPending;

  const completedLines = updatedPatternLines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null);

  const updatedPlayer = {
    ...currentPlayer,
    patternLines: updatedPatternLines,
    health: nextHealth,
    armor: nextArmor,
  };

  const defeatedByOverload = nextHealth === 0;
  if (defeatedByOverload) {
    const defeatedState = handlePlayerDefeat(
      state,
      updatedPlayer,
      overloadDamage,
      channelTriggered
    );
    return { ...state, ...defeatedState, selectionTimestamp: null };
  }

  const nextRunePowerTotal = state.runePowerTotal + scoreBonus;
  if (nextRunePowerTotal >= state.targetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...state,
      player: updatedPlayer,
      selectedRunes: [],
      selectionTimestamp: null,
      draftSource: null,
      pendingPlacement: null,
      animatingRunes: [],
      shouldTriggerEndRound: false,
      overloadSoundPending: overloadDamage > 0,
      runePowerTotal: nextRunePowerTotal,
    });

    return {
      ...state,
      ...deckDraftReadyState,
      selectionTimestamp: null,
      channelSoundPending: nextChannelSoundPending,
    };
  }

  const shouldEndRound = isRoundExhausted(state.runeforges);

  const nextTurnPhase =
    completedLines.length > 0
      ? ('cast' as const)
      : shouldEndRound
        ? ('end-of-round' as const)
        : ('select' as const);

  return {
    ...state,
    player: updatedPlayer,
    selectedRunes: [],
    overloadRunes: overflowRunes.length > 0 ? [...state.overloadRunes, ...overflowRunes] : state.overloadRunes,
    selectionTimestamp: null,
    draftSource: null,
    turnPhase: nextTurnPhase,
    shouldTriggerEndRound: completedLines.length > 0 ? false : shouldEndRound,
    overloadSoundPending: overloadDamage > 0,
    runePowerTotal: state.runePowerTotal + scoreBonus,
    channelSoundPending: nextChannelSoundPending,
  };
}

function placeSelectionInFloor(state: GameplayStore): GameplayStore {
  if (state.turnPhase !== 'place') {
    return state;
  }

  const { selectedRunes } = state;
  if (selectedRunes.length === 0) return state;

  const currentPlayer = state.player;

  const { overloadDamage, nextHealth, nextArmor, scoreBonus, channelTriggered } = getOverloadResult(
    currentPlayer.health,
    currentPlayer.armor,
    selectedRunes,
    state
  );
  const nextChannelSoundPending = channelTriggered || state.channelSoundPending;

  const updatedPlayer = {
    ...currentPlayer,
    health: nextHealth,
    armor: nextArmor,
  };

  const defeatedByOverload = nextHealth === 0;
  if (defeatedByOverload) {
    const defeatedState = handlePlayerDefeat(
      state,
      updatedPlayer,
      overloadDamage,
      channelTriggered
    );
    return { ...state, ...defeatedState, selectionTimestamp: null };
  }

  const nextRunePowerTotal = state.runePowerTotal + scoreBonus;
  if (nextRunePowerTotal >= state.targetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...state,
      player: updatedPlayer,
      selectedRunes: [],
      selectionTimestamp: null,
      draftSource: null,
      pendingPlacement: null,
      animatingRunes: [],
      shouldTriggerEndRound: false,
      overloadSoundPending: overloadDamage > 0,
      runePowerTotal: nextRunePowerTotal,
    });

    return {
      ...state,
      ...deckDraftReadyState,
      selectionTimestamp: null,
      channelSoundPending: nextChannelSoundPending,
    };
  }

  const shouldEndRound = isRoundExhausted(state.runeforges);

  return {
    ...state,
    player: updatedPlayer,
    selectedRunes: [],
    overloadRunes: [...state.overloadRunes, ...selectedRunes],
    selectionTimestamp: null,
    draftSource: null,
    turnPhase: shouldEndRound ? ('end-of-round' as const) : ('select' as const),
    shouldTriggerEndRound: shouldEndRound,
    overloadSoundPending: overloadDamage > 0,
    runePowerTotal: state.runePowerTotal + scoreBonus,
    channelSoundPending: nextChannelSoundPending,
  };
}

function canPlaceSelectionOnAnyLine(state: GameplayStore): boolean {
  if (state.turnPhase !== 'place' || state.selectedRunes.length === 0) {
    return false;
  }

  const currentPlayer = state.player;
  const runeType = state.selectedRunes[0].runeType;
  const lockedLinesForPlayer = state.lockedPatternLines;

  return currentPlayer.patternLines.some((line, index) => {
    if (lockedLinesForPlayer.includes(index)) {
      return false;
    }
    if (line.runeType !== null && line.runeType !== runeType) {
      return false;
    }
    if (line.count >= line.tier) {
      return false;
    }

    const wallSize = currentPlayer.wall.length;
    const col = getWallColumnForRune(index, runeType, wallSize);
    if (currentPlayer.wall[index][col].runeType !== null) {
      return false;
    }

    return true;
  });
}

function attemptAutoPlacement(state: GameplayStore): GameplayStore {
  if (state.turnPhase !== 'place' || state.selectedRunes.length === 0) {
    return state;
  }

  const now = Date.now();
  const timeSinceSelection = state.selectionTimestamp ? now - state.selectionTimestamp : Infinity;
  const isWithinDoubleClickWindow = timeSinceSelection <= 250;

  if (!isWithinDoubleClickWindow) {
    return cancelSelectionState(state);
  }

  const currentPlayer = state.player;
  const lockedLineIndexes = state.lockedPatternLines;

  const bestLineIndex = findBestPatternLineForAutoPlacement(
    state.selectedRunes,
    currentPlayer.patternLines,
    currentPlayer.wall,
    lockedLineIndexes
  );

  if (bestLineIndex !== null) {
    return placeSelectionOnPatternLine(state, bestLineIndex);
  }

  const canPlaceAnywhere = canPlaceSelectionOnAnyLine(state);
  if (!canPlaceAnywhere) {
    return placeSelectionInFloor(state);
  }

  return cancelSelectionState(state);
}

function attachSoloPersistence(store: StoreApi<GameplayStore>): () => void {
  return store.subscribe((state) => {
    if (!state.gameStarted) {
      return;
    }

    // If the player has been defeated, clear any saved solo run from localStorage
    if (state.outcome === 'defeat') {
      clearSoloState();
      return;
    }

    saveSoloState(state);
  });
}

export const gameplayStoreConfig = (set: StoreApi<GameplayStore>['setState']): GameplayStore => ({
  // Initial state
  ...nextGame(),



  setTooltipCards: (cards, overrideSelection = false) => {
    set((state) => ({
      ...state,
      tooltipCards: cards,
      tooltipOverrideActive: overrideSelection,
    }));
  },

  resetTooltipCards: () => {
    set((state) => ({
      ...state,
      tooltipCards: createDefaultTooltipCards(),
      tooltipOverrideActive: false,
    }));
  },

  // Actions
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId?: string) => {
    set((state) => {
      if (state.turnPhase === 'place') {
        return attemptAutoPlacement(state);
      }
      if (state.turnPhase !== 'select') {
        return state;
      }
      const runeforges = state.runeforges;
      const runeforge = runeforges.find((f) => f.id === runeforgeId);
      if (!runeforge) return state;

      const selectionMode = state.runeforgeDraftStage ?? 'single';
      const wasDisabled = runeforge.disabled ?? false;

      if (selectionMode === 'single') {
        if (wasDisabled) {
          return state;
        }

        const selectedRunes = runeforge.runes.filter((r: Rune) => r.runeType === runeType);
        const remainingRunes = runeforge.runes.filter((r: Rune) => r.runeType !== runeType);
        if (selectedRunes.length === 0) return state;

        const orderedRunes = sortPrimaryRuneFirst(selectedRunes, primaryRuneId);
        const originalRunes = runeforge.runes;
        const disabledRuneforges = runeforges.filter((runeforge) => runeforge.disabled);
        const previousDisabledRuneforgeIds = disabledRuneforges.map((runeforge) => runeforge.id);

        const updatedRuneforges = runeforges.map((f) =>
          f.id === runeforgeId ? { ...f, runes: remainingRunes, disabled: true } : f
        );

        const shouldUnlockRuneforges = areAllRuneforgesDisabled(updatedRuneforges);
        const nextRuneforgeDraftStage = shouldUnlockRuneforges ? ('global' as const) : ('single' as const);
        const unlockedRuneforges = shouldUnlockRuneforges
          ? updatedRuneforges.map((f) => ({ ...f, disabled: false }))
          : updatedRuneforges;

        return {
          ...state,
          runeforges: unlockedRuneforges,
          runeforgeDraftStage: nextRuneforgeDraftStage,
          selectedRunes: [...state.selectedRunes, ...orderedRunes],
          selectionTimestamp: Date.now(),
          draftSource: {
            type: 'runeforge',
            runeforgeId,
            movedToCenter: [],
            originalRunes,
            affectedRuneforges: [{ runeforgeId, originalRunes }],
            previousDisabledRuneforgeIds,
            previousRuneforgeDraftStage: 'single',
            selectionMode: 'single',
          },
          turnPhase: 'place' as const,
        };
      }

      // Global selection mode: pick the rune type from every runeforge
      const affectedRuneforges: { runeforgeId: string; originalRunes: Rune[] }[] = [];
      const nextRuneforges = runeforges.map((forge) => {
        const matchingRunes = forge.runes.filter((rune) => rune.runeType === runeType);
        if (matchingRunes.length > 0) {
          affectedRuneforges.push({ runeforgeId: forge.id, originalRunes: forge.runes });
        }
        return {
          ...forge,
          runes: forge.runes.filter((rune) => rune.runeType !== runeType),
        };
      });

      const selectedFromAllRuneforges = runeforges.flatMap((forge) =>
        forge.runes.filter((rune) => rune.runeType === runeType)
      );

      if (selectedFromAllRuneforges.length === 0) {
        return state;
      }

      const orderedRunes = sortPrimaryRuneFirst(selectedFromAllRuneforges, primaryRuneId);
      const disabledRuneforges = runeforges.filter((runeforge) => runeforge.disabled);
      const previousDisabledRuneforgeIds = disabledRuneforges.map((runeforge) => runeforge.id);
      return {
        ...state,
        runeforges: nextRuneforges,
        runeforgeDraftStage: 'global',
        selectedRunes: [...state.selectedRunes, ...orderedRunes],
        selectionTimestamp: Date.now(),
        draftSource: {
          type: 'runeforge',
          runeforgeId,
          movedToCenter: [],
          originalRunes: runeforge.runes,
          affectedRuneforges,
          previousDisabledRuneforgeIds: previousDisabledRuneforgeIds,
          previousRuneforgeDraftStage: 'global',
          selectionMode: 'global',
        },
        turnPhase: 'place' as const,
      };
    });
  },

  moveRunesToWall: () => {
    let scoringSequenceForAnimation: ScoringSequenceState | null = null;
    let arcaneDustGain = 0;
    const baseArcaneDust = useArtefactStore.getState().arcaneDust;
    
    set((state) => {
      if (state.turnPhase !== 'cast') {
        return state;
      }
      const currentPlayer = state.player;

      const updatedPatternLines = [...currentPlayer.patternLines];
      const updatedWall = currentPlayer.wall.map((row) => [...row]);

      const completedLines = updatedPatternLines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.count === line.tier && line.runeType !== null);

      if (completedLines.length === 0) {
        const shouldEndRound = isRoundExhausted(state.runeforges);

        return {
          ...state,
          turnPhase: shouldEndRound ? ('end-of-round' as const) : ('select' as const),
          shouldTriggerEndRound: shouldEndRound,
        };
      }

      const scoringSteps: ScoringStep[] = [];
      const overloadRuneCounts = buildRuneTypeCountMap(state.overloadRunes);
      let scoringChannelTriggered = false;

      let lockedPatternLines = state.lockedPatternLines;
      completedLines.forEach(({ line, index }) => {
        const runeType = line.runeType as RuneType;
        const wallSize = updatedWall.length;
        const col = getWallColumnForRune(index, runeType, wallSize);
        const effects = line.firstRuneEffects ?? getRuneEffectsForType(runeType);

        updatedWall[index][col] = { runeType, effects: copyRuneEffects(effects) };
        updatedPatternLines[index] = {
          tier: line.tier,
          runeType: null,
          count: 0,
          firstRuneId: null,
          firstRuneEffects: null,
        };

        const resolvedSegment = resolveSegment(updatedWall, index, col, overloadRuneCounts);
        if (resolvedSegment.channelSynergyTriggered) {
          scoringChannelTriggered = true;
        }
        const damageMultiplier = applyOutgoingDamageModifiers(1, resolvedSegment.segmentSize, state);
        const healingMultiplier = applyOutgoingHealingModifiers(1, resolvedSegment.segmentSize, state);
        const segmentDelay = getRuneResolutionDelayMs(resolvedSegment.segmentSize);

        const armorMultiplier = getArmorGainMultiplier(resolvedSegment.segmentSize, state);
        const segmentSteps = resolvedSegment.resolutionSteps.map((step) => ({
          row: step.cell.row,
          col: step.cell.col,
          runeType: step.cell.runeType ?? runeType,
          damageDelta: step.damageDelta * damageMultiplier,
          healingDelta: step.healingDelta * healingMultiplier,
          arcaneDustDelta: step.arcaneDustDelta,
          armorDelta: step.armorDelta * armorMultiplier,
          delayMs: segmentDelay,
        }));

        scoringSteps.push(...segmentSteps);

        if (!lockedPatternLines.includes(index)) {
          lockedPatternLines = [...lockedPatternLines, index];
        }
      });

      const shouldEndRound = isRoundExhausted(state.runeforges);
      const sequenceId = Date.now();
      const baseHealth = currentPlayer.health;
      const baseArmor = currentPlayer.armor;
      const baseRunePowerTotal = state.runePowerTotal;
      const scoringDeltas = accumulateScoringDeltas(scoringSteps);
      arcaneDustGain = scoringDeltas.arcaneDust;
      const maxHealth = currentPlayer.maxHealth;
      const targetHealth = Math.min(maxHealth, baseHealth + scoringDeltas.healing);
      const targetArmor = Math.max(0, baseArmor + scoringDeltas.armor);
      const targetRunePowerTotal = baseRunePowerTotal + scoringDeltas.damage;
      const targetArcaneDust = baseArcaneDust + scoringDeltas.arcaneDust;
      const scoringSequence = scoringSteps.length > 0
        ? ({
          steps: scoringSteps,
          activeIndex: -1,
          sequenceId,
          startHealth: baseHealth,
          startArmor: baseArmor,
          startRunePowerTotal: baseRunePowerTotal,
          startArcaneDust: baseArcaneDust,
          maxHealth,
          displayHealth: baseHealth,
          displayArmor: baseArmor,
          displayRunePowerTotal: baseRunePowerTotal,
          displayArcaneDust: baseArcaneDust,
          targetHealth,
          targetArmor,
          targetRunePowerTotal,
          targetArcaneDust,
        } satisfies ScoringSequenceState)
        : null;

      scoringSequenceForAnimation = scoringSequence;

      const nextChannelSoundPending = scoringChannelTriggered || state.channelSoundPending;
      const baseNextState = {
        ...state,
        player: {
          ...currentPlayer,
          patternLines: updatedPatternLines,
          wall: updatedWall,
          health: targetHealth,
          armor: targetArmor,
        },
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('select' as const),
        shouldTriggerEndRound: shouldEndRound, //TODO why would both be needed?
        scoringSequence,
        lockedPatternLines: lockedPatternLines,
        outcome: state.outcome,
        channelSoundPending: nextChannelSoundPending,
        runePowerTotal: targetRunePowerTotal,
      };

      if (targetRunePowerTotal >= state.targetScore) {
        const deckDraftState = enterDeckDraftMode({
          ...baseNextState,
          outcome: 'victory',
          selectedRunes: [],
          draftSource: null,
          pendingPlacement: null,
          animatingRunes: [],
          shouldTriggerEndRound: false,
          scoringSequence: null,
        });
        scoringSequenceForAnimation = null;
        return deckDraftState;
      }

      return {
        ...baseNextState,
      };
    });

    if (arcaneDustGain > 0) {
      const newDustTotal = addArcaneDust(arcaneDustGain);
      useArtefactStore.getState().updateArcaneDust(newDustTotal);
    }

    if (scoringSequenceForAnimation) {
      runScoringSequence(scoringSequenceForAnimation, set);
    }
  },

  placeRunes: (patternLineIndex: number) => {
    set((state) => placeSelectionOnPatternLine(state, patternLineIndex));
  },

  placeRunesInFloor: () => {
    set((state) => placeSelectionInFloor(state));
  },

  cancelSelection: () => {
    set((state) => cancelSelectionState(state));
  },


  /**
   * Try to automatically place the current rune selection on an appropriate pattern line.
   * This implements the "double-click to send runes" feature with a 1-second timeout.
   * 
   * Algorithm:
   * 1. Check if the selection was made within the last 1 second (for double-click behavior)
   * 2. If yes, try to find an unfinished pattern line or empty line with exact match
   * 3. If found, place runes there; otherwise cancel selection
   * 4. If more than 1 second has passed, just cancel the selection
   * 
   * Only works when in the 'place' phase with selected runes.
   */
  autoPlaceSelection: () => {
    set((state) => attemptAutoPlacement(state));
  },

  acknowledgeOverloadSound: () => {
    set({ overloadSoundPending: false });
  },

  acknowledgeChannelSound: () => {
    set({ channelSoundPending: false });
  },

  endRound: () => {
    console.log('gameplayStoreConfig: endRound triggered');
    set((state) => {
      if (!state.shouldTriggerEndRound && state.turnPhase !== 'end-of-round') {
        return state;
      }
      console.log('gameplayStoreConfig: prepareRoundReset');
      return prepareRoundReset(state);
    });
  },

  startSoloRun: () => {
    clearScoringTimeout();
    set(() => {
      const baseState = nextGame();
      const selectedArtefacts = useArtefactStore.getState().selectedArtefactIds;
      const nextState = {
        ...baseState,
        gameStarted: true,
        activeArtefacts: selectedArtefacts,
      };

      trackNewGameEvent({
        gameIndex: nextState.gameIndex,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        targetScore: nextState.targetScore,
        strain: nextState.strain,
        startingHealth: 452,
      });

      return nextState;
    });
  },

  prepareSoloMode: () => { //TODO: do we need multiple game setups functions?
    clearScoringTimeout();
    set(() => ({
      ...nextGame(),
      gameStarted: false,
    }));
  },

  forceSoloVictory: () => {
    clearScoringTimeout();
    set((state) => {
      if (state.turnPhase === 'deck-draft' || state.turnPhase === 'game-over') {
        return state;
      }
      const nextRunePowerTotal = Math.max(state.targetScore, state.runePowerTotal);
      return enterDeckDraftMode({
        ...state,
        runePowerTotal: nextRunePowerTotal,
        selectedRunes: [],
        draftSource: null,
        pendingPlacement: null,
        animatingRunes: [],
        shouldTriggerEndRound: false,
        scoringSequence: null,
      });
    });
  },

  hydrateGameState: (nextState: GameState) => {
    clearScoringTimeout();
    set((state) => {
      const soloBaseTargetScore =
        typeof nextState.baseTargetScore === 'number'
          ? nextState.baseTargetScore
          : nextState.targetScore;
      const nextGameIndex = state.gameIndex
      const nextRoundNumber = state.round;
      const calculatedStrain = getOverloadDamageForRound(nextGameIndex, nextRoundNumber);
      return {
        ...state,
        ...nextState,
        player: {
          ...state.player,
          ...nextState.player,
          armor: nextState.player.armor,
        },
        runeforges: nextState.runeforges ?? state.runeforges,
        deckDraftState: nextState.deckDraftState ?? null,
        deckDraftReadyForNextGame: nextState.deckDraftReadyForNextGame ?? false,
        tooltipCards: nextState.tooltipCards ?? state.tooltipCards ?? createDefaultTooltipCards(),
        tooltipOverrideActive:
          typeof nextState.tooltipOverrideActive === 'boolean'
            ? nextState.tooltipOverrideActive
            : state.tooltipOverrideActive ?? false,
        baseTargetScore: soloBaseTargetScore,
        strain: calculatedStrain,
        round: nextRoundNumber,
        selectionTimestamp: nextState.selectionTimestamp ?? null,
        overloadSoundPending: nextState.overloadSoundPending ?? false,
        runeforgeDraftStage: nextState.runeforgeDraftStage ?? 'single',
        scoringSequence: null,
        runeScoreTargetIncrement: 7789,
        victoryDraftPicks:
          typeof nextState.victoryDraftPicks === 'number'
            ? nextState.victoryDraftPicks
            : state.victoryDraftPicks,
      };
    });
  },

  returnToStartScreen: () => {
    clearScoringTimeout();
    set((state) => {
      // If the last run ended in defeat, ensure persisted state is cleared immediately
      if (state.outcome === 'defeat') {
        try {
          clearSoloState();
        } catch (error) {
          console.log(error)
        }
      }

      return {
        ...nextGame(),
        gameStarted: false,
      };
    });
    // Call navigation callback if registered (for router integration)
    if (navigationCallback) {
      navigationCallback();
    }
  },

  resetGame: () => {
    clearScoringTimeout();
    set(() => nextGame());
  },

  disenchantRuneFromDeck: (runeId: string) => {
    let dustAwarded = 0;

    set((state) => {
      if (state.turnPhase !== 'deck-draft') {
        return state;
      }

      const runeToRemove = state.player.deck.find((rune) => rune.id === runeId);

      if (!runeToRemove) {
        return state;
      }

      const rarity = getRuneRarity(runeToRemove.effects);
      const rarityDustMap: Record<NonNullable<typeof rarity>, number> = {
        common: 0,
        uncommon: 1,
        rare: 5,
        epic: 25,
      } as const;
      dustAwarded = rarity ? rarityDustMap[rarity] ?? 0 : 0;

      const updatedDeck = runeToRemove
        ? state.player.deck.filter((rune) => rune.id !== runeId)
        : state.player.deck;
      const updatedDeckTemplate = state.player.deck.filter((rune) => rune.id !== runeId);

      if (dustAwarded > 0) {
        const nextDustTotal = addArcaneDust(dustAwarded);
        useArtefactStore.getState().updateArcaneDust(nextDustTotal);
      }

      return {
        ...state,
        player: {
          ...state.player,
          deck: updatedDeck,
        },
        soloDeckTemplate: updatedDeckTemplate,
        totalRunesPerPlayer: updatedDeckTemplate.length,
      };
    });

    return dustAwarded;
  },

  selectDeckDraftRuneforge: (runeforgeId: string) => {
    set((state) => {
      if (state.turnPhase !== 'deck-draft' || !state.deckDraftState) {
        return state;
      }
      const selectedRuneforge = state.deckDraftState.runeforges.find((runeforge) => runeforge.id === runeforgeId);
      if (!selectedRuneforge) {
        return state;
      }

      const playerAfterEffect = applyDeckDraftEffectToPlayer(
        state.player,
        selectedRuneforge.deckDraftEffect,
        state.player.maxHealth
      );
      const updatedDeckTemplate = mergeDeckWithRuneforge(state.player.deck, selectedRuneforge);
      const updatedPlayer: Player = {
        ...playerAfterEffect,
        deck: mergeDeckWithRuneforge(playerAfterEffect.deck, selectedRuneforge),
      };

      const selectionLimit = state.deckDraftState.selectionLimit ?? 1;
      const selectionsThisOffer = state.deckDraftState.selectionsThisOffer ?? 0;
      const nextSelectionsThisOffer = selectionsThisOffer + 1;
      const remainingRuneforges = state.deckDraftState.runeforges.filter((runeforge) => runeforge.id !== runeforgeId);
      const shouldAdvanceOffer =
        nextSelectionsThisOffer >= selectionLimit || remainingRuneforges.length === 0;

      if (shouldAdvanceOffer) {
        const draftStateAfterSelection = {
          ...state.deckDraftState,
          runeforges: remainingRuneforges,
          selectionsThisOffer: nextSelectionsThisOffer,
        };
        const nextDraftState = advanceDeckDraftState(
          draftStateAfterSelection,
          state.player.id,
          state.gameIndex,
          state.activeArtefacts
        );

        if (!nextDraftState) {
          return {
            ...state,
            player: updatedPlayer,
            soloDeckTemplate: updatedDeckTemplate,
            totalRunesPerPlayer: updatedDeckTemplate.length,
            deckDraftState: {
              runeforges: [],
              picksRemaining: 0,
              totalPicks: state.deckDraftState.totalPicks,
              selectionLimit,
              selectionsThisOffer: 0,
            },
            baseTargetScore: state.baseTargetScore || state.targetScore,
            deckDraftReadyForNextGame: true,
          };
        }

        return {
          ...state,
          player: updatedPlayer,
          deckDraftState: nextDraftState,
          soloDeckTemplate: updatedDeckTemplate,
          totalRunesPerPlayer: updatedDeckTemplate.length,
          deckDraftReadyForNextGame: false,
        };
      }

      const partialDraftState = {
        ...state.deckDraftState,
        runeforges: remainingRuneforges,
        selectionsThisOffer: nextSelectionsThisOffer,
      };

      return {
        ...state,
        player: updatedPlayer,
        deckDraftState: partialDraftState,
        soloDeckTemplate: updatedDeckTemplate,
        totalRunesPerPlayer: updatedDeckTemplate.length,
        deckDraftReadyForNextGame: false,
      };
    });
  },

  startNextSoloGame: () => {
    set((state) => {
      const nextGameIndex = state.gameIndex + 1;
      const nextGameState = nextGame(nextGameIndex, state.player);
      const nextState = {
        ...nextGameState,
        gameIndex: nextGameIndex,
        gameStarted: true,
        deckDraftState: null,
        deckDraftReadyForNextGame: false,
        activeArtefacts: state.activeArtefacts,
      };

      trackNewGameEvent({
        gameIndex: nextGameIndex,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        targetScore: nextState.targetScore,
        strain: nextState.strain,
        startingHealth: nextState.player.maxHealth,
      });

      return nextState;
    });
  },
});

export const useGameplayStore = create<GameplayStore>((set) => gameplayStoreConfig(set));
attachSoloPersistence(useGameplayStore);

export function createGameplayStoreInstance() {
  const store = create<GameplayStore>((set) => gameplayStoreConfig(set));
  attachSoloPersistence(store);
  return store;
}
