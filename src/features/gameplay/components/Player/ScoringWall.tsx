/**
 * ScoringWall component - displays the player's spell wall.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { Rune } from '../../../../types/game';
import { useGameplayActions } from '../../../../hooks/useGameActions';
import { useGameplayWallState, usePendingRuneTargetState } from '../../../../hooks/useGameState';
import { WallCell } from '../WallCell';

const cellKey = (row: number, col: number) => `${row}-${col}`;

interface ScoringWallProps {
  hiddenWallSlots: Set<string>;
  onRuneHover: (rune: Rune) => void;
  onRuneLeave: () => void;
}

export function ScoringWall({ hiddenWallSlots, onRuneHover, onRuneLeave }: ScoringWallProps) {
  const { wall } = useGameplayWallState();
  const pendingTarget = usePendingRuneTargetState();
  const { castRuneToWall, selectPendingRuneTarget } = useGameplayActions();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const isConsuming = pendingTarget?.effectRef.effectId === 'rune.consume';
  const targetableKeys = useMemo(() => new Set(wall.flatMap((row, rowIndex) => (
    row.flatMap((cell, colIndex) => (
      isConsuming
      && cell.id
      && cell.id !== pendingTarget.sourceRuneId
      && (!pendingTarget.effectRef.runeType || cell.runeTypes.includes(pendingTarget.effectRef.runeType))
        ? [cellKey(rowIndex, colIndex)]
        : []
    ))
  ))), [isConsuming, pendingTarget, wall]);

  useEffect(() => {
    if (!isConsuming) return;
    const firstKey = targetableKeys.values().next().value as string | undefined;
    if (firstKey) buttonRefs.current.get(firstKey)?.focus();
  }, [isConsuming, pendingTarget?.sourceRuneId, targetableKeys]);

  const handleWallCellClick = useCallback(
    (rowIndex: number, colIndex: number) => {
      const key = cellKey(rowIndex, colIndex);
      if (isConsuming) {
        if (targetableKeys.has(key)) selectPendingRuneTarget('player', rowIndex, colIndex);
        return;
      }
      if (!pendingTarget) castRuneToWall(rowIndex, colIndex);
    },
    [castRuneToWall, isConsuming, pendingTarget, selectPendingRuneTarget, targetableKeys]
  );

  const focusTargetByArrow = useCallback((event: KeyboardEvent<HTMLButtonElement>, currentKey: string) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const keys = isConsuming ? [...targetableKeys] : wall.flatMap((row, rowIndex) => row.map((_, colIndex) => cellKey(rowIndex, colIndex)));
    const index = keys.indexOf(currentKey);
    if (index < 0 || keys.length === 0) return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const nextKey = keys[(index + delta + keys.length) % keys.length];
    if (nextKey) buttonRefs.current.get(nextKey)?.focus();
  }, [isConsuming, targetableKeys, wall]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column'}}>
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
          {row.map((cell, colIndex) => (
            <button
              type="button"
              key={colIndex}
              data-wall-row={rowIndex}
              data-wall-col={colIndex}
              onClick={() => handleWallCellClick(rowIndex, colIndex)}
              ref={(element) => {
                const key = cellKey(rowIndex, colIndex);
                if (element) buttonRefs.current.set(key, element);
                else buttonRefs.current.delete(key);
              }}
              tabIndex={isConsuming ? (targetableKeys.has(cellKey(rowIndex, colIndex)) ? 0 : -1) : 0}
              disabled={Boolean(pendingTarget) && !targetableKeys.has(cellKey(rowIndex, colIndex))}
              onKeyDown={(event) => focusTargetByArrow(event, cellKey(rowIndex, colIndex))}
              aria-label={targetableKeys.has(cellKey(rowIndex, colIndex))
                ? `Consume ${cell.name ?? cell.runeTypes.join(' ')} rune at row ${rowIndex + 1}, column ${colIndex + 1}`
                : `Wall slot row ${rowIndex + 1}, column ${colIndex + 1}`}
              style={{ display: 'flex', cursor: 'pointer', border: 0, padding: 0, background: 'transparent' }}
            >
              <WallCell
                cell={
                  hiddenWallSlots.has(cellKey(rowIndex, colIndex))
                    ? {
                      ...cell,
                      id: null,
                      name: null,
                      runeTypes: [],
                      rarity: null,
                      cardImageSrc: null,
                      tokenImageSrc: null,
                      castEffectRefs: null,
                      passiveEffectRefs: null,
                    }
                    : cell
                }
                row={rowIndex}
                col={colIndex}
                onRuneHover={onRuneHover}
                onRuneLeave={onRuneLeave}
                isTargetable={targetableKeys.has(cellKey(rowIndex, colIndex))}
              />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
