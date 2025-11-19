/**
 * Gameplay Store - Core game state and logic
 * Handles: runeforges, turns, runes, drafting, placement, scoring
 */

import { create } from 'zustand';
import type { GameState, RuneType, Player, Rune, VoidTarget } from '../../types/game';
import { initializeGame, fillFactories, createEmptyFactories } from '../../utils/gameInitialization';
import { calculateWallPower, calculateWallPowerWithSegments, getWallColumnForRune, calculateEffectiveFloorPenalty } from '../../utils/scoring';

// Helper function to count Life runes on a wall
function countLifeRunes(wall: Player['wall']): number {
  return wall.flat().filter(cell => cell.runeType === 'Life').length;
}

// Navigation callback registry for routing integration
let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null) {
  navigationCallback = callback;
}

interface GameplayStore extends GameState {
  // Actions
  startGame: (gameMode: 'classic' | 'standard') => void;
  returnToStartScreen: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType) => void;
  draftFromCenter: (runeType: RuneType) => void;
  placeRunes: (patternLineIndex: number) => void;
  placeRunesInFloor: () => void;
  cancelSelection: () => void;
  destroyRune: (target: VoidTarget) => void;
  skipVoidEffect: () => void;
  freezePatternLine: (playerId: string, patternLineIndex: number) => void;
  endRound: () => void;
  resetGame: () => void;
  processScoringStep: () => void;
}

export const useGameplayStore = create<GameplayStore>((set) => ({
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
      
      // Update runeforges (remove all runes from this runeforge)
      const updatedRuneforges = state.runeforges.map((f) =>
        f.id === runeforgeId ? { ...f, runes: [] } : f
      );
      
      // Move remaining runes to center pool
      const updatedCenterPool = [...state.centerPool, ...remainingRunes];
      
      return {
        ...state,
        runeforges: updatedRuneforges,
        centerPool: updatedCenterPool,
        selectedRunes: [...state.selectedRunes, ...selectedRunes],
        draftSource: { type: 'runeforge', runeforgeId, movedToCenter: remainingRunes },
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

      // Get all runes of selected type from center
      const selectedRunes = state.centerPool.filter((r: Rune) => r.runeType === runeType);
      const remainingRunes = state.centerPool.filter((r: Rune) => r.runeType !== runeType);
      
      // If no runes of this type, do nothing
      if (selectedRunes.length === 0) return state;
      
      return {
        ...state,
        centerPool: remainingRunes,
        selectedRunes: [...state.selectedRunes, ...selectedRunes],
        draftSource: { type: 'center' },
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
      const col = getWallColumnForRune(row, runeType);
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
          centerPool: [...state.centerPool, ...state.selectedRunes],
          selectedRunes: [],
          draftSource: null,
        };
      } else {
        // Return to runeforge (both selected runes and the ones moved to center)
        const runeforgeId = state.draftSource.runeforgeId;
        const movedToCenter = state.draftSource.movedToCenter;
        
        // Remove the moved runes from center pool
        const updatedCenterPool = state.centerPool.filter(
          (rune) => !movedToCenter.some((moved) => moved.id === rune.id)
        );
        
        const updatedRuneforges = state.runeforges.map((f) =>
          f.id === runeforgeId
            ? { ...f, runes: [...f.runes, ...state.selectedRunes, ...movedToCenter] }
            : f
        );
        
        return {
          ...state,
          runeforges: updatedRuneforges,
          centerPool: updatedCenterPool,
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
    set((state) => {
      console.log('End of round - starting scoring animation...');
      
      // Start scoring animation sequence
      return {
        ...state,
        scoringPhase: 'moving-to-wall' as const,
        shouldTriggerEndRound: false,
      };
    });
  },
  
  processScoringStep: () => {
    set((state) => {
      const currentPhase = state.scoringPhase;
      
      if (currentPhase === 'moving-to-wall') {
        console.log('Scoring: Moving runes to wall...');
        
        // Score both players - Move completed lines to wall
        const updatedPlayersArray = state.players.map((player) => {
        const updatedPatternLines = [...player.patternLines];
        const updatedWall = player.wall.map((row) => [...row]);
        
        // Process completed pattern lines - move runes to wall
        player.patternLines.forEach((line, lineIndex) => {
          if (line.count === line.tier && line.runeType) {
            // Line is complete - move one rune to wall
            const row = lineIndex;
            const col = getWallColumnForRune(row, line.runeType);
            
            // Place rune on wall
            updatedWall[row][col] = { runeType: line.runeType };
            
            console.log(`Player ${player.id}: Line ${lineIndex + 1} complete, placed ${line.runeType} at (${row},${col})`);
            
            // Clear the pattern line
            updatedPatternLines[lineIndex] = {
              tier: line.tier,
              runeType: null,
              count: 0,
            };
          }
        });
        
        // Calculate total wall power based on connected segments.
        // Use the player's original pattern lines (before we cleared completed lines)
        // so Wind runes that were on completed pattern lines still mitigate penalties.
        const floorPenaltyCount = calculateEffectiveFloorPenalty(player.floorLine.runes, player.patternLines, state.gameMode);
        
        const wallPower = calculateWallPower(updatedWall, floorPenaltyCount, state.gameMode);
        
        // Add wall power to existing score (minimum 0)
        const newHealth = player.health;

        console.log(`Player ${player.id}: Wall power ${wallPower} (with ${floorPenaltyCount} floor penalties), Health remains ${newHealth}`);

        return {
          ...player,
          patternLines: updatedPatternLines,
          wall: updatedWall,
          health: player.health,
          floorLine: player.floorLine,
        };
      });
      
      const updatedPlayers: [Player, Player] = [updatedPlayersArray[0], updatedPlayersArray[1]];
      
      return {
        ...state,
        players: updatedPlayers,
        scoringPhase: 'calculating-score' as const,
      };
    } else if (currentPhase === 'calculating-score') {
      console.log('Scoring: Calculating scores...');
      
      // Calculate and apply scores, and record round history
      
      // Calculate each player's wall power (damage they deal)
      // Calculate each player's effective floor penalty. Pattern lines in state
      // may already have been cleared; include Wind runes that are now on the
      // wall so completed pattern-line Wind runes still mitigate penalties.
      const baseP1Penalty = calculateEffectiveFloorPenalty(
        state.players[0].floorLine.runes,
        state.players[0].patternLines,
        state.gameMode
      );
      const baseP2Penalty = calculateEffectiveFloorPenalty(
        state.players[1].floorLine.runes,
        state.players[1].patternLines,
        state.gameMode
      );

      const p1WindOnWall = state.players[0].wall.flat().filter(cell => cell.runeType === 'Wind').length;
      const p2WindOnWall = state.players[1].wall.flat().filter(cell => cell.runeType === 'Wind').length;

      const player1FloorPenalty = Math.max(0, baseP1Penalty - p1WindOnWall);
      const player2FloorPenalty = Math.max(0, baseP2Penalty - p2WindOnWall);

      const player1Data = calculateWallPowerWithSegments(
        state.players[0].wall,
        player1FloorPenalty,
        state.gameMode
      );
      const player2Data = calculateWallPowerWithSegments(
        state.players[1].wall,
        player2FloorPenalty,
        state.gameMode
      );

      // Life Effect: Count Life runes and heal players by 10 HP per active Life rune (only in standard mode)
      const player1LifeCount = state.gameMode === 'standard' ? countLifeRunes(state.players[0].wall) : 0;
      const player2LifeCount = state.gameMode === 'standard' ? countLifeRunes(state.players[1].wall) : 0;
      
      const player1Healing = player1LifeCount * 10;
      const player2Healing = player2LifeCount * 10;

      // Apply healing from Life runes first (capped at player's maxHealth), then apply damage dealt by opponent
      const p1Max = state.players[0].maxHealth ?? state.players[0].health;
      const p2Max = state.players[1].maxHealth ?? state.players[1].health;

      const player1Healed = Math.min(state.players[0].health + player1Healing, p1Max);
      const player2Healed = Math.min(state.players[1].health + player2Healing, p2Max);

      const player1NewHealth = Math.max(0, player1Healed - player2Data.totalPower);
      const player2NewHealth = Math.max(0, player2Healed - player1Data.totalPower);

      const updatedPlayers: [Player, Player] = [
        { ...state.players[0], health: player1NewHealth },
        { ...state.players[1], health: player2NewHealth }
      ];

      const roundScore = {
        round: state.round,
        playerName: updatedPlayers[0].name,
        playerEssence: player1Data.essence,
        playerFocus: player1Data.focus,
        playerTotal: player1Data.totalPower,
        opponentName: updatedPlayers[1].name,
        opponentEssence: player2Data.essence,
        opponentFocus: player2Data.focus,
        opponentTotal: player2Data.totalPower,
      };

      return {
        ...state,
        players: updatedPlayers,
        roundHistory: [...state.roundHistory, roundScore],
        scoringPhase: 'clearing-floor' as const,
      };
    } else if (currentPhase === 'clearing-floor') {
      console.log('Scoring: Clearing floor lines...');
      
      // Clear floor lines
      const updatedPlayersArray = state.players.map((player) => ({
        ...player,
        floorLine: {
          ...player.floorLine,
          runes: [],
        },
      }));
      
      const updatedPlayers: [Player, Player] = [updatedPlayersArray[0], updatedPlayersArray[1]];
      
      return {
        ...state,
        players: updatedPlayers,
        scoringPhase: 'complete' as const,
      };
    } else if (currentPhase === 'complete') {
      console.log('Scoring: Complete, checking game over...');
      
      // Check if either player has run out of runes
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
        };
      }
      
      // Prepare for next round
      const emptyFactories = createEmptyFactories(state.players, 3);
      const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
        emptyFactories,
        {
          [state.players[0].id]: state.players[0].deck,
          [state.players[1].id]: state.players[1].deck,
        }
      );
      
      // Update player decks with remaining runes after filling runeforges
      const finalPlayers: [Player, Player] = [
        { ...state.players[0], deck: decksByPlayer[state.players[0].id] ?? [] },
        { ...state.players[1], deck: decksByPlayer[state.players[1].id] ?? [] }
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
      };
    }
    
    return state;
    });
  },
  
  startGame: (gameMode: 'classic' | 'standard') => {
    set((state) => ({
      ...state,
      gameStarted: true,
      gameMode: gameMode,
    }));
  },

  returnToStartScreen: () => {
    set({
      ...initializeGame(),
      gameStarted: false,
    });
    // Call navigation callback if registered (for router integration)
    if (navigationCallback) {
      navigationCallback();
    }
  },
  
  resetGame: () => {
    set(initializeGame());
  },
}));
