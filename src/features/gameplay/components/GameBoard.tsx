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
  const { draftRune, draftFromCenter } = useGameActions();
  
  const isDraftPhase = turnPhase === 'draft';
  const hasSelectedRunes = selectedRunes.length > 0;
  
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
        
        {/* Factories and Center */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">Factories</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {factories.map((factory) => (
              <Factory 
                key={factory.id} 
                factory={factory}
                onDraftRune={draftRune}
                disabled={!isDraftPhase || hasSelectedRunes}
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
                      disabled={!isDraftPhase || hasSelectedRunes}
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
        
        {/* Players */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {players.map((player, index) => (
            <PlayerBoard
              key={player.id}
              player={player}
              isActive={index === currentPlayerIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
