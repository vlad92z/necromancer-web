/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

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
  frozenPatternLines?: number[];
  freezeSelectionEnabled?: boolean;
  onFreezePatternLine?: (patternLineIndex: number) => void;
  onShowDeck: () => void;
  onShowLog: () => void;
  onShowRules: () => void;
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
}

export function PlayerBoard({ player, isActive, onPlaceRunes, onPlaceRunesInFloor, selectedRuneType, canPlace, onCancelSelection, gameMode, nameColor, frozenPatternLines = [], freezeSelectionEnabled = false, onFreezePatternLine, onShowDeck, onShowLog, onShowRules, hiddenSlotKeys, hiddenFloorSlotIndexes }: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };

  // Find completed pattern lines
  const completedPatternLines = player.patternLines
    .map((line, index) => ({ line, row: index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null)
    .map(({ line, row }) => ({ row, runeType: line.runeType! }));

  const currentHealth = player.health;
  const lifeRunesOnWall = gameMode === 'standard'
    ? player.wall.flat().filter((cell) => cell.runeType === 'Life').length
    : 0;
  const lifeRunesInCompletedLines = gameMode === 'standard'
    ? completedPatternLines.filter((line) => line.runeType === 'Life').length
    : 0;
  const healingAmount = (lifeRunesOnWall + lifeRunesInCompletedLines) * 10;
  
  // Wind Effect: Wind runes in pattern lines mitigate floor penalties (standard mode only)
  const floorPenaltyCount = calculateEffectiveFloorPenalty(player.floorLine.runes, player.patternLines, gameMode);
  const windRuneCount = gameMode === 'standard'
    ? player.patternLines.reduce((total, line) => (
        line.runeType === 'Wind' ? total + line.count : total
      ), 0)
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

  const detailPanelWidth = 'clamp(320px, 30vmin, 420px)';

  return (
    <div
      onClick={handleBoardClick}
      style={{
        width: '100%',
        height: '100%',
        padding: 'min(1.2vmin, 16px)',
        borderRadius: '28px',
        background: 'rgba(14, 6, 32, 0.92)',
        boxShadow: '0 10px 40px rgba(3, 0, 18, 0.65)',
        transition: 'box-shadow 0.2s ease'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'stretch', 
        justifyContent: 'space-between', 
        gap: 'min(1.5vmin, 18px)',
        width: '100%',
        height: '100%'
      }}>
        {/* Floor Line - Left side */}
        <div onClick={(e) => e.stopPropagation()}>
          <FloorLine 
            floorLine={player.floorLine}
            onPlaceRunesInFloor={onPlaceRunesInFloor}
            canPlace={canPlace}
            mitigatedSlots={windRuneCount}
            playerId={player.id}
            hiddenSlotIndexes={hiddenFloorSlotIndexes}
          />
        </div>
        
        {/* Pattern Lines */}
        <div onClick={(e) => e.stopPropagation()}>
          <PatternLines 
            patternLines={player.patternLines}
            wall={player.wall}
            onPlaceRunes={onPlaceRunes}
            selectedRuneType={selectedRuneType}
            canPlace={canPlace}
            frozenLineIndexes={frozenPatternLines}
            freezeSelectionEnabled={freezeSelectionEnabled}
            onFreezeLine={onFreezePatternLine}
            playerId={player.id}
            hiddenSlotKeys={hiddenSlotKeys}
          />
        </div>
        
        {/* Wall */}
        <ScoringWall wall={player.wall} patternLines={player.patternLines} />
        
        {/* Right side - Player Info and RuneScore */}
        <div style={{ 
          flex: '0 0 auto',
          width: detailPanelWidth,
          minWidth: detailPanelWidth,
          maxWidth: detailPanelWidth,
          display: 'flex', 
          flexDirection: 'column'
        }} onClick={(e) => e.stopPropagation()}>
          <Spellpower
            playerId={player.id}
            playerName={player.name}
            isActive={isActive}
            nameColor={nameColor}
            health={currentHealth}
            healing={healingAmount}
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
