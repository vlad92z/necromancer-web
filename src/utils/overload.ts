import { SOLO_RUN_CONFIG } from "./soloRunConfig";

export function getOverloadDamageForRound(gameIndex: number, roundIndex: number): number {
  const overloadProgression = SOLO_RUN_CONFIG.overloadDamageProgression;
  const index = Math.min(gameIndex + roundIndex, overloadProgression.length - 1);
  return overloadProgression[index];
}

export function getOverloadDamageForGame(gameIndex: number): number {
  return getOverloadDamageForRound(gameIndex, 0);
}
