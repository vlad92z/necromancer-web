/**
 * Game initialization utilities
 */

import type {
  GameState,
  PlayerControllers,
  Player,
  Runeforge,
  PatternLine,
  ScoringWall,
  Rune,
  RuneType,
  RuneTypeCount,
  PlayerType,
} from '../types/game';

/**
 * Create an empty scoring wall (3x3, 4x4, or 5x5)
 */
export function createEmptyWall(size: number = 5): ScoringWall {
  return Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => ({ runeType: null }))
    );
}

/**
 * Create initial pattern lines (3, 4, or 5 lines, capacities 1-N)
 */
export function createPatternLines(count: number = 5): PatternLine[] {
  const lines: PatternLine[] = [];
  for (let i = 1; i <= count; i++) {
    lines.push({ tier: i as 1 | 2 | 3 | 4 | 5, runeType: null, count: 0 });
  }
  return lines;
}

/**
 * Get the rune types for a given rune type count
 * 3 types: Fire, Life, Wind
 * 4 types: Fire, Life, Wind, Frost
 * 5 types: Fire, Life, Wind, Frost, Void (note: Void is NOT included in 5-type according to issue)
 */
export function getRuneTypesForCount(count: RuneTypeCount): RuneType[] {
  if (count === 3) {
    return ['Fire', 'Life', 'Wind'];
  } else if (count === 4) {
    return ['Fire', 'Life', 'Wind', 'Frost'];
  } else {
    return ['Fire', 'Life', 'Wind', 'Frost', 'Void'];
  }
}

const DEFAULT_RUNES_PER_RUNEFORGE = 4;

export interface QuickPlayConfig {
  factoriesPerPlayer: number;
  totalRunesPerPlayer: number;
  runesPerRuneforge: number;
}

/**
 * Derive quick play sizing for factories and rune pool based on wall size.
 */
export function getQuickPlayConfig(runeTypeCount: RuneTypeCount): QuickPlayConfig {
  const factoriesPerPlayer = Math.max(1, runeTypeCount - 2);
  const totalRunesPerPlayer = 12 * factoriesPerPlayer;
  return {
    factoriesPerPlayer,
    totalRunesPerPlayer,
    runesPerRuneforge: DEFAULT_RUNES_PER_RUNEFORGE,
  };
}

/**
 * Create a mock player deck (for now, just basic runes)
 */
export function createMockDeck(
  playerId: string,
  runeTypeCount: RuneTypeCount = 5,
  totalRunesPerPlayer?: number
): Rune[] {
  const deck: Rune[] = [];
  const runeTypes = getRuneTypesForCount(runeTypeCount);
  const runesToGenerate = totalRunesPerPlayer ?? runeTypes.length * 8;
  const baseRunesPerType = Math.floor(runesToGenerate / runeTypes.length);
  let remainder = runesToGenerate - baseRunesPerType * runeTypes.length;

  runeTypes.forEach((runeType) => {
    const extra = remainder > 0 ? 1 : 0;
    const typeCount = baseRunesPerType + extra;
    remainder -= extra;

    for (let i = 0; i < typeCount; i++) {
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
export function createPlayer(
  id: string,
  name: string,
  type: PlayerType = 'human',
  startingHealth: number = 300,
  runeTypeCount: RuneTypeCount = 5,
  totalRunesPerPlayer?: number
): Player {
  return {
    id,
    name,
    type,
    patternLines: createPatternLines(runeTypeCount),
    wall: createEmptyWall(runeTypeCount),
    floorLine: {
      runes: [],
      maxCapacity: 10,
    },
    health: startingHealth,
    maxHealth: startingHealth,
    deck: createMockDeck(id, runeTypeCount, totalRunesPerPlayer),
  };
}

/**
 * Create empty runeforges for each player
 */
export function createEmptyFactories(players: [Player, Player], perPlayerCount: number): Runeforge[] {
  return players.flatMap((player) =>
    Array(perPlayerCount)
      .fill(null)
      .map((_, index) => ({
        id: `${player.id}-runeforge-${index + 1}`,
        ownerId: player.id,
        runes: [],
      }))
  );
}

/**
 * Fill runeforges with runes from their owner's deck
 * Each runeforge pulls only from its owning player's deck
 */
export function fillFactories(
  runeforges: Runeforge[],
  playerDecks: Record<string, Rune[]>,
  runesPerRuneforge: number = 4
): { runeforges: Runeforge[]; decksByPlayer: Record<string, Rune[]> } {
  const shuffledDecks: Record<string, Rune[]> = {};

  Object.entries(playerDecks).forEach(([playerId, deck]) => {
    shuffledDecks[playerId] = [...deck].sort(() => Math.random() - 0.5);
  });

  const filledRuneforges = runeforges.map((runeforge) => {
    const ownerDeck = shuffledDecks[runeforge.ownerId] ?? [];
    const runesToDeal = Math.min(ownerDeck.length, runesPerRuneforge);
    const runesForForge = ownerDeck.slice(0, runesToDeal);
    shuffledDecks[runeforge.ownerId] = ownerDeck.slice(runesToDeal);

    return {
      ...runeforge,
      runes: runesForForge,
    };
  });

  return {
    runeforges: filledRuneforges,
    decksByPlayer: shuffledDecks,
  };
}

/**
 * Initialize a new game state with filled factories
 * Always creates a PvE game (Player vs AI Opponent)
 */
export function initializeGame(startingHealth: number = 300, runeTypeCount: RuneTypeCount = 5): GameState {
  const playerControllers: PlayerControllers = {
    bottom: { type: 'human' },
    top: { type: 'computer', difficulty: 'normal' },
  };

  const quickPlayConfig = getQuickPlayConfig(runeTypeCount);

  const player1 = createPlayer(
    'player-1',
    'Player',
    'human',
    startingHealth,
    runeTypeCount,
    quickPlayConfig.totalRunesPerPlayer
  );
  const player2 = createPlayer(
    'player-2',
    'Opponent',
    'computer',
    startingHealth,
    runeTypeCount,
    quickPlayConfig.totalRunesPerPlayer
  );
  
  // Each player gets the configured number of personal runeforges
  const emptyFactories = createEmptyFactories([player1, player2], quickPlayConfig.factoriesPerPlayer);
  
  // Fill factories and get updated decks
  const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
    emptyFactories,
    {
      [player1.id]: player1.deck,
      [player2.id]: player2.deck,
    },
    quickPlayConfig.runesPerRuneforge
  );
  
  // Update player decks with remaining runes
  player1.deck = decksByPlayer[player1.id] ?? [];
  player2.deck = decksByPlayer[player2.id] ?? [];
  
  return {
    gameStarted: false,
    gameMode: 'standard', // Default to standard mode (will be set when starting game)
    runeTypeCount,
    factoriesPerPlayer: quickPlayConfig.factoriesPerPlayer,
    totalRunesPerPlayer: quickPlayConfig.totalRunesPerPlayer,
    runesPerRuneforge: quickPlayConfig.runesPerRuneforge,
    playerControllers,
    players: [player1, player2],
    runeforges: filledRuneforges,
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
    frozenPatternLines: {
      [player1.id]: [],
      [player2.id]: [],
    },
    shouldTriggerEndRound: false,
    scoringSnapshot: null,
  };
}
