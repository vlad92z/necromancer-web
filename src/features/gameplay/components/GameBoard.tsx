/**
 * GameBoard component - main game board displaying factories, center, and player boards
 */

import type { GameState } from '../../../types/game';
import { Factory } from './Factory';
import { PlayerBoard } from './PlayerBoard';
import { RuneToken } from '../../../components/RuneToken';
import { useGameActions } from '../../../hooks/useGameActions';

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { players, factories, centerPool, currentPlayerIndex, selectedRunes, turnPhase } = gameState;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor } = useGameActions();
  
  const isDraftPhase = turnPhase === 'draft';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  const isGameOver = turnPhase === 'game-over';
  const currentPlayer = players[currentPlayerIndex];
  const isAITurn = currentPlayer.type === 'ai';
  
  // Determine winner
  const winner = isGameOver 
    ? players[0].score > players[1].score 
      ? players[0] 
      : players[1].score > players[0].score 
        ? players[1] 
        : null // Tie
    : null;
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Runesmith</h1>
          <div className="text-gray-400">
            Round {gameState.round} | {players[currentPlayerIndex].name}'s Turn
          </div>
        </div>
        
        {/* Player 1 */}
        <div className="mb-8">
          <PlayerBoard
            player={players[0]}
            isActive={currentPlayerIndex === 0}
            onPlaceRunes={currentPlayerIndex === 0 ? placeRunes : undefined}
            onPlaceRunesInFloor={currentPlayerIndex === 0 ? placeRunesInFloor : undefined}
            selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
            canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
          />
        </div>
        
        {/* Factories and Center */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">Factories</h2>
          <div className="flex justify-between items-center gap-6 mb-6 max-w-6xl mx-auto">
            {factories.map((factory) => (
              <Factory 
                key={factory.id} 
                factory={factory}
                onDraftRune={draftRune}
                disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
              />
            ))}
          </div>
          
          {/* Center Pool */}
          <div className="flex justify-center">
            <div className="
              bg-gray-800 
              rounded-xl 
              p-4 
              min-w-[200px] 
              min-h-[120px]
            ">
              <h3 className="text-sm font-semibold text-gray-300 mb-2 text-center">
                Center Pool
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {centerPool.length === 0 ? (
                  <div className="text-gray-500 text-sm">Empty</div>
                ) : (
                  centerPool.map((rune) => (
                    <button
                      key={rune.id}
                      onClick={() => draftFromCenter(rune.runeType)}
                      disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
                      className="
                        focus:outline-none 
                        focus:ring-2 
                        focus:ring-blue-500 
                        rounded-lg
                        disabled:cursor-not-allowed
                        hover:scale-110
                        transition-transform
                      "
                      aria-label={`Select ${rune.runeType} runes from center`}
                    >
                      <RuneToken rune={rune} size="small" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Selected Runes Display */}
        {hasSelectedRunes && (
          <div className="mb-8 flex justify-center">
            <div className="
              bg-blue-900/30 
              border-2 
              border-blue-500 
              rounded-xl 
              p-4
              max-w-xl
            ">
              <h3 className="text-sm font-semibold text-blue-300 mb-2 text-center">
                Selected Runes ({selectedRunes.length})
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedRunes.map((rune) => (
                  <RuneToken key={rune.id} rune={rune} size="small" />
                ))}
              </div>
              <div className="mt-3 text-center text-sm text-gray-300">
                Click a pattern line to place these runes
              </div>
            </div>
          </div>
        )}
        
        {/* Player 2 */}
        <div>
          <PlayerBoard
            player={players[1]}
            isActive={currentPlayerIndex === 1}
            onPlaceRunes={currentPlayerIndex === 1 ? placeRunes : undefined}
            onPlaceRunesInFloor={currentPlayerIndex === 1 ? placeRunesInFloor : undefined}
            selectedRuneType={currentPlayerIndex === 1 ? selectedRuneType : null}
            canPlace={currentPlayerIndex === 1 && hasSelectedRunes}
          />
        </div>
        
        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border-4 border-yellow-500 shadow-2xl">
              <h2 className="text-4xl font-bold text-center mb-6 text-yellow-400">
                Game Over!
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className={`p-4 rounded-lg ${players[0].score >= players[1].score ? 'bg-green-900/50 border-2 border-green-500' : 'bg-gray-700'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{players[0].name}</span>
                    <span className="text-2xl font-bold">{players[0].score}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Runes remaining: {players[0].deck.length}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${players[1].score >= players[0].score ? 'bg-green-900/50 border-2 border-green-500' : 'bg-gray-700'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{players[1].name}</span>
                    <span className="text-2xl font-bold">{players[1].score}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Runes remaining: {players[1].deck.length}
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-6">
                {winner ? (
                  <div className="text-2xl font-bold text-yellow-400">
                    🏆 {winner.name} Wins! 🏆
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-blue-400">
                    It's a Tie!
                  </div>
                )}
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="
                  w-full 
                  bg-blue-600 
                  hover:bg-blue-700 
                  text-white 
                  font-bold 
                  py-3 
                  px-6 
                  rounded-lg
                  transition-colors
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              >
                New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
