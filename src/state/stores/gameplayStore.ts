/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, VoidTarget, AIDifficulty, QuickPlayOpponent, PlayerControllers, ScoringSnapshot, WallPowerStats, MatchType, SoloOutcome, PassiveRuneEffect } from '../../types/game';
import { initializeGame, fillFactories, createEmptyFactories, initializeSoloGame, createSoloFactories, DEFAULT_STARTING_STRAIN, DEFAULT_STRAIN_MULTIPLIER } from '../../utils/gameInitialization';
import { calculateWallPowerWithSegments, getWallColumnForRune, calculateEffectiveFloorPenalty, applyStressMitigation } from '../../utils/scoring';
import { getAIDifficultyLabel } from '../../utils/aiDifficultyLabels';
import { copyRuneEffects, getPassiveEffectValue, getRuneEffectsForType, hasActiveEffect } from '../../utils/runeEffects';

// Helper function to count Life runes on a wall
function calculateHealingAmount(wall: Player['wall']): number {
  return wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'Healing'), 0);
}

function calculatePassiveEffectForWall(
  wall: Player['wall'],
  effectType: PassiveRuneEffect['type']
): number {
  return wall.flat().reduce(
    (total, cell) => total + getPassiveEffectValue(cell.effects, effectType),
    0
  );
}

function calculateVoidDamageBonus(
  wall: Player['wall'],
  projectedDamageTaken: number,
  gameMode: GameState['gameMode']
): number {
  if (gameMode === 'classic') {
    return 0;
  }
  const conversionRate = calculatePassiveEffectForWall(wall, 'DamageToSpellpower');
  return projectedDamageTaken * conversionRate;
}

function calculateNextStrainMultiplier(
  _players: [Player, Player],
  _gameMode: GameState['gameMode'],
  baseMultiplier: number
): number {
  return baseMultiplier;
}

function getAIDisplayName(baseName: string, difficulty: AIDifficulty): string {
  return `${baseName} (${getAIDifficultyLabel(difficulty)})`;
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
  startGame: (gameMode: 'classic' | 'standard', topController: QuickPlayOpponent, runeTypeCount: import('../../types/game').RuneTypeCount) => void;
  startSpectatorMatch: (topDifficulty: AIDifficulty, bottomDifficulty: AIDifficulty) => void;
  startSoloRun: (runeTypeCount: import('../../types/game').RuneTypeCount) => void;
  prepareSoloMode: (runeTypeCount?: import('../../types/game').RuneTypeCount) => void;
  returnToStartScreen: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType) => void;
  draftFromCenter: (runeType: RuneType) => void;
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

  const emptyWallStats: WallPowerStats = { essence: 0, focus: 0, totalPower: 0 };

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

    const floorPenalty = calculateEffectiveFloorPenalty(
      updatedPlayer.floorLine.runes,
      updatedPlayer.patternLines,
      updatedPlayer.wall,
      state.gameMode
    );

    const wallPowerStats = calculateWallPowerWithSegments(
      updatedPlayer.wall,
      floorPenalty,
      state.gameMode
    );
    const projectedDamageTaken = floorPenalty * state.strain;
    const voidBonus = calculateVoidDamageBonus(updatedPlayer.wall, projectedDamageTaken, state.gameMode);
    const adjustedWallPowerStats: WallPowerStats = {
      ...wallPowerStats,
      totalPower: wallPowerStats.totalPower + voidBonus,
    };

    const healingTotal = state.gameMode === 'standard' ? calculateHealingAmount(updatedPlayer.wall) : 0;

    const scoringSnapshot: ScoringSnapshot = {
      floorPenalties: [floorPenalty, 0],
      wallPowerStats: [adjustedWallPowerStats, emptyWallStats],
      healingTotals: [healingTotal, 0],
    };

    return {
      ...state,
      players: [updatedPlayer, state.players[1]],
      scoringPhase: 'clearing-floor' as const,
      scoringSnapshot,
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
      scoringPhase: 'healing' as const,
    };
  }

  if (currentPhase === 'healing') {
    if (!state.scoringSnapshot) {
      return state;
    }

    const healingAmount = state.scoringSnapshot.healingTotals[0];
    const applyHealing = (player: Player, amount: number): Player => {
      const maxHealth = player.maxHealth ?? player.health;
      return {
        ...player,
        health: Math.min(maxHealth, player.health + amount),
      };
    };

    const healedPlayers: [Player, Player] = [
      applyHealing(state.players[0], healingAmount),
      state.players[1],
    ];

    return {
      ...state,
      players: healedPlayers,
      scoringPhase: 'damage' as const,
    };
  }

  if (currentPhase === 'damage') {
    if (!state.scoringSnapshot) {
      return state;
    }

    const snapshot = state.scoringSnapshot;
    const overloadValue = snapshot.floorPenalties[0];
    const frostMitigation = state.gameMode === 'standard'
      ? calculatePassiveEffectForWall(state.players[0].wall, 'StrainMitigation')
      : 0;
    const overloadMultiplier = applyStressMitigation(state.strain, frostMitigation);
    const overloadDamage = overloadValue * overloadMultiplier;

    const updatedPlayer: Player = {
      ...state.players[0],
      health: Math.max(0, state.players[0].health - overloadDamage),
    };

    const roundScore = {
      round: state.round,
      playerName: updatedPlayer.name,
      playerEssence: snapshot.wallPowerStats[0].essence,
      playerFocus: snapshot.wallPowerStats[0].focus,
      playerTotal: snapshot.wallPowerStats[0].totalPower,
      opponentName: 'Overload',
      opponentEssence: overloadValue,
      opponentFocus: overloadMultiplier,
      opponentTotal: overloadDamage,
    };

    const runePowerTotal = state.runePowerTotal + snapshot.wallPowerStats[0].totalPower;
    const playerDefeated = updatedPlayer.health === 0;
    if (playerDefeated) {
      return {
        ...state,
        players: [updatedPlayer, state.players[1]],
        roundHistory: [...state.roundHistory, roundScore],
        runePowerTotal,
        scoringPhase: null,
        scoringSnapshot: null,
        runeforges: [],
        centerPool: [],
        turnPhase: 'game-over',
        shouldTriggerEndRound: false,
        soloOutcome: 'defeat' as SoloOutcome,
      };
    }

    return {
      ...state,
      players: [updatedPlayer, state.players[1]],
      roundHistory: [...state.roundHistory, roundScore],
      runePowerTotal,
      scoringPhase: 'complete' as const,
      scoringSnapshot: null,
    };
  }

  if (currentPhase === 'complete') {
    const runesNeededForRound = state.factoriesPerPlayer * state.runesPerRuneforge;
    const playerHasEnough = state.players[0].deck.length >= runesNeededForRound;

    if (!playerHasEnough) {
      return {
        ...state,
        runeforges: [],
        centerPool: [],
        turnPhase: 'game-over',
        round: state.round,
        scoringPhase: null,
        scoringSnapshot: null,
        soloOutcome: 'victory' as SoloOutcome,
        shouldTriggerEndRound: false,
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
      state.gameMode,
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
      scoringSnapshot: null,
      soloOutcome: null,
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
  draftRune: (runeforgeId: string, runeType: RuneType) => {
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
      
      // Capture original order before clearing for display restoration
      const originalRunes = runeforge.runes;

      // Update runeforges (remove all runes from this runeforge)
      const updatedRuneforges = state.runeforges.map((f) =>
        f.id === runeforgeId ? { ...f, runes: [] } : f
      );
      
      return {
        ...state,
        runeforges: updatedRuneforges,
        selectedRunes: [...state.selectedRunes, ...selectedRunes],
        draftSource: { type: 'runeforge', runeforgeId, movedToCenter: remainingRunes, originalRunes },
      };
    });
  },
  
  draftFromCenter: (runeType: RuneType) => {
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
      
      return {
        ...state,
        centerPool: remainingRunes,
        selectedRunes: [...state.selectedRunes, ...selectedRunes],
        draftSource: { type: 'center', originalRunes: originalCenterRunes },
      };
    });
  },
  
  placeRunes: (patternLineIndex: number) => {
    set((state) => {
      const { selectedRunes, currentPlayerIndex } = state;
      const isSoloMode = state.matchType === 'solo';
      
      // No runes selected, do nothing
      if (selectedRunes.length === 0) return state;
      
      const currentPlayer = state.players[currentPlayerIndex];
      const patternLine = currentPlayer.patternLines[patternLineIndex];
      if (!patternLine) {
        return state;
      }
      const frozenLinesForPlayer = state.frozenPatternLines[currentPlayer.id] ?? [];
      if (frozenLinesForPlayer.includes(patternLineIndex)) {
        console.log(`Pattern line ${patternLineIndex + 1} is frozen - cannot place runes`);
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
      
      // Update player
      const updatedPlayers: [typeof currentPlayer, typeof currentPlayer] = [
        ...state.players,
      ] as [typeof currentPlayer, typeof currentPlayer];
      
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        patternLines: updatedPatternLines,
        floorLine: updatedFloorLine,
      };
      
      // Clear any frozen lines affecting this player after they complete placement
      const updatedFrozenPatternLines = {
        ...state.frozenPatternLines,
        [currentPlayer.id]: [],
      };
      const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
      const nextCenterPool = movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
      
      // Check if Void runes were placed (Void effect: destroy a single rune)
      const hasVoidRunes = selectedRunes.some((rune) => hasActiveEffect(rune.effects, 'DestroyRune'));
      const hasVoidTargets = state.runeforges.some(f => f.runes.length > 0) || state.centerPool.length > 0;
      
      // Check if Frost runes were placed (Frost effect: freeze an opponent pattern line)
      const hasFrostRunes = !isSoloMode && selectedRunes.some((rune) => hasActiveEffect(rune.effects, 'FreezePatternLine'));
      const opponentIndex = currentPlayerIndex === 0 ? 1 : 0;
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
      
      // Only trigger rune effects in standard mode
      const isStandardMode = state.gameMode === 'standard';
      
      // If Void runes were placed and there are available targets, trigger Void effect
      // Keep current player so THEY get to choose which rune to destroy
      if (isStandardMode && hasVoidRunes && hasVoidTargets && !shouldEndRound) {
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
        };
      }
      
      // If Frost runes were placed and there are non-empty runeforges, trigger Frost effect
      // Keep current player so THEY get to choose which runeforge to freeze
      if (isStandardMode && hasFrostRunes && canTriggerFrostEffect && !shouldEndRound) {
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
      };
    });
  },
  
  placeRunesInFloor: () => {
    set((state) => {
      const { selectedRunes, currentPlayerIndex } = state;
      const isSoloMode = state.matchType === 'solo';
      
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
      
      // Update player
      const updatedPlayers: [typeof currentPlayer, typeof currentPlayer] = [
        ...state.players,
      ] as [typeof currentPlayer, typeof currentPlayer];
      
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        floorLine: updatedFloorLine,
      };
      
      const movedToCenter = state.draftSource?.type === 'runeforge' ? state.draftSource.movedToCenter : [];
      const nextCenterPool = movedToCenter.length > 0 ? [...state.centerPool, ...movedToCenter] : state.centerPool;
      // Switch to next player (alternate between 0 and 1)
      const nextPlayerIndex = isSoloMode ? currentPlayerIndex : currentPlayerIndex === 0 ? 1 : 0;
      
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
      scoringSnapshot: null,
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

        const floorPenalties: [number, number] = [
          calculateEffectiveFloorPenalty(
            updatedPlayersArray[0].floorLine.runes,
            updatedPlayersArray[0].patternLines,
            updatedPlayersArray[0].wall,
            state.gameMode
          ),
          calculateEffectiveFloorPenalty(
            updatedPlayersArray[1].floorLine.runes,
            updatedPlayersArray[1].patternLines,
            updatedPlayersArray[1].wall,
            state.gameMode
          ),
        ];

        const baseWallPowerStats: [WallPowerStats, WallPowerStats] = [
          calculateWallPowerWithSegments(
            updatedPlayersArray[0].wall,
            floorPenalties[0],
            state.gameMode
          ),
          calculateWallPowerWithSegments(
            updatedPlayersArray[1].wall,
            floorPenalties[1],
            state.gameMode
          ),
        ];
        const projectedDamageTaken: [number, number] = [
          baseWallPowerStats[1].totalPower,
          baseWallPowerStats[0].totalPower,
        ];
        const voidBonuses: [number, number] = [
          calculateVoidDamageBonus(updatedPlayersArray[0].wall, projectedDamageTaken[0], state.gameMode),
          calculateVoidDamageBonus(updatedPlayersArray[1].wall, projectedDamageTaken[1], state.gameMode),
        ];
        const wallPowerStats: [WallPowerStats, WallPowerStats] = [
          {
            ...baseWallPowerStats[0],
            totalPower: baseWallPowerStats[0].totalPower + voidBonuses[0],
          },
          {
            ...baseWallPowerStats[1],
            totalPower: baseWallPowerStats[1].totalPower + voidBonuses[1],
          },
        ];

        const healingTotals: [number, number] = [
          state.gameMode === 'standard' ? calculateHealingAmount(updatedPlayersArray[0].wall) : 0,
          state.gameMode === 'standard' ? calculateHealingAmount(updatedPlayersArray[1].wall) : 0,
        ];

        const scoringSnapshot: ScoringSnapshot = {
          floorPenalties,
          wallPowerStats,
          healingTotals,
        };

        return {
          ...state,
          players: updatedPlayersArray,
          scoringPhase: 'clearing-floor' as const,
          scoringSnapshot,
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
          scoringPhase: 'healing' as const,
        };
      }

      if (currentPhase === 'healing') {
        if (!state.scoringSnapshot) {
          return state;
        }

        const healingAmounts: [number, number] = state.scoringSnapshot.healingTotals;

        const applyHealing = (player: Player, amount: number): Player => {
          const maxHealth = player.maxHealth ?? player.health;
          return {
            ...player,
            health: Math.min(maxHealth, player.health + amount),
          };
        };

        const healedPlayers: [Player, Player] = [
          applyHealing(state.players[0], healingAmounts[0]),
          applyHealing(state.players[1], healingAmounts[1]),
        ];

        console.log('Scoring: Applied healing stage', healingAmounts);

        return {
          ...state,
          players: healedPlayers,
          scoringPhase: 'damage' as const,
        };
      }

      if (currentPhase === 'damage') {
        if (!state.scoringSnapshot) {
          return state;
        }

        const snapshot = state.scoringSnapshot;
        const updatedPlayers: [Player, Player] = [
          {
            ...state.players[0],
            health: Math.max(
              0,
              state.players[0].health - snapshot.wallPowerStats[1].totalPower
            ),
          },
          {
            ...state.players[1],
            health: Math.max(
              0,
              state.players[1].health - snapshot.wallPowerStats[0].totalPower
            ),
          },
        ];

        const roundScore = {
          round: state.round,
          playerName: updatedPlayers[0].name,
          playerEssence: snapshot.wallPowerStats[0].essence,
          playerFocus: snapshot.wallPowerStats[0].focus,
          playerTotal: snapshot.wallPowerStats[0].totalPower,
          opponentName: updatedPlayers[1].name,
          opponentEssence: snapshot.wallPowerStats[1].essence,
          opponentFocus: snapshot.wallPowerStats[1].focus,
          opponentTotal: snapshot.wallPowerStats[1].totalPower,
        };

        const eitherPlayerDead = updatedPlayers.some((player) => player.health === 0);
        if (eitherPlayerDead) {
          console.log('Game over! A player reached 0 health at end of round.');
          return {
            ...state,
            players: updatedPlayers,
            roundHistory: [...state.roundHistory, roundScore],
            scoringPhase: null,
            scoringSnapshot: null,
            runeforges: [],
            centerPool: [],
            turnPhase: 'game-over',
            shouldTriggerEndRound: false,
          };
        }

        return {
          ...state,
          players: updatedPlayers,
          roundHistory: [...state.roundHistory, roundScore],
          scoringPhase: 'complete' as const,
          scoringSnapshot: null,
        };
      }

      if (currentPhase === 'complete') {
        console.log('Scoring: Complete, checking game over...');
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
            scoringSnapshot: null,
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
          state.gameMode,
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
          scoringSnapshot: null,
        };
      }

      return state;
    });
  },
  
  startGame: (gameMode: 'classic' | 'standard', topController: QuickPlayOpponent, runeTypeCount: import('../../types/game').RuneTypeCount) => {
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
          gameMode: gameMode,
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
        gameMode: gameMode,
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
        gameMode: 'standard' as const,
        players: updatedPlayers,
        playerControllers,
        runePowerTotal: 0,
        soloOutcome: null,
        strain: DEFAULT_STARTING_STRAIN,
        strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
      };
    });
  },

  startSoloRun: (runeTypeCount: import('../../types/game').RuneTypeCount) => {
    set(() => {
      const baseState = initializeSoloGame(runeTypeCount);
      return {
        ...baseState,
        gameStarted: true,
        strain: DEFAULT_STARTING_STRAIN,
        strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
      };
    });
  },

  prepareSoloMode: (runeTypeCount?: import('../../types/game').RuneTypeCount) => {
    set((state) => {
      const targetRuneTypeCount = runeTypeCount ?? state.runeTypeCount;
      return {
        ...initializeSoloGame(targetRuneTypeCount),
        strain: DEFAULT_STARTING_STRAIN,
        strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
        gameStarted: false,
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
