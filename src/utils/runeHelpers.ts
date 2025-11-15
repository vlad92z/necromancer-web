/**
 * Rune utility functions
 */

import type { RuneType } from '../types/game';

/**
 * Get the glyph/emoji for a rune type
 */
export function getRuneGlyph(runeType: RuneType): string {
  const glyphs: Record<RuneType, string> = {
    Fire: '🔥',
    Frost: '❄️',
    Poison: '☠️',
    Void: '🌀',
    Wind: '💨',
  };
  return glyphs[runeType];
}

/**
 * Get the Tailwind color class for a rune type
 */
export function getRuneColorClass(runeType: RuneType): string {
  const colors: Record<RuneType, string> = {
    Fire: 'bg-red-500',
    Frost: 'bg-blue-500',
    Poison: 'bg-green-500',
    Void: 'bg-purple-700',
    Wind: 'bg-yellow-400',
  };
  return colors[runeType];
}
