import { SOLO_RUN_CONFIG } from "./soloRunConfig";
import type { PlayerStats, Rune } from "../types/game";

export function getOverloadDamageForRound(gameIndex: number, roundIndex: number): number {
  const overloadProgression = SOLO_RUN_CONFIG.overloadDamageProgression;
  const index = Math.min(gameIndex + roundIndex, overloadProgression.length - 1);
  return overloadProgression[index];
}

export function getOverloadDamageForGame(gameIndex: number): number {
  return getOverloadDamageForRound(gameIndex, 0);
}

/**
 * applySoloOverloadDamage - apply overflow damage to player stats.
 */
export function applySoloOverloadDamage(
  playerStats: PlayerStats,
  overflowRunes: Rune[],
  overloadDamagePerRune: number
): { nextStats: PlayerStats; appliedDamage: number } {
  if (overflowRunes.length === 0) {
    return { nextStats: playerStats, appliedDamage: 0 };
  }

  const baseDamage = overflowRunes.length * overloadDamagePerRune;
  const armorAbsorbed = Math.min(playerStats.currentArmor, baseDamage);
  const remainingDamage = baseDamage - armorAbsorbed;
  const nextArmor = playerStats.currentArmor - armorAbsorbed;
  const nextHealth = Math.max(0, playerStats.currentHealth - remainingDamage);

  return {
    nextStats: {
      ...playerStats,
      currentArmor: nextArmor,
      currentHealth: nextHealth,
    },
    appliedDamage: remainingDamage,
  };
}
