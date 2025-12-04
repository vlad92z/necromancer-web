/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, VoidTarget, AIDifficulty, QuickPlayOpponent, PlayerControllers, MatchType, SoloOutcome, SoloRunConfig } from '../../types/game';
import { initializeGame, fillFactories, createEmptyFactories, initializeSoloGame, createSoloFactories, DEFAULT_STARTING_STRAIN, DEFAULT_STRAIN_MULTIPLIER, createStartingDeck, DEFAULT_SOLO_CONFIG } from '../../utils/gameInitialization';
import { resolveSegment, getWallColumnForRune } from '../../utils/scoring';
import { getAIDifficultyLabel } from '../../utils/aiDifficultyLabels';
import { copyRuneEffects, getRuneEffectsForType } from '../../utils/runeEffects';
import { createDeckDraftState, advanceDeckDraftState, mergeDeckWithRuneforge } from '../../utils/deckDrafting';

function calculateNextStrainMultiplier(
  _players: [Player, Player],
  baseMultiplier: number
): number {
  return baseMultiplier;
}

function getAIDisplayName(baseName: string, difficulty: AIDifficulty): string {
  return `${baseName} (${getAIDifficultyLabel(difficulty)})`;
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
  if (state.soloDeckTemplate && state.soloDeckTemplate.length > 0) {
    return state.soloDeckTemplate;
  }
  return createStartingDeck(state.players[0].id, state.runeTypeCount, state.totalRunesPerPlayer);
}

function enterDeckDraftMode(state: GameState): GameState {
  if (state.matchType !== 'solo') {
    return state;
  }
  const deckTemplate = getSoloDeckTemplate(state);
  const nextWinStreak = state.soloWinStreak + 1;
  const deckDraftState = createDeckDraftState(state.runeTypeCount, state.players[0].id, 3, nextWinStreak);

  return {
    ...state,
    deckDraftState,
    soloDeckTemplate: deckTemplate,
    turnPhase: 'deck-draft' as const,
    runeforges: [],
    centerPool: [],
    selectedRunes: [],
    draftSource: null,
    shouldTriggerEndRound: false,
    voidEffectPending: false,
    frostEffectPending: false,
    soloOutcome: 'victory',
    soloWinStreak: nextWinStreak,
    currentPlayerIndex: 0,
  };
}

// NOTE: overload multiplier is now stored in state.strain and adjusted at
// round end. The old getOverloadMultiplier(round) helper is no longer used.

// Navigation callback registry for routing integration
let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null) {
  navigationCallback = callback;
}

function clearFloorLines(players: [Player, Player]): [Player, Player] {
  return [
    {
      ...players[0],
      floorLine: {
        ...players[0].floorLine,
        runes: [],
      },
    },
    {
      ...players[1],
      floorLine: {
        ...players[1].floorLine,
        runes: [],
      },
    },
  ];
}

function prepareSoloRoundReset(state: GameState): GameState {
  const clearedPlayers = clearFloorLines(state.players);
  const runesNeededForRound = state.factoriesPerPlayer * state.runesPerRuneforge;
  const playerHasEnough = clearedPlayers[0].deck.length >= runesNeededForRound;

  if (!playerHasEnough) {
    const achievedTarget = state.runePowerTotal >= state.soloTargetScore;
    if (achievedTarget) {
      return enterDeckDraftMode({
        ...state,
        players: clearedPlayers,
        runeforges: [],
        centerPool: [],
        round: state.round,
        shouldTriggerEndRound: false,
        roundDamage: [0, 0],
        lockedPatternLines: {
          [clearedPlayers[0].id]: [],
          [clearedPlayers[1].id]: [],
        },
        selectedRunes: [],
        draftSource: null,
        pendingPlacement: null,
        animatingRunes: [],
        voidEffectPending: false,
        frostEffectPending: false,
        turnPhase: 'deck-draft',
      });
    }

    return {
      ...state,
      players: clearedPlayers,
      runeforges: [],
      centerPool: [],
      turnPhase: 'game-over',
      round: state.round,
      soloOutcome: 'defeat' as SoloOutcome,
      soloWinStreak: 0,
      shouldTriggerEndRound: false,
      roundDamage: [0, 0],
      lockedPatternLines: {
        [clearedPlayers[0].id]: [],
        [clearedPlayers[1].id]: [],
      },
      selectedRunes: [],
      draftSource: null,
      pendingPlacement: null,
      animatingRunes: [],
      voidEffectPending: false,
      frostEffectPending: false,
    };
  }

  const emptyFactories = createSoloFactories(clearedPlayers[0], state.factoriesPerPlayer);
  const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
    emptyFactories,
    { [clearedPlayers[0].id]: clearedPlayers[0].deck },
    state.runesPerRuneforge
  );

  const updatedPlayer: Player = {
    ...clearedPlayers[0],
    deck: decksByPlayer[clearedPlayers[0].id] ?? [],
  };

  const nextStrainMultiplier = calculateNextStrainMultiplier(
    [updatedPlayer, clearedPlayers[1]],
    DEFAULT_STRAIN_MULTIPLIER
  );

  return {
    ...state,
    players: [updatedPlayer, clearedPlayers[1]],
    runeforges: filledRuneforges,
    centerPool: [],
    turnPhase: 'draft',
    round: state.round + 1,
    strain: state.strain * state.strainMultiplier,
    strainMultiplier: nextStrainMultiplier,
    soloOutcome: null,
    roundDamage: [0, 0],
    lockedPatternLines: {
      [updatedPlayer.id]: [],
      [clearedPlayers[1].id]: [],
    },
    shouldTriggerEndRound: false,
    selectedRunes: [],
    draftSource: null,
    pendingPlacement: null,
    animatingRunes: [],
    voidEffectPending: false,
    frostEffectPending: false,
  };
}

function prepareVersusRoundReset(state: GameState): GameState {
  const clearedPlayers = clearFloorLines(state.players);
  const roundScore = {
    round: state.round,
    playerName: clearedPlayers[0].name,
    opponentName: clearedPlayers[1].name,
  };
  const roundHistory = [...state.roundHistory, roundScore];
  const runesNeededForRound = state.factoriesPerPlayer * state.runesPerRuneforge;

  const player1HasEnough = clearedPlayers[0].deck.length >= runesNeededForRound;
  const player2HasEnough = clearedPlayers[1].deck.length >= runesNeededForRound;

  if (!player1HasEnough || !player2HasEnough) {
    return {
      ...state,
      players: clearedPlayers,
      runeforges: [],
      centerPool: [],
      turnPhase: 'game-over',
      round: state.round,
      roundHistory,
      roundDamage: [0, 0],
      lockedPatternLines: {
        [clearedPlayers[0].id]: [],
        [clearedPlayers[1].id]: [],
      },
      shouldTriggerEndRound: false,
      selectedRunes: [],
      draftSource: null,
      pendingPlacement: null,
      animatingRunes: [],
      voidEffectPending: false,
      frostEffectPending: false,
    };
  }

  const emptyFactories = createEmptyFactories(clearedPlayers, state.factoriesPerPlayer);
  const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
    emptyFactories,
    {
      [clearedPlayers[0].id]: clearedPlayers[0].deck,
      [clearedPlayers[1].id]: clearedPlayers[1].deck,
    },
    state.runesPerRuneforge
  );

  const finalPlayers: [Player, Player] = [
    { ...clearedPlayers[0], deck: decksByPlayer[clearedPlayers[0].id] ?? [] },
    { ...clearedPlayers[1], deck: decksByPlayer[clearedPlayers[1].id] ?? [] },
  ];
  const nextStrainMultiplier = calculateNextStrainMultiplier(
    finalPlayers,
    DEFAULT_STRAIN_MULTIPLIER
  );

  return {
    ...state,
    players: finalPlayers,
    runeforges: filledRuneforges,
    centerPool: [],
    turnPhase: 'draft',
    round: state.round + 1,
    strain: state.strain * state.strainMultiplier,
    strainMultiplier: nextStrainMultiplier,
    roundHistory,
    roundDamage: [0, 0],
    lockedPatternLines: {
      [finalPlayers[0].id]: [],
      [finalPlayers[1].id]: [],
    },
    shouldTriggerEndRound: false,
    selectedRunes: [],
    draftSource: null,
    pendingPlacement: null,
    animatingRunes: [],
    voidEffectPending: false,
    frostEffectPending: false,
  };
}

const getInitializerForMatchType = (matchType: MatchType, runeTypeCount: import('../../types/game').RuneTypeCount) =>
  matchType === 'solo' ? initializeSoloGame(runeTypeCount) : initializeGame(runeTypeCount);

export interface GameplayStore extends GameState {
  // Actions
  // Not in use
  startGame: (topController: QuickPlayOpponent, runeTypeCount: import('../../types/game').RuneTypeCount) => void;
  startSpectatorMatch: (topDifficulty: AIDifficulty, bottomDifficulty: AIDifficulty) => void;
  startSoloRun: (runeTypeCount: import('../../types/game').RuneTypeCount, config?: Partial<SoloRunConfig>) => void;
  prepareSoloMode: (runeTypeCount?: import('../../types/game').RuneTypeCount, config?: Partial<SoloRunConfig>) => void;
  forceSoloVictory: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId?: string) => void;
  draftFromCenter: (runeType: RuneType, primaryRuneId?: string) => void;
  placeRunes: (patternLineIndex: number) => void;
  moveRunesToWall: () => void;
  placeRunesInFloor: () => void;
  cancelSelection: () => void;
  destroyRune: (target: VoidTarget) => void;
  skipVoidEffect: () => void;
  skipFrostEffect: () => void;
  freezePatternLine: (playerId: string, patternLineIndex: number) => void;
  endRound: () => void;
  resetGame: () => void;
  triggerRoundEnd: () => void;
  selectDeckDraftRuneforge: (runeforgeId: string) => void;
}

export const gameplayStoreConfig = (set: StoreApi<GameplayStore>['setState']): GameplayStore => ({
  // Initial state
  ...initializeGame(),
  // Strain configuration - starting value and multiplier factor (tune here)
  strain: DEFAULT_STARTING_STRAIN,
  strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
  
  // Actions
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId?: string) => {
    set((state) => {
      if (state.turnPhase !== 'draft') {
        return state;
      }
      const currentPlayer = state.players[state.currentPlayerIndex];
      const isSoloMode = state.matchType === 'solo';
      // Find the runeforge
      const runeforge = state.runeforges.find((f) => f.id === runeforgeId);
      if (!runeforge) return state;

      if (isSoloMode && runeforge.ownerId !== currentPlayer.id) {
        return state;
      }

      const ownsRuneforge = runeforge.ownerId === currentPlayer.id;
      const playerRuneforges = state.runeforges.filter((f) => f.ownerId === currentPlayer.id);
      const hasAccessibleRuneforges = playerRuneforges.some(
        (f) => f.runes.length > 0
      );
      const centerIsEmpty = state.centerPool.length === 0;
      const canDraftOpponentRuneforge = !ownsRuneforge && !hasAccessibleRuneforges && centerIsEmpty;

      if (isSoloMode && !ownsRuneforge) {
        return state;
      }

      if (!ownsRuneforge && !canDraftOpponentRuneforge) {
        return state;
      }
      
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

      const currentPlayerIndex = state.currentPlayerIndex;
      const currentPlayer = state.players[currentPlayerIndex];
      const opponentIndex = currentPlayerIndex === 0 ? 1 : 0;
      const isSoloMode = state.matchType === 'solo';

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
        const nextPlayerIndex = isSoloMode ? currentPlayerIndex : opponentIndex;

        return {
          ...state,
          turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
          currentPlayerIndex: nextPlayerIndex as 0 | 1,
          shouldTriggerEndRound: shouldEndRound,
        };
      }

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

        if (isSoloMode && state.soloPatternLineLock) {
          const existingLocked = updatedLockedPatternLines[currentPlayer.id] ?? [];
          updatedLockedPatternLines[currentPlayer.id] = existingLocked.includes(index)
            ? existingLocked
            : [...existingLocked, index];
        }
      });

      let nextRunePowerTotal = state.runePowerTotal;
      let updatedRoundDamage: [number, number] = [...state.roundDamage] as [number, number];
      let soloOutcome: SoloOutcome = state.soloOutcome;
      let opponentHealth: number | null = null;
      let nextHealth = currentPlayer.health;

      if (totalHealing > 0) {
        const maxHealth = currentPlayer.maxHealth ?? state.startingHealth;
        nextHealth = Math.min(maxHealth, nextHealth + totalHealing);
      }

      if (isSoloMode && currentPlayerIndex === 0) {
        nextRunePowerTotal += totalDamage;
        updatedRoundDamage = [updatedRoundDamage[0] + totalDamage, updatedRoundDamage[1]];
        if (nextRunePowerTotal >= state.soloTargetScore) {
          soloOutcome = 'victory';
        }
      } else {
        const opponent = state.players[opponentIndex];
        opponentHealth = Math.max(0, opponent.health - totalDamage);
        updatedRoundDamage = currentPlayerIndex === 0
          ? [updatedRoundDamage[0] + totalDamage, updatedRoundDamage[1]]
          : [updatedRoundDamage[0], updatedRoundDamage[1] + totalDamage];
      }

      const updatedPlayers: [Player, Player] = [...state.players] as [Player, Player];
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        patternLines: updatedPatternLines,
        wall: updatedWall,
        health: nextHealth,
      };

      if (!isSoloMode && opponentHealth !== null) {
        const opponentPlayer = state.players[opponentIndex];
        updatedPlayers[opponentIndex] = {
          ...opponentPlayer,
          health: opponentHealth,
        };
      }

      const opponentDefeated = !isSoloMode && opponentHealth === 0 && totalDamage > 0;
      const soloVictoryAchieved = isSoloMode && soloOutcome === 'victory';

      if (opponentDefeated) {
        return {
          ...state,
          players: updatedPlayers,
          turnPhase: 'game-over' as const,
          shouldTriggerEndRound: false,
          soloOutcome,
          runePowerTotal: nextRunePowerTotal,
          roundDamage: updatedRoundDamage,
          lockedPatternLines: updatedLockedPatternLines,
          draftSource: null,
          selectedRunes: [],
        };
      }

      if (soloVictoryAchieved) {
        return enterDeckDraftMode({
          ...state,
          players: updatedPlayers,
          runePowerTotal: nextRunePowerTotal,
          roundDamage: updatedRoundDamage,
          lockedPatternLines: updatedLockedPatternLines,
          selectedRunes: [],
          draftSource: null,
          pendingPlacement: null,
          animatingRunes: [],
          shouldTriggerEndRound: false,
          voidEffectPending: false,
          frostEffectPending: false,
        });
      }

      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      const nextPlayerIndex = isSoloMode ? currentPlayerIndex : opponentIndex;

      return {
        ...state,
        players: updatedPlayers,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
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
      const currentPlayer = state.players[state.currentPlayerIndex];
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
      const { selectedRunes, currentPlayerIndex } = state;
      const isSoloMode = state.matchType === 'solo';
      const shouldApplyOverloadDamage = isSoloMode ? currentPlayerIndex === 0 : true;
      
      // No runes selected, do nothing
      if (selectedRunes.length === 0) return state;
      
      const currentPlayer = state.players[currentPlayerIndex];
      const opponentIndex = currentPlayerIndex === 0 ? 1 : 0;
      const patternLine = currentPlayer.patternLines[patternLineIndex];
      if (!patternLine) {
        return state;
      }
      const frozenLinesForPlayer = state.frozenPatternLines[currentPlayer.id] ?? [];
      const lockedLinesForPlayer = state.lockedPatternLines[currentPlayer.id] ?? [];
      if (frozenLinesForPlayer.includes(patternLineIndex) || lockedLinesForPlayer.includes(patternLineIndex)) {
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

      const overloadRunesPlaced = shouldApplyOverloadDamage ? overflowRunes.length : 0;
      const overloadDamage = overloadRunesPlaced > 0
        ? overloadRunesPlaced * state.strain
        : 0;
      let nextHealth = overloadDamage > 0
        ? Math.max(0, currentPlayer.health - overloadDamage)
        : currentPlayer.health;

      const completedLines = updatedPatternLines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.count === line.tier && line.runeType !== null);

      // Update player
      const updatedPlayers: [typeof currentPlayer, typeof currentPlayer] = [
        ...state.players,
      ] as [typeof currentPlayer, typeof currentPlayer];
      
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        patternLines: updatedPatternLines,
        floorLine: updatedFloorLine,
        health: nextHealth,
      };
      
      // Clear any frozen lines affecting this player after they complete placement
      const updatedFrozenPatternLines = {
        ...state.frozenPatternLines,
        [currentPlayer.id]: [],
      };
      const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
      const nextCenterPool = movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
      const defeatedByOverload = shouldApplyOverloadDamage && nextHealth === 0;
      if (defeatedByOverload) {
        return {
          ...state,
          players: updatedPlayers,
          selectedRunes: [],
          draftSource: null,
          centerPool: nextCenterPool,
          turnPhase: 'game-over' as const,
          shouldTriggerEndRound: false,
          soloOutcome: isSoloMode ? ('defeat' as SoloOutcome) : state.soloOutcome,
          soloWinStreak: isSoloMode ? 0 : state.soloWinStreak,
          voidEffectPending: false,
          frostEffectPending: false,
        };
      }
      
      // Check if round should end (all runeforges and center empty)
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      
      // Switch to next player (alternate between 0 and 1) - only if no cast required
      const nextPlayerIndex = isSoloMode ? currentPlayerIndex : currentPlayerIndex === 0 ? 1 : 0;
      const nextTurnPhase =
        completedLines.length > 0
          ? ('cast' as const)
          : shouldEndRound
            ? ('end-of-round' as const)
            : ('draft' as const);
      
      return {
        ...state,
        players: updatedPlayers,
        selectedRunes: [],
        draftSource: null,
        centerPool: nextCenterPool,
        turnPhase: nextTurnPhase,
        currentPlayerIndex: completedLines.length > 0 ? currentPlayerIndex : (nextPlayerIndex as 0 | 1),
        shouldTriggerEndRound: completedLines.length > 0 ? false : shouldEndRound,
        frozenPatternLines: updatedFrozenPatternLines,
      };
    });
  },
  
  placeRunesInFloor: () => {
    set((state) => {
      if (state.turnPhase !== 'place') {
        return state;
      }
      const { selectedRunes, currentPlayerIndex } = state;
      const isSoloMode = state.matchType === 'solo';
      const shouldApplyOverloadDamage = isSoloMode ? currentPlayerIndex === 0 : true;
      
      // No runes selected, do nothing
      if (selectedRunes.length === 0) return state;
      
      const currentPlayer = state.players[currentPlayerIndex];
      const updatedFrozenPatternLines = {
        ...state.frozenPatternLines,
        [currentPlayer.id]: [],
      };
      
      // Add all selected runes to floor line
      const updatedFloorLine = {
        ...currentPlayer.floorLine,
        runes: [...currentPlayer.floorLine.runes, ...selectedRunes],
      };

      const overloadRunesPlaced = shouldApplyOverloadDamage ? selectedRunes.length : 0;
      const overloadDamage = overloadRunesPlaced > 0
        ? overloadRunesPlaced * state.strain
        : 0;
      const nextHealth = overloadDamage > 0
        ? Math.max(0, currentPlayer.health - overloadDamage)
        : currentPlayer.health;
      
      // Update player
      const updatedPlayers: [typeof currentPlayer, typeof currentPlayer] = [
        ...state.players,
      ] as [typeof currentPlayer, typeof currentPlayer];
      
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        floorLine: updatedFloorLine,
        health: nextHealth,
      };
      
      const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
      const nextCenterPool = movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
      // Switch to next player (alternate between 0 and 1)
      const nextPlayerIndex = isSoloMode ? currentPlayerIndex : currentPlayerIndex === 0 ? 1 : 0;
      const defeatedByOverload = shouldApplyOverloadDamage && nextHealth === 0;
      if (defeatedByOverload) {
        return {
          ...state,
          players: updatedPlayers,
          selectedRunes: [],
        draftSource: null,
        centerPool: nextCenterPool,
        turnPhase: 'game-over' as const,
        shouldTriggerEndRound: false,
        soloOutcome: isSoloMode ? ('defeat' as SoloOutcome) : state.soloOutcome,
        soloWinStreak: isSoloMode ? 0 : state.soloWinStreak,
        voidEffectPending: false,
        frostEffectPending: false,
      };
      }
      
      // Check if round should end (all runeforges and center empty)
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      
      return {
        ...state,
        players: updatedPlayers,
        selectedRunes: [],
        draftSource: null,
        centerPool: nextCenterPool,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
        shouldTriggerEndRound: shouldEndRound,
        frozenPatternLines: updatedFrozenPatternLines,
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
  
  destroyRune: (target: VoidTarget) => {
    set((state) => {
      // Void effect: destroy a single rune from a runeforge or the center
      if (!state.voidEffectPending) return state;

      const isSoloMode = state.matchType === 'solo';
      const nextPlayerIndex = isSoloMode ? state.currentPlayerIndex : state.currentPlayerIndex === 0 ? 1 : 0;

      if (target.source === 'runeforge') {
        const targetRuneforge = state.runeforges.find((f) => f.id === target.runeforgeId);
        if (!targetRuneforge) {
          return state;
        }

        const hasRune = targetRuneforge.runes.some((r) => r.id === target.runeId);
        if (!hasRune) {
          return state;
        }

        const updatedRuneforges = state.runeforges.map((f) =>
          f.id === target.runeforgeId
            ? { ...f, runes: f.runes.filter((r) => r.id !== target.runeId) }
            : f
        );

        const allRuneforgesEmpty = updatedRuneforges.every((f) => f.runes.length === 0);
        const centerEmpty = state.centerPool.length === 0;
        const shouldEndRound = allRuneforgesEmpty && centerEmpty;

        return {
          ...state,
          runeforges: updatedRuneforges,
          voidEffectPending: false,
          currentPlayerIndex: nextPlayerIndex as 0 | 1,
          turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
          shouldTriggerEndRound: shouldEndRound,
        };
      }

      if (target.source === 'center') {
        const hasRune = state.centerPool.some((r) => r.id === target.runeId);
        if (!hasRune) {
          return state;
        }

        const updatedCenterPool = state.centerPool.filter((r) => r.id !== target.runeId);
        const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
        const centerEmpty = updatedCenterPool.length === 0;
        const shouldEndRound = allRuneforgesEmpty && centerEmpty;

        return {
          ...state,
          centerPool: updatedCenterPool,
          voidEffectPending: false,
          currentPlayerIndex: nextPlayerIndex as 0 | 1,
          turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
          shouldTriggerEndRound: shouldEndRound,
        };
      }

      return state;
    });
  },
  
  skipVoidEffect: () => {
    set((state) => {
      // Skip Void effect without destroying any rune
      if (!state.voidEffectPending) return state;
      
      // Switch to next player when skipping Void effect
      const isSoloMode = state.matchType === 'solo';
      const nextPlayerIndex = isSoloMode ? state.currentPlayerIndex : state.currentPlayerIndex === 0 ? 1 : 0;
      
      // Check if round should end
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      
      return {
        ...state,
        voidEffectPending: false,
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        shouldTriggerEndRound: shouldEndRound,
      };
    });
  },
  
  skipFrostEffect: () => {
    set((state) => {
      // Skip Frost effect without freezing a pattern line
      if (!state.frostEffectPending) return state;
      
      const isSoloMode = state.matchType === 'solo';
      const nextPlayerIndex = isSoloMode ? state.currentPlayerIndex : state.currentPlayerIndex === 0 ? 1 : 0;
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      
      return {
        ...state,
        frostEffectPending: false,
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        shouldTriggerEndRound: shouldEndRound,
      };
    });
  },
  
  freezePatternLine: (playerId: string, patternLineIndex: number) => {
    set((state) => {
      // Frost effect: freeze the selected opponent pattern line
      if (!state.frostEffectPending) return state;
      const isSoloMode = state.matchType === 'solo';
      if (isSoloMode) return state;

      const currentPlayer = state.players[state.currentPlayerIndex];
      if (playerId === currentPlayer.id) {
        return state;
      }
      const targetPlayer = state.players.find((player) => player.id === playerId);
      if (!targetPlayer) {
        return state;
      }
      const targetLine = targetPlayer.patternLines[patternLineIndex];
      if (!targetLine) {
        return state;
      }
      const isLineFull = targetLine.count >= targetLine.tier;
      const currentFrozen = state.frozenPatternLines[playerId] ?? [];
      if (isLineFull || currentFrozen.includes(patternLineIndex)) {
        return state;
      }
      
      const updatedFrozenPatternLines = {
        ...state.frozenPatternLines,
        [playerId]: [...currentFrozen, patternLineIndex],
      };
      
      // Switch to next player after pattern line is frozen
      const nextPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
      
      // Check if round should end
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      
      return {
        ...state,
        frozenPatternLines: updatedFrozenPatternLines,
        frostEffectPending: false,
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
        turnPhase: shouldEndRound ? ('end-of-round' as const) : ('draft' as const),
        shouldTriggerEndRound: shouldEndRound,
      };
    });
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
      if (state.matchType === 'solo') {
        return prepareSoloRoundReset(state);
      }

      return prepareVersusRoundReset(state);
    });
  },
  
  startGame: (topController: QuickPlayOpponent, runeTypeCount: import('../../types/game').RuneTypeCount) => {
    set((state) => {
      const shouldResetState = state.runeTypeCount !== runeTypeCount || state.matchType !== 'versus';
      // If rune type count changed or we are resuming from a different match type, reinitialize the game with new configuration
      if (shouldResetState) {
        const newState = initializeGame(runeTypeCount);
        const updatedControllers: PlayerControllers = {
          bottom: { type: 'human' },
          top: topController === 'human' ? { type: 'human' } : { type: 'computer', difficulty: topController },
        };

        const updatedPlayers: [Player, Player] = [
          { ...newState.players[0], type: 'human' },
          {
            ...newState.players[1],
            type: updatedControllers.top.type,
            name:
              updatedControllers.top.type === 'computer'
                ? getAIDisplayName('Opponent', updatedControllers.top.difficulty)
                : 'Player 2',
          },
        ];

        return {
          ...newState,
          gameStarted: true,
          matchType: 'versus',
          runeTypeCount: runeTypeCount,
          playerControllers: updatedControllers,
          players: updatedPlayers,
          runePowerTotal: 0,
          soloOutcome: null,
          // ensure strain defaults are present when creating a fresh game
          strain: DEFAULT_STARTING_STRAIN,
          strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
        };
      }

      // Otherwise just update the existing state
      const updatedControllers: PlayerControllers = {
        bottom: { type: 'human' },
        top: topController === 'human' ? { type: 'human' } : { type: 'computer', difficulty: topController },
      };

      const updatedPlayers: [Player, Player] = [
        { ...state.players[0], type: 'human' },
        {
          ...state.players[1],
          type: updatedControllers.top.type,
          name:
            updatedControllers.top.type === 'computer'
              ? getAIDisplayName('Opponent', updatedControllers.top.difficulty)
              : 'Player 2',
        },
      ];

      return {
        ...state,
        gameStarted: true,
        matchType: 'versus',
        runeTypeCount: runeTypeCount,
        playerControllers: updatedControllers,
        players: updatedPlayers,
        runePowerTotal: 0,
        soloOutcome: null,
      };
    });
  },

  startSpectatorMatch: (topDifficulty: AIDifficulty, bottomDifficulty: AIDifficulty) => {
    set((state) => {
      const baseState = state.matchType === 'versus' ? state : initializeGame(state.runeTypeCount);
      const playerControllers: PlayerControllers = {
        bottom: { type: 'computer', difficulty: bottomDifficulty },
        top: { type: 'computer', difficulty: topDifficulty },
      };

      const updatedPlayers: [Player, Player] = [
        {
          ...baseState.players[0],
          type: 'computer',
          name: getAIDisplayName('Bottom AI', bottomDifficulty),
        },
        {
          ...baseState.players[1],
          type: 'computer',
          name: getAIDisplayName('Top AI', topDifficulty),
        },
      ];

      return {
        ...baseState,
        gameStarted: true,
        matchType: 'versus',
        players: updatedPlayers,
        playerControllers,
        runePowerTotal: 0,
        soloOutcome: null,
        strain: DEFAULT_STARTING_STRAIN,
        strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
      };
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
      if (state.matchType !== 'solo') {
        return state;
      }
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
        voidEffectPending: false,
        frostEffectPending: false,
      });
    });
  },

  hydrateGameState: (nextState: GameState) => {
    set((state) => {
      const shouldMerge = nextState.matchType === 'solo' || state.matchType === nextState.matchType;
      if (!shouldMerge) {
        return state;
      }
      const targetRuneTypeCount = nextState.runeTypeCount ?? state.runeTypeCount;
      const totalRunes = nextState.totalRunesPerPlayer ?? state.totalRunesPerPlayer;
      const deckTemplate =
        nextState.matchType === 'solo'
          ? (nextState.soloDeckTemplate && nextState.soloDeckTemplate.length > 0
            ? nextState.soloDeckTemplate
            : createStartingDeck(nextState.players[0]?.id ?? 'player-1', targetRuneTypeCount, totalRunes))
          : [];
      const soloBaseTargetScore =
        typeof nextState.soloBaseTargetScore === 'number'
          ? nextState.soloBaseTargetScore
          : nextState.matchType === 'solo'
            ? nextState.soloTargetScore ?? DEFAULT_SOLO_CONFIG.targetRuneScore
            : 0;
      const soloStartingStrain =
        typeof nextState.soloStartingStrain === 'number'
          ? nextState.soloStartingStrain
          : nextState.matchType === 'solo'
            ? nextState.strain
            : DEFAULT_STARTING_STRAIN;
      const soloWinStreak =
        typeof nextState.soloWinStreak === 'number'
          ? nextState.soloWinStreak
          : 0;
      return {
        ...state,
        ...nextState,
        deckDraftState: nextState.deckDraftState ?? null,
        soloDeckTemplate: deckTemplate,
        soloBaseTargetScore,
        soloStartingStrain,
        soloWinStreak,
      };
    });
  },

  returnToStartScreen: () => {
    set((state) => ({
      ...getInitializerForMatchType(state.matchType, state.runeTypeCount),
      gameStarted: false,
    }));
    // Call navigation callback if registered (for router integration)
    if (navigationCallback) {
      navigationCallback();
    }
  },
  
  resetGame: () => {
    set((state) => getInitializerForMatchType(state.matchType, state.runeTypeCount));
  },

  selectDeckDraftRuneforge: (runeforgeId: string) => {
    set((state) => {
      if (state.matchType !== 'solo' || state.turnPhase !== 'deck-draft' || !state.deckDraftState) {
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
        state.players[0].id,
        state.soloWinStreak
      );
      const updatedPlayer: Player = {
        ...state.players[0],
        deck: mergeDeckWithRuneforge(state.players[0].deck, selectedRuneforge),
      };

      if (!nextDraftState) {
        const nextTarget = state.soloTargetScore + 50;
        const deckRunesPerType = Math.max(1, Math.round(updatedDeckTemplate.length / state.runeTypeCount));
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
            startingDeck: updatedDeckTemplate,
            targetScore: nextTarget,
            winStreak: state.soloWinStreak,
          }
        );

        return {
          ...nextGameState,
          gameStarted: true,
          soloDeckTemplate: updatedDeckTemplate,
          soloBaseTargetScore: state.soloBaseTargetScore || nextTarget,
          deckDraftState: null,
        };
      }

      return {
        ...state,
        players: [updatedPlayer, state.players[1]],
        deckDraftState: nextDraftState,
        soloDeckTemplate: updatedDeckTemplate,
        totalRunesPerPlayer: updatedDeckTemplate.length,
      };
    });
  },
});

export const useGameplayStore = create<GameplayStore>((set) => gameplayStoreConfig(set));

export function createGameplayStoreInstance() {
  return create<GameplayStore>((set) => gameplayStoreConfig(set));
}
