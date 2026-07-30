/** Read-only spellboard for the enemy's completed runes. */

import { useEnemySpellBoardState } from '../../../hooks/useGameState';
import { WallCell } from './WallCell';

const GAP = 0;

export function EnemySpellBoard() {
  const { wall } = useEnemySpellBoardState();

  return (
    <div className="flex flex-col items-center" aria-label="Enemy spellboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {wall.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: `${GAP}px` }}>
            {row.map((cell, colIndex) => (
              <WallCell
                key={colIndex}
                cell={cell}
                row={rowIndex}
                col={colIndex}
                wallSize={wall.length}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
