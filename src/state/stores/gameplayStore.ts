/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, SoloOutcome, SoloRunConfig } from '../../types/game';
import { fillFactories, initializeSoloGame, createSoloFactories, DEFAULT_STARTING_STRAIN, DEFAULT_STRAIN_MULTIPLIER, DEFAULT_SOLO_CONFIG } from '../../utils/gameInitialization';
import { resolveSegment, getWallColumnForRune } from '../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType } from '../../utils/runeEffects';
import { createDeckDraftState, advanceDeckDraftState, mergeDeckWithRuneforge } from '../../utils/deckDrafting';
import castSoundUrl from '../../assets/sounds/cast.mp3';
import { useUIStore } from './uiStore';

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
  const deckTemplate = getSoloDeckTemplate(state);
  const nextWinStreak = state.soloWinStreak + 1;
  const deckDraftState = createDeckDraftState(state.runeTypeCount, state.player.id, 3, nextWinStreak); //TODO configure number

  return {
    ...state,
    deckDraftState,
    deckDraftReadyForNextGame: false,
    soloDeckTemplate: deckTemplate,
    turnPhase: 'deck-draft' as const,
    runeforges: [],
    centerPool: [],
    selectedRunes: [],
    draftSource: null,
    shouldTriggerEndRound: false,
    overloadSoundPending: false,
    soloOutcome: 'victory',
    soloWinStreak: nextWinStreak
  };
}

// NOTE: overload multiplier is now stored in state.strain and adjusted at
// round end. The old getOverloadMultiplier(round) helper is no longer used.

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

function prepareSoloRoundReset(state: GameState): GameState {
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
        round: state.round,
        shouldTriggerEndRound: false,
        roundDamage: 0,
        lockedPatternLines: { [clearedPlayer.id]: [] },
        selectedRunes: [],
        draftSource: null,
        pendingPlacement: null,
        animatingRunes: [],
        overloadSoundPending: false,
        turnPhase: 'deck-draft',
      });
    }

    return {
      ...state,
      player: clearedPlayer,
      runeforges: [],
      centerPool: [],
      turnPhase: 'game-over',
      round: state.round,
      soloOutcome: 'defeat' as SoloOutcome,
      soloWinStreak: 0,
      shouldTriggerEndRound: false,
      roundDamage: 0,
      lockedPatternLines: { [clearedPlayer.id]: [] },
      selectedRunes: [],
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
    round: state.round + 1,
    strain: state.strain * state.strainMultiplier,
    strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
    soloOutcome: null,
    roundDamage: 0,
    lockedPatternLines: { [updatedPlayer.id]: [], },
    shouldTriggerEndRound: false,
    selectedRunes: [],
    draftSource: null,
    pendingPlacement: null,
    animatingRunes: [],
    overloadSoundPending: false,
  };
}

export interface GameplayStore extends GameState {
  // Actions
  startSoloRun: (runeTypeCount: import('../../types/game').RuneTypeCount, config?: Partial<SoloRunConfig>) => void;
  prepareSoloMode: (runeTypeCount?: import('../../types/game').RuneTypeCount, config?: Partial<SoloRunConfig>) => void;
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
  acknowledgeOverloadSound: () => void;
  endRound: () => void;
  resetGame: () => void;
  triggerRoundEnd: () => void;
  selectDeckDraftRuneforge: (runeforgeId: string) => void;
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
      if (state.turnPhase !== 'draft') {
        return state;
      }
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
        const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
        const centerEmpty = state.centerPool.length === 0;
        const shouldEndRound = allRuneforgesEmpty && centerEmpty;

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
        totalDamage += resolvedSegment.damage;
        totalHealing += resolvedSegment.healing;

        if (state.soloPatternLineLock) {
          const existingLocked = updatedLockedPatternLines[currentPlayer.id] ?? [];
          updatedLockedPatternLines[currentPlayer.id] = existingLocked.includes(index)
            ? existingLocked
            : [...existingLocked, index];
        }
      });

      let nextRunePowerTotal = state.runePowerTotal;
      let updatedRoundDamage: number = state.roundDamage; //TODO: Round damage is deprecated
      let soloOutcome: SoloOutcome = state.soloOutcome;
      let nextHealth = currentPlayer.health;

      if (totalHealing > 0) {
        const maxHealth = currentPlayer.maxHealth ?? state.startingHealth;
        nextHealth = Math.min(maxHealth, nextHealth + totalHealing);
      }

      nextRunePowerTotal += totalDamage;
      updatedRoundDamage = updatedRoundDamage + totalDamage;
        if (nextRunePowerTotal >= state.soloTargetScore) {
          soloOutcome = 'victory';
        }

      let updatedPlayer = state.player;
      updatedPlayer = {
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
          roundDamage: updatedRoundDamage,
          lockedPatternLines: updatedLockedPatternLines,
          selectedRunes: [],
          draftSource: null,
          pendingPlacement: null,
          animatingRunes: [],
          shouldTriggerEndRound: false,
        });
      }

      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;

      return {
        ...state,
        player: updatedPlayer,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        shouldTriggerEndRound: shouldEndRound,
        runePowerTotal: nextRunePowerTotal,
        roundDamage: updatedRoundDamage,
        lockedPatternLines: updatedLockedPatternLines,
        soloOutcome,
      };
    });
  },
  
  draftFromCenter: (runeType: RuneType, primaryRuneId?: string) => {
    set((state) => {
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
        draftSource: { type: 'center', originalRunes: originalCenterRunes },
        turnPhase: 'place' as const,
      };
    });
  },
  
  placeRunes: (patternLineIndex: number) => {
    set((state) => {
      if (state.turnPhase !== 'place') {
        return state;
      }
      const { selectedRunes } = state;
      
      // No runes selected, do nothing
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
      
      // Validation: Pattern line must be empty or have same rune type
      if (patternLine.runeType !== null && patternLine.runeType !== runeType) {
        // Invalid placement - different rune type
        return state;
      }
      
      // Validation: Pattern line must not be full
      if (patternLine.count >= patternLine.tier) {
        // Invalid placement - line is full
        return state;
      }
      
      // Validation: Check if this rune type is already on the wall in this row
      const row = patternLineIndex;
      const wallSize = currentPlayer.wall.length;
      const col = getWallColumnForRune(row, runeType, wallSize);
      if (currentPlayer.wall[row][col].runeType !== null) {
        // Invalid placement - rune type already on wall in this row
        return state;
      }
      
      // Calculate how many runes fit in the pattern line
      const availableSpace = patternLine.tier - patternLine.count;
      const runesToPlace = Math.min(selectedRunes.length, availableSpace);
      const overflowRunes = selectedRunes.slice(runesToPlace);

      const primaryRune = selectedRunes[0];
      const nextFirstRuneId = patternLine.firstRuneId ?? primaryRune.id;
      const nextFirstRuneEffects = patternLine.firstRuneEffects ?? copyRuneEffects(primaryRune.effects);
      
      // Update pattern line
      const updatedPatternLines = [...currentPlayer.patternLines];
      updatedPatternLines[patternLineIndex] = {
        ...patternLine,
        runeType,
        count: patternLine.count + runesToPlace,
        firstRuneId: nextFirstRuneId,
        firstRuneEffects: nextFirstRuneEffects,
      };
      
      // Add overflow runes to floor line
      const updatedFloorLine = {
        ...currentPlayer.floorLine,
        runes: [...currentPlayer.floorLine.runes, ...overflowRunes],
      };

      const overloadRunesPlaced = overflowRunes.length;
      const overloadDamage = overloadRunesPlaced > 0
        ? overloadRunesPlaced * state.strain
        : 0;
      const nextHealth = overloadDamage > 0
        ? Math.max(0, currentPlayer.health - overloadDamage)
        : currentPlayer.health;

      const completedLines = updatedPatternLines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.count === line.tier && line.runeType !== null);

      // Update player
      let updatedPlayer = state.player;
      
      updatedPlayer = {
        ...currentPlayer,
        patternLines: updatedPatternLines,
        floorLine: updatedFloorLine,
        health: nextHealth,
      };
      
      const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
      const nextCenterPool = movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
      const defeatedByOverload = nextHealth === 0;
      if (defeatedByOverload) {
        return {
          ...state,
          player: updatedPlayer,
          selectedRunes: [],
          draftSource: null,
          centerPool: nextCenterPool,
          turnPhase: 'game-over' as const,
          shouldTriggerEndRound: false,
          soloOutcome: ('defeat' as SoloOutcome),
          soloWinStreak: 0,
          overloadSoundPending: overloadDamage > 0,
        };
      }
      
      // Check if round should end (all runeforges and center empty)
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;

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
        draftSource: null,
        centerPool: nextCenterPool,
        turnPhase: nextTurnPhase,
        shouldTriggerEndRound: completedLines.length > 0 ? false : shouldEndRound,
        overloadSoundPending: overloadDamage > 0,
      };
    });
  },
  
  placeRunesInFloor: () => {
    set((state) => {
      if (state.turnPhase !== 'place') {
        return state;
      }
      const { selectedRunes } = state;
      
      // No runes selected, do nothing
      if (selectedRunes.length === 0) return state;
      
      const currentPlayer = state.player;
      
      // Add all selected runes to floor line
      const updatedFloorLine = {
        ...currentPlayer.floorLine,
        runes: [...currentPlayer.floorLine.runes, ...selectedRunes],
      };

      const overloadRunesPlaced = selectedRunes.length;
      const overloadDamage = overloadRunesPlaced > 0
        ? overloadRunesPlaced * state.strain
        : 0;
      const nextHealth = overloadDamage > 0
        ? Math.max(0, currentPlayer.health - overloadDamage)
        : currentPlayer.health;
      
      // Update player
      let updatedPlayer = state.player;
      
      updatedPlayer = {
        ...currentPlayer,
        floorLine: updatedFloorLine,
        health: nextHealth,
      };
      
      const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
      const nextCenterPool = movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
      const defeatedByOverload = nextHealth === 0;
      if (defeatedByOverload) {
        return {
          ...state,
          player: updatedPlayer,
          selectedRunes: [],
          draftSource: null,
          centerPool: nextCenterPool,
          turnPhase: 'game-over' as const,
          shouldTriggerEndRound: false,
          soloOutcome: ('defeat' as SoloOutcome),
          soloWinStreak: 0,
          overloadSoundPending: overloadDamage > 0,
        };
      }
      
      // Check if round should end (all runeforges and center empty)
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      
      return {
        ...state,
        player: updatedPlayer,
        selectedRunes: [],
        draftSource: null,
        centerPool: nextCenterPool,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        shouldTriggerEndRound: shouldEndRound,
        overloadSoundPending: overloadDamage > 0,
      };
    });
  },
  
  cancelSelection: () => {
    set((state) => {
      if (state.turnPhase === 'deck-draft') {
        return state;
      }
      // Only allow cancellation if there are selected runes
      if (state.selectedRunes.length === 0 || !state.draftSource) return state;
      
      // Return selected runes to their original source
      if (state.draftSource.type === 'center') {
        return {
          ...state,
          centerPool: [...state.draftSource.originalRunes],
          selectedRunes: [],
          draftSource: null,
          turnPhase: 'draft' as const,
        };
      } else {
        // Return to runeforge (both selected runes and the ones moved to center)
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
          draftSource: null,
          turnPhase: 'draft' as const,
        };
      }
    });
  },
  
  acknowledgeOverloadSound: () => {
    set({ overloadSoundPending: false });
  },

  triggerRoundEnd: () => {
    set((state) => {
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      if (!allRuneforgesEmpty || !centerEmpty || state.selectedRunes.length > 0 || state.turnPhase === 'end-of-round') {
        return state;
      }

      return {
        ...state,
        turnPhase: 'end-of-round' as const,
        shouldTriggerEndRound: true,
      };
    });
  },
  
  endRound: () => {
    set((state) => {
      if (!state.shouldTriggerEndRound && state.turnPhase !== 'end-of-round') {
        return state;
      }
      return prepareSoloRoundReset(state);
    });
  },

  startSoloRun: (runeTypeCount: import('../../types/game').RuneTypeCount, config?: Partial<SoloRunConfig>) => {
    set(() => {
      const baseState = initializeSoloGame(runeTypeCount, config);
      return {
        ...baseState,
        gameStarted: true,
      };
    });
  },

  prepareSoloMode: (runeTypeCount?: import('../../types/game').RuneTypeCount, config?: Partial<SoloRunConfig>) => {
    set((state) => {
      const targetRuneTypeCount = runeTypeCount ?? state.runeTypeCount;
      return {
        ...initializeSoloGame(targetRuneTypeCount, config),
        gameStarted: false,
      };
    });
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
      const soloWinStreak =
        typeof nextState.soloWinStreak === 'number'
          ? nextState.soloWinStreak
          : 0;
      return {
        ...state,
        ...nextState,
        deckDraftState: nextState.deckDraftState ?? null,
        deckDraftReadyForNextGame: nextState.deckDraftReadyForNextGame ?? false,
        soloDeckTemplate: deckTemplate,
        soloBaseTargetScore,
        soloStartingStrain,
        soloWinStreak,
        overloadSoundPending: nextState.overloadSoundPending ?? false,
      };
    });
  },

  returnToStartScreen: () => {
    set((state) => ({
      ...initializeSoloGame(state.runeTypeCount),
      gameStarted: false,
    }));
    // Call navigation callback if registered (for router integration)
    if (navigationCallback) {
      navigationCallback();
    }
  },
  
  resetGame: () => {
    set((state) => initializeSoloGame(state.runeTypeCount));
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
        state.runeTypeCount,
        state.player.id,
        state.soloWinStreak
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
      const deckRunesPerType = Math.max(1, Math.round(deckTemplate.length / state.runeTypeCount));
      const nextGameState = initializeSoloGame(
        state.runeTypeCount,
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
          winStreak: state.soloWinStreak,
        }
      );
      nextGameState.round += 1;
      return {
        ...nextGameState,
        gameStarted: true,
        soloDeckTemplate: deckTemplate,
        soloBaseTargetScore: state.soloBaseTargetScore || nextTarget,
        deckDraftState: null,
        deckDraftReadyForNextGame: false,
      };
    });
  },
});

export const useGameplayStore = create<GameplayStore>((set) => gameplayStoreConfig(set));

export function createGameplayStoreInstance() {
  return create<GameplayStore>((set) => gameplayStoreConfig(set));
}
