/**
 * ScoringWall component - displays the scoring grid
 */

import { useMemo } from 'react';
import type { ScoringWall as ScoringWallType, PatternLine } from '../../../../types/game';
import { getRuneOrderForSize, getWallColumnForRune } from '../../../../utils/scoring';
import { WallCell } from '../WallCell';
import type { RuneType } from '../../../../types/game';

interface ScoringWallProps {
  wall: ScoringWallType;
  patternLines: PatternLine[];
}

// Layout constants (kept in sync with RuneCell size config)
const CELL_SIZE = 60; // matches RuneCell size="large"
const GAP = 4; // gap used between cells in ScoringWall layout
const cellKey = (row: number, col: number) => `${row}-${col}`;

function getLargestConnectedComponent(wall: ScoringWallType, pendingCells: Set<string>) {
  const gridSize = wall.length;
  const visited = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const components: { nodes: { row: number; col: number }[] }[] = [];
  const isOccupied = (row: number, col: number) => Boolean(wall[row]?.[col]?.runeType) || pendingCells.has(cellKey(row, col));

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (visited[r][c]) continue;
      if (!isOccupied(r, c)) {
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
          if (nb.row < 0 || nb.row >= gridSize || nb.col < 0 || nb.col >= gridSize) continue;
          if (visited[nb.row][nb.col]) continue;
          if (!isOccupied(nb.row, nb.col)) {
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
  // Also compute short neighbor-to-neighbor edges (right + down) to avoid duplicates
  const overlay = useMemo(() => {
    const pendingCells = new Set<string>();
    const wallSize = wall.length;
    patternLines.forEach((line, rowIndex) => {
      if (line.count === line.tier && line.runeType) {
        const col = getWallColumnForRune(rowIndex, line.runeType, wallSize);
        if (!wall[rowIndex][col].runeType) {
          pendingCells.add(cellKey(rowIndex, col));
        }
      }
    });

    const comp = getLargestConnectedComponent(wall, pendingCells);
    if (!comp.nodes.length) return null;

    const pointsMap = new Map<string, { x: number; y: number; row: number; col: number; isPending: boolean }>();
    for (const { row, col } of comp.nodes) {
      const x = col * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const y = row * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const key = cellKey(row, col);
      pointsMap.set(key, { x, y, row, col, isPending: pendingCells.has(key) });
    }

    const edges: { x1: number; y1: number; x2: number; y2: number; connectsPending: boolean }[] = [];

    for (const { row, col } of comp.nodes) {
      // only check right and down neighbors to avoid duplicate lines
      const right = pointsMap.get(cellKey(row, col + 1));
      if (right) {
        const a = pointsMap.get(cellKey(row, col))!;
        edges.push({
          x1: a.x,
          y1: a.y,
          x2: right.x,
          y2: right.y,
          connectsPending: a.isPending || right.isPending
        });
      }
      const down = pointsMap.get(cellKey(row + 1, col));
      if (down) {
        const a = pointsMap.get(cellKey(row, col))!;
        edges.push({
          x1: a.x,
          y1: a.y,
          x2: down.x,
          y2: down.y,
          connectsPending: a.isPending || down.isPending
        });
      }
    }

    const points = Array.from(pointsMap.values()).map(p => ({
      x: p.x,
      y: p.y,
      isPending: p.isPending
    }));
    return { points, edges };
  }, [wall, patternLines]);

  const gridSize = wall.length;
  const availableRuneTypes: RuneType[] = getRuneOrderForSize(gridSize);
  const totalWidth = gridSize * CELL_SIZE + (gridSize - 1) * GAP;
  const totalHeight = gridSize * CELL_SIZE + (gridSize - 1) * GAP;

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
          {/* draw short edges between orthogonal neighbors */}
          {overlay.edges && overlay.edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={'#35bfff'}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={e.connectsPending ? 0.65 : 0.8}
            />
          ))}

          {/* highlight nodes */}
          {overlay.points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={6}
              fill={p.isPending ? '#fde047' : '#f97316'}
              opacity={p.isPending ? 0.8 : 0.95}
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
                wallSize={gridSize}
                availableRuneTypes={availableRuneTypes}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
