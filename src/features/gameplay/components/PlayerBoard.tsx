/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import { motion } from 'framer-motion';
import type { Player, RuneType } from '../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { FloorLine } from './FloorLine';
import { Spellpower } from './Spellpower';
import { calculateProjectedPower, calculateEffectiveFloorPenalty } from '../../../utils/scoring';

interface PlayerBoardProps {
  player: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  gameMode: 'classic' | 'standard';
  nameColor: string;
  onShowDeck: () => void;
  onShowLog: () => void;
  onShowRules: () => void;
}

export function PlayerBoard({ player, isActive, onPlaceRunes, onPlaceRunesInFloor, selectedRuneType, canPlace, onCancelSelection, gameMode, nameColor, onShowDeck, onShowLog, onShowRules}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };

  const currentHealth = player.health;

  // Find completed pattern lines
  const completedPatternLines = player.patternLines
    .map((line, index) => ({ line, row: index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null)
    .map(({ line, row }) => ({ row, runeType: line.runeType! }));
  
  // Wind Effect: Wind runes in incomplete pattern lines mitigate floor penalties (standard mode only)
  const floorPenaltyCount = calculateEffectiveFloorPenalty(player.floorLine.runes, player.patternLines, gameMode);
  const windRuneCount = gameMode === 'standard'
    ? player.patternLines.reduce((total, line) => {
        if (line.runeType !== 'Wind') {
          return total;
        }

        const isLineIncomplete = line.count < line.tier;
        return isLineIncomplete ? total + line.count : total;
      }, 0)
    : 0;
  const hasWindMitigation = gameMode === 'standard' && windRuneCount > 0;
 
  const { essence, focus, totalPower } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount,
    gameMode
  );
  const hasPenalty = floorPenaltyCount > 0;
  
  // Count Fire runes: current wall + completed pattern lines (only in standard mode)
  const fireRunesOnWall = gameMode === 'standard' 
    ? player.wall.flat().filter(cell => cell.runeType === 'Fire').length 
    : 0;
  const fireRunesInCompletedLines = gameMode === 'standard'
    ? completedPatternLines.filter(line => line.runeType === 'Fire').length
    : 0;
  const fireRuneCount = fireRunesOnWall + fireRunesInCompletedLines;

  return (
    <div
      onClick={handleBoardClick}
      style={{
        padding: '4px',
        borderRadius: '8px',
        border: isActive ? '2px solid rgba(59, 130, 246, 0.5)' : '2px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
        {/* Floor Line - Left side */}
        <div style={{ 
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingRight: '16px'
        }} onClick={(e) => e.stopPropagation()}>
          <FloorLine 
            floorLine={player.floorLine}
            onPlaceRunesInFloor={onPlaceRunesInFloor}
            canPlace={canPlace}
            mitigatedSlots={windRuneCount}
          />
        </div>
        
        {/* Pattern Lines */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <PatternLines 
            patternLines={player.patternLines}
            wall={player.wall}
            onPlaceRunes={onPlaceRunes}
            selectedRuneType={selectedRuneType}
            canPlace={canPlace}
          />
        </div>
        
        {/* Wall */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoringWall wall={player.wall} patternLines={player.patternLines} />
        </div>
        
        {/* Right side - Player Info and RuneScore */}
        <div style={{ 
          flex: '0 0 240px',
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Player Name and Health */}
          <div style={{
            backgroundColor: 'rgba(191, 219, 254, 0.3)',
            border: '2px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '18px',
              color: nameColor,
              fontWeight: 'bold'
            }}>
              {player.name}
            </div>
            <motion.div
              key={currentHealth}
              initial={{ scale: 1.5, color: '#dc2626' }}
              animate={{ scale: 1, color: '#ea580c' }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
              style={{ 
                color: '#ea580c',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              ❤️ {currentHealth}
            </motion.div>
          </div>
          
          {/* RuneScore Stats */}
          <Spellpower
            essence={essence}
            focus={focus}
            totalPower={totalPower}
            fireRuneCount={fireRuneCount}
            hasPenalty={hasPenalty}
            hasWindMitigation={hasWindMitigation}
            windRuneCount={windRuneCount}
            onShowDeck={onShowDeck}
            onShowLog={onShowLog}
            onShowRules={onShowRules}
          />
        </div>
      </div>
    </div>
  );
}
