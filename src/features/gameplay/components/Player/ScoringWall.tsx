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

// We no longer compute the largest connected component. Instead we connect
// every occupied or pending cell to its orthogonal neighbors (right + down).

export function ScoringWall({ wall, patternLines }: ScoringWallProps) {
  // Compute pixel centers for all occupied or pending cells and short
  // neighbor-to-neighbor edges (right + down) so every adjacent pair is
  // connected by a single line segment.
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

    const pointsMap = new Map<string, { x: number; y: number; row: number; col: number; isPending: boolean }>();
    for (let r = 0; r < wallSize; r++) {
      for (let c = 0; c < wallSize; c++) {
        const key = cellKey(r, c);
        const occupied = Boolean(wall[r]?.[c]?.runeType) || pendingCells.has(key);
        if (!occupied) continue;
        const x = c * (CELL_SIZE + GAP) + CELL_SIZE / 2;
        const y = r * (CELL_SIZE + GAP) + CELL_SIZE / 2;
        pointsMap.set(key, { x, y, row: r, col: c, isPending: pendingCells.has(key) });
      }
    }

    if (pointsMap.size === 0) return null;

    const edges: { x1: number; y1: number; x2: number; y2: number; connectsPending: boolean }[] = [];
    for (const [, a] of pointsMap) {
      const right = pointsMap.get(cellKey(a.row, a.col + 1));
      if (right) {
        edges.push({ x1: a.x, y1: a.y, x2: right.x, y2: right.y, connectsPending: a.isPending || right.isPending });
      }
      const down = pointsMap.get(cellKey(a.row + 1, a.col));
      if (down) {
        edges.push({ x1: a.x, y1: a.y, x2: down.x, y2: down.y, connectsPending: a.isPending || down.isPending });
      }
    }

    const points = Array.from(pointsMap.values()).map(p => ({ x: p.x, y: p.y, isPending: p.isPending }));
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
