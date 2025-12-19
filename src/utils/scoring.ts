/**
 * Scoring utilities for Massive Spell: Arcane Arena
 * Implements connected segment scoring
 */

import type { RuneEffect, Rune, RuneType, SpellWall } from '../types/game';

export interface SegmentCell {
  row: number;
  col: number;
  rune: Rune;
}

export function collectSegmentCells(
  wall: SpellWall,
  row: number,
  col: number
): SegmentCell[] {
  const wallSize = wall.length;
  if (row < 0 || row >= wallSize || col < 0 || col >= wallSize) {
    return [];
  }

  if (wall[row][col].rune === null) {
    return [];
  }

  const visited = Array(wallSize)
    .fill(null)
    .map(() => Array(wallSize).fill(false));
  const stack: Array<[number, number]> = [[row, col]];
  const cells: SegmentCell[] = [];

  while (stack.length > 0) {
    const [r, c] = stack.pop() as [number, number];
    const rune = wall[r][c].rune;
    if (
      r < 0 ||
      r >= wallSize ||
      c < 0 ||
      c >= wallSize ||
      visited[r][c] ||
      rune === null
    ) {
      continue;
    }

    visited[r][c] = true;
    cells.push({ row: r, col: c, rune: rune });

    stack.push([r - 1, c]);
    stack.push([r + 1, c]);
    stack.push([r, c - 1]);
    stack.push([r, c + 1]);
  }

  return cells;
}

/**
 * Calculate the size of the connected segment that includes a specific cell.
 * Counts all orthogonally-adjacent runes regardless of type; returns 0 if empty.
 */
export function calculateSegmentSize(
  wall: SpellWall,
  row: number,
  col: number
): number {
  return collectSegmentCells(wall, row, col).length;
}

export interface ResolvedSegment {
  segmentSize: number;
  damage: number;
  healing: number;
  arcaneDust: number;
  armor: number;
  orderedCells: SegmentCell[];
  resolutionSteps: RuneResolutionStep[];
  channelSynergyTriggered: boolean;
}

export interface RuneResolutionStep {
  cell: SegmentCell;
  damageDelta: number;
  healingDelta: number;
  arcaneDustDelta: number;
  armorDelta: number;
}

/**
 * Resolve scoring effects for a connected segment. Effects are applied in
 * reading order (left-to-right within each row, then top-to-bottom across rows).
 */
export function resolveSegment(
  wall: SpellWall,
  row: number,
  col: number,
  overloadRuneCounts?: Map<RuneType, number>
): ResolvedSegment {
  const connectedCells = collectSegmentCells(wall, row, col);
  return resolveSegmentFromCells(connectedCells, overloadRuneCounts);
}

export function resolveSegmentFromCells(
  connectedCells: SegmentCell[],
  overloadRuneCounts: Map<RuneType, number> = new Map()
): ResolvedSegment {
  if (connectedCells.length === 0) {
    return {
      segmentSize: 0,
      damage: 0,
      healing: 0,
      arcaneDust: 0,
      armor: 0,
      orderedCells: [],
      resolutionSteps: [],
      channelSynergyTriggered: false,
    };
  }

  const orderedCells = [...connectedCells].sort((a, b) =>
    a.row === b.row ? a.col - b.col : a.row - b.row
  );

  // Count runes by type for Synergy and Fragile effects
  const runeTypeCounts = new Map<RuneType, number>();
  connectedCells.forEach((cell) => {
    if (cell.rune.runeType) {
      runeTypeCounts.set(cell.rune.runeType, (runeTypeCounts.get(cell.rune.runeType) ?? 0) + 1);
    }
  });

  let channelSynergyTriggered = false;
  const resolutionSteps: RuneResolutionStep[] = orderedCells.map((cell) => {
    const effect = cell.rune.effect

    let damage = 0;
    let healing = 0;
    let arcaneDust = 0;
    let armor = 0;

    switch (effect.type) {
      case 'Damage':
        damage += effect.amount;
        break;
      case 'Healing':
        healing += effect.amount;
        break;
      case 'Armor':
        console.log('ADDING ARMOR FROM EFFECT', effect.amount);
        armor += effect.amount;
        break;
      case 'Synergy': {
        // Add amount to damage for each synergyType rune in the segment
        const synergyCount = runeTypeCounts.get(effect.synergyType) ?? 0;
        damage += effect.amount * synergyCount;
        break;
      }
      case 'ArmorSynergy': {
        const synergyCount = runeTypeCounts.get(effect.synergyType) ?? 0;
        armor += effect.amount * synergyCount;
        break;
      }
      case 'Fortune':
        // Add amount to arcane dust
        arcaneDust += effect.amount;
        break;
      case 'Fragile': {
        // Add amount to damage if the segment has no fragileType runes
        const fragileTypeCount = runeTypeCounts.get(effect.fragileType) ?? 0;
        if (fragileTypeCount === 0) {
          damage += effect.amount;
        }
        break;
      }
      case 'Channel':
        break;
      case 'ChannelSynergy': {
        const overloadedCount = overloadRuneCounts.get(effect.synergyType) ?? 0;
        const bonus = effect.amount * overloadedCount;
        if (bonus > 0) {
          channelSynergyTriggered = true;
        }
        damage += bonus;
        break;
      }
    }

    return {
      cell,
      damageDelta: damage,
      healingDelta: healing,
      arcaneDustDelta: arcaneDust,
      armorDelta: armor,
    };
  });

  const totals = resolutionSteps.reduce(
    (acc, step) => ({
      damage: acc.damage + step.damageDelta,
      healing: acc.healing + step.healingDelta,
      arcaneDust: acc.arcaneDust + step.arcaneDustDelta,
      armor: acc.armor + step.armorDelta,
    }),
    { damage: 0, healing: 0, arcaneDust: 0, armor: 0 }
  );

  return {
    segmentSize: connectedCells.length,
    damage: totals.damage,
    healing: totals.healing,
    arcaneDust: totals.arcaneDust,
    armor: totals.armor,
    orderedCells,
    resolutionSteps,
    channelSynergyTriggered,
  };
}

/**
 * Legacy function for placement scoring (no longer used for end-of-round scoring)
 * Kept for backwards compatibility if needed
 */
export function calculatePlacementScore(
  wall: SpellWall,
  row: number,
  col: number
): number {
  const wallSize = wall.length;
  let score = 0;

  // Count horizontal adjacent runes
  let horizontalCount = 1;

  for (let c = col - 1; c >= 0; c--) {
    if (wall[row][c].rune !== null) {
      horizontalCount++;
    } else {
      break;
    }
  }

  for (let c = col + 1; c < wallSize; c++) {
    if (wall[row][c].rune !== null) {
      horizontalCount++;
    } else {
      break;
    }
  }

  // Count vertical adjacent runes
  let verticalCount = 1;

  for (let r = row - 1; r >= 0; r--) {
    if (wall[r][col].rune !== null) {
      verticalCount++;
    } else {
      break;
    }
  }

  for (let r = row + 1; r < wallSize; r++) {
    if (wall[r][col].rune !== null) {
      verticalCount++;
    } else {
      break;
    }
  }

  if (horizontalCount === 1 && verticalCount === 1) {
    score = 1;
  } else {
    if (horizontalCount > 1) score += horizontalCount;
    if (verticalCount > 1) score += verticalCount;
  }

  return score;
}

/**
 * Legacy round-based overload penalty helper.
 * @deprecated Overload damage now derives from game number progression.
 */
export function calculateOverloadPenalty(effectivePenalty: number, round: number): number {
  const normalizedPenalty = Math.max(0, effectivePenalty);
  const normalizedRound = Math.max(0, round);
  return normalizedPenalty + normalizedRound;
}

/**
 * Apply Frost mitigation to strain/stress (10% per mitigation point)
 */
export function applyStressMitigation(strain: number, mitigation: number): number {
  const mitigationFactor = Math.max(0, 1 - mitigation);
  const mitigatedStrain = strain * mitigationFactor;
  return Math.max(0, Math.round(mitigatedStrain * 10) / 10);
}

/**
 * Check if a row is complete (all positions filled)
 */
export function isRowComplete(wall: SpellWall, row: number): boolean {
  return wall[row].every((cell) => cell.rune !== null);
}

/**
 * Check if a column is complete (all positions filled)
 */
export function isColumnComplete(wall: SpellWall, col: number): boolean {
  return wall.every((row) => row[col].rune !== null);
}

/**
 * Check if all cells of a specific rune type are placed (wall-size total)
 */
export function isRuneTypeComplete(wall: SpellWall, runeType: RuneType): boolean {
  let count = 0;
  for (let row = 0; row < wall.length; row++) {
    for (let col = 0; col < wall[row].length; col++) {
      if (wall[row][col].runeType === runeType) {
        count++;
      }
    }
  }
  return count === wall.length;
}
