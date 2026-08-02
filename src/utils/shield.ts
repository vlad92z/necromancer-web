import type { ScoringWall, WallPosition } from '../types/game';
import { removeRuneAtPosition } from './runeRemoval';

export interface ShieldDamageResult {
  wall: ScoringWall;
  absorbedDamage: number;
  remainingDamage: number;
  removedRuneIds: string[];
}

export function addShieldToWallCell(
  wall: ScoringWall,
  position: WallPosition | null | undefined,
  amount: number,
): ScoringWall {
  const normalizedAmount = Math.max(0, amount);
  const cell = position ? wall[position.row]?.[position.col] : null;
  if (!cell?.id || normalizedAmount === 0) return wall;

  const nextWall = wall.map((row) => [...row]);
  nextWall[position!.row][position!.col] = {
    ...cell,
    shield: (cell.shield ?? 0) + normalizedAmount,
  };
  return nextWall;
}

export function applyDamageToShieldedWall(wall: ScoringWall, damage: number): ShieldDamageResult {
  let nextWall = wall;
  let remainingDamage = Math.max(0, damage);
  let absorbedDamage = 0;
  const removedRuneIds: string[] = [];

  for (let row = 0; row < wall.length && remainingDamage > 0; row += 1) {
    for (let col = 0; col < (nextWall[row]?.length ?? 0) && remainingDamage > 0; col += 1) {
      const cell = nextWall[row]?.[col];
      const currentShield = cell?.shield ?? 0;
      if (!cell?.id || currentShield <= 0) continue;

      const absorbed = Math.min(currentShield, remainingDamage);
      absorbedDamage += absorbed;
      remainingDamage -= absorbed;

      if (absorbed === currentShield) {
        const removal = removeRuneAtPosition(nextWall, { row, col });
        nextWall = removal.wall;
        if (removal.removedRune) removedRuneIds.push(removal.removedRune.id);
      } else {
        nextWall = nextWall.map((wallRow) => [...wallRow]);
        nextWall[row]![col] = { ...cell, shield: currentShield - absorbed };
      }
    }
  }

  return { wall: nextWall, absorbedDamage, remainingDamage, removedRuneIds };
}
