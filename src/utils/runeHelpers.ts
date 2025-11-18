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

/**
 * Get the effect description for a rune type
 */
export function getRuneEffectDescription(runeType: RuneType, isClassicMode: boolean): string {
  if (isClassicMode) {
    return 'No special effect (Classic Mode)';
  }
  
  const descriptions: Record<RuneType, string> = {
    Fire: 'Each Fire rune on your wall adds +1 Essence',
    Frost: 'Freeze one runeforge when placing',
    Poison: 'Each Poison rune reduces opponent Focus by 1',
    Void: 'Destroy all runes in one runeforge when placing',
    Wind: 'In floor line: cancels one other penalty',
  };
  return descriptions[runeType];
}
