/**
 * Game initialization utilities for hand-driven solo encounters.
 */

import type {
  Enemy,
  GameState,
  Player,
  Rune,
  RuneEffectRarity,
  RuneType,
  ScoringWall,
  SpellWallCharge,
  TooltipCard,
} from '../types/game';
import { copyEffectRefs } from './runeEffects';
import { getWallSlotFamily } from './scoring';
import goblinImageSrc from '../assets/enemies/goblin.png';

export const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
export const WALL_SIZE = RUNE_TYPES.length;
export const DEFAULT_HAND_SIZE = 6;
export const DEFAULT_ENEMY_MAX_HEALTH = 7;
export const DEFAULT_ENEMY_ATTACK_DAMAGE = 3;
export const ENEMY_SCALING_MULTIPLIER = 1.35;
export const ENEMY_HEALTH_ROUNDING_STEP = 1;
export const STARTING_DECK: Rune[] = [
  {
    id: 'player-1-Fire-0',
    runeType: 'Fire',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-1',
    runeType: 'Fire',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-2',
    runeType: 'Fire',
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.damageAdjacent', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-3',
    runeType: 'Fire',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-4',
    runeType: 'Fire',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-0',
    runeType: 'Life',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-1',
    runeType: 'Life',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-2',
    runeType: 'Life',
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.healthIncrease', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-3',
    runeType: 'Life',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-4',
    runeType: 'Life',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-0',
    runeType: 'Wind',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Fire' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-1',
    runeType: 'Wind',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Frost' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-2',
    runeType: 'Wind',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Lightning' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-3',
    runeType: 'Wind',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Void' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-4',
    runeType: 'Wind',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Life' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-0',
    runeType: 'Frost',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-1',
    runeType: 'Frost',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-2',
    runeType: 'Frost',
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.armorAdjacent', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-3',
    runeType: 'Frost',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-4',
    runeType: 'Frost',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-0',
    runeType: 'Void',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-1',
    runeType: 'Void',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-2',
    runeType: 'Void',
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.damageConsuming', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-3',
    runeType: 'Void',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-4',
    runeType: 'Void',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-0',
    runeType: 'Lightning',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-1',
    runeType: 'Lightning',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-2',
    runeType: 'Lightning',
    rarity: 'uncommon',
    castEffectRefs: [],
    passiveEffectRefs: [{ effectId: 'passive.adjacentDamageBoost', params: { amount: 1 } }],
  },
  {
    id: 'player-1-Lightning-3',
    runeType: 'Lightning',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-4',
    runeType: 'Lightning',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
];

export function createEmptyWall(size: number = WALL_SIZE): ScoringWall {
  return Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => ({ id: null, runeType: null, rarity: null, castEffectRefs: null, passiveEffectRefs: null }))
    );
}

export function scaleEnemyMaxHealth(maxHealth: number): number {
  return Math.ceil((maxHealth * ENEMY_SCALING_MULTIPLIER) / ENEMY_HEALTH_ROUNDING_STEP) * ENEMY_HEALTH_ROUNDING_STEP;
}

export function scaleEnemyAttackDamage(attackDamage: number): number {
  return Math.ceil(attackDamage * ENEMY_SCALING_MULTIPLIER);
}

export function getRequiredChargesForRarity(rarity: RuneEffectRarity): number {
  switch (rarity) {
    case 'common':
      return 0;
    case 'uncommon':
      return 1;
    case 'rare':
      return 2;
    case 'epic':
      return 3;
  }
}

export function createGoblinEnemy(
  maxHealth: number,
  attackDamage: number = DEFAULT_ENEMY_ATTACK_DAMAGE
): Enemy {
  return {
    id: 'goblin',
    name: 'Goblin',
    imageSrc: goblinImageSrc,
    health: maxHealth,
    maxHealth,
    intent: { type: 'Attack', amount: attackDamage },
  };
}

export function createEmptyWallCharges(size: number = WALL_SIZE): SpellWallCharge[][] {
  return Array(size)
    .fill(null)
    .map((_, row) =>
      Array(size)
        .fill(null)
        .map((_, col) => ({
          row,
          col,
          slotFamily: getWallSlotFamily(row, col),
          lockedRuneType: null,
          requiredCount: 0,
          currentCount: 0,
          stagedRune: null,
          spentRunes: [],
          completedRuneId: null,
        }))
    );
}

export function getRuneTypes(): RuneType[] {
  return [...RUNE_TYPES];
}

export function createRuneSoundSignals(): Record<RuneType, number> {
  return RUNE_TYPES.reduce<Record<RuneType, number>>((signals, runeType) => {
    signals[runeType] = 0;
    return signals;
  }, {} as Record<RuneType, number>);
}

export function createStartingDeck(): Rune[] {
  return STARTING_DECK.map((rune) => ({
    ...rune,
    castEffectRefs: copyEffectRefs(rune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(rune.passiveEffectRefs),
  }));
}

export function createDefaultTooltipCards(): TooltipCard[] {
  return [];
}

export function createPlayer(
  id: string,
  name: string,
  startingHealth: number,
  deck: Rune[],
  maxHealth: number,
): Player {
  return {
    id,
    name,
    wall: createEmptyWall(WALL_SIZE),
    health: startingHealth,
    maxHealth,
    armor: 0,
    deck,
  };
}

function shuffleRunes(runes: Rune[]): Rune[] {
  return [...runes].sort(() => Math.random() - 0.5);
}

export function initializeSoloGame(
  enemyMaxHealth: number = DEFAULT_ENEMY_MAX_HEALTH,
  fullDeck: Rune[] = createStartingDeck(),
  enemyAttackDamage: number = DEFAULT_ENEMY_ATTACK_DAMAGE
): GameState {
  const maxHealth = 100;
  const activeDeck = shuffleRunes(fullDeck);
  const hand = activeDeck.slice(0, DEFAULT_HAND_SIZE);
  const remainingDeck = activeDeck.slice(DEFAULT_HAND_SIZE);
  const player = createPlayer('player-1', 'Arcane Apprentice', maxHealth, remainingDeck, maxHealth);

  return {
    gameStarted: false,
    startingHealth: player.maxHealth,
    player,
    fullDeck,
    gameIndex: 1,
    enemyMaxHealth,
    enemyAttackDamage,
    baseEnemyMaxHealth: DEFAULT_ENEMY_MAX_HEALTH,
    isDefeat: false,
    longestRun: 0,
    deckDraftState: null,
    deckDraftReadyForNextGame: false,
    activeArtefacts: [],
    runeSoundSignals: createRuneSoundSignals(),
    wallChargeSoundSignal: 0,
    enemyAttackSoundSignal: 0,
    shieldSoundSignal: 0,
    enemy: createGoblinEnemy(enemyMaxHealth, enemyAttackDamage),
    combatPhase: 'player-turn',
    hand,
    discardPile: [],
    suppressedRunes: [],
    wallCharges: createEmptyWallCharges(WALL_SIZE),
    selectedHandRuneId: null,
  };
}
