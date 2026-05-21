/**
 * Gameplay Store - compatibility action engine for split gameplay stores.
 * Read ownership now lives in runStore, boardStore, and resolutionStore.
 */

import { create, type StoreApi } from 'zustand';
import type {
  GameState,
  RuneType,
  Player,
  Rune,
  ScoringSequenceState,
  ScoringStep,
  SelectionState,
} from '../../types/game';
import { fillFactories, initializeSoloGame, createSoloFactories } from '../../utils/gameInitialization';
import { resolveSegment, getWallColumnForRune } from '../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType, getRuneRarity } from '../../utils/runeEffects';
import { createDeckDraftState, advanceDeckDraftState, mergeDeckWithRuneforge, applyDeckDraftEffectToPlayer } from '../../utils/deckDrafting';
import { getArcaneDustReward } from '../../utils/arcaneDust';
import {
  applyIncomingDamageModifiers,
  applyOutgoingDamageModifiers,
  applyOutgoingHealingModifiers,
  getArmorGainMultiplier,
  getDeckDraftSelectionLimit,
} from '../../utils/artefactEffects';
import { findBestPatternLineForAutoPlacement } from '../../utils/patternLineHelpers';
import { getOverloadDamageForGame, getOverloadDamageForRound } from '../../utils/overload';
import { runeTypeCounts } from '../../utils/runeCounting';
import { primaryRuneFirst } from '../../utils/runeHelpers';
import { trackGameplayDefeat, trackGameplayNewGame } from '../../systems/gameplayAnalytics';
import {
  addGameplayArcaneDust,
  clearGameplaySelection,
  clearPersistedSoloRun,
  getArcaneDustTotal,
  getGameplaySelection,
  getSelectedArtefactIds,
  navigateToSoloRun,
  setGameplaySelection,
} from '../../systems/gameplayOrchestrator';
import {
  accumulateScoringDeltas,
  clearScoringSequenceTimer,
  getRuneResolutionDelayMs,
  runScoringSequence,
} from '../../systems/scoringSequenceRunner';
import { attachGameplayPersistence } from './gameplayPersistence';
import { replaceGameplayState } from './gameplayState';

function enterDeckDraftMode(state: GameState): GameState {
  //TODO: These should not be handled as p0art of entering draft mode
  clearGameplaySelection();
  const arcaneDustReward = getArcaneDustReward(state.gameIndex);
  if (arcaneDustReward > 0) {
    addGameplayArcaneDust(arcaneDustReward);
  }

  const nextLongestRun = Math.max(state.longestRun, state.gameIndex);
  const selectionLimit = getDeckDraftSelectionLimit(state.activeArtefacts);
  const deckDraftState = createDeckDraftState(
    state.player.id,
    nextLongestRun,
    state.activeArtefacts,
    selectionLimit
  );

  const nextTargetScore = state.targetScore + 25;

  return {
    ...state,
    deckDraftState,
    deckDraftReadyForNextGame: false,
    turnPhase: 'deck-draft' as const,
    runeforges: [],
    runeforgeDraftStage: 'single' as const,
    overloadRunes: [],
    scoringSequence: null,
    shouldTriggerEndRound: false,
    overloadSoundPending: false,
    channelSoundPending: state.channelSoundPending,
    isDefeat: false,
    longestRun: nextLongestRun,
    targetScore: nextTargetScore,
    baseTargetScore: state.baseTargetScore || nextTargetScore,
  };
}

function isRoundExhausted(runeforges: GameState['runeforges']): boolean {
  const allRuneforgesEmpty = runeforges.every((runeforge) => runeforge.runes.length === 0);
  return allRuneforgesEmpty;
}

function getOverloadResult(
  currentHealth: number,
  currentArmor: number,
  newlyOverloadedRunes: Rune[],
  state: GameState
): { overloadDamage: number; nextHealth: number; nextArmor: number; scoreBonus: number; channelTriggered: boolean } {
  const baseDamage = newlyOverloadedRunes.length * state.overloadDamage;

  // Apply artefact modifiers to incoming damage (Potion triples, Rod converts to score)
  const { damage: modifiedDamage, scoreBonus: rodScoreBonus } = applyIncomingDamageModifiers(baseDamage, state);
  const armorAbsorbed = Math.min(currentArmor, modifiedDamage);
  const unabsorbedDamage = modifiedDamage - armorAbsorbed;
  const nextArmor = currentArmor - armorAbsorbed;
  const nextHealth = currentHealth - unabsorbedDamage;
  return {
    overloadDamage: unabsorbedDamage,
    nextHealth,
    nextArmor,
    scoreBonus: rodScoreBonus,
    channelTriggered: false,
  };
}

function handlePlayerDefeat(
  state: GameState,
  updatedPlayer: Player,
  overloadDamage: number,
  channelTriggered: boolean
): GameState {
  console.log('gameplayStore: handlePlayerDefeat');
  const nextLongestRun = Math.max(state.longestRun, state.gameIndex);

  trackGameplayDefeat({
    gameNumber: state.gameIndex,
    deck: updatedPlayer.deck,
    runePowerTotal: state.runePowerTotal,
    activeArtefacts: state.activeArtefacts,
    cause: 'overload',
    strain: state.overloadDamage,
    health: updatedPlayer.health,
    targetScore: state.targetScore,
  });

  return {
    ...state,
    player: updatedPlayer,
    overloadRunes: [],
    shouldTriggerEndRound: false,
    isDefeat: true,
    longestRun: nextLongestRun,
    overloadSoundPending: overloadDamage > 0,
    channelSoundPending: channelTriggered || state.channelSoundPending,
  };
}

function prepareRoundReset(state: GameState): GameState {
  console.log('gameplayStore: prepareRoundReset');
  clearGameplaySelection();
  const player = state.player;
  const currentStrain = state.overloadDamage;
  const nextRound = state.round + 1;
  const nextStrain = getOverloadDamageForRound(state.gameIndex, nextRound);
  const runesNeededForRound = 5 * state.runesPerRuneforge;
  const playerHasEnough = player.deck.length >= runesNeededForRound; //TODO: Find a better way to check this

  if (!playerHasEnough) {
    // Defeat
    trackGameplayDefeat({
      gameNumber: state.gameIndex,
      deck: player.deck,
      runePowerTotal: state.runePowerTotal,
      activeArtefacts: state.activeArtefacts,
      cause: 'deck-empty',
      strain: currentStrain,
      health: player.health,
      targetScore: state.targetScore,
    });

    return {...state, isDefeat: true,};
  }

  const emptyFactories = createSoloFactories(player);
  const { runeforges: filledRuneforges, deck } = fillFactories(
    emptyFactories,
    player.deck,
    state.runesPerRuneforge
  );

  const updatedPlayer: Player = {
    ...player,
    deck: deck,
  };

  return {
    ...state,
    player: updatedPlayer,
    runeforges: filledRuneforges.map((runeforge) => ({ ...runeforge, disabled: false })),
    turnPhase: 'select',
    gameIndex: state.gameIndex,
    round: nextRound,
    overloadDamage: nextStrain,
    startingStrain: nextStrain,
    isDefeat: false,
    lockedPatternLines: [],
    shouldTriggerEndRound: false,
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
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  startNextSoloGame: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId: string) => void;
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
}

function cancelSelectionState(state: GameplayStore, selectionState: SelectionState): GameplayStore {
  if (state.turnPhase === 'deck-draft' || selectionState.selectedRunes.length === 0 || !selectionState.draftSource) {
    return state;
  }

  clearGameplaySelection();
  return {
    ...state,
    turnPhase: 'select' as const,
  };
}

function applyRuneforgeDraftAfterPlacement(
  state: GameplayStore,
  selectionState: SelectionState
): { runeforges: GameState['runeforges']; runeforgeDraftStage: GameState['runeforgeDraftStage'] } {
  if (!selectionState.draftSource || selectionState.selectedRunes.length === 0) {
    return {
      runeforges: state.runeforges,
      runeforgeDraftStage: state.runeforgeDraftStage,
    };
  }

  const selectedRuneIds = new Set(selectionState.selectedRunes.map((rune) => rune.id));
  const selectionMode = selectionState.draftSource.selectionMode ?? state.runeforgeDraftStage ?? 'single';

  if (selectionMode === 'single') {
    const runeforgeId = selectionState.draftSource.runeforgeId;
    const updatedRuneforges = state.runeforges.map((forge) => {
      if (forge.id !== runeforgeId) {
        return forge;
      }
      return {
        ...forge,
        runes: forge.runes.filter((rune) => !selectedRuneIds.has(rune.id)),
        disabled: true,
      };
    });

    const shouldUnlockRuneforges = updatedRuneforges.length > 0 && updatedRuneforges.every((forge) => forge.disabled);
    const nextRuneforges = shouldUnlockRuneforges
      ? updatedRuneforges.map((forge) => ({ ...forge, disabled: false }))
      : updatedRuneforges;

    return {
      runeforges: nextRuneforges,
      runeforgeDraftStage: shouldUnlockRuneforges ? ('global' as const) : ('single' as const),
    };
  }

  const updatedRuneforges = state.runeforges.map((forge) => ({
    ...forge,
    runes: forge.runes.filter((rune) => !selectedRuneIds.has(rune.id)),
  }));

  return {
    runeforges: updatedRuneforges,
    runeforgeDraftStage: 'global' as const,
  };
}

function placeSelectionOnPatternLine(
  state: GameplayStore,
  selectionState: SelectionState,
  patternLineIndex: number
): GameplayStore {
  if (state.turnPhase !== 'select') {
    return state;
  }

  const { selectedRunes } = selectionState;
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

  const { runeforges: nextRuneforges, runeforgeDraftStage: nextRuneforgeDraftStage } =
    applyRuneforgeDraftAfterPlacement(state, selectionState);

  const defeatedByOverload = nextHealth === 0;
  if (defeatedByOverload) {
    const defeatedState = handlePlayerDefeat(
      { ...state, runeforges: nextRuneforges, runeforgeDraftStage: nextRuneforgeDraftStage },
      updatedPlayer,
      overloadDamage,
      channelTriggered
    );
    return { ...state, ...defeatedState };
  }

  const nextRunePowerTotal = state.runePowerTotal + scoreBonus;
  if (nextRunePowerTotal >= state.targetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...state,
      player: updatedPlayer,
      runeforges: nextRuneforges,
      runeforgeDraftStage: nextRuneforgeDraftStage,
      pendingPlacement: null,
      animatingRunes: [],
      shouldTriggerEndRound: false,
      overloadSoundPending: overloadDamage > 0,
      runePowerTotal: nextRunePowerTotal,
    });

    clearGameplaySelection();
    return {
      ...state,
      ...deckDraftReadyState,
      channelSoundPending: nextChannelSoundPending,
    };
  }

  const shouldEndRound = isRoundExhausted(nextRuneforges);

  const nextTurnPhase =
    shouldEndRound
      ? ('end-of-round' as const)
      : ('select' as const);

  clearGameplaySelection();
  return {
    ...state,
    player: updatedPlayer,
    runeforges: nextRuneforges,
    runeforgeDraftStage: nextRuneforgeDraftStage,
    overloadRunes: overflowRunes.length > 0 ? [...state.overloadRunes, ...overflowRunes] : state.overloadRunes,
    turnPhase: nextTurnPhase,
    shouldTriggerEndRound: completedLines.length > 0 ? false : shouldEndRound,
    overloadSoundPending: overloadDamage > 0,
    runePowerTotal: state.runePowerTotal + scoreBonus,
    channelSoundPending: nextChannelSoundPending,
  };
}

function placeSelectionInFloor(state: GameplayStore, selectionState: SelectionState): GameplayStore {
  if (state.turnPhase !== 'select') {
    return state;
  }

  const { selectedRunes } = selectionState;
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

  const { runeforges: nextRuneforges, runeforgeDraftStage: nextRuneforgeDraftStage } =
    applyRuneforgeDraftAfterPlacement(state, selectionState);

  const defeatedByOverload = nextHealth === 0;
  if (defeatedByOverload) {
    const defeatedState = handlePlayerDefeat(
      { ...state, runeforges: nextRuneforges, runeforgeDraftStage: nextRuneforgeDraftStage },
      updatedPlayer,
      overloadDamage,
      channelTriggered
    );
    return { ...state, ...defeatedState };
  }

  const nextRunePowerTotal = state.runePowerTotal + scoreBonus;
  if (nextRunePowerTotal >= state.targetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...state,
      player: updatedPlayer,
      runeforges: nextRuneforges,
      runeforgeDraftStage: nextRuneforgeDraftStage,
      pendingPlacement: null,
      animatingRunes: [],
      shouldTriggerEndRound: false,
      overloadSoundPending: overloadDamage > 0,
      runePowerTotal: nextRunePowerTotal,
    });

    clearGameplaySelection();
    return {
      ...state,
      ...deckDraftReadyState,
      channelSoundPending: nextChannelSoundPending,
    };
  }

  const shouldEndRound = isRoundExhausted(nextRuneforges);

  clearGameplaySelection();
  return {
    ...state,
    player: updatedPlayer,
    runeforges: nextRuneforges,
    runeforgeDraftStage: nextRuneforgeDraftStage,
    overloadRunes: [...state.overloadRunes, ...selectedRunes],
    turnPhase: shouldEndRound ? ('end-of-round' as const) : ('select' as const),
    shouldTriggerEndRound: shouldEndRound,
    overloadSoundPending: overloadDamage > 0,
    runePowerTotal: state.runePowerTotal + scoreBonus,
    channelSoundPending: nextChannelSoundPending,
  };
}

function canPlaceSelectionOnAnyLine(state: GameplayStore, selectionState: SelectionState): boolean {
  if (state.turnPhase !== 'select' || selectionState.selectedRunes.length === 0) {
    return false;
  }

  const currentPlayer = state.player;
  const runeType = selectionState.selectedRunes[0].runeType;
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

function attemptAutoPlacement(state: GameplayStore, selectionState: SelectionState): GameplayStore {
  if (state.turnPhase !== 'select' || selectionState.selectedRunes.length === 0) {
    return state;
  }

  const now = Date.now();
  const timeSinceSelection = selectionState.selectionTimestamp ? now - selectionState.selectionTimestamp : Infinity;
  const isWithinDoubleClickWindow = timeSinceSelection <= 250;

  if (!isWithinDoubleClickWindow) {
    return cancelSelectionState(state, selectionState);
  }

  const currentPlayer = state.player;
  const lockedLineIndexes = state.lockedPatternLines;

  const bestLineIndex = findBestPatternLineForAutoPlacement(
    selectionState.selectedRunes,
    currentPlayer.patternLines,
    currentPlayer.wall,
    lockedLineIndexes
  );

  if (bestLineIndex !== null) {
    return placeSelectionOnPatternLine(state, selectionState, bestLineIndex);
  }

  const canPlaceAnywhere = canPlaceSelectionOnAnyLine(state, selectionState);
  if (!canPlaceAnywhere) {
    return placeSelectionInFloor(state, selectionState);
  }

  return cancelSelectionState(state, selectionState);
}

export const gameplayStoreConfig = (set: StoreApi<GameplayStore>['setState']): GameplayStore => ({
  // Initial state
  ...initializeSoloGame(),

  // Actions
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId: string) => {
    set((state) => {
      const selectionState = getGameplaySelection();
      if (selectionState.selectedRunes.length > 0) {
        return attemptAutoPlacement(state, selectionState);
      }
      if (state.turnPhase !== 'select') {
        return state;
      }
      const normalizedRuneforges = state.runeforges;
      const runeforge = normalizedRuneforges.find((f) => f.id === runeforgeId);
      if (!runeforge) return state;

      const selectionMode = state.runeforgeDraftStage ?? 'single';
      const wasDisabled = runeforge.disabled ?? false;

      if (selectionMode === 'single') {
        if (wasDisabled) {
          return state;
        }

        const selectedRunes = runeforge.runes.filter((r: Rune) => r.runeType === runeType);
        if (selectedRunes.length === 0) return state;

        const orderedRunes = primaryRuneFirst(selectedRunes, primaryRuneId);
        const originalRunes = runeforge.runes;

        const selectionTimestamp = Date.now();
        setGameplaySelection({
          selectedRunes: [...selectionState.selectedRunes, ...orderedRunes],
          selectionTimestamp,
          draftSource: {
            runeforgeId,
            originalRunes,
            affectedRuneforges: [{ runeforgeId, originalRunes }],
            selectionMode: 'single',
          },
        });

        return {
          ...state,
        };
      }

      // Global selection mode: pick the rune type from every runeforge
      const affectedRuneforges: { runeforgeId: string; originalRunes: Rune[] }[] = [];
      normalizedRuneforges.forEach((forge) => {
        const matchingRunes = forge.runes.filter((rune) => rune.runeType === runeType);
        if (matchingRunes.length > 0) {
          affectedRuneforges.push({ runeforgeId: forge.id, originalRunes: forge.runes });
        }
      });

      const selectedFromAllRuneforges = normalizedRuneforges.flatMap((forge) =>
        forge.runes.filter((rune) => rune.runeType === runeType)
      );

      if (selectedFromAllRuneforges.length === 0) {
        return state;
      }

      const orderedRunes = primaryRuneFirst(selectedFromAllRuneforges, primaryRuneId);

      const selectionTimestamp = Date.now();
      setGameplaySelection({
        selectedRunes: [...selectionState.selectedRunes, ...orderedRunes],
        selectionTimestamp,
        draftSource: {
          runeforgeId,
          originalRunes: runeforge.runes,
          affectedRuneforges,
          selectionMode: 'global',
        },
      });

      return {
        ...state,
      };
    });
  },

  moveRunesToWall: () => {
    let scoringSequenceForAnimation: ScoringSequenceState | null = null;
    let arcaneDustGain = 0;
    const baseArcaneDust = getArcaneDustTotal();

    set((state) => {
      if (state.scoringSequence) {
        return state;
      }
      const currentPlayer = state.player;

      const updatedPatternLines = [...currentPlayer.patternLines];
      const updatedWall = currentPlayer.wall.map((row) => [...row]);
      let updatedLockedPatternLines = state.lockedPatternLines;

      const completedLines = updatedPatternLines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.count === line.tier && line.runeType !== null);

        //TODO: Unnecesary code duplication due to turn phases
      if (completedLines.length === 0) {
        const shouldEndRound = isRoundExhausted(state.runeforges);

        return {
          ...state,
          turnPhase: shouldEndRound ? ('end-of-round' as const) : ('select' as const),
          shouldTriggerEndRound: shouldEndRound,
        };
      }

      const scoringSteps: ScoringStep[] = [];
      const overloadRuneCounts = runeTypeCounts(state.overloadRunes);
      let scoringChannelTriggered = false;

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

        if (state.patternLineLock) {
          updatedLockedPatternLines = updatedLockedPatternLines.includes(index)
            ? updatedLockedPatternLines
            : [...updatedLockedPatternLines, index];
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
        shouldTriggerEndRound: shouldEndRound,
        scoringSequence,
        lockedPatternLines: updatedLockedPatternLines,
        isDefeat: state.isDefeat,
        channelSoundPending: nextChannelSoundPending,
        runePowerTotal: targetRunePowerTotal,
      };

      if (targetRunePowerTotal >= state.targetScore) {
        const deckDraftState = enterDeckDraftMode({
          ...baseNextState,
          isDefeat: false,
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
      addGameplayArcaneDust(arcaneDustGain);
    }

    if (scoringSequenceForAnimation) {
      runScoringSequence(scoringSequenceForAnimation, set);
    }
  },

  placeRunes: (patternLineIndex: number) => {
    set((state) => placeSelectionOnPatternLine(state, getGameplaySelection(), patternLineIndex));
  },

  placeRunesInFloor: () => {
    set((state) => placeSelectionInFloor(state, getGameplaySelection()));
  },

  cancelSelection: () => {
    set((state) => cancelSelectionState(state, getGameplaySelection()));
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
   * Only works when in the 'select' phase with selected runes.
   */
  autoPlaceSelection: () => {
    set((state) => attemptAutoPlacement(state, getGameplaySelection()));
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
    clearScoringSequenceTimer();
    clearGameplaySelection();
    set(() => {
      const baseState = initializeSoloGame();
      const selectedArtefacts = getSelectedArtefactIds();
      const nextState = {
        ...baseState,
        gameStarted: true,
        activeArtefacts: selectedArtefacts,
      };

      trackGameplayNewGame({
        gameNumber: nextState.gameIndex,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        targetScore: nextState.targetScore,
        strain: nextState.overloadDamage,
        startingHealth: nextState.startingHealth,
      });

      return nextState;
    });
  },

  prepareSoloMode: () => {
    clearScoringSequenceTimer();
    clearGameplaySelection();
    set(() => ({
      ...initializeSoloGame(),
      gameStarted: false,
    }));
  },

  hydrateGameState: (nextState: GameState) => {
    clearScoringSequenceTimer();
    clearGameplaySelection();
    set((state) => {
      // const shouldMerge = nextState.matchType === 'solo' || state.matchType === nextState.matchType;
      // if (!shouldMerge) {
      //   return state;
      // }
      //TODO WTF is happening?
      const nextFullDeck = nextState.fullDeck;
      const nextBaseTargetScore =
        typeof nextState.baseTargetScore === 'number'
          ? nextState.baseTargetScore
          : nextState.targetScore;
      const nextGameNumber =
        typeof nextState.gameIndex === 'number'
          ? nextState.gameIndex
          : typeof state.gameIndex === 'number'
            ? state.gameIndex
            : 1;
      const nextRoundNumber =
        typeof nextState.round === 'number'
          ? nextState.round
          : typeof state.round === 'number'
            ? state.round
            : 1;
      const soloStartingStrain = getOverloadDamageForGame(nextGameNumber);
      const calculatedStrain = getOverloadDamageForRound(nextGameNumber, nextRoundNumber);
      const storedStartingStrain =
        typeof nextState.startingStrain === 'number'
          ? nextState.startingStrain
          : soloStartingStrain;
      const longestRun =
        typeof nextState.longestRun === 'number'
          ? nextState.longestRun
          : 0;
      return {
        ...state,
        ...nextState,
        player: {
          ...state.player,
          ...nextState.player,
          armor: nextState.player?.armor ?? state.player.armor ?? 0,
        },
        runeforges: nextState.runeforges,
        deckDraftState: nextState.deckDraftState ?? null,
        deckDraftReadyForNextGame: nextState.deckDraftReadyForNextGame ?? false,
        fullDeck: nextFullDeck,
        baseTargetScore: nextBaseTargetScore,
        overloadDamage: calculatedStrain,
        startingStrain: storedStartingStrain,
        longestRun,
        round: nextRoundNumber,
        overloadSoundPending: nextState.overloadSoundPending ?? false,
        runeforgeDraftStage: nextState.runeforgeDraftStage ?? 'single',
        scoringSequence: null,
      };
    });
  },

  returnToStartScreen: () => {
    clearScoringSequenceTimer();
    clearGameplaySelection();
    set((state) => {
      // If the last run ended in defeat, ensure persisted state is cleared immediately
      if (state.isDefeat) {
        try {
          clearPersistedSoloRun();
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
    navigateToSoloRun();
  },

  resetGame: () => {
    clearScoringSequenceTimer();
    clearGameplaySelection();
    set(() => initializeSoloGame());
  },

  disenchantRuneFromDeck: (runeId: string) => {
    let dustAwarded = 0;

    set((state) => {
      if (state.turnPhase !== 'deck-draft') {
        return state;
      }

      const runeInDeck = state.player.deck.find((rune) => rune.id === runeId);
      const runeInTemplate = state.fullDeck.find((rune) => rune.id === runeId);
      const runeToRemove = runeInDeck ?? runeInTemplate;

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

      const updatedDeck = runeInDeck
        ? state.player.deck.filter((rune) => rune.id !== runeId)
        : state.player.deck;
      const updatedDeckTemplate = state.fullDeck.filter((rune) => rune.id !== runeId);

      if (dustAwarded > 0) {
        addGameplayArcaneDust(dustAwarded);
      }

      return {
        ...state,
        player: {
          ...state.player,
          deck: updatedDeck,
        },
        fullDeck: updatedDeckTemplate,
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
        state.startingHealth
      );
      const updatedDeckTemplate = mergeDeckWithRuneforge(state.fullDeck, selectedRuneforge);
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
          state.longestRun,
          state.activeArtefacts
        );

        if (!nextDraftState) {
          return {
            ...state,
            player: updatedPlayer,
            fullDeck: updatedDeckTemplate,
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
          fullDeck: updatedDeckTemplate,
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
        fullDeck: updatedDeckTemplate,
        deckDraftReadyForNextGame: false,
      };
    });
  },

  startNextSoloGame: () => {
    clearGameplaySelection();
    set((state) => {
      const nextTarget = state.targetScore;
      const nextGameIndex = state.gameIndex + 1;
      const nextOverloadDamage = getOverloadDamageForGame(nextGameIndex);
      const previousHealth = Math.max(0, state.player.health);
      const nextMaxHealth = state.player.maxHealth ?? state.startingHealth;
      const clampedHealth = Math.min(nextMaxHealth, previousHealth);
      const nextGameState = initializeSoloGame(nextTarget, state.fullDeck);
      const nextState = {
        ...nextGameState,
        player: {
          ...nextGameState.player,
          health: clampedHealth,
          maxHealth: nextMaxHealth,
        },
        gameIndex: nextGameIndex,
        gameStarted: true,
        overloadDamage: nextOverloadDamage,
        startingStrain: nextOverloadDamage,
        fullDeck: state.fullDeck,
        baseTargetScore: state.baseTargetScore || nextTarget,
        deckDraftState: null,
        deckDraftReadyForNextGame: false,
        activeArtefacts: state.activeArtefacts,
      };

      trackGameplayNewGame({
        gameNumber: nextState.gameIndex,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        targetScore: nextState.targetScore,
        strain: nextState.overloadDamage,
        startingHealth: nextState.startingHealth,
      });

      return nextState;
    });
  },
});

export const useGameplayStore = create<GameplayStore>((set) => gameplayStoreConfig(set));
replaceGameplayState(useGameplayStore.getState());
useGameplayStore.subscribe((state) => {
  replaceGameplayState(state);
});
attachGameplayPersistence();

export function createGameplayStoreInstance() {
  const store = create<GameplayStore>((set) => gameplayStoreConfig(set));
  replaceGameplayState(store.getState());
  store.subscribe((state) => {
    replaceGameplayState(state);
  });
  return store;
}
