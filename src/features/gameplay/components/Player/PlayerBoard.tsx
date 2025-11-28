/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { FloorLine } from './FloorLine';
import { PlayerStats } from './PlayerStats';
import { calculateProjectedPower, calculateEffectiveFloorPenalty } from '../../../../utils/scoring';
import { copyRuneEffects, getPassiveEffectValue, getRuneEffectsForType } from '../../../../utils/runeEffects';

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
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
  round: number;
  hideStatsPanel?: boolean;
}

export function PlayerBoard({ player, isActive, onPlaceRunes, onPlaceRunesInFloor, selectedRuneType, canPlace, onCancelSelection, gameMode, nameColor, frozenPatternLines = [], freezeSelectionEnabled = false, onFreezePatternLine, hiddenSlotKeys, hiddenFloorSlotIndexes, round, hideStatsPanel = false }: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };

  // Find completed pattern lines
  const completedPatternLines = player.patternLines
    .map((line, index) => ({ line, row: index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null)
    .map(({ line, row }) => ({
      row,
      runeType: line.runeType!,
      effects: copyRuneEffects(line.firstRuneEffects ?? getRuneEffectsForType(line.runeType!)),
    }));

  const currentHealth = player.health;
  const healingAmount = gameMode === 'standard'
    ? player.wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'Healing'), 0) +
      completedPatternLines.reduce((total, line) => total + getPassiveEffectValue(line.effects, 'Healing'), 0)
    : 0;
  
  // Wind Effect: Wind runes anchored to the wall mitigate floor penalties (standard mode only)
  const floorPenaltyCount = calculateEffectiveFloorPenalty(
    player.floorLine.runes,
    player.patternLines,
    player.wall,
    gameMode
  );
  const windMitigationCount = gameMode === 'standard'
    ? player.wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'FloorPenaltyMitigation'), 0) +
      completedPatternLines.reduce((total, line) => total + getPassiveEffectValue(line.effects, 'FloorPenaltyMitigation'), 0)
    : 0;
  const hasWindMitigation = gameMode === 'standard' && windMitigationCount > 0;
 
  const { essence, focus, totalPower } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount,
    gameMode
  );
  const hasPenalty = floorPenaltyCount > 0;
  
  // Count Fire runes: current wall + completed pattern lines (only in standard mode)
  const fireRuneCount = gameMode === 'standard'
    ? player.wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'EssenceBonus'), 0) +
      completedPatternLines.reduce((total, line) => total + getPassiveEffectValue(line.effects, 'EssenceBonus'), 0)
    : 0;

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
        <div style={{ 
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'min(1.2vmin, 12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'min(1.2vmin, 14px)' }}>
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
          </div>

          {/* Floor Line - spans beneath pattern lines and wall */}
          <div onClick={(e) => e.stopPropagation()}>
            <FloorLine 
              floorLine={player.floorLine}
              onPlaceRunesInFloor={onPlaceRunesInFloor}
              canPlace={canPlace}
              mitigatedSlots={windMitigationCount}
              playerId={player.id}
              hiddenSlotIndexes={hiddenFloorSlotIndexes}
            />
          </div>
        </div>

        {/* Right side - Player Info and RuneScore */}
        {!hideStatsPanel && (
          <div style={{ 
            flex: '0 0 auto',
            width: detailPanelWidth,
            minWidth: detailPanelWidth,
            maxWidth: detailPanelWidth,
            display: 'flex', 
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            <PlayerStats
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
              windRuneCount={windMitigationCount}
              round={round}
            />
          </div>
        )}
      </div>
    </div>
  );
}
