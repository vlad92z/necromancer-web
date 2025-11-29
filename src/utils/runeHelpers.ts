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
    Frost: 'Each Frost rune on your wall reduces next round\'s strain growth by 10%',
    Life: 'Each Life rune on your wall heals you every round',
    Void: 'Each Void rune adds 10% of projected incoming damage to your spellpower',
    Wind: 'Wind runes on your wall cancel one floor penalty each (completed Wind lines count immediately)',
    Lightning: 'Each Lightning rune on your wall adds +1 Essence',
  };
  return descriptions[runeType];
}
