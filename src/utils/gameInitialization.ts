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
import { copyEffectRefs, createRuneFromPool } from './runeEffects';
import { createEffectRef } from './effectCatalog';
import { HIDE_RUNE_IMAGE_SOURCES, THROW_ROCK_RUNE_IMAGE_SOURCES } from './runeImages';
import { getWallSlotRuneTypes } from './scoring';
import { initializeSoloMap } from './soloMap';
import goblinImageSrc from '../assets/enemies/goblin.png';

export const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
export const WALL_SIZE = RUNE_TYPES.length;
export const DEFAULT_HAND_SIZE = 5;
export const DEFAULT_PLAYER_MANA = 7;
export const DEFAULT_ENEMY_MAX_HEALTH = 20;
export const GOBLIN_ARCANE_DUST_REWARD_RANGE = [4, 7] as const;
const STARTING_DECK_DEFINITIONS: Array<Pick<Rune, 'id' | 'runeTypes' | 'rarity'>> = [
  {
    id: 'player-1-Fire-0',
    runeTypes: ['Fire'],
    rarity: 'common',
  },
  {
    id: 'player-1-Fire-1',
    runeTypes: ['Fire'],
    rarity: 'common',
  },
  {
    id: 'player-1-Life-0',
    runeTypes: ['Life'],
    rarity: 'common',
  },
  {
    id: 'player-1-Life-1',
    runeTypes: ['Life'],
    rarity: 'common',
  },
  {
    id: 'player-1-Wind-0',
    runeTypes: ['Wind'],
    rarity: 'common',
  },
  {
    id: 'player-1-Wind-1',
    runeTypes: ['Wind'],
    rarity: 'uncommon',
  },
  {
    id: 'player-1-Frost-0',
    runeTypes: ['Frost'],
    rarity: 'common',
  },
  {
    id: 'player-1-Frost-1',
    runeTypes: ['Frost'],
    rarity: 'common',
  },
  {
    id: 'player-1-Void-0',
    runeTypes: ['Void'],
    rarity: 'common',
  },
  {
    id: 'player-1-Void-1',
    runeTypes: ['Void'],
    rarity: 'common',
  },
  {
    id: 'player-1-Lightning-0',
    runeTypes: ['Lightning'],
    rarity: 'common',
  },
  {
    id: 'player-1-Lightning-1',
    runeTypes: ['Lightning'],
    rarity: 'common',
  },
];

export const STARTING_DECK: Rune[] = STARTING_DECK_DEFINITIONS.map((rune) => (
  createRuneFromPool({
    id: rune.id,
    runeType: rune.runeTypes[0],
    rarity: rune.rarity,
    random: () => 0,
  })
));

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
          manaCost: null,
          castEffectRefs: null,
          passiveEffectRefs: null,
        }))
    );
}

export function createEnemySpellBoard(size: number = WALL_SIZE): ScoringWall {
  return createEmptyWall(size).map((row) => row.map((cell) => ({
    ...cell,
    acceptedRuneTypes: ['Life'],
  })));
}

export function createGoblinEnemy(maxHealth: number): Enemy {
  return {
    id: 'goblin',
    name: 'Goblin',
    imageSrc: goblinImageSrc,
    health: maxHealth,
    maxHealth,
    armor: 0,
    arcaneDustRewardRange: GOBLIN_ARCANE_DUST_REWARD_RANGE,
    rewardRunePoolId: 'goblin',
  };
}

export function rollEnemyArcaneDustReward(enemy: Enemy | null, random: () => number = Math.random): number {
  const range = enemy?.arcaneDustRewardRange;
  if (!range) return 0;

  const [minimum, maximum] = range;
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function createEnemyRune(
  id: string,
  name: string,
  runeType: RuneType,
  rarity: Rune['rarity'],
  damage: number,
  imageSources: Pick<Rune, 'cardImageSrc' | 'tokenImageSrc'>,
  castEffectRefs: Rune['castEffectRefs'] = [],
  manaCost: number = 2,
): EnemyRune {
  const effectiveCastEffectRefs = castEffectRefs.length > 0
    ? castEffectRefs
    : damage > 0
      ? [createEffectRef('cast.damage', { amount: damage })]
      : [];

  return {
    id,
    name,
    runeTypes: [runeType],
    rarity,
    ...imageSources,
    manaCost,
    castEffectRefs: copyEffectRefs(effectiveCastEffectRefs),
    passiveEffectRefs: [],
    damage,
  };
}

export function createEnemyTurnRunes(turnNumber: number): EnemyRune[] {
  return [
    createEnemyRune(`enemy-${turnNumber}-throw-rock-0`, 'Throw Rock', 'Life', 'common', 3, THROW_ROCK_RUNE_IMAGE_SOURCES, [], 1),
    createEnemyRune(`enemy-${turnNumber}-throw-rock-1`, 'Throw Rock', 'Life', 'common', 3, THROW_ROCK_RUNE_IMAGE_SOURCES, [], 1),
    createEnemyRune(`enemy-${turnNumber}-throw-rock-2`, 'Throw Rock', 'Life', 'common', 3, THROW_ROCK_RUNE_IMAGE_SOURCES, [], 1),
    createEnemyRune(
      `enemy-${turnNumber}-hide`,
      'Hide',
      'Life',
      'common',
      0,
      HIDE_RUNE_IMAGE_SOURCES,
      [{ effectId: 'cast.armor', params: { amount: 3 } }],
      1,
    ),
  ];
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
    mana: DEFAULT_PLAYER_MANA,
    maxMana: DEFAULT_PLAYER_MANA,
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
    soloPhase: 'map',
    soloMap: initializeSoloMap(),
    startingHealth: player.maxHealth,
    player,
    fullDeck: deckTemplate,
    gameIndex: 1,
    arcaneDust: 0,
    enemyMaxHealth,
    isDefeat: false,
    longestRun: 0,
    deckDraftState: null,
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
    enemyBoard: createEnemySpellBoard(WALL_SIZE),
    enemyQueuedRunes: [],
    enemyTurnNumber: 0,
  };
}
