/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, SoloOutcome, SoloRunConfig } from '../../types/game';
import { fillFactories, initializeSoloGame, createSoloFactories, DEFAULT_STARTING_STRAIN, DEFAULT_STRAIN_MULTIPLIER, DEFAULT_SOLO_CONFIG, RUNE_TYPES } from '../../utils/gameInitialization';
import { resolveSegment, getWallColumnForRune } from '../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType, getRuneRarity } from '../../utils/runeEffects';
import { createDeckDraftState, advanceDeckDraftState, mergeDeckWithRuneforge } from '../../utils/deckDrafting';
import { addArcaneDust, getArcaneDustReward } from '../../utils/arcaneDust';
import castSoundUrl from '../../assets/sounds/cast.mp3';
import { useUIStore } from './uiStore';
import { useArtefactStore } from './artefactStore';
import { applyIncomingDamageModifiers, applyOutgoingDamageModifiers, applyOutgoingHealingModifiers, modifyDraftPicksWithRobe, hasArtefact } from '../../utils/artefactEffects';
import { saveSoloState } from '../../utils/soloPersistence';
import { findBestPatternLineForAutoPlacement } from '../../utils/patternLineHelpers';

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
  const basePicks = 3; //TODO configure number
  const totalPicks = modifyDraftPicksWithRobe(basePicks, hasArtefact(state, 'robe'));
  const deckDraftState = createDeckDraftState(state.player.id, totalPicks, nextLongestRun, state.activeArtefacts);
  const arcaneDustReward = getArcaneDustReward(state.game);

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
    selectedRunes: [],
    selectionTimestamp: null,
    draftSource: null, 
    shouldTriggerEndRound: false,
    overloadSoundPending: false,
    soloOutcome: 'victory',
    longestRun: nextLongestRun
  };
}

// NOTE: overload multiplier is now stored in state.strain and adjusted at
// Game end. The old getOverloadMultiplier(round) helper is no longer used.

// Navigation callback registry for routing integration
let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null) {
  navigationCallback = callback;
}

const castAudioRef: { current: HTMLAudioElement | null } = { current: null };

function playCastSound(): void {
  if (typeof Audio === 'undefined') {
    return;
  }

  if (!castAudioRef.current) {
    castAudioRef.current = new Audio(castSoundUrl);
  }

  const audioElement = castAudioRef.current;
  if (!audioElement) {
    return;
  }

  audioElement.volume = useUIStore.getState().soundVolume;
  audioElement.currentTime = 0;
  const playPromise = audioElement.play();
  if (playPromise) {
    void playPromise.catch(() => {});
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
  const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
  return movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
}

function getOverloadResult(
  currentHealth: number,
  overloadRunesPlaced: number,
  strain: number,
  state: GameState
): { overloadDamage: number; nextHealth: number; scoreBonus: number } {
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
  return {
    ...state,
    player: updatedPlayer,
    selectedRunes: [],
    selectionTimestamp: null,
    draftSource: null,
    centerPool: nextCenterPool,
    turnPhase: 'game-over' as const,
    shouldTriggerEndRound: false,
    soloOutcome: 'defeat' as SoloOutcome,
    longestRun: nextLongestRun,
    overloadSoundPending: overloadDamage > 0,
  };
}

function prepareRoundReset(state: GameState): GameState {
  console.log('gameplayStore: prepareRoundReset');
  const clearedPlayer = clearFloorLines(state.player);
  const runesNeededForRound = state.factoriesPerPlayer * state.runesPerRuneforge;
  const playerHasEnough = clearedPlayer.deck.length >= runesNeededForRound;

  if (!playerHasEnough) {
    const achievedTarget = state.runePowerTotal >= state.soloTargetScore;
    if (achievedTarget) {
      return enterDeckDraftMode({
        ...state,
        player: clearedPlayer,
        runeforges: [],
        centerPool: [],
        game: state.game,
        shouldTriggerEndRound: false,
        lockedPatternLines: { [clearedPlayer.id]: [] },
        selectedRunes: [],
        selectionTimestamp: null,
        draftSource: null,
        pendingPlacement: null,
        animatingRunes: [],
        overloadSoundPending: false,
        turnPhase: 'deck-draft',
      });
    }

    const nextLongestRun = Math.max(state.longestRun, state.game);
    return {
      ...state,
      player: clearedPlayer,
      runeforges: [],
      centerPool: [],
      turnPhase: 'game-over',
      game: state.game,
      soloOutcome: 'defeat' as SoloOutcome,
      longestRun: nextLongestRun,
      shouldTriggerEndRound: false,
      lockedPatternLines: { [clearedPlayer.id]: [] },
      selectedRunes: [],
      selectionTimestamp: null,
      draftSource: null,
      pendingPlacement: null,
      animatingRunes: [],
      overloadSoundPending: false,
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
    runeforges: filledRuneforges,
    centerPool: [],
    turnPhase: 'draft',
    game: state.game,
    strain: state.strain * state.strainMultiplier,
    strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
    soloOutcome: null,
    lockedPatternLines: { [updatedPlayer.id]: [], },
    shouldTriggerEndRound: false,
    selectedRunes: [],
    selectionTimestamp: null,
    draftSource: null,
    pendingPlacement: null,
    animatingRunes: [],
    overloadSoundPending: false,
  };
}

export interface GameplayStore extends GameState {
  // Actions
  startSoloRun: (config?: Partial<SoloRunConfig>) => void;
  prepareSoloMode: (config?: Partial<SoloRunConfig>) => void;
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
      turnPhase: 'draft' as const,
    };
  }

  const runeforgeId = state.draftSource.runeforgeId;
  const originalRunes = state.draftSource.originalRunes;

  const updatedRuneforges = state.runeforges.map((f) =>
    f.id === runeforgeId
      ? { ...f, runes: originalRunes }
      : f
  );

  return {
    ...state,
    runeforges: updatedRuneforges,
    selectedRunes: [],
    selectionTimestamp: null,
    draftSource: null,
    turnPhase: 'draft' as const,
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
  const { overloadDamage, nextHealth, scoreBonus } = getOverloadResult(currentPlayer.health, overloadRunesPlaced, state.strain, state);

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
  if (nextRunePowerTotal >= state.soloTargetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...selectPersistableGameState(state),
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
        : ('draft' as const);

  return {
    ...state,
    player: updatedPlayer,
    selectedRunes: [],
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
  const { overloadDamage, nextHealth, scoreBonus } = getOverloadResult(currentPlayer.health, overloadRunesPlaced, state.strain, state);

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
  if (nextRunePowerTotal >= state.soloTargetScore) {
    const deckDraftReadyState = enterDeckDraftMode({
      ...selectPersistableGameState(state),
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
    selectionTimestamp: null,
    draftSource: null,
    centerPool: nextCenterPool,
    turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
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
  const isWithinDoubleClickWindow = timeSinceSelection <= 1000;

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

function selectPersistableGameState(state: GameplayStore): GameState {
  const {
    startSoloRun,
    prepareSoloMode,
    forceSoloVictory,
    hydrateGameState,
    returnToStartScreen,
    startNextSoloGame,
    draftRune,
    draftFromCenter,
    placeRunes,
    moveRunesToWall,
    placeRunesInFloor,
    cancelSelection,
    autoPlaceSelection,
    acknowledgeOverloadSound,
    endRound,
    resetGame,
    selectDeckDraftRuneforge,
    disenchantRuneFromDeck,
    ...persistableState
  } = state;

  return persistableState;
}

function attachSoloPersistence(store: StoreApi<GameplayStore>): () => void {
  console.log('attachSoloPersistence: subscribing to store changes');
  return store.subscribe((state) => {
    if (!state.gameStarted) {
      return;
    }

    const persistableState = selectPersistableGameState(state);
    saveSoloState(persistableState);
  });
}

export const gameplayStoreConfig = (set: StoreApi<GameplayStore>['setState']): GameplayStore => ({
  // Initial state
  ...initializeSoloGame(),
  // Strain configuration - starting value and multiplier factor (tune here)
  strain: DEFAULT_STARTING_STRAIN,
  strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,

  
  
  // Actions
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId?: string) => {
    set((state) => {
      if (state.turnPhase === 'place') {
        return attemptAutoPlacement(state);
      }
      if (state.turnPhase !== 'draft') {
        return state;
      }
      console.log('continue');
      // Find the runeforge
      const runeforge = state.runeforges.find((f) => f.id === runeforgeId);
      if (!runeforge) return state;
//       
      // Separate runes by selected type
      const selectedRunes = runeforge.runes.filter((r: Rune) => r.runeType === runeType);
      const remainingRunes = runeforge.runes.filter((r: Rune) => r.runeType !== runeType);
      
      // If no runes of this type, do nothing
      if (selectedRunes.length === 0) return state;
      const orderedRunes = prioritizeRuneById(selectedRunes, primaryRuneId);
      
      // Capture original order before clearing for display restoration
      const originalRunes = runeforge.runes;

      // Update runeforges (remove all runes from this runeforge)
      const updatedRuneforges = state.runeforges.map((f) =>
        f.id === runeforgeId ? { ...f, runes: [] } : f
      );
      
      return {
        ...state,
        runeforges: updatedRuneforges,
        selectedRunes: [...state.selectedRunes, ...orderedRunes],
        selectionTimestamp: Date.now(),
        draftSource: { type: 'runeforge', runeforgeId, movedToCenter: remainingRunes, originalRunes },
        turnPhase: 'place' as const,
      };
    });
  },

  moveRunesToWall: () => {
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
          turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
          shouldTriggerEndRound: shouldEndRound,
        };
      }

      playCastSound();

      let totalDamage = 0;
      let totalHealing = 0;

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
        
        // Apply artefact modifiers to damage and healing
        const modifiedDamage = applyOutgoingDamageModifiers(resolvedSegment.damage, resolvedSegment.segmentSize, state);
        const modifiedHealing = applyOutgoingHealingModifiers(resolvedSegment.healing, resolvedSegment.segmentSize, state);
        
        totalDamage += modifiedDamage;
        totalHealing += modifiedHealing;

        if (state.soloPatternLineLock) {
          const existingLocked = updatedLockedPatternLines[currentPlayer.id] ?? [];
          updatedLockedPatternLines[currentPlayer.id] = existingLocked.includes(index)
            ? existingLocked
            : [...existingLocked, index];
        }
      });

      let nextRunePowerTotal = state.runePowerTotal;
      let soloOutcome: SoloOutcome = state.soloOutcome;
      let nextHealth = currentPlayer.health;

      if (totalHealing > 0) {
        const maxHealth = currentPlayer.maxHealth ?? state.startingHealth;
        nextHealth = Math.min(maxHealth, nextHealth + totalHealing);
      }

      nextRunePowerTotal += totalDamage;
        if (nextRunePowerTotal >= state.soloTargetScore) {
          soloOutcome = 'victory';
        }

      const updatedPlayer = {
        ...currentPlayer,
        patternLines: updatedPatternLines,
        wall: updatedWall,
        health: nextHealth,
      };

      const soloVictoryAchieved = soloOutcome === 'victory';

      if (soloVictoryAchieved) {
        return enterDeckDraftMode({
          ...state,
          player: updatedPlayer,
          runePowerTotal: nextRunePowerTotal,
          lockedPatternLines: updatedLockedPatternLines,
          selectedRunes: [],
          draftSource: null,
          pendingPlacement: null,
          animatingRunes: [],
          shouldTriggerEndRound: false,
        });
      }

      const shouldEndRound = isRoundExhausted(state.runeforges, state.centerPool);

      return {
        ...state,
        player: updatedPlayer,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        shouldTriggerEndRound: shouldEndRound,
        runePowerTotal: nextRunePowerTotal,
        lockedPatternLines: updatedLockedPatternLines,
        soloOutcome,
      };
    });
  },
  
  draftFromCenter: (runeType: RuneType, primaryRuneId?: string) => {
    set((state) => {
      if (state.turnPhase === 'place') {
        return attemptAutoPlacement(state);
      }
      if (state.turnPhase !== 'draft') {
        return state;
      }
      const currentPlayer = state.player;
      const playerRuneforges = state.runeforges.filter((f) => f.ownerId === currentPlayer.id);
      const hasAccessibleRuneforges = playerRuneforges.some(
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

  startSoloRun: (config?: Partial<SoloRunConfig>) => {
    set(() => {
      const baseState = initializeSoloGame(config);
      const selectedArtefacts = useArtefactStore.getState().selectedArtefactIds;
      return {
        ...baseState,
        gameStarted: true,
        activeArtefacts: selectedArtefacts,
      };
    });
  },

  prepareSoloMode: (config?: Partial<SoloRunConfig>) => {
    set(() => ({
      ...initializeSoloGame(config),
      gameStarted: false,
    }));
  },

  forceSoloVictory: () => {
    set((state) => {
      if (state.turnPhase === 'deck-draft' || state.turnPhase === 'game-over') {
        return state;
      }
      const nextRunePowerTotal = Math.max(state.soloTargetScore, state.runePowerTotal);
      return enterDeckDraftMode({
        ...state,
        runePowerTotal: nextRunePowerTotal,
        selectedRunes: [],
        draftSource: null,
        pendingPlacement: null,
        animatingRunes: [],
        shouldTriggerEndRound: false,
      });
    });
  },

  hydrateGameState: (nextState: GameState) => {
    set((state) => {
      // const shouldMerge = nextState.matchType === 'solo' || state.matchType === nextState.matchType;
      // if (!shouldMerge) {
      //   return state;
      // }
      //TODO WTF is happening?
      const deckTemplate = nextState.soloDeckTemplate;
      const soloBaseTargetScore =
        typeof nextState.soloBaseTargetScore === 'number'
          ? nextState.soloBaseTargetScore
          : nextState.soloTargetScore ?? DEFAULT_SOLO_CONFIG.targetRuneScore;
      const soloStartingStrain =
        typeof nextState.soloStartingStrain === 'number'
          ? nextState.soloStartingStrain
          : nextState.strain;
      const longestRun =
        typeof nextState.longestRun === 'number'
          ? nextState.longestRun
          : 0;
      return {
        ...state,
        ...nextState,
        deckDraftState: nextState.deckDraftState ?? null,
        deckDraftReadyForNextGame: nextState.deckDraftReadyForNextGame ?? false,
        soloDeckTemplate: deckTemplate,
        soloBaseTargetScore,
        soloStartingStrain,
        longestRun,
        selectionTimestamp: nextState.selectionTimestamp ?? null,
        overloadSoundPending: nextState.overloadSoundPending ?? false,
      };
    });
  },

  returnToStartScreen: () => {
    set(() => ({
      ...initializeSoloGame(),
      gameStarted: false,
    }));
    // Call navigation callback if registered (for router integration)
    if (navigationCallback) {
      navigationCallback();
    }
  },
  
  resetGame: () => {
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
        const nextTarget = state.soloTargetScore + 50;
        return {
          ...state,
          player: updatedPlayer,
          soloDeckTemplate: updatedDeckTemplate,
          totalRunesPerPlayer: updatedDeckTemplate.length,
          soloTargetScore: nextTarget,
          soloBaseTargetScore: state.soloBaseTargetScore || nextTarget,
          deckDraftState: {
            runeforges: [],
            picksRemaining: 0,
            totalPicks: state.deckDraftState.totalPicks,
          },
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
      const nextTarget = state.soloTargetScore;
      const deckRunesPerType = Math.max(1, Math.round(deckTemplate.length / RUNE_TYPES.length));
      const nextGame = state.game + 1;
      const nextGameState = initializeSoloGame(
        {
          startingHealth: state.startingHealth,
          startingStrain: state.soloStartingStrain,
          strainMultiplier: state.strainMultiplier,
          factoriesPerPlayer: state.factoriesPerPlayer,
          deckRunesPerType,
          targetRuneScore: nextTarget,
          patternLinesLockOnComplete: state.soloPatternLineLock,
        },
        {
          startingDeck: deckTemplate,
          targetScore: nextTarget,
          longestRun: state.longestRun,
        }
      );
      console.log('gameplayStore: startNextSoloGame +1');
      return {
        ...nextGameState,
        game: nextGame,
        gameStarted: true,
        soloDeckTemplate: deckTemplate,
        soloBaseTargetScore: state.soloBaseTargetScore || nextTarget,
        deckDraftState: null,
        deckDraftReadyForNextGame: false,
        activeArtefacts: state.activeArtefacts,
      };
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
