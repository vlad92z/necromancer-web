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
export function getRuneEffectDescription(runeType: RuneType, isClassicMode: boolean): string {
  if (isClassicMode) {
    return 'No special effect (Classic Mode)';
  }
  
  const descriptions: Record<RuneType, string> = {
    Fire: 'Each Fire rune on your wall adds +1 Essence',
    Frost: 'Each Frost rune on your wall restores 10 health during scoring',
    Life: 'Each Life rune on your wall restores 10 health during scoring',
    Void: 'Each Void rune on your wall adds +1 Essence',
    Wind: 'Each Wind rune on your wall restores 10 health during scoring',
    Lightning: 'Each Lightning rune on your wall adds +1 Essence',
  };
  return descriptions[runeType];
}
