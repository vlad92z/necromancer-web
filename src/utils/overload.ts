/**
 * Overload helpers - maps game number to overload damage per rune.
 */
export const OVERLOAD_DAMAGE_PROGRESSION: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 35, 40, 50, 60, 70, 80, 90, 100,
];

function getProgressionIndex(gameNumber: number, roundNumber: number): number {
  const normalizedGame = Math.max(1, Math.floor(gameNumber));
  const normalizedRound = Math.max(1, Math.floor(roundNumber));
  const baseIndex = Math.min(normalizedGame - 1, OVERLOAD_DAMAGE_PROGRESSION.length - 1);
  return Math.min(baseIndex + (normalizedRound - 1), OVERLOAD_DAMAGE_PROGRESSION.length - 1);
}

export function getOverloadDamageForRound(gameNumber: number, roundNumber: number): number {
  return OVERLOAD_DAMAGE_PROGRESSION[getProgressionIndex(gameNumber, roundNumber)];
}

export function getOverloadDamageForGame(gameNumber: number): number {
  return getOverloadDamageForRound(gameNumber, 1);
}
