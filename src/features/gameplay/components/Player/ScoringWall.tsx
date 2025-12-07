/**
 * ScoringWall component - displays the scoring grid
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ScoringWall as ScoringWallType, PatternLine } from '../../../../types/game';
import { collectSegmentCells, getRuneOrderForSize, getWallColumnForRune } from '../../../../utils/scoring';
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
const parseCellKey = (key: string) => {
  const [row, col] = key.split('-').map(Number);
  return { row, col };
};

interface OverlayPoint {
  x: number;
  y: number;
  isPending: boolean;
}

interface OverlayEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  connectsPending: boolean;
}

interface OverlayData {
  points: OverlayPoint[];
  edges: OverlayEdge[];
}

// We no longer compute the largest connected component. Instead we connect
// every occupied or pending cell to its orthogonal neighbors (right + down).

export function ScoringWall({ wall, patternLines }: ScoringWallProps) {
  const [pulseKey, setPulseKey] = useState(0);
  const hasMountedRef = useRef(false);
  const previousWallRef = useRef<ScoringWallType | null>(null);
  const overlayWallRef = useRef<ScoringWallType | null>(null);
  const pendingCellsRef = useRef<Set<string>>(new Set());
  const overlayRef = useRef<{ points: Map<string, OverlayPoint>; edges: Map<string, OverlayEdge> } | null>(null);
  const [overlay, setOverlay] = useState<OverlayData | null>(null);
  const [pulseTargets, setPulseTargets] = useState<Set<string>>(new Set());

  const wallSignature = useMemo(
    () => wall.map(row => row.map(cell => cell.runeType ?? '0').join(',')).join('|'),
    [wall]
  );

  const getCellCenter = (row: number, col: number) => {
    const x = col * (CELL_SIZE + GAP) + CELL_SIZE / 2;
    const y = row * (CELL_SIZE + GAP) + CELL_SIZE / 2;
    return { x, y };
  };

  const computePendingCells = (currentWall: ScoringWallType, currentPatternLines: PatternLine[]) => {
    const pendingCells = new Set<string>();
    const wallSize = currentWall.length;
    currentPatternLines.forEach((line, rowIndex) => {
      if (line.count === line.tier && line.runeType) {
        const col = getWallColumnForRune(rowIndex, line.runeType, wallSize);
        if (!currentWall[rowIndex][col].runeType) {
          pendingCells.add(cellKey(rowIndex, col));
        }
      }
    });
    return pendingCells;
  };

  const buildFullOverlay = (currentWall: ScoringWallType, pendingCells: Set<string>) => {
    const pointsMap = new Map<string, OverlayPoint>();
    const edgesMap = new Map<string, OverlayEdge>();
    const wallSize = currentWall.length;

    for (let r = 0; r < wallSize; r++) {
      for (let c = 0; c < wallSize; c++) {
        const key = cellKey(r, c);
        const occupied = Boolean(currentWall[r]?.[c]?.runeType) || pendingCells.has(key);
        if (!occupied) {
          continue;
        }
        const { x, y } = getCellCenter(r, c);
        pointsMap.set(key, { x, y, isPending: pendingCells.has(key) });
      }
    }

    const updateEdge = (rowA: number, colA: number, rowB: number, colB: number) => {
      if (rowB >= wallSize || colB >= wallSize || rowB < 0 || colB < 0) return;
      const keyA = cellKey(rowA, colA);
      const keyB = cellKey(rowB, colB);
      const a = pointsMap.get(keyA);
      const b = pointsMap.get(keyB);
      if (!a || !b) return;
      const edgeKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
      edgesMap.set(edgeKey, {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        connectsPending: a.isPending || b.isPending,
      });
    };

    for (let r = 0; r < wallSize; r++) {
      for (let c = 0; c < wallSize; c++) {
        updateEdge(r, c, r, c + 1);
        updateEdge(r, c, r + 1, c);
      }
    }

    return { pointsMap, edgesMap };
  };

  useEffect(() => {
    const wallSize = wall.length;
    const pendingCells = computePendingCells(wall, patternLines);

    const rebuildFromScratch = () => {
      const built = buildFullOverlay(wall, pendingCells);
      overlayRef.current = { points: built.pointsMap, edges: built.edgesMap };
      pendingCellsRef.current = pendingCells;
      overlayWallRef.current = wall;
      setOverlay({
        points: Array.from(built.pointsMap.values()),
        edges: Array.from(built.edgesMap.values()),
      });
    };

    if (!overlayRef.current) {
      rebuildFromScratch();
      return;
    }

    const previousWall = overlayWallRef.current;
    const previousPending = pendingCellsRef.current;

    // If wall size changes, fallback to full rebuild
    if (!previousWall || previousWall.length !== wallSize) {
      rebuildFromScratch();
      return;
    }

    const dirtyCells = new Set<string>();

    // Detect wall changes row-by-row to avoid full grid walks when row references are stable
    for (let r = 0; r < wallSize; r++) {
      if (previousWall[r] === wall[r]) {
        continue;
      }
      const prevRow = previousWall[r];
      const nextRow = wall[r];
      for (let c = 0; c < nextRow.length; c++) {
        const prevRune = prevRow?.[c]?.runeType ?? null;
        const nextRune = nextRow?.[c]?.runeType ?? null;
        if (prevRune !== nextRune) {
          dirtyCells.add(cellKey(r, c));
        }
      }
    }

    // Detect pending cell changes
    pendingCells.forEach(key => {
      if (!previousPending.has(key)) {
        dirtyCells.add(key);
      }
    });
    previousPending.forEach(key => {
      if (!pendingCells.has(key)) {
        dirtyCells.add(key);
      }
    });

    if (dirtyCells.size === 0) {
      pendingCellsRef.current = pendingCells;
      overlayWallRef.current = wall;
      return;
    }

    const points = new Map(overlayRef.current.points);
    const edges = new Map(overlayRef.current.edges);

    // Update points for dirty cells
    dirtyCells.forEach(key => {
      const { row, col } = parseCellKey(key);
      const occupied = Boolean(wall[row]?.[col]?.runeType) || pendingCells.has(key);
      if (occupied) {
        const { x, y } = getCellCenter(row, col);
        points.set(key, { x, y, isPending: pendingCells.has(key) });
      } else {
        points.delete(key);
      }
    });

    const edgeCells = new Set<string>();
    dirtyCells.forEach(key => {
      edgeCells.add(key);
      const { row, col } = parseCellKey(key);
      const neighbors: Array<[number, number]> = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];
      neighbors.forEach(([nr, nc]) => {
        if (nr >= 0 && nc >= 0 && nr < wallSize && nc < wallSize) {
          edgeCells.add(cellKey(nr, nc));
        }
      });
    });

    const updateEdge = (rowA: number, colA: number, rowB: number, colB: number) => {
      if (rowB >= wallSize || colB >= wallSize || rowB < 0 || colB < 0) return;
      const keyA = cellKey(rowA, colA);
      const keyB = cellKey(rowB, colB);
      const a = points.get(keyA);
      const b = points.get(keyB);
      const edgeKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
      if (a && b) {
        edges.set(edgeKey, {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          connectsPending: a.isPending || b.isPending,
        });
      } else {
        edges.delete(edgeKey);
      }
    };

    edgeCells.forEach(key => {
      const { row, col } = parseCellKey(key);
      updateEdge(row, col, row, col + 1);
      updateEdge(row, col, row + 1, col);
    });

    overlayRef.current = { points, edges };
    pendingCellsRef.current = pendingCells;
    overlayWallRef.current = wall;
    setOverlay({
      points: Array.from(points.values()),
      edges: Array.from(edges.values()),
    });
  }, [wall, patternLines]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousWallRef.current = wall;
      return;
    }

    const previousWall = previousWallRef.current;
    previousWallRef.current = wall;

    if (!previousWall) {
      return;
    }

    const anchors: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < wall.length; r++) {
      for (let c = 0; c < wall.length; c++) {
        const wasEmpty = previousWall[r]?.[c]?.runeType === null;
        const isFilled = wall[r]?.[c]?.runeType !== null;
        if (wasEmpty && isFilled) {
          anchors.push({ row: r, col: c });
        }
      }
    }

    if (anchors.length === 0) {
      setPulseTargets(new Set());
      return;
    }

    const newTargets = new Set<string>();
    anchors.forEach(({ row, col }) => {
      const segmentCells = collectSegmentCells(wall, row, col);
      segmentCells.forEach(cell => newTargets.add(cellKey(cell.row, cell.col)));
    });

    if (newTargets.size > 0) {
      setPulseTargets(newTargets);
      setPulseKey(prev => prev + 1);
    } else {
      setPulseTargets(new Set());
    }
  }, [wall, wallSignature]);

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
                wallSize={gridSize}
                availableRuneTypes={availableRuneTypes}
                pulseKey={pulseTargets.has(cellKey(rowIndex, colIndex)) ? pulseKey : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
