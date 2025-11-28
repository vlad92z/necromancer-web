/**
 * OpponentView component - displays the AI opponent's board (read-only view)
 */

import type { Player } from '../../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface OpponentViewProps {
  opponent: Player;
  isActive: boolean;
  gameMode: 'classic' | 'standard';
  frozenPatternLines?: number[];
  freezeSelectionEnabled?: boolean;
  onFreezePatternLine?: (patternLineIndex: number) => void;
  onCancelFreezeSelection?: () => void;
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
  round: number;
}

export function OpponentView({ opponent, isActive, gameMode, frozenPatternLines = [], freezeSelectionEnabled = false, onFreezePatternLine, onCancelFreezeSelection, hiddenSlotKeys, hiddenFloorSlotIndexes, round }: OpponentViewProps) {
  const showCancelPill = freezeSelectionEnabled && Boolean(onCancelFreezeSelection);
  return (
    <div style={{ marginBottom: '24px', position: 'relative' }}>
      {showCancelPill && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            background: 'rgba(10, 18, 40, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.35)',
            color: '#e0f2ff',
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            zIndex: 2
          }}
        >
          <span style={{ opacity: 0.9 }}>Freeze a pattern line</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCancelFreezeSelection?.();
            }}
            style={{
              border: 'none',
              borderRadius: '999px',
              background: '#38bdf8',
              color: '#03111f',
              fontWeight: 600,
              fontSize: '12px',
              padding: '4px 12px',
              cursor: 'pointer'
            }}
          >
            Skip
          </button>
        </div>
      )}
      <PlayerBoard
        player={opponent}
        isActive={isActive}
        // No interaction handlers for opponent view
        selectedRuneType={null}
        canPlace={false}
        onCancelSelection={() => {}}
        gameMode={gameMode}
        nameColor="#7f1d1d"
        frozenPatternLines={frozenPatternLines}
        freezeSelectionEnabled={freezeSelectionEnabled}
        onFreezePatternLine={onFreezePatternLine}
        hiddenSlotKeys={hiddenSlotKeys}
        hiddenFloorSlotIndexes={hiddenFloorSlotIndexes}
        round={round}
      />
    </div>
  );
}
