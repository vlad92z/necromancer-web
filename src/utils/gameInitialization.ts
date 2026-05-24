/**
 * Game initialization utilities for hand-driven solo encounters.
 */

import type {
  Enemy,
  GameState,
  Player,
  Rune,
  RuneType,
  ScoringWall,
  SpellWallCharge,
  TooltipCard,
} from '../types/game';
import { createRune } from './runeEffects';
import goblinImageSrc from '../assets/enemies/goblin.png';

export const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
export const WALL_SIZE = RUNE_TYPES.length;
export const DEFAULT_HAND_SIZE = 6;
export const DEFAULT_ENEMY_MAX_HEALTH = 10;
export const DEFAULT_ENEMY_ATTACK_DAMAGE = 5;
export const ENEMY_SCALING_MULTIPLIER = 1.2;
export const ENEMY_HEALTH_ROUNDING_STEP = 5;

export function createEmptyWall(size: number = WALL_SIZE): ScoringWall {
  return Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => ({ runeType: null, rarity: null, castEffectRefs: null, passiveEffectRefs: null }))
    );
}

export function scaleEnemyMaxHealth(maxHealth: number): number {
  return Math.ceil((maxHealth * ENEMY_SCALING_MULTIPLIER) / ENEMY_HEALTH_ROUNDING_STEP) * ENEMY_HEALTH_ROUNDING_STEP;
}

export function scaleEnemyAttackDamage(attackDamage: number): number {
  return Math.ceil(attackDamage * ENEMY_SCALING_MULTIPLIER);
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
  const runeTypes = RUNE_TYPES.slice(0, size);
  return Array(size)
    .fill(null)
    .map((_, row) =>
      Array(size)
        .fill(null)
        .map((_, col) => ({
          row,
          col,
          runeType: runeTypes[(col - row + size) % size],
          requiredCount: row + 1,
          currentCount: 0,
          spentRunes: [],
          completedRuneId: null,
        }))
    );
}

export function getRuneTypes(): RuneType[] {
  return [...RUNE_TYPES];
}

export function createStartingDeck(totalRunes: number): Rune[] {
  const deck: Rune[] = [];
  const runeTypes = getRuneTypes();
  const baseRunesPerType = Math.floor(totalRunes / runeTypes.length);
  let remainder = totalRunes - baseRunesPerType * runeTypes.length;

  runeTypes.forEach((runeType) => {
    const extra = remainder > 0 ? 1 : 0;
    const typeCount = baseRunesPerType + extra;
    remainder -= extra;

    for (let i = 0; i < typeCount; i++) {
      deck.push(createRune(`player-1-${runeType}-${i}`, runeType, 'common'));
    }
  });

  return deck;
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
  fullDeck: Rune[] = createStartingDeck(25),
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
    enemy: createGoblinEnemy(enemyMaxHealth, enemyAttackDamage),
    combatPhase: 'player-turn',
    hand,
    discardPile: [],
    wallCharges: createEmptyWallCharges(WALL_SIZE),
    selectedHandRuneId: null,
  };
}
