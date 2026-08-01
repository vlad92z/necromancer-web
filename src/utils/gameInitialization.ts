/**
 * Game initialization utilities for hand-driven solo encounters.
 */

import type {
  Enemy,
  EnemyRune,
  GameState,
  MonsterId,
  Player,
  Rune,
  RuneType,
  ScoringWall,
} from '../types/game';
import { copyEffectRefs, createRuneFromCardName } from './runeEffects';
import type { CardName } from './cardCatalog';
import { MONSTER_CATALOG } from './monsterCatalog';
import { initializeSoloMap } from './soloMap';

export const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
export const WALL_SIZE = RUNE_TYPES.length;
export const DEFAULT_HAND_SIZE = 5;
export const DEFAULT_PLAYER_MANA = 7;
export const DEFAULT_ENEMY_MAX_HEALTH = MONSTER_CATALOG.goblin.maxHealth;
const STARTING_DECK_DEFINITIONS: Array<{ id: string; cardName: CardName }> = [
  { id: 'player-1-0', cardName: 'Firebolt' },
  { id: 'player-1-1', cardName: 'Firebolt' },
  { id: 'player-1-2', cardName: 'Barricade' },
  { id: 'player-1-3', cardName: 'Barricade' },
  { id: 'player-1-4', cardName: 'Tornado' },
  { id: 'player-1-5', cardName: 'Tornado' },
  { id: 'player-1-6', cardName: 'FrostShield' },
  { id: 'player-1-7', cardName: 'FrostShield' },
  { id: 'player-1-8', cardName: 'VoidTendrils' },
  { id: 'player-1-9', cardName: 'VoidTendrils' },
  { id: 'player-1-10', cardName: 'LightningBolt' },
  { id: 'player-1-11', cardName: 'LightningBolt' },
];

export const STARTING_DECK: Rune[] = STARTING_DECK_DEFINITIONS.map(({ id, cardName }) => createRuneFromCardName({ id, cardName }));

export function createEmptyWall(size: number = WALL_SIZE): ScoringWall {
  return Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => ({
          id: null,
          name: null,
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
  return createMonsterSpellBoard('goblin', size);
}

export function createMonsterSpellBoard(_monsterId: MonsterId, size: number = WALL_SIZE): ScoringWall {
  return createEmptyWall(size);
}

export function createGoblinEnemy(maxHealth: number = MONSTER_CATALOG.goblin.maxHealth): Enemy {
  return createMonsterEnemy('goblin', maxHealth);
}

export function createMonsterEnemy(monsterId: MonsterId, maxHealth?: number): Enemy {
  const monster = MONSTER_CATALOG[monsterId];
  const resolvedMaxHealth = maxHealth ?? monster.maxHealth;
  return {
    id: monster.id,
    name: monster.name,
    imageSrc: monster.imageSrc,
    isBoss: monster.isBoss,
    health: resolvedMaxHealth,
    maxHealth: resolvedMaxHealth,
    armor: monster.armor,
    arcaneDustRewardRange: monster.arcaneDustRewardRange,
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
  cardName: CardName,
  damage: number,
): EnemyRune {
  return {
    ...createRuneFromCardName({ id, cardName }),
    damage,
  };
}

export function createEnemyTurnRunes(monsterId: MonsterId, turnNumber: number): EnemyRune[] {
  const monster = MONSTER_CATALOG[monsterId];
  const turnCards = monster.turnCycle[turnNumber % monster.turnCycle.length] ?? [];
  return turnCards.map(({ idSuffix, cardName, damage }) => (
    createEnemyRune(`enemy-${turnNumber}-${idSuffix}`, cardName, damage)
  ));
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
    isVictory: false,
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
    pendingCombatResolution: null,
  };
}
