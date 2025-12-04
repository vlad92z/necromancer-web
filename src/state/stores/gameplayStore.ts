/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, VoidTarget, AIDifficulty, QuickPlayOpponent, PlayerControllers, MatchType, SoloOutcome, RuneEffect, SoloRunConfig } from '../../types/game';
import { initializeGame, fillFactories, createEmptyFactories, initializeSoloGame, createSoloFactories, DEFAULT_STARTING_STRAIN, DEFAULT_STRAIN_MULTIPLIER } from '../../utils/gameInitialization';
import { resolveSegment, getWallColumnForRune, calculateEffectiveFloorPenalty, applyStressMitigation } from '../../utils/scoring';
import { getAIDifficultyLabel } from '../../utils/aiDifficultyLabels';
import { copyRuneEffects, getEffectValue, getRuneEffectsForType, hasEffectType } from '../../utils/runeEffects';

type NumericEffectType = Extract<RuneEffect, { amount: number }>['type'];

function calculateEffectValueForWall(
  wall: Player['wall'],
  effectType: NumericEffectType
): number {
  return wall.flat().reduce(
    (total, cell) => total + getEffectValue(cell.effects, effectType),
    0
  );
}

function calculateNextStrainMultiplier(
  _players: [Player, Player],
  baseMultiplier: number
): number {
  return baseMultiplier;
}

function calculateImmediateOverloadDamage(
  previousFloorRunes: Player['floorLine']['runes'],
  nextFloorRunes: Player['floorLine']['runes'],
  previousPatternLines: Player['patternLines'],
  nextPatternLines: Player['patternLines'],
  wall: Player['wall'],
  strain: number,
): number {
  const previousPenalty = calculateEffectiveFloorPenalty(
    previousFloorRunes,
    previousPatternLines,
    wall
  );
  const nextPenalty = calculateEffectiveFloorPenalty(
    nextFloorRunes,
    nextPatternLines,
    wall
  );
  const addedPenalty = Math.max(0, nextPenalty - previousPenalty);
  if (addedPenalty === 0) {
    return 0;
  }

  const frostMitigation = calculateEffectValueForWall(wall, 'StrainMitigation');
  const overloadMultiplier = applyStressMitigation(strain, frostMitigation);
  return addedPenalty * overloadMultiplier;
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

// NOTE: overload multiplier is now stored in state.strain and adjusted at
// round end. The old getOverloadMultiplier(round) helper is no longer used.

// Navigation callback registry for routing integration
let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null) {
  navigationCallback = callback;
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
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId?: string) => void;
  draftFromCenter: (runeType: RuneType, primaryRuneId?: string) => void;
  placeRunes: (patternLineIndex: number) => void;
  placeRunesInFloor: () => void;
  cancelSelection: () => void;
  destroyRune: (target: VoidTarget) => void;
  skipVoidEffect: () => void;
  skipFrostEffect: () => void;
  freezePatternLine: (playerId: string, patternLineIndex: number) => void;
  endRound: () => void;
  resetGame: () => void;
  triggerRoundEnd: () => void;
  processScoringStep: () => void;
}

function processSoloScoringPhase(state: GameState): GameState {
  const currentPhase = state.scoringPhase;
  if (!currentPhase) {
    return state;
  }

  if (currentPhase === 'moving-to-wall') {
    const moveRunesToWall = (player: Player): Player => {
      const updatedPatternLines = [...player.patternLines];
      const updatedWall = player.wall.map((row) => [...row]);
      const wallSize = player.wall.length;

      player.patternLines.forEach((line, lineIndex) => {
        if (line.count === line.tier && line.runeType) {
          const row = lineIndex;
          const col = getWallColumnForRune(row, line.runeType, wallSize);
          const effects = line.firstRuneEffects ?? getRuneEffectsForType(line.runeType);
          updatedWall[row][col] = { runeType: line.runeType, effects: copyRuneEffects(effects) };
          updatedPatternLines[lineIndex] = {
            tier: line.tier,
            runeType: null,
            count: 0,
            firstRuneId: null,
            firstRuneEffects: null,
          };
        }
      });

      return {
        ...player,
        patternLines: updatedPatternLines,
        wall: updatedWall,
      };
    };

    const updatedPlayer = moveRunesToWall(state.players[0]);

    return {
      ...state,
      players: [updatedPlayer, state.players[1]],
      scoringPhase: 'clearing-floor' as const,
    };
  }

  if (currentPhase === 'clearing-floor') {
    const updatedPlayersArray: [Player, Player] = [
      {
        ...state.players[0],
        floorLine: {
          ...state.players[0].floorLine,
          runes: [],
        },
      },
      {
        ...state.players[1],
        floorLine: {
          ...state.players[1].floorLine,
          runes: [],
        },
      },
    ];

    return {
      ...state,
      players: updatedPlayersArray,
      scoringPhase: 'complete' as const,
    };
  }

  if (currentPhase === 'complete') {
    const roundHistory = [...state.roundHistory];
    const runesNeededForRound = state.factoriesPerPlayer * state.runesPerRuneforge;
    const playerHasEnough = state.players[0].deck.length >= runesNeededForRound;

    if (!playerHasEnough) {
      const achievedTarget = state.runePowerTotal >= state.soloTargetScore;
      return {
        ...state,
        roundHistory,
        runeforges: [],
        centerPool: [],
        turnPhase: 'game-over',
        round: state.round,
        scoringPhase: null,
        soloOutcome: achievedTarget ? ('victory' as SoloOutcome) : ('defeat' as SoloOutcome),
        shouldTriggerEndRound: false,
        roundDamage: [0, 0],
        lockedPatternLines: {
          [state.players[0].id]: [],
          [state.players[1].id]: [],
        },
      };
    }

    const emptyFactories = createSoloFactories(state.players[0], state.factoriesPerPlayer);
    const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
      emptyFactories,
      { [state.players[0].id]: state.players[0].deck },
      state.runesPerRuneforge
    );

    const updatedPlayer: Player = {
      ...state.players[0],
      deck: decksByPlayer[state.players[0].id] ?? [],
    };

    const nextStrainMultiplier = calculateNextStrainMultiplier(
      [updatedPlayer, state.players[1]],
      DEFAULT_STRAIN_MULTIPLIER
    );

    return {
      ...state,
      players: [updatedPlayer, state.players[1]],
      runeforges: filledRuneforges,
      centerPool: [],
      turnPhase: 'draft',
      round: state.round + 1,
      // multiply strain at end of round so it applies next round
      strain: state.strain * state.strainMultiplier,
      strainMultiplier: nextStrainMultiplier,
      scoringPhase: null,
      soloOutcome: null,
      roundDamage: [0, 0],
      roundHistory,
      lockedPatternLines: {
        [updatedPlayer.id]: [],
        [state.players[1].id]: [],
      },
    };
  }

  return state;
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
      };
    });
  },
  
  draftFromCenter: (runeType: RuneType, primaryRuneId?: string) => {
    set((state) => {
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
      };
    });
  },
  
  placeRunes: (patternLineIndex: number) => {
    set((state) => {
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

      const overloadDamage = shouldApplyOverloadDamage
        ? calculateImmediateOverloadDamage(
            currentPlayer.floorLine.runes,
            updatedFloorLine.runes,
            currentPlayer.patternLines,
            updatedPatternLines,
            currentPlayer.wall,
            state.strain
          )
        : 0;
      let nextHealth = shouldApplyOverloadDamage
        ? Math.max(0, currentPlayer.health - overloadDamage)
        : currentPlayer.health;

      const updatedWall = currentPlayer.wall.map((rowCells) => [...rowCells]);
      const roundDamage = state.roundDamage ?? [0, 0];
      let updatedRoundDamage: [number, number] = [...roundDamage] as [number, number];
      const updatedLockedPatternLines: Record<Player['id'], number[]> = { ...state.lockedPatternLines };
      let nextRunePowerTotal = state.runePowerTotal;
      let damageDealt = 0;
      let healingGained = 0;
      let opponentHealth: number | null = null;
      let soloOutcome: SoloOutcome = state.soloOutcome;

      const completedLine = updatedPatternLines[patternLineIndex].count === updatedPatternLines[patternLineIndex].tier;
      if (completedLine) {
        updatedWall[row][col] = {
          runeType,
          effects: copyRuneEffects(nextFirstRuneEffects),
        };
        updatedPatternLines[patternLineIndex] = {
          tier: patternLine.tier,
          runeType: null,
          count: 0,
          firstRuneId: null,
          firstRuneEffects: null,
        };
        const resolvedSegment = resolveSegment(updatedWall, row, col);
        damageDealt = resolvedSegment.damage;
        healingGained = resolvedSegment.healing;
        if (state.matchType === 'solo' && state.soloPatternLineLock) {
          const existingLocked = updatedLockedPatternLines[currentPlayer.id] ?? [];
          updatedLockedPatternLines[currentPlayer.id] = existingLocked.includes(patternLineIndex)
            ? existingLocked
            : [...existingLocked, patternLineIndex];
        }

        if (isSoloMode && currentPlayerIndex === 0) {
          nextRunePowerTotal += damageDealt;
          updatedRoundDamage = [updatedRoundDamage[0] + damageDealt, updatedRoundDamage[1]];
          if (nextRunePowerTotal >= state.soloTargetScore) {
            soloOutcome = 'victory';
          }
        } else {
          const opponent = state.players[opponentIndex];
          opponentHealth = Math.max(0, opponent.health - damageDealt);
          updatedRoundDamage = currentPlayerIndex === 0
            ? [updatedRoundDamage[0] + damageDealt, updatedRoundDamage[1]]
            : [updatedRoundDamage[0], updatedRoundDamage[1] + damageDealt];
        }
      }

      if (healingGained > 0) {
        const maxHealth = currentPlayer.maxHealth ?? state.startingHealth;
        nextHealth = Math.min(maxHealth, nextHealth + healingGained);
      }

      // Update player
      const updatedPlayers: [typeof currentPlayer, typeof currentPlayer] = [
        ...state.players,
      ] as [typeof currentPlayer, typeof currentPlayer];
      
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        patternLines: updatedPatternLines,
        floorLine: updatedFloorLine,
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
      
      // Clear any frozen lines affecting this player after they complete placement
      const updatedFrozenPatternLines = {
        ...state.frozenPatternLines,
        [currentPlayer.id]: [],
      };
      const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
      const nextCenterPool = movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
      const defeatedByOverload = shouldApplyOverloadDamage && nextHealth === 0;
      const opponentDefeated = !isSoloMode && opponentHealth === 0 && damageDealt > 0;
      const soloVictoryAchieved = isSoloMode && soloOutcome === 'victory';
      if (defeatedByOverload) {
        return {
          ...state,
          players: updatedPlayers,
          selectedRunes: [],
          draftSource: null,
          centerPool: nextCenterPool,
          turnPhase: 'game-over' as const,
          shouldTriggerEndRound: false,
          scoringPhase: null,
          soloOutcome: isSoloMode ? ('defeat' as SoloOutcome) : state.soloOutcome,
          runePowerTotal: nextRunePowerTotal,
          roundDamage: updatedRoundDamage,
          lockedPatternLines: updatedLockedPatternLines,
          voidEffectPending: false,
          frostEffectPending: false,
        };
      }

      if (opponentDefeated || soloVictoryAchieved) {
        return {
          ...state,
          players: updatedPlayers,
          selectedRunes: [],
          draftSource: null,
          centerPool: nextCenterPool,
          turnPhase: 'game-over' as const,
          shouldTriggerEndRound: false,
          scoringPhase: null,
          soloOutcome,
          runePowerTotal: nextRunePowerTotal,
          roundDamage: updatedRoundDamage,
          lockedPatternLines: updatedLockedPatternLines,
          voidEffectPending: false,
          frostEffectPending: false,
        };
      }
      
      // Check if Void runes were placed (Void effect: destroy a single rune)
      const hasVoidRunes = selectedRunes.some((rune) => hasEffectType(rune.effects, 'DestroyRune'));
      const hasVoidTargets = state.runeforges.some(f => f.runes.length > 0) || state.centerPool.length > 0;
      
      // Check if Frost runes were placed (Frost effect: freeze an opponent pattern line)
      const hasFrostRunes = !isSoloMode && selectedRunes.some((rune) => hasEffectType(rune.effects, 'FreezePatternLine'));
      const opponentId = state.players[opponentIndex].id;
      const opponentPatternLines = state.players[opponentIndex].patternLines;
      const frozenOpponentLines = state.frozenPatternLines[opponentId] ?? [];
      const canTriggerFrostEffect = !isSoloMode && opponentPatternLines.some(
        (line, index) => line.count < line.tier && !frozenOpponentLines.includes(index)
      );
      
      // Check if round should end (all runeforges and center empty)
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allRuneforgesEmpty && centerEmpty;
      
      // If Void runes were placed and there are available targets, trigger Void effect
      // Keep current player so THEY get to choose which rune to destroy
      if (hasVoidRunes && hasVoidTargets && !shouldEndRound) {
        return {
          ...state,
          players: updatedPlayers,
          selectedRunes: [],
          draftSource: null,
          centerPool: nextCenterPool,
          turnPhase: 'draft' as const,
          currentPlayerIndex: currentPlayerIndex, // Don't switch! Current player chooses runeforge
          voidEffectPending: true, // Wait for runeforge selection
          frozenPatternLines: updatedFrozenPatternLines,
          runePowerTotal: nextRunePowerTotal,
          roundDamage: updatedRoundDamage,
          lockedPatternLines: updatedLockedPatternLines,
        };
      }
      
      // If Frost runes were placed and there are non-empty runeforges, trigger Frost effect
      // Keep current player so THEY get to choose which runeforge to freeze
      if (hasFrostRunes && canTriggerFrostEffect && !shouldEndRound) {
        return {
          ...state,
          players: updatedPlayers,
          selectedRunes: [],
          draftSource: null,
          centerPool: nextCenterPool,
          turnPhase: 'draft' as const,
          currentPlayerIndex: currentPlayerIndex, // Don't switch! Current player chooses runeforge
          frostEffectPending: true, // Wait for runeforge selection
          frozenPatternLines: updatedFrozenPatternLines,
          runePowerTotal: nextRunePowerTotal,
          roundDamage: updatedRoundDamage,
          lockedPatternLines: updatedLockedPatternLines,
        };
      }
      
      // Switch to next player (alternate between 0 and 1) - only if no Void/Frost effect
      const nextPlayerIndex = isSoloMode ? currentPlayerIndex : currentPlayerIndex === 0 ? 1 : 0;
      
      return {
        ...state,
        players: updatedPlayers,
        selectedRunes: [],
        draftSource: null,
        centerPool: nextCenterPool,
        turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
        shouldTriggerEndRound: shouldEndRound,
        frozenPatternLines: updatedFrozenPatternLines,
        runePowerTotal: nextRunePowerTotal,
        roundDamage: updatedRoundDamage,
        lockedPatternLines: updatedLockedPatternLines,
      };
    });
  },
  
  placeRunesInFloor: () => {
    set((state) => {
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

      const overloadDamage = shouldApplyOverloadDamage
        ? calculateImmediateOverloadDamage(
            currentPlayer.floorLine.runes,
            updatedFloorLine.runes,
            currentPlayer.patternLines,
            currentPlayer.patternLines,
            currentPlayer.wall,
            state.strain
          )
        : 0;
      const nextHealth = shouldApplyOverloadDamage
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
          scoringPhase: null,
          soloOutcome: isSoloMode ? ('defeat' as SoloOutcome) : state.soloOutcome,
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
        turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
        shouldTriggerEndRound: shouldEndRound,
        frozenPatternLines: updatedFrozenPatternLines,
      };
    });
  },
  
  cancelSelection: () => {
    set((state) => {
      // Only allow cancellation if there are selected runes
      if (state.selectedRunes.length === 0 || !state.draftSource) return state;
      
      // Return selected runes to their original source
      if (state.draftSource.type === 'center') {
        return {
          ...state,
          centerPool: [...state.draftSource.originalRunes],
          selectedRunes: [],
          draftSource: null,
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
          turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
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
          turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
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
        turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
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
        turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
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
        turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
        shouldTriggerEndRound: shouldEndRound,
      };
    });
  },

  triggerRoundEnd: () => {
    set((state) => {
      const allRuneforgesEmpty = state.runeforges.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      if (!allRuneforgesEmpty || !centerEmpty || state.selectedRunes.length > 0 || state.turnPhase === 'scoring') {
        return state;
      }

      return {
        ...state,
        turnPhase: 'scoring' as const,
        shouldTriggerEndRound: true,
      };
    });
  },
  
  endRound: () => {
    set((state) => ({
      ...state,
      scoringPhase: 'moving-to-wall' as const,
      shouldTriggerEndRound: false,
    }));
  },
  
  processScoringStep: () => {
    set((state) => {
      const currentPhase = state.scoringPhase;
      if (!currentPhase) {
        return state;
      }

      if (state.matchType === 'solo') {
        return processSoloScoringPhase(state);
      }

      if (currentPhase === 'moving-to-wall') {
        console.log('Scoring: Moving runes to wall...');

        const moveRunesToWall = (player: Player): Player => {
          const updatedPatternLines = [...player.patternLines];
          const updatedWall = player.wall.map((row) => [...row]);
          const wallSize = player.wall.length;

          player.patternLines.forEach((line, lineIndex) => {
            if (line.count === line.tier && line.runeType) {
              const row = lineIndex;
              const col = getWallColumnForRune(row, line.runeType, wallSize);
              const effects = line.firstRuneEffects ?? getRuneEffectsForType(line.runeType);
              updatedWall[row][col] = { runeType: line.runeType, effects: copyRuneEffects(effects) };
              console.log(`Player ${player.id}: Line ${lineIndex + 1} complete, placed ${line.runeType} at (${row},${col})`);
              updatedPatternLines[lineIndex] = {
                tier: line.tier,
                runeType: null,
                count: 0,
                firstRuneId: null,
                firstRuneEffects: null,
              };
            }
          });

          return {
            ...player,
            patternLines: updatedPatternLines,
            wall: updatedWall,
          };
        };

        const updatedPlayersArray: [Player, Player] = [
          moveRunesToWall(state.players[0]),
          moveRunesToWall(state.players[1]),
        ];

        return {
          ...state,
          players: updatedPlayersArray,
          scoringPhase: 'clearing-floor' as const,
        };
      }

      if (currentPhase === 'clearing-floor') {
        console.log('Scoring: Clearing floor lines...');

        const updatedPlayersArray: [Player, Player] = [
          {
            ...state.players[0],
            floorLine: {
              ...state.players[0].floorLine,
              runes: [],
            },
          },
          {
            ...state.players[1],
            floorLine: {
              ...state.players[1].floorLine,
              runes: [],
            },
          },
        ];

        return {
          ...state,
          players: updatedPlayersArray,
          scoringPhase: 'complete' as const,
        };
      }

      if (currentPhase === 'complete') {
        console.log('Scoring: Complete, checking game over...');
        const roundScore = {
          round: state.round,
          playerName: state.players[0].name,
          opponentName: state.players[1].name,
        };
        const roundHistory = [...state.roundHistory, roundScore];
        const runesNeededForRound = state.factoriesPerPlayer * state.runesPerRuneforge;

        const player1HasEnough = state.players[0].deck.length >= runesNeededForRound;
        const player2HasEnough = state.players[1].deck.length >= runesNeededForRound;

        if (!player1HasEnough || !player2HasEnough) {
          console.log('Game over! A player has run out of runes.');
          console.log(
            `Player 1 runes: ${state.players[0].deck.length}, Player 2 runes: ${state.players[1].deck.length} (need at least ${runesNeededForRound} for the next round)`
          );

          return {
            ...state,
            runeforges: [],
            centerPool: [],
            turnPhase: 'game-over',
            round: state.round,
            scoringPhase: null,
            roundHistory,
            roundDamage: [0, 0],
            lockedPatternLines: {
              [state.players[0].id]: [],
              [state.players[1].id]: [],
            },
          };
        }

        const emptyFactories = createEmptyFactories(state.players, state.factoriesPerPlayer);
        const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
          emptyFactories,
          {
            [state.players[0].id]: state.players[0].deck,
            [state.players[1].id]: state.players[1].deck,
          },
          state.runesPerRuneforge
        );

        const finalPlayers: [Player, Player] = [
          { ...state.players[0], deck: decksByPlayer[state.players[0].id] ?? [] },
          { ...state.players[1], deck: decksByPlayer[state.players[1].id] ?? [] },
        ];
        const nextStrainMultiplier = calculateNextStrainMultiplier(
          finalPlayers,
          DEFAULT_STRAIN_MULTIPLIER
        );

        console.log('Round complete! Starting next round...');

        return {
          ...state,
          players: finalPlayers,
          runeforges: filledRuneforges,
          centerPool: [],
          turnPhase: 'draft',
          round: state.round + 1,
          // multiply strain at end of round so it applies next round
          strain: state.strain * state.strainMultiplier,
          strainMultiplier: nextStrainMultiplier,
          scoringPhase: null,
          roundHistory,
          roundDamage: [0, 0],
          lockedPatternLines: {
            [state.players[0].id]: [],
            [state.players[1].id]: [],
          },
        };
      }

      return state;
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

  hydrateGameState: (nextState: GameState) => {
    set((state) => {
      const shouldMerge = nextState.matchType === 'solo' || state.matchType === nextState.matchType;
      if (!shouldMerge) {
        return state;
      }
      return {
        ...state,
        ...nextState,
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
});

export const useGameplayStore = create<GameplayStore>((set) => gameplayStoreConfig(set));

export function createGameplayStoreInstance() {
  return create<GameplayStore>((set) => gameplayStoreConfig(set));
}
