/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player } from '../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { RuneToken } from '../../../components/RuneToken';

interface PlayerBoardProps {
  player: Player;
  isActive: boolean;
}

export function PlayerBoard({ player, isActive }: PlayerBoardProps) {
  return (
    <div
      className={`
        p-4 
        rounded-lg 
        border-2 
        ${isActive ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}
      `}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{player.name}</h3>
        <div className="text-sm text-gray-400">Score: {player.score}</div>
      </div>
      
      <div className="flex gap-6 justify-between w-full">
        {/* Pattern Lines */}
        <div className="flex-1 flex flex-col items-center">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Pattern Lines</h4>
          <PatternLines patternLines={player.patternLines} />
        </div>
        
        {/* Wall */}
        <div className="flex-1 flex flex-col items-center">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Scoring Wall</h4>
          <ScoringWall wall={player.wall} />
        </div>
      </div>
      
      {/* Floor Line */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Floor Line (Penalties)</h4>
        <div className="flex gap-2">
          {Array(player.floorLine.maxCapacity)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                style={{ width: '40px', height: '40px' }}
                className="
                  border-2 
                  border-red-900 
                  rounded-lg 
                  flex 
                  items-center 
                  justify-center 
                  bg-gray-800
                "
              >
                {player.floorLine.runes[index] ? (
                  <RuneToken rune={player.floorLine.runes[index]} size="small" />
                ) : (
                  <div className="text-red-900 text-xs">-{index + 1}</div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
