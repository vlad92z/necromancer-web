/** Read-only spellboard for the enemy's completed runes. */

import { useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useGameplayActions } from '../../../hooks/useGameActions';
import { useEnemySpellBoardState, usePendingRuneTargetState } from '../../../hooks/useGameState';
import type { Rune } from '../../../types/game';
import { WallCell } from './WallCell';

const GAP = 0;

interface EnemySpellBoardProps {
  onRuneHover: (rune: Rune) => void;
  onRuneLeave: () => void;
}

export function EnemySpellBoard({ onRuneHover, onRuneLeave }: EnemySpellBoardProps) {
  const { wall } = useEnemySpellBoardState();
  const pendingTarget = usePendingRuneTargetState();
  const { selectPendingRuneTarget } = useGameplayActions();
  const isDestroying = pendingTarget?.effectRef.effectId === 'rune.destroy';
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const targetableKeys = useMemo(() => new Set(wall.flatMap((row, rowIndex) => row.flatMap((cell, colIndex) => (
    isDestroying
    && cell.id
    && (!pendingTarget.effectRef.runeType || cell.runeTypes.includes(pendingTarget.effectRef.runeType))
      ? [`${rowIndex}-${colIndex}`]
      : []
  )))), [isDestroying, pendingTarget, wall]);

  useEffect(() => {
    if (!isDestroying) return;
    const firstKey = targetableKeys.values().next().value as string | undefined;
    if (firstKey) buttonRefs.current.get(firstKey)?.focus();
  }, [isDestroying, pendingTarget?.sourceRuneId, targetableKeys]);

  const handleArrow = (event: KeyboardEvent<HTMLButtonElement>, currentKey: string) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const keys = [...targetableKeys];
    const index = keys.indexOf(currentKey);
    if (index < 0 || keys.length === 0) return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const nextKey = keys[(index + delta + keys.length) % keys.length];
    if (nextKey) buttonRefs.current.get(nextKey)?.focus();
  };

  return (
    <div className="flex flex-col items-center" aria-label="Enemy spellboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {wall.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: `${GAP}px` }}>
            {row.map((cell, colIndex) => (
              <button
                type="button"
                key={colIndex}
                ref={(element) => {
                  const key = `${rowIndex}-${colIndex}`;
                  if (element) buttonRefs.current.set(key, element);
                  else buttonRefs.current.delete(key);
                }}
                disabled={Boolean(pendingTarget) && !targetableKeys.has(`${rowIndex}-${colIndex}`)}
                tabIndex={targetableKeys.has(`${rowIndex}-${colIndex}`) ? 0 : -1}
                onClick={() => selectPendingRuneTarget('enemy', rowIndex, colIndex)}
                onKeyDown={(event) => handleArrow(event, `${rowIndex}-${colIndex}`)}
                aria-label={targetableKeys.has(`${rowIndex}-${colIndex}`)
                  ? `Destroy ${cell.name ?? cell.runeTypes.join(' ')} rune at row ${rowIndex + 1}, column ${colIndex + 1}`
                  : undefined}
                style={{ display: 'flex', border: 0, padding: 0, background: 'transparent' }}
              >
                <WallCell
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  onRuneHover={onRuneHover}
                  onRuneLeave={onRuneLeave}
                  isTargetable={targetableKeys.has(`${rowIndex}-${colIndex}`)}
                />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
