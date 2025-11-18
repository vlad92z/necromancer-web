/**
 * ScoringWall component - displays the 5x5 scoring grid
 */

import { useMemo } from 'react';
import type { ScoringWall as ScoringWallType, PatternLine } from '../../../types/game';
import { WallCell } from './WallCell';

interface ScoringWallProps {
  wall: ScoringWallType;
  patternLines: PatternLine[];
}

// Layout constants (kept in sync with RuneCell size config)
const CELL_SIZE = 45; // large size from RuneCell
const GAP = 4; // gap used between cells in ScoringWall layout
const GRID_SIZE = 5;

function getLargestConnectedComponent(wall: ScoringWallType) {
  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  const components: { nodes: { row: number; col: number }[] }[] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (visited[r][c]) continue;
      if (!wall[r][c].runeType) {
        visited[r][c] = true;
        continue;
      }

      // BFS for this component
      const queue: { row: number; col: number }[] = [{ row: r, col: c }];
      const compNodes: { row: number; col: number }[] = [];
      visited[r][c] = true;

      while (queue.length) {
        const cur = queue.shift()!;
        compNodes.push(cur);

        const neighbors = [
          { row: cur.row - 1, col: cur.col },
          { row: cur.row + 1, col: cur.col },
          { row: cur.row, col: cur.col - 1 },
          { row: cur.row, col: cur.col + 1 },
        ];

        for (const nb of neighbors) {
          if (nb.row < 0 || nb.row >= GRID_SIZE || nb.col < 0 || nb.col >= GRID_SIZE) continue;
          if (visited[nb.row][nb.col]) continue;
          if (!wall[nb.row][nb.col].runeType) {
            visited[nb.row][nb.col] = true;
            continue;
          }
          visited[nb.row][nb.col] = true;
          queue.push(nb);
        }
      }

      components.push({ nodes: compNodes });
    }
  }

  if (components.length === 0) return { nodes: [] };
  // return the component with maximum nodes
  return components.reduce((a, b) => (a.nodes.length >= b.nodes.length ? a : b));
}

export function ScoringWall({ wall, patternLines }: ScoringWallProps) {
  // Compute largest connected set of occupied cells and their pixel centers
  const overlay = useMemo(() => {
    const comp = getLargestConnectedComponent(wall);
    if (!comp.nodes.length) return null;

    const points = comp.nodes.map(({ row, col }) => {
      const x = col * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const y = row * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      return { x, y };
    });

    return { points };
  }, [wall]);

  const totalWidth = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * GAP;
  const totalHeight = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * GAP;

  return (
    <div style={{ position: 'relative', width: `${totalWidth}px`, height: `${totalHeight}px` }}>
      {/* SVG overlay connecting biggest segment */}
      {overlay && overlay.points.length > 0 && (
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {overlay.points.length > 1 && (
            <polyline
              points={overlay.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#f59e0b" /* amber accent */
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.75}
            />
          )}

          {/* highlight nodes */}
          {overlay.points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={6}
              fill="#f97316"
              opacity={0.95}
              pointerEvents="none"
            />
          ))}
        </svg>
      )}

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {wall.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: `${GAP}px` }}>
            {row.map((cell, colIndex) => (
              <WallCell
                key={colIndex}
                cell={cell}
                row={rowIndex}
                col={colIndex}
                patternLine={patternLines[rowIndex]}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
