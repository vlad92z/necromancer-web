/**
 * Game initialization utilities for hand-driven solo encounters.
 */

import type {
  Enemy,
  EnemyRune,
  GameState,
  Player,
  Rune,
  RuneType,
  ScoringWall,
} from '../types/game';
import { copyEffectRefs, getDefaultRuneName } from './runeEffects';
import { CURRENT_RUNE_IMAGE_SOURCES } from './runeImages';
import { getWallSlotRuneTypes } from './scoring';
import goblinImageSrc from '../assets/enemies/goblin.png';

export const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
export const WALL_SIZE = RUNE_TYPES.length;
export const DEFAULT_HAND_SIZE = 6;
export const DEFAULT_ENEMY_MAX_HEALTH = 7;
export const ENEMY_SCALING_MULTIPLIER = 1.35;
export const ENEMY_HEALTH_ROUNDING_STEP = 1;
const STARTING_DECK_DEFINITIONS: Array<Omit<Rune, 'name' | 'cardImageSrc' | 'tokenImageSrc'>> = [
  {
    id: 'player-1-Fire-0',
    runeTypes: ['Fire'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-1',
    runeTypes: ['Fire'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-2',
    runeTypes: ['Fire'],
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.damageAdjacent', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-3',
    runeTypes: ['Fire'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Fire-4',
    runeTypes: ['Fire'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-0',
    runeTypes: ['Life'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-1',
    runeTypes: ['Life'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-2',
    runeTypes: ['Life'],
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.healthIncrease', params: { amount: 4 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-3',
    runeTypes: ['Life'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Life-4',
    runeTypes: ['Life'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-0',
    runeTypes: ['Wind'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Fire' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-1',
    runeTypes: ['Wind'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Frost' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-2',
    runeTypes: ['Wind'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Lightning' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-3',
    runeTypes: ['Wind'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Void' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Wind-4',
    runeTypes: ['Wind'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Life' } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-0',
    runeTypes: ['Frost'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-1',
    runeTypes: ['Frost'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-2',
    runeTypes: ['Frost'],
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.armorAdjacent', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-3',
    runeTypes: ['Frost'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Frost-4',
    runeTypes: ['Frost'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-0',
    runeTypes: ['Void'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-1',
    runeTypes: ['Void'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-2',
    runeTypes: ['Void'],
    rarity: 'uncommon',
    castEffectRefs: [{ effectId: 'cast.damageConsuming', params: { amount: 2 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-3',
    runeTypes: ['Void'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Void-4',
    runeTypes: ['Void'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-0',
    runeTypes: ['Lightning'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-1',
    runeTypes: ['Lightning'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-2',
    runeTypes: ['Lightning'],
    rarity: 'uncommon',
    castEffectRefs: [],
    passiveEffectRefs: [{ effectId: 'passive.adjacentDamageBoost', params: { amount: 2 } }],
  },
  {
    id: 'player-1-Lightning-3',
    runeTypes: ['Lightning'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
  {
    id: 'player-1-Lightning-4',
    runeTypes: ['Lightning'],
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
    passiveEffectRefs: [],
  },
];

export const STARTING_DECK: Rune[] = STARTING_DECK_DEFINITIONS.map((rune) => ({
  ...rune,
  name: getDefaultRuneName(rune.runeTypes[0], rune.rarity),
  ...CURRENT_RUNE_IMAGE_SOURCES[rune.runeTypes[0]],
}));

export function createEmptyWall(size: number = WALL_SIZE): ScoringWall {
  return Array(size)
    .fill(null)
    .map((_, row) =>
      Array(size)
        .fill(null)
        .map((_, col) => ({
          id: null,
          name: null,
          acceptedRuneTypes: getWallSlotRuneTypes(row, col),
          runeTypes: [],
          rarity: null,
          cardImageSrc: null,
          tokenImageSrc: null,
          castEffectRefs: null,
          passiveEffectRefs: null,
        }))
    );
}

export function scaleEnemyMaxHealth(maxHealth: number): number {
  return Math.ceil((maxHealth * ENEMY_SCALING_MULTIPLIER) / ENEMY_HEALTH_ROUNDING_STEP) * ENEMY_HEALTH_ROUNDING_STEP;
}

export function createGoblinEnemy(maxHealth: number): Enemy {
  return {
    id: 'goblin',
    name: 'Goblin',
    imageSrc: goblinImageSrc,
    health: maxHealth,
    maxHealth,
  };
}

export function createEnemyLifeRune(id: string): EnemyRune {
  return {
    id,
    name: getDefaultRuneName('Life'),
    runeTypes: ['Life'],
    rarity: 'common',
    ...CURRENT_RUNE_IMAGE_SOURCES.Life,
    castEffectRefs: [],
    passiveEffectRefs: [],
    damage: 1,
  };
}

export function createEnemyTurnRunes(turnNumber: number): EnemyRune[] {
  return [0, 1, 2].map((index) => createEnemyLifeRune(`enemy-${turnNumber}-${index}`));
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
    runeTypes: [...rune.runeTypes],
    castEffectRefs: copyEffectRefs(rune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(rune.passiveEffectRefs),
  }));
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
): GameState {
  const maxHealth = 100;
  const deckTemplate = [...fullDeck];
  const activeDeck = shuffleRunes(deckTemplate);
  const hand = activeDeck.slice(0, DEFAULT_HAND_SIZE);
  const remainingDeck = activeDeck.slice(DEFAULT_HAND_SIZE);
  const player = createPlayer('player-1', 'Arcane Apprentice', maxHealth, remainingDeck, maxHealth);

  return {
    gameStarted: false,
    startingHealth: player.maxHealth,
    player,
    fullDeck: deckTemplate,
    gameIndex: 1,
    enemyMaxHealth,
    baseEnemyMaxHealth: DEFAULT_ENEMY_MAX_HEALTH,
    isDefeat: false,
    longestRun: 0,
    deckDraftState: null,
    deckDraftReadyForNextGame: false,
    activeArtefacts: [],
    runeSoundSignals: createRuneSoundSignals(),
    enemyAttackSoundSignal: 0,
    shieldSoundSignal: 0,
    enemy: createGoblinEnemy(enemyMaxHealth),
    combatPhase: 'player-turn',
    hand,
    discardPile: [],
    suppressedRunes: [],
    selectedHandRuneId: null,
    enemyBoard: createEmptyWall(WALL_SIZE),
    enemyQueuedRunes: [],
    enemyTurnNumber: 0,
  };
}
