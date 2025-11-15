/**
 * GameBoard component - main game board displaying factories, center, and player boards
 */

import type { GameState } from '../types/game';
import { Factory } from './Factory';
import { PlayerBoard } from './PlayerBoard';
import { RuneToken } from './RuneToken';

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { players, factories, centerPool, currentPlayerIndex } = gameState;
  
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
              <Factory key={factory.id} factory={factory} />
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
                    <RuneToken key={rune.id} rune={rune} size="small" />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
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
