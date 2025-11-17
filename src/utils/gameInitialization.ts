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
  PlayerType,
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
    for (let i = 0; i < 8; i++) {
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
export function createPlayer(id: string, name: string, type: PlayerType = 'human'): Player {
  return {
    id,
    name,
    type,
    patternLines: createPatternLines(),
    wall: createEmptyWall(),
    floorLine: {
      runes: [],
      maxCapacity: 9,
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
 * Fill factories with runes from player decks
 * Each factory gets 4 runes: 2 from player 1's deck and 2 from player 2's deck
 * Returns both filled factories and updated decks
 */
export function fillFactories(
  factories: Factory[], 
  deck1: Rune[], 
  deck2: Rune[]
): { factories: Factory[], deck1: Rune[], deck2: Rune[] } {
  // Shuffle each deck separately
  const shuffledDeck1 = [...deck1].sort(() => Math.random() - 0.5);
  const shuffledDeck2 = [...deck2].sort(() => Math.random() - 0.5);
  
  const filledFactories = factories.map((factory, index) => {
    // Get 2 runes from each player's deck
    const startIdx = index * 2;
    const runesFromPlayer1 = shuffledDeck1.slice(startIdx, startIdx + 2);
    const runesFromPlayer2 = shuffledDeck2.slice(startIdx, startIdx + 2);
    
    // Combine and shuffle the 4 runes for this factory
    const runes = [...runesFromPlayer1, ...runesFromPlayer2].sort(() => Math.random() - 0.5);
    
    return {
      ...factory,
      runes,
    };
  });
  
  // Remove used runes from decks (10 runes total: 2 per factory × 5 factories)
  const runesUsed = factories.length * 2;
  const remainingDeck1 = shuffledDeck1.slice(runesUsed);
  const remainingDeck2 = shuffledDeck2.slice(runesUsed);
  
  return {
    factories: filledFactories,
    deck1: remainingDeck1,
    deck2: remainingDeck2,
  };
}

/**
 * Initialize a new game state with filled factories
 * Always creates a PvE game (Player vs AI Opponent)
 */
export function initializeGame(): GameState {
  const player1 = createPlayer('player-1', 'Player', 'human');
  const player2 = createPlayer('player-2', 'Opponent', 'ai');
  
  // For 2 players, Azul uses 5 factories
  const emptyFactories = createEmptyFactories(5);
  
  // Fill factories and get updated decks
  const { factories: filledFactories, deck1, deck2 } = fillFactories(emptyFactories, player1.deck, player2.deck);
  
  // Update player decks with remaining runes
  player1.deck = deck1;
  player2.deck = deck2;
  
  return {
    gameStarted: false,
    players: [player1, player2],
    factories: filledFactories,
    centerPool: [],
    currentPlayerIndex: 0,
    turnPhase: 'draft',
    round: 1,
    selectedRunes: [],
    draftSource: null,
    firstPlayerToken: null,
    animatingRunes: [],
    pendingPlacement: null,
    scoringPhase: null,
    roundHistory: [],
    voidEffectPending: false,
    frostEffectPending: false,
    frozenFactories: [],
  };
}
