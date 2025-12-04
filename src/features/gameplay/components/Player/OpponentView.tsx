/**
 * OpponentView component - displays the AI opponent's board (read-only view)
 */

import type { Player } from '../../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface OpponentViewProps {
  opponent: Player;
  isActive: boolean;
  lockedPatternLines?: number[];
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
  round: number;
}

export function OpponentView(
  {
    opponent,
    isActive,
    lockedPatternLines,
    hiddenSlotKeys,
    hiddenFloorSlotIndexes, 
    round 
  }: OpponentViewProps) {
  return (
    <div style={{ marginBottom: '24px', position: 'relative' }}>
      <PlayerBoard
        player={opponent}
        isActive={isActive}
        // No interaction handlers for opponent view
        selectedRuneType={null}
        canPlace={false}
        onCancelSelection={() => {}}
        hiddenSlotKeys={hiddenSlotKeys}
        hiddenFloorSlotIndexes={hiddenFloorSlotIndexes}
        lockedLineIndexes={lockedPatternLines}
        round={round}
      />
    </div>
  );
}
