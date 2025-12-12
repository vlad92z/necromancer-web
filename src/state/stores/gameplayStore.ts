/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, GameOutcome, RunConfig, Runeforge, ScoringSequenceState, ScoringStep } from '../../types/game';
import { fillFactories, initializeSoloGame, createSoloFactories, RUNE_TYPES, createDefaultTooltipCards } from '../../utils/gameInitialization';
import { resolveSegment, getWallColumnForRune } from '../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType, getRuneRarity } from '../../utils/runeEffects';
import { createDeckDraftState, advanceDeckDraftState, mergeDeckWithRuneforge } from '../../utils/deckDrafting';
import { addArcaneDust, getArcaneDustReward } from '../../utils/arcaneDust';
import { useArtefactStore } from './artefactStore';
import { applyIncomingDamageModifiers, applyOutgoingDamageModifiers, applyOutgoingHealingModifiers, modifyDraftPicksWithRobe, hasArtefact } from '../../utils/artefactEffects';
import { saveSoloState, clearSoloState } from '../../utils/soloPersistence';
import { findBestPatternLineForAutoPlacement } from '../../utils/patternLineHelpers';
import { trackDefeatEvent, trackNewGameEvent } from '../../utils/mixpanel';
import { getOverloadDamageForGame } from '../../utils/overload';



function withRuneforgeDefaults(runeforge: Runeforge): Runeforge {
  return {
    ...runeforge,
    disabled: Boolean(runeforge.disabled),
  };
}

function withRuneforgeListDefaults(runeforges: Runeforge[]): Runeforge[] {
  return runeforges.map(withRuneforgeDefaults);
}

function areRuneforgesDisabled(runeforges: Runeforge[]): boolean {
  return runeforges.every((runeforge) => (runeforge.disabled ?? false) || runeforge.runes.length === 0);
}

interface ScoringPlan {
  steps: ScoringStep[];
  sequenceId: number;
  shouldEndRound: boolean;
}

function prioritizeRuneById(runes: Rune[], primaryRuneId?: string | null): Rune[] {
  if (!primaryRuneId) {
    return runes;
  }
  const primaryRune = runes.find((rune) => rune.id === primaryRuneId);
  if (!primaryRune) {
    return runes;
  }
  return [primaryRune, ...runes.filter((rune) => rune.id !== primaryRuneId)];
}

function getSoloDeckTemplate(state: GameState): Rune[] {
  return state.soloDeckTemplate;
}

function enterDeckDraftMode(state: GameState): GameState {
  console.log('gameplayStore: enterDeckDraftMode');
  const deckTemplate = getSoloDeckTemplate(state);
  const nextLongestRun = Math.max(state.longestRun, state.game);
  const basePicks = state.victoryDraftPicks;
  const totalPicks = modifyDraftPicksWithRobe(basePicks, hasArtefact(state, 'robe'));
  const deckDraftState = createDeckDraftState(state.player.id, totalPicks, nextLongestRun, state.activeArtefacts);
  const arcaneDustReward = getArcaneDustReward(state.game);
  const nextTargetScore = state.targetScore + state.runeScoreTargetIncrement;

  if (arcaneDustReward > 0) {
    const newDustTotal = addArcaneDust(arcaneDustReward);
    useArtefactStore.getState().updateArcaneDust(newDustTotal);
  }

  return {
    ...state,
    deckDraftState,
    deckDraftReadyForNextGame: false,
    soloDeckTemplate: deckTemplate,
    turnPhase: 'deck-draft' as const,
    runeforges: [],
    centerPool: [],
    runeforgeDraftStage: 'single' as const,
    selectedRunes: [],
    overloadRunes: [],
    scoringSequence: null,
    selectionTimestamp: null,
    draftSource: null, 
    shouldTriggerEndRound: false,
    overloadSoundPending: false,
    outcome: 'victory',
    longestRun: nextLongestRun,
    targetScore: nextTargetScore,
    baseTargetScore: state.baseTargetScore || nextTargetScore,
  };
}

// NOTE: overload damage per rune is derived from the current game number
// via getOverloadDamageForGame.

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

function clearFloorLines(player: Player): Player {
  return {
    ...player,
    floorLine: {
      ...player.floorLine,
      runes: [],
    },
  };
}

function isRoundExhausted(runeforges: GameState['runeforges'], centerPool: GameState['centerPool']): boolean {
  const allRuneforgesEmpty = runeforges.every((runeforge) => runeforge.runes.length === 0);
  return allRuneforgesEmpty && centerPool.length === 0;
}

function getNextCenterPool(state: GameState): Rune[] {
  // Remaining runes now stay in their runeforge; center pool is unchanged here
  return state.centerPool;
}

function getOverloadResult(
  currentHealth: number,
  overloadRunesPlaced: number,
  state: GameState
): { overloadDamage: number; nextHealth: number; scoreBonus: number } {
  const strain = getOverloadDamageForGame(state.game);
  const baseDamage = overloadRunesPlaced > 0 ? overloadRunesPlaced * strain : 0;
  
  // Apply artefact modifiers to incoming damage (Potion triples, Rod converts to score)
  const { damage: modifiedDamage, scoreBonus } = applyIncomingDamageModifiers(baseDamage, state);
  
  const nextHealth = modifiedDamage > 0 ? Math.max(0, currentHealth - modifiedDamage) : currentHealth;
  return { overloadDamage: modifiedDamage, nextHealth, scoreBonus };
}

function handlePlayerDefeat(
  state: GameState,
  updatedPlayer: Player,
  nextCenterPool: Rune[],
  overloadDamage: number
): GameState {
  console.log('gameplayStore: handlePlayerDefeat');
  const nextLongestRun = Math.max(state.longestRun, state.game);

  trackDefeatEvent({
    gameNumber: state.game,
    deck: updatedPlayer.deck,
    runePowerTotal: state.runePowerTotal,
    activeArtefacts: state.activeArtefacts,
    cause: 'overload',
    strain: getOverloadDamageForGame(state.game),
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
    centerPool: nextCenterPool,
    turnPhase: 'game-over' as const,
    shouldTriggerEndRound: false,
    outcome: 'defeat' as GameOutcome,
    longestRun: nextLongestRun,
    overloadSoundPending: overloadDamage > 0,
  };
}

function finalizeScoringSequence(plan: ScoringPlan, set: StoreApi<GameplayStore>['setState']): void {
  clearScoringTimeout();
  set((state) => {
    if (!state.scoringSequence || state.scoringSequence.sequenceId !== plan.sequenceId) {
      return state;
    }

    const nextRunePowerTotal = state.runePowerTotal;
    let outcome: GameOutcome = state.outcome;

    if (nextRunePowerTotal >= state.targetScore) {
      const deckDraftState = enterDeckDraftMode({
        ...state,
        outcome: 'victory',
        runePowerTotal: nextRunePowerTotal,
        scoringSequence: null,
        selectedRunes: [],
        draftSource: null,
        pendingPlacement: null,
        animatingRunes: [],
        shouldTriggerEndRound: false,
      });
      return deckDraftState;
    }

    const nextTurnPhase = plan.shouldEndRound ? ('end-of-round' as const) : ('select' as const);

    return {
      ...state,
      outcome,
      turnPhase: nextTurnPhase,
      shouldTriggerEndRound: plan.shouldEndRound,
      scoringSequence: null,
    };
  });
}

function runScoringSequence(plan: ScoringPlan, set: StoreApi<GameplayStore>['setState']): void {
  clearScoringTimeout();

  if (plan.steps.length === 0) {
    finalizeScoringSequence(plan, set);
    return;
  }

  const executeStep = (index: number) => {
    const step = plan.steps[index];

    set((state) => {
      if (!state.scoringSequence || state.scoringSequence.sequenceId !== plan.sequenceId) {
        return state;
      }

      const maxHealth = state.player.maxHealth ?? state.startingHealth;
      const nextHealth = Math.min(maxHealth, state.player.health + step.healingDelta);
      const nextRunePowerTotal = state.runePowerTotal + step.damageDelta;
      const nextScoringSequence: ScoringSequenceState = {
        ...state.scoringSequence,
        activeIndex: index,
      };

      return {
        ...state,
        player: {
          ...state.player,
          health: nextHealth,
        },
        runePowerTotal: nextRunePowerTotal,
        scoringSequence: nextScoringSequence,
      };
    });

    if (step.arcaneDustDelta > 0) {
      const newDustTotal = addArcaneDust(step.arcaneDustDelta);
      useArtefactStore.getState().updateArcaneDust(newDustTotal);
    }

    const hasNextStep = index + 1 < plan.steps.length;
    const delay = step.delayMs;

    scoringTimeoutRef.current = setTimeout(() => {
      if (hasNextStep) {
        executeStep(index + 1);
      } else {
        finalizeScoringSequence(plan, set);
      }
    }, delay);
  };

  executeStep(0);
}

function prepareRoundReset(state: GameState): GameState {
  console.log('gameplayStore: prepareRoundReset');
  const nextStrain = getOverloadDamageForGame(state.game);
  const clearedPlayer = clearFloorLines(state.player);
  const runesNeededForRound = state.factoriesPerPlayer * state.runesPerRuneforge;
  const playerHasEnough = clearedPlayer.deck.length >= runesNeededForRound;

  if (!playerHasEnough) {
    const achievedTarget = state.runePowerTotal >= state.targetScore;
    if (achievedTarget) {
      return enterDeckDraftMode({
        ...state,
        player: clearedPlayer,
        strain: nextStrain,
        startingStrain: nextStrain,
        runeforges: [],
        centerPool: [],
        runeforgeDraftStage: 'single',
        game: state.game,
        shouldTriggerEndRound: false,
        lockedPatternLines: { [clearedPlayer.id]: [] },
        selectedRunes: [],
        selectionTimestamp: null,
        draftSource: null,
        scoringSequence: null,
        pendingPlacement: null,
        animatingRunes: [],
        overloadSoundPending: false,
        turnPhase: 'deck-draft',
      });
    }

    const nextLongestRun = Math.max(state.longestRun, state.game);

    trackDefeatEvent({
      gameNumber: state.game,
      deck: clearedPlayer.deck,
      runePowerTotal: state.runePowerTotal,
      activeArtefacts: state.activeArtefacts,
      cause: 'deck-empty',
      strain: nextStrain,
      health: clearedPlayer.health,
      targetScore: state.targetScore,
    });

    return {
      ...state,
      player: clearedPlayer,
      strain: nextStrain,
      startingStrain: nextStrain,
      runeforges: [],
      centerPool: [],
      turnPhase: 'game-over',
      game: state.game,
      outcome: 'defeat' as GameOutcome,
      longestRun: nextLongestRun,
      shouldTriggerEndRound: false,
      lockedPatternLines: { [clearedPlayer.id]: [] },
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

  const emptyFactories = createSoloFactories(clearedPlayer, state.factoriesPerPlayer);
  const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
    emptyFactories,
    { [clearedPlayer.id]: clearedPlayer.deck },
    state.runesPerRuneforge
  );

  const updatedPlayer: Player = {
    ...clearedPlayer,
    deck: decksByPlayer[clearedPlayer.id] ?? [],
  };

  return {
    ...state,
    player: updatedPlayer,
    runeforges: withRuneforgeListDefaults(filledRuneforges).map((runeforge) => ({ ...runeforge, disabled: false })),
    centerPool: [],
    turnPhase: 'select',
    game: state.game,
    strain: nextStrain,
    strainMultiplier: state.strainMultiplier,
    startingStrain: nextStrain,
    outcome: null,
    lockedPatternLines: { [updatedPlayer.id]: [], },
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
  startSoloRun: (config?: Partial<RunConfig>) => void;
  prepareSoloMode: (config?: Partial<RunConfig>) => void;
  forceSoloVictory: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  startNextSoloGame: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId?: string) => void;
  draftFromCenter: (runeType: RuneType, primaryRuneId?: string) => void;
  placeRunes: (patternLineIndex: number) => void;
  moveRunesToWall: () => void;
  placeRunesInFloor: () => void;
  cancelSelection: () => void;
  autoPlaceSelection: () => void;
  acknowledgeOverloadSound: () => void;
  endRound: () => void;
  resetGame: () => void;
  selectDeckDraftRuneforge: (runeforgeId: string) => void;
  disenchantRuneFromDeck: (runeId: string) => number;
  setTooltipCards: (cards: GameState['tooltipCards']) => void;
  resetTooltipCards: () => void;
}

function cancelSelectionState(state: GameplayStore): GameplayStore {
  if (state.turnPhase === 'deck-draft' || state.selectedRunes.length === 0 || !state.draftSource) {
    return state;
  }

  if (state.draftSource.type === 'center') {
    return {
      ...state,
      centerPool: [...state.draftSource.originalRunes],
      selectedRunes: [],
      selectionTimestamp: null,
      draftSource: null,
      turnPhase: 'select' as const,
    };
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

  const lockedLinesForPlayer = state.lockedPatternLines[currentPlayer.id] ?? [];
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

  const updatedFloorLine = {
    ...currentPlayer.floorLine,
    runes: [...currentPlayer.floorLine.runes, ...overflowRunes],
  };

  const overloadRunesPlaced = overflowRunes.length;
  const { overloadDamage, nextHealth, scoreBonus } = getOverloadResult(currentPlayer.health, overloadRunesPlaced, state);

  const completedLines = updatedPatternLines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null);

  const updatedPlayer = {
    ...currentPlayer,
    patternLines: updatedPatternLines,
    floorLine: updatedFloorLine,
    health: nextHealth,
  };

  const nextCenterPool = getNextCenterPool(state);
  const defeatedByOverload = nextHealth === 0;
  if (defeatedByOverload) {
    const defeatedState = handlePlayerDefeat(state, updatedPlayer, nextCenterPool, overloadDamage);
    return { ...state, ...defeatedState, selectionTimestamp: null };
  }

  const nextRunePowerTotal = state.runePowerTotal + scoreBonus;
  if (nextRunePowerTotal >= state.targetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...state,
      player: updatedPlayer,
      centerPool: nextCenterPool,
      selectedRunes: [],
      selectionTimestamp: null,
      draftSource: null,
      pendingPlacement: null,
      animatingRunes: [],
      shouldTriggerEndRound: false,
      overloadSoundPending: overloadDamage > 0,
      runePowerTotal: nextRunePowerTotal,
    });

    return { ...state, ...deckDraftReadyState, selectionTimestamp: null };
  }

  const shouldEndRound = isRoundExhausted(state.runeforges, state.centerPool);

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
    centerPool: nextCenterPool,
    turnPhase: nextTurnPhase,
    shouldTriggerEndRound: completedLines.length > 0 ? false : shouldEndRound,
    overloadSoundPending: overloadDamage > 0,
    runePowerTotal: state.runePowerTotal + scoreBonus,
  };
}

function placeSelectionInFloor(state: GameplayStore): GameplayStore {
  if (state.turnPhase !== 'place') {
    return state;
  }

  const { selectedRunes } = state;
  if (selectedRunes.length === 0) return state;

  const currentPlayer = state.player;

  const updatedFloorLine = {
    ...currentPlayer.floorLine,
    runes: [...currentPlayer.floorLine.runes, ...selectedRunes],
  };

  const overloadRunesPlaced = selectedRunes.length;
  const { overloadDamage, nextHealth, scoreBonus } = getOverloadResult(currentPlayer.health, overloadRunesPlaced, state);

  const updatedPlayer = {
    ...currentPlayer,
    floorLine: updatedFloorLine,
    health: nextHealth,
  };

  const nextCenterPool = getNextCenterPool(state);
  const defeatedByOverload = nextHealth === 0;
  if (defeatedByOverload) {
    const defeatedState = handlePlayerDefeat(state, updatedPlayer, nextCenterPool, overloadDamage);
    return { ...state, ...defeatedState, selectionTimestamp: null };
  }

  const nextRunePowerTotal = state.runePowerTotal + scoreBonus;
  if (nextRunePowerTotal >= state.targetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...state,
      player: updatedPlayer,
      centerPool: nextCenterPool,
      selectedRunes: [],
      selectionTimestamp: null,
      draftSource: null,
      pendingPlacement: null,
      animatingRunes: [],
      shouldTriggerEndRound: false,
      overloadSoundPending: overloadDamage > 0,
      runePowerTotal: nextRunePowerTotal,
    });

    return { ...state, ...deckDraftReadyState, selectionTimestamp: null };
  }

  const shouldEndRound = isRoundExhausted(state.runeforges, state.centerPool);

  return {
    ...state,
    player: updatedPlayer,
    selectedRunes: [],
    overloadRunes: [...state.overloadRunes, ...selectedRunes],
    selectionTimestamp: null,
    draftSource: null,
    centerPool: nextCenterPool,
    turnPhase: shouldEndRound ? ('end-of-round' as const) : ('select' as const),
    shouldTriggerEndRound: shouldEndRound,
    overloadSoundPending: overloadDamage > 0,
    runePowerTotal: state.runePowerTotal + scoreBonus,
  };
}

function canPlaceSelectionOnAnyLine(state: GameplayStore): boolean {
  if (state.turnPhase !== 'place' || state.selectedRunes.length === 0) {
    return false;
  }

  const currentPlayer = state.player;
  const runeType = state.selectedRunes[0].runeType;
  const lockedLinesForPlayer = state.lockedPatternLines[currentPlayer.id] ?? [];

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
  const lockedLineIndexes = state.lockedPatternLines[currentPlayer.id] ?? [];

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
  ...initializeSoloGame(),

  
  
  setTooltipCards: (cards) => {
    set((state) => ({
      ...state,
      tooltipCards: cards,
    }));
  },

  resetTooltipCards: () => {
    set((state) => ({
      ...state,
      tooltipCards: createDefaultTooltipCards(),
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
      const normalizedRuneforges = withRuneforgeListDefaults(state.runeforges);
      const runeforge = normalizedRuneforges.find((f) => f.id === runeforgeId);
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

        const orderedRunes = prioritizeRuneById(selectedRunes, primaryRuneId);
        const originalRunes = runeforge.runes;
        const previousDisabledRuneforgeIds = normalizedRuneforges.filter((f) => f.disabled).map((f) => f.id);

        const updatedRuneforges = normalizedRuneforges.map((f) =>
          f.id === runeforgeId ? { ...f, runes: remainingRunes, disabled: true } : f
        );

        const shouldUnlockRuneforges = areRuneforgesDisabled(updatedRuneforges);
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
      const nextRuneforges = normalizedRuneforges.map((forge) => {
        const matchingRunes = forge.runes.filter((rune) => rune.runeType === runeType);
        if (matchingRunes.length > 0) {
          affectedRuneforges.push({ runeforgeId: forge.id, originalRunes: forge.runes });
        }
        return {
          ...forge,
          runes: forge.runes.filter((rune) => rune.runeType !== runeType),
        };
      });

      const selectedFromAllRuneforges = normalizedRuneforges.flatMap((forge) =>
        forge.runes.filter((rune) => rune.runeType === runeType)
      );

      if (selectedFromAllRuneforges.length === 0) {
        return state;
      }

      const orderedRunes = prioritizeRuneById(selectedFromAllRuneforges, primaryRuneId);

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
          previousDisabledRuneforgeIds: normalizedRuneforges.filter((f) => f.disabled).map((f) => f.id),
          previousRuneforgeDraftStage: 'global',
          selectionMode: 'global',
        },
        turnPhase: 'place' as const,
      };
    });
  },

  moveRunesToWall: () => {
    let scoringPlan: ScoringPlan | null = null;

    set((state) => {
      if (state.turnPhase !== 'cast') {
        return state;
      }
      const currentPlayer = state.player;

      const updatedPatternLines = [...currentPlayer.patternLines];
      const updatedWall = currentPlayer.wall.map((row) => [...row]);
      const updatedLockedPatternLines: Record<Player['id'], number[]> = { ...state.lockedPatternLines };

      const completedLines = updatedPatternLines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.count === line.tier && line.runeType !== null);

      if (completedLines.length === 0) {
        const shouldEndRound = isRoundExhausted(state.runeforges, state.centerPool);

        return {
          ...state,
          turnPhase: shouldEndRound ? ('end-of-round' as const) : ('select' as const),
          shouldTriggerEndRound: shouldEndRound,
        };
      }

      const scoringSteps: ScoringStep[] = [];

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

        const resolvedSegment = resolveSegment(updatedWall, index, col);
        const damageMultiplier = applyOutgoingDamageModifiers(1, resolvedSegment.segmentSize, state);
        const healingMultiplier = applyOutgoingHealingModifiers(1, resolvedSegment.segmentSize, state);
        const segmentDelay = getRuneResolutionDelayMs(resolvedSegment.segmentSize);

        const segmentSteps = resolvedSegment.resolutionSteps.map((step) => ({
          row: step.cell.row,
          col: step.cell.col,
          runeType: step.cell.runeType ?? runeType,
          damageDelta: step.damageDelta * damageMultiplier,
          healingDelta: step.healingDelta * healingMultiplier,
          arcaneDustDelta: step.arcaneDustDelta,
          delayMs: segmentDelay,
        }));

        scoringSteps.push(...segmentSteps);

        if (state.patternLineLock) {
          const existingLocked = updatedLockedPatternLines[currentPlayer.id] ?? [];
          updatedLockedPatternLines[currentPlayer.id] = existingLocked.includes(index)
            ? existingLocked
            : [...existingLocked, index];
        }
      });

      const shouldEndRound = isRoundExhausted(state.runeforges, state.centerPool);
      const sequenceId = Date.now();
      const scoringSequence = scoringSteps.length > 0
        ? ({
            steps: scoringSteps,
            activeIndex: -1,
            sequenceId,
          } satisfies ScoringSequenceState)
        : null;

      scoringPlan = scoringSequence
        ? {
            steps: scoringSteps,
            sequenceId,
            shouldEndRound,
          }
        : null;

      return {
        ...state,
        player: {
          ...currentPlayer,
          patternLines: updatedPatternLines,
          wall: updatedWall,
        },
        turnPhase: scoringSequence ? ('scoring' as const) : shouldEndRound ? ('end-of-round' as const) : ('select' as const),
        shouldTriggerEndRound: scoringSequence ? false : shouldEndRound,
        scoringSequence,
        lockedPatternLines: updatedLockedPatternLines,
        outcome: state.outcome,
      };
    });

    if (scoringPlan) {
      runScoringSequence(scoringPlan, set);
    }
  },
  
  draftFromCenter: (runeType: RuneType, primaryRuneId?: string) => {
    set((state) => {
      if (state.turnPhase === 'place') {
        return attemptAutoPlacement(state);
      }
      if (state.turnPhase !== 'select') {
        return state;
      }
      const hasAccessibleRuneforges = state.runeforges.some(
        (f) => f.runes.length > 0
      );

      if (hasAccessibleRuneforges) {
        return state;
      }

      const originalCenterRunes = [...state.centerPool];
      // Get all runes of selected type from center
      const selectedRunes = state.centerPool.filter((r: Rune) => r.runeType === runeType);
      const remainingRunes = state.centerPool.filter((r: Rune) => r.runeType !== runeType);
      
      // If no runes of this type, do nothing
      if (selectedRunes.length === 0) return state;
      const orderedRunes = prioritizeRuneById(selectedRunes, primaryRuneId);
      
      return {
        ...state,
        centerPool: remainingRunes,
        selectedRunes: [...state.selectedRunes, ...orderedRunes],
        selectionTimestamp: Date.now(),
        draftSource: { type: 'center', originalRunes: originalCenterRunes },
        turnPhase: 'place' as const,
      };
    });
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

  startSoloRun: (config?: Partial<RunConfig>) => {
    clearScoringTimeout();
    set(() => {
      const baseState = initializeSoloGame(config);
      const selectedArtefacts = useArtefactStore.getState().selectedArtefactIds;
      const nextState = {
        ...baseState,
        gameStarted: true,
        activeArtefacts: selectedArtefacts,
      };

      trackNewGameEvent({
        gameNumber: nextState.game,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        targetScore: nextState.targetScore,
        strain: nextState.strain,
        startingHealth: nextState.startingHealth,
      });

      return nextState;
    });
  },

  prepareSoloMode: (config?: Partial<RunConfig>) => {
    clearScoringTimeout();
    set(() => ({
      ...initializeSoloGame(config),
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
      // const shouldMerge = nextState.matchType === 'solo' || state.matchType === nextState.matchType;
      // if (!shouldMerge) {
      //   return state;
      // }
      //TODO WTF is happening?
      const deckTemplate = nextState.soloDeckTemplate;
      const soloBaseTargetScore =
        typeof nextState.baseTargetScore === 'number'
          ? nextState.baseTargetScore
          : nextState.targetScore;
      const nextGameNumber =
        typeof nextState.game === 'number'
          ? nextState.game
          : typeof state.game === 'number'
            ? state.game
            : 1;
      const soloStartingStrain = getOverloadDamageForGame(nextGameNumber);
      const longestRun =
        typeof nextState.longestRun === 'number'
          ? nextState.longestRun
          : 0;
      return {
        ...state,
        ...nextState,
        runeforges: withRuneforgeListDefaults(nextState.runeforges ?? state.runeforges),
        deckDraftState: nextState.deckDraftState ?? null,
        deckDraftReadyForNextGame: nextState.deckDraftReadyForNextGame ?? false,
        tooltipCards: nextState.tooltipCards ?? state.tooltipCards ?? createDefaultTooltipCards(),
        soloDeckTemplate: deckTemplate,
        baseTargetScore: soloBaseTargetScore,
        strain: soloStartingStrain,
        startingStrain: soloStartingStrain,
        longestRun,
        selectionTimestamp: nextState.selectionTimestamp ?? null,
        overloadSoundPending: nextState.overloadSoundPending ?? false,
        runeforgeDraftStage: nextState.runeforgeDraftStage ?? 'single',
        scoringSequence: nextState.scoringSequence ?? null,
        runeScoreTargetIncrement:
          typeof nextState.runeScoreTargetIncrement === 'number'
            ? nextState.runeScoreTargetIncrement
            : state.runeScoreTargetIncrement,
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
        ...initializeSoloGame(),
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
    set(() => initializeSoloGame());
  },

  disenchantRuneFromDeck: (runeId: string) => {
    let dustAwarded = 0;

    set((state) => {
      if (state.turnPhase !== 'deck-draft') {
        return state;
      }

      const runeInDeck = state.player.deck.find((rune) => rune.id === runeId);
      const runeInTemplate = state.soloDeckTemplate.find((rune) => rune.id === runeId);
      const runeToRemove = runeInDeck ?? runeInTemplate;

      if (!runeToRemove) {
        return state;
      }

      const rarity = getRuneRarity(runeToRemove.effects);
      const rarityDustMap: Record<NonNullable<typeof rarity>, number> = {
        uncommon: 1,
        rare: 5,
        epic: 25,
      } as const;
      dustAwarded = rarity ? rarityDustMap[rarity] ?? 0 : 0;

      const updatedDeck = runeInDeck
        ? state.player.deck.filter((rune) => rune.id !== runeId)
        : state.player.deck;
      const updatedDeckTemplate = state.soloDeckTemplate.filter((rune) => rune.id !== runeId);

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

      const deckTemplate = getSoloDeckTemplate(state);
      const updatedDeckTemplate = mergeDeckWithRuneforge(deckTemplate, selectedRuneforge);
      const nextDraftState = advanceDeckDraftState(
        state.deckDraftState,
        state.player.id,
        state.longestRun,
        state.activeArtefacts
      );
      const updatedPlayer: Player = {
        ...state.player,
        deck: mergeDeckWithRuneforge(state.player.deck, selectedRuneforge),
      };

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
    });
  },

  startNextSoloGame: () => {
    set((state) => {
      const deckTemplate = getSoloDeckTemplate(state);
      const nextTarget = state.targetScore;
      const deckRunesPerType = Math.max(1, Math.round(deckTemplate.length / RUNE_TYPES.length));
      const nextGame = state.game + 1;
      const nextStrain = getOverloadDamageForGame(nextGame);
      const previousHealth = Math.max(0, state.player.health);
      const nextMaxHealth = state.player.maxHealth ?? state.startingHealth;
      const clampedHealth = Math.min(nextMaxHealth, previousHealth);
      const nextGameState = initializeSoloGame(
        {
          startingHealth: state.startingHealth,
          startingStrain: nextStrain,
          strainMultiplier: state.strainMultiplier,
          factoriesPerPlayer: state.factoriesPerPlayer,
          deckRunesPerType,
          targetRuneScore: nextTarget,
          patternLinesLockOnComplete: state.patternLineLock,
        },
        {
          startingDeck: deckTemplate,
          targetScore: nextTarget,
          longestRun: state.longestRun,
        }
      );
      const nextState = {
        ...nextGameState,
        player: {
          ...nextGameState.player,
          health: clampedHealth,
          maxHealth: nextMaxHealth,
        },
        game: nextGame,
        gameStarted: true,
        strain: nextStrain,
        startingStrain: nextStrain,
        soloDeckTemplate: deckTemplate,
        soloBaseTargetScore: state.baseTargetScore || nextTarget,
        deckDraftState: null,
        deckDraftReadyForNextGame: false,
        activeArtefacts: state.activeArtefacts,
      };

      trackNewGameEvent({
        gameNumber: nextState.game,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        targetScore: nextState.targetScore,
        strain: nextState.strain,
        startingHealth: nextState.startingHealth,
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
