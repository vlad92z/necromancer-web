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
    Life: '💚',
    Void: '🌀',
    Wind: '💨',
    Lightning: '⚡',
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
    Life: 'bg-green-500',
    Void: 'bg-purple-700',
    Wind: 'bg-yellow-400',
    Lightning: 'bg-cyan-300',
  };
  return colors[runeType];
}

/**
 * Get the effect description for a rune type
 */
export function getRuneEffectDescription(runeType: RuneType): string {  
  const descriptions: Record<RuneType, string> = {
    Fire: 'Fire Rune',
    Frost: 'Frost Rune',
    Life: 'Life Rune',
    Void: 'Void Rune',
    Wind: 'Wind Rune',
    Lightning: 'Lightning Rune',
  };
  return descriptions[runeType];
}
