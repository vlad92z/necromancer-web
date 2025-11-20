/**
 * AI difficulty labels - align display names with actual strength
 */
import type { AIDifficulty } from '../types/game';

export const AI_DIFFICULTY_LABELS: Record<AIDifficulty, string> = {
  easy: 'Strong',
  normal: 'Normal',
  hard: 'Weak',
};

export function getAIDifficultyLabel(difficulty: AIDifficulty): string {
  return AI_DIFFICULTY_LABELS[difficulty] ?? 'Normal';
}
