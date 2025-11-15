/**
 * Game initialization utilities
 */

import type {
  GameState,
  Player,
  Factory,
  PatternLine,
  ScoringWall,
  Rune,
  RuneType,
} from '../types/game';

/**
 * Create an empty 5x5 scoring wall
 */
export function createEmptyWall(): ScoringWall {
  return Array(5)
    .fill(null)
    .map(() =>
      Array(5)
        .fill(null)
        .map(() => ({ runeType: null }))
    );
}

/**
 * Create initial pattern lines (5 lines, capacities 1-5)
 */
export function createPatternLines(): PatternLine[] {
  return [
    { tier: 1, runeType: null, count: 0 },
    { tier: 2, runeType: null, count: 0 },
    { tier: 3, runeType: null, count: 0 },
    { tier: 4, runeType: null, count: 0 },
    { tier: 5, runeType: null, count: 0 },
  ];
}

/**
 * Create a mock player deck (for now, just basic runes)
 */
export function createMockDeck(playerId: string): Rune[] {
  const deck: Rune[] = [];
  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Poison', 'Void', 'Wind'];
  
  // Create 4 of each rune type (20 total per player)
  runeTypes.forEach((runeType) => {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `${playerId}-${runeType}-${i}`,
        runeType,
        effect: { type: 'None' },
      });
    }
  });
  
  return deck;
}

/**
 * Create a player
 */
export function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    patternLines: createPatternLines(),
    wall: createEmptyWall(),
    floorLine: {
      runes: [],
      maxCapacity: 7,
    },
    score: 0,
    deck: createMockDeck(id),
  };
}

/**
 * Create empty factories (for static rendering, no runes yet)
 */
export function createEmptyFactories(count: number): Factory[] {
  return Array(count)
    .fill(null)
    .map((_, index) => ({
      id: `factory-${index}`,
      runes: [],
    }));
}

/**
 * Fill factories with runes from the combined player decks
 * Each factory gets 4 runes (standard Azul rules)
 */
export function fillFactories(factories: Factory[], combinedDeck: Rune[]): Factory[] {
  const shuffled = [...combinedDeck].sort(() => Math.random() - 0.5);
  
  return factories.map((factory, index) => {
    const startIdx = index * 4;
    const runes = shuffled.slice(startIdx, startIdx + 4);
    return {
      ...factory,
      runes,
    };
  });
}

/**
 * Initialize a new game state with filled factories
 */
export function initializeGame(): GameState {
  const player1 = createPlayer('player-1', 'Player 1');
  const player2 = createPlayer('player-2', 'Player 2');
  
  // For 2 players, Azul uses 5 factories
  const emptyFactories = createEmptyFactories(5);
  
  // Combine player decks and fill factories (4 runes per factory)
  const combinedDeck = [...player1.deck, ...player2.deck];
  const factories = fillFactories(emptyFactories, combinedDeck);
  
  return {
    players: [player1, player2],
    factories,
    centerPool: [],
    currentPlayerIndex: 0,
    turnPhase: 'draft',
    round: 1,
    selectedRunes: [],
    firstPlayerToken: null,
  };
}
