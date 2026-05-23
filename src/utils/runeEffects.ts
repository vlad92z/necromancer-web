/**
 * runeEffects - temporary Stage 1 helpers for rune effect refs and rarity.
 */

import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';

export function getRuneCastEffectRefsForType(_runeType: RuneType, _rarity: RuneEffectRarity = 'common'): EffectRef[] {
  void _runeType;
  void _rarity;
  return [];
}

export function getRunePassiveEffectRefsForType(_runeType: RuneType, _rarity: RuneEffectRarity = 'common'): EffectRef[] {
  void _runeType;
  void _rarity;
  return [];
}

export function copyEffectRefs(effectRefs: EffectRef[] | null | undefined): EffectRef[] {
  if (!effectRefs) {
    return [];
  }
  return effectRefs.map((effectRef) => ({
    effectId: effectRef.effectId,
    ...(effectRef.params ? { params: { ...effectRef.params } } : {}),
  }));
}

export function createRune(
  id: string,
  runeType: RuneType,
  rarity: RuneEffectRarity = 'common'
): Rune {
  return {
    id,
    runeType,
    rarity,
    castEffectRefs: getRuneCastEffectRefsForType(runeType, rarity),
    passiveEffectRefs: getRunePassiveEffectRefsForType(runeType, rarity),
  };
}

export function getRuneEffectDescription(rune: Rune | null | undefined): string {
  if (!rune || rune.castEffectRefs.length === 0 && rune.passiveEffectRefs.length === 0) {
    return '';
  }

  return 'Effect details coming soon';
}

export function getRuneRarity(rune: Rune | null | undefined): RuneEffectRarity | null {
  return rune?.rarity ?? null;
}
