/**
 * Overload helpers - maps game number to overload damage per rune.
 */
export const OVERLOAD_DAMAGE_PROGRESSION: readonly number[] = [
  1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100,
];

export function getOverloadDamageForGame(gameNumber: number): number {
  const normalizedGame = Math.max(1, Math.floor(gameNumber));
  const index = Math.min(normalizedGame - 1, OVERLOAD_DAMAGE_PROGRESSION.length - 1);
  return OVERLOAD_DAMAGE_PROGRESSION[index];
}
