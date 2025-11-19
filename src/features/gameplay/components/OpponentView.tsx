/**
 * OpponentView component - displays the AI opponent's board (read-only view)
 */

import type { Player } from '../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface OpponentViewProps {
  opponent: Player;
  isActive: boolean;
  gameMode: 'classic' | 'standard';
  frozenPatternLines?: number[];
  freezeSelectionEnabled?: boolean;
  onFreezePatternLine?: (patternLineIndex: number) => void;
}

export function OpponentView({ opponent, isActive, gameMode, frozenPatternLines = [], freezeSelectionEnabled = false, onFreezePatternLine }: OpponentViewProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
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
        // Dummy overlay handlers (opponent doesn't need these)
        onShowDeck={() => {}}
        onShowLog={() => {}}
        onShowRules={() => {}}
      />
    </div>
  );
}
