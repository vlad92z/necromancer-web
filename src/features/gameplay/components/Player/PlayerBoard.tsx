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
  lockedPatternLines?: number[];
  freezeSelectionEnabled?: boolean;
  onFreezePatternLine?: (patternLineIndex: number) => void;
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
  round: number;
  hideStatsPanel?: boolean;
}

export function PlayerBoard({ player, isActive, onPlaceRunes, onPlaceRunesInFloor, selectedRuneType, canPlace, onCancelSelection, gameMode, nameColor, frozenPatternLines = [], lockedPatternLines = [], freezeSelectionEnabled = false, onFreezePatternLine, hiddenSlotKeys, hiddenFloorSlotIndexes, round, hideStatsPanel = false }: PlayerBoardProps) {
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
  
  // Floor mitigation is applied only when runes grant FloorPenaltyMitigation (legacy Wind effect).
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
  const windRuneCount = gameMode === 'standard'
    ? player.wall.flat().reduce((total, cell) => (cell.runeType === 'Wind' ? total + 1 : total), 0) +
      completedPatternLines.reduce((total, line) => (line.runeType === 'Wind' ? total + 1 : total), 0)
    : 0;
  const hasWindMitigation = gameMode === 'standard' && (windMitigationCount > 0 || windRuneCount > 0);
 
  const { essence, focus, totalPower } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount,
    gameMode
  );
  const hasPenalty = floorPenaltyCount > 0;
  
  // Count Essence-boosting runes: current wall + completed pattern lines (only in standard mode)
  const essenceRuneCount = gameMode === 'standard'
    ? player.wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'EssenceBonus'), 0) +
      completedPatternLines.reduce((total, line) => total + getPassiveEffectValue(line.effects, 'EssenceBonus'), 0)
    : 0;

  const detailPanelWidth = 'clamp(320px, 30vmin, 420px)';
  const focusTooltip = 'Focus - connect more runes to increase your multiplier.';
  const segmentDamageTooltip = 'Complete a pattern line to strike immediately. The placed rune deals damage equal to the connected segment it joins (minimum 1).';
  const essenceTooltip = essenceRuneCount > 0
    ? `Essence - cast more runes to increase spell damage. Fire, Lightning, and Void runes (${essenceRuneCount}) amplify your Essence.`
    : 'Essence - cast more runes to increase spell damage.';

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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto auto',
              gridTemplateRows: hideStatsPanel ? 'auto auto' : 'auto',
              alignItems: 'start',
              gap: 'min(1.2vmin, 14px)'
            }}
          >
            {/* Pattern Lines */}
            <div
              style={{ gridColumn: 1, gridRow: hideStatsPanel ? 2 : 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PatternLines 
                patternLines={player.patternLines}
                wall={player.wall}
                onPlaceRunes={onPlaceRunes}
                selectedRuneType={selectedRuneType}
                canPlace={canPlace}
                frozenLineIndexes={frozenPatternLines}
                lockedLineIndexes={lockedPatternLines}
                freezeSelectionEnabled={freezeSelectionEnabled}
                onFreezeLine={onFreezePatternLine}
                playerId={player.id}
                hiddenSlotKeys={hiddenSlotKeys}
              />
            </div>
            
            {/* Wall */}
            <div
              style={{
                gridColumn: 2,
                gridRow: hideStatsPanel ? 2 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'min(0.7vmin, 12px)'
              }}
            >
              <ScoringWall wall={player.wall} patternLines={player.patternLines} />
            </div>
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
              essenceRuneCount={essenceRuneCount}
              hasPenalty={hasPenalty}
              hasWindMitigation={hasWindMitigation}
              windRuneCount={windRuneCount}
              round={round}
            />
          </div>
        )}
      </div>
    </div>
  );
}
