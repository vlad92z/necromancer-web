/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, RuneType, Player, Rune, VoidTarget, AIDifficulty, QuickPlayOpponent, PlayerControllers, ScoringSnapshot, WallPowerStats } from '../../types/game';
import { initializeGame, fillFactories, createEmptyFactories } from '../../utils/gameInitialization';
import { calculateWallPowerWithSegments, getWallColumnForRune, calculateEffectiveFloorPenalty } from '../../utils/scoring';
import { getAIDifficultyLabel } from '../../utils/aiDifficultyLabels';

// Helper function to count Life runes on a wall
function countLifeRunes(wall: Player['wall']): number {
  return wall.flat().filter(cell => cell.runeType === 'Life').length;
}

function getAIDisplayName(baseName: string, difficulty: AIDifficulty): string {
  return `${baseName} (${getAIDifficultyLabel(difficulty)})`;
}

// Navigation callback registry for routing integration
let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null) {
  navigationCallback = callback;
}

export interface GameplayStore extends GameState {
  // Actions
  startGame: (gameMode: 'classic' | 'standard', topController: QuickPlayOpponent, runeTypeCount: import('../../types/game').RuneTypeCount) => void;
  startSpectatorMatch: (topDifficulty: AIDifficulty, bottomDifficulty: AIDifficulty) => void;
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
  processScoringStep: () => void;
}

export const gameplayStoreConfig = (set: StoreApi<GameplayStore>['setState']): GameplayStore => ({
  // Initial state
  ...initializeGame(),
  
  // Actions
  draftRune: (runeforgeId: string, runeType: RuneType) => {
    set((state) => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      // Find the runeforge
      const runeforge = state.runeforges.find((f) => f.id === runeforgeId);
      if (!runeforge) return state;

      const ownsRuneforge = runeforge.ownerId === currentPlayer.id;
      const playerRuneforges = state.runeforges.filter((f) => f.ownerId === currentPlayer.id);
      const hasAccessibleRuneforges = playerRuneforges.some(
        (f) => f.runes.length > 0
      );
      const centerIsEmpty = state.centerPool.length === 0;
      const canDraftOpponentRuneforge = !ownsRuneforge && !hasAccessibleRuneforges && centerIsEmpty;

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
      
      // Update pattern line
      const updatedPatternLines = [...currentPlayer.patternLines];
      updatedPatternLines[patternLineIndex] = {
        ...patternLine,
        runeType,
        count: patternLine.count + runesToPlace,
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
      const hasVoidRunes = selectedRunes.some(rune => rune.runeType === 'Void');
      const hasVoidTargets = state.runeforges.some(f => f.runes.length > 0) || state.centerPool.length > 0;
      
      // Check if Frost runes were placed (Frost effect: freeze an opponent pattern line)
      const hasFrostRunes = selectedRunes.some(rune => rune.runeType === 'Frost');
      const opponentIndex = currentPlayerIndex === 0 ? 1 : 0;
      const opponentId = state.players[opponentIndex].id;
      const opponentPatternLines = state.players[opponentIndex].patternLines;
      const frozenOpponentLines = state.frozenPatternLines[opponentId] ?? [];
      const canTriggerFrostEffect = opponentPatternLines.some(
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
      const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
      
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
      const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
      
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

      const nextPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;

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
      const nextPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
      
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
      
      const nextPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
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
              updatedWall[row][col] = { runeType: line.runeType };
              console.log(`Player ${player.id}: Line ${lineIndex + 1} complete, placed ${line.runeType} at (${row},${col})`);
              updatedPatternLines[lineIndex] = {
                tier: line.tier,
                runeType: null,
                count: 0,
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

        const wallPowerStats: [WallPowerStats, WallPowerStats] = [
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

        const lifeCounts: [number, number] = [
          state.gameMode === 'standard' ? countLifeRunes(updatedPlayersArray[0].wall) : 0,
          state.gameMode === 'standard' ? countLifeRunes(updatedPlayersArray[1].wall) : 0,
        ];

        const scoringSnapshot: ScoringSnapshot = {
          floorPenalties,
          wallPowerStats,
          lifeCounts,
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

        const healingAmounts: [number, number] = [
          state.scoringSnapshot.lifeCounts[0] * 10,
          state.scoringSnapshot.lifeCounts[1] * 10,
        ];

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

        const player1HasEnough = state.players[0].deck.length >= 10;
        const player2HasEnough = state.players[1].deck.length >= 10;

        if (!player1HasEnough || !player2HasEnough) {
          console.log('Game over! A player has run out of runes.');
          console.log(`Player 1 runes: ${state.players[0].deck.length}, Player 2 runes: ${state.players[1].deck.length}`);

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

        const emptyFactories = createEmptyFactories(state.players, 3);
        const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
          emptyFactories,
          {
            [state.players[0].id]: state.players[0].deck,
            [state.players[1].id]: state.players[1].deck,
          }
        );

        const finalPlayers: [Player, Player] = [
          { ...state.players[0], deck: decksByPlayer[state.players[0].id] ?? [] },
          { ...state.players[1], deck: decksByPlayer[state.players[1].id] ?? [] },
        ];

        console.log('Round complete! Starting next round...');

        return {
          ...state,
          players: finalPlayers,
          runeforges: filledRuneforges,
          centerPool: [],
          turnPhase: 'draft',
          round: state.round + 1,
          scoringPhase: null,
          scoringSnapshot: null,
        };
      }

      return state;
    });
  },
  
  startGame: (gameMode: 'classic' | 'standard', topController: QuickPlayOpponent, runeTypeCount: import('../../types/game').RuneTypeCount) => {
    set((state) => {
      // If rune type count changed, reinitialize the game with new configuration
      if (state.runeTypeCount !== runeTypeCount) {
        const newState = initializeGame(300, runeTypeCount);
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
          gameMode: gameMode,
          runeTypeCount: runeTypeCount,
          playerControllers: updatedControllers,
          players: updatedPlayers,
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
        gameMode: gameMode,
        runeTypeCount: runeTypeCount,
        playerControllers: updatedControllers,
        players: updatedPlayers,
      };
    });
  },

  startSpectatorMatch: (topDifficulty: AIDifficulty, bottomDifficulty: AIDifficulty) => {
    set((state) => {
      const playerControllers: PlayerControllers = {
        bottom: { type: 'computer', difficulty: bottomDifficulty },
        top: { type: 'computer', difficulty: topDifficulty },
      };

      const updatedPlayers: [Player, Player] = [
        {
          ...state.players[0],
          type: 'computer',
          name: getAIDisplayName('Bottom AI', bottomDifficulty),
        },
        {
          ...state.players[1],
          type: 'computer',
          name: getAIDisplayName('Top AI', topDifficulty),
        },
      ];

      return {
        ...state,
        gameStarted: true,
        gameMode: 'standard' as const,
        players: updatedPlayers,
        playerControllers,
      };
    });
  },

  returnToStartScreen: () => {
    set((state) => ({
      ...initializeGame(300, state.runeTypeCount),
      gameStarted: false,
    }));
    // Call navigation callback if registered (for router integration)
    if (navigationCallback) {
      navigationCallback();
    }
  },
  
  resetGame: () => {
    set((state) => initializeGame(300, state.runeTypeCount));
  },
});

export const useGameplayStore = create<GameplayStore>((set) => gameplayStoreConfig(set));

export function createGameplayStoreInstance() {
  return create<GameplayStore>((set) => gameplayStoreConfig(set));
}
