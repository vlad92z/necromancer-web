import type { Rune, ScoringWall, SpellWallCharge } from '../types/game';
import { copyEffectRefs } from './runeEffects';

export interface ChargeCompletionPosition {
  row: number;
  col: number;
}

export interface VirtualChargeCompletionInput {
  wall: ScoringWall;
  wallCharges: SpellWallCharge[][];
  position: ChargeCompletionPosition;
  createCompletedRuneId?: (rune: Rune, position: ChargeCompletionPosition) => string;
}

export interface VirtualChargeCompletionResult {
  wall: ScoringWall;
  wallCharges: SpellWallCharge[][];
  completedRune: Rune;
  discardedRunes: Rune[];
  position: ChargeCompletionPosition;
}

function cloneRune(rune: Rune): Rune {
  return {
    ...rune,
    castEffectRefs: copyEffectRefs(rune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(rune.passiveEffectRefs),
  };
}

function cloneWall(wall: ScoringWall): ScoringWall {
  return wall.map((row) => row.map((cell) => ({
    id: cell.id,
    runeType: cell.runeType,
    rarity: cell.rarity,
    castEffectRefs: cell.castEffectRefs ? copyEffectRefs(cell.castEffectRefs) : null,
    passiveEffectRefs: cell.passiveEffectRefs ? copyEffectRefs(cell.passiveEffectRefs) : null,
  })));
}

function cloneWallCharges(wallCharges: SpellWallCharge[][]): SpellWallCharge[][] {
  return wallCharges.map((row) => row.map((charge) => ({
    ...charge,
    stagedRune: charge.stagedRune ? cloneRune(charge.stagedRune) : null,
    spentRunes: charge.spentRunes.map(cloneRune),
  })));
}

export function createCompletedRuneId(rune: Rune, position: ChargeCompletionPosition): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `${rune.id}-wall-${position.row}-${position.col}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function completeVirtualChargeAtPosition({
  wall,
  wallCharges,
  position,
  createCompletedRuneId: createId = createCompletedRuneId,
}: VirtualChargeCompletionInput): VirtualChargeCompletionResult | null {
  const charge = wallCharges[position.row]?.[position.col];
  const stagedRune = charge?.stagedRune;

  if (!charge || !stagedRune || charge.completedRuneId || charge.currentCount < charge.requiredCount) {
    return null;
  }

  const completedRuneId = createId(stagedRune, position);
  const completedRune: Rune = {
    ...cloneRune(stagedRune),
    id: completedRuneId,
  };
  const nextWall = cloneWall(wall);
  const nextWallCharges = cloneWallCharges(wallCharges);

  nextWall[position.row][position.col] = {
    id: completedRune.id,
    runeType: completedRune.runeType,
    rarity: completedRune.rarity,
    castEffectRefs: copyEffectRefs(completedRune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(completedRune.passiveEffectRefs),
  };
  nextWallCharges[position.row][position.col] = {
    ...nextWallCharges[position.row][position.col],
    lockedRuneType: charge.lockedRuneType ?? stagedRune.runeType,
    requiredCount: charge.requiredCount,
    currentCount: charge.requiredCount,
    stagedRune: null,
    spentRunes: [],
    completedRuneId,
  };

  return {
    wall: nextWall,
    wallCharges: nextWallCharges,
    completedRune,
    discardedRunes: [cloneRune(stagedRune), ...charge.spentRunes.map(cloneRune)],
    position,
  };
}