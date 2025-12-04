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
  SoloRunConfig,
} from '../types/game';
import { getRuneEffectsForType } from './runeEffects';

const RUNE_ORDER: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];

/**
 * Create an empty scoring wall (3x3 up to 6x6)
 */
export function createEmptyWall(size: number = 5): ScoringWall {
  return Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => ({ runeType: null, effects: null }))
    );
}

/**
 * Create initial pattern lines (3, 4, or 5 lines, capacities 1-N)
 */
export function createPatternLines(count: number = 5): PatternLine[] {
  const lines: PatternLine[] = [];
  for (let i = 1; i <= count; i++) {
    lines.push({
      tier: i as PatternLine['tier'],
      runeType: null,
      count: 0,
      firstRuneId: null,
      firstRuneEffects: null,
    });
  }
  return lines;
}

/**
 * Get the rune types for a given rune type count
 * 3 types: Fire, Life, Wind
 * 4 types: Fire, Life, Wind, Frost
 * 5 types: Fire, Life, Wind, Frost, Void
 * 6 types: Fire, Life, Wind, Frost, Void, Lightning
 */
export function getRuneTypesForCount(count: RuneTypeCount): RuneType[] {
  const clampedCount = Math.min(RUNE_ORDER.length, Math.max(3, count));
  return RUNE_ORDER.slice(0, clampedCount) as RuneType[];
}

const DEFAULT_RUNES_PER_RUNEFORGE = 4;
export const DEFAULT_STARTING_STRAIN = 1;
export const DEFAULT_STRAIN_MULTIPLIER = 2;
const SOLO_STARTING_HEALTH = 100;
const SOLO_MAX_HEALTH = 100;
const SOLO_FACTORIES_PER_PLAYER = 5;
const DEFAULT_SOLO_RUNES_PER_TYPE = 15;
const DEFAULT_SOLO_TARGET_SCORE = 100;

export const DEFAULT_SOLO_CONFIG: SoloRunConfig = {
  startingHealth: SOLO_STARTING_HEALTH,
  startingStrain: DEFAULT_STARTING_STRAIN,
  strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
  factoriesPerPlayer: SOLO_FACTORIES_PER_PLAYER,
  deckRunesPerType: DEFAULT_SOLO_RUNES_PER_TYPE,
  targetRuneScore: DEFAULT_SOLO_TARGET_SCORE,
  patternLinesLockOnComplete: true,
};

export interface QuickPlayConfig {
  factoriesPerPlayer: number;
  totalRunesPerPlayer: number;
  runesPerRuneforge: number;
  startingHealth: number;
  overflowCapacity: number;
}

export interface SoloInitializationOptions {
  startingDeck?: Rune[];
  targetScore?: number;
  winStreak?: number;
}

export function normalizeSoloConfig(config?: Partial<SoloRunConfig>): SoloRunConfig {
  const merged = { ...DEFAULT_SOLO_CONFIG, ...config };

  return {
    startingHealth: Math.max(1, merged.startingHealth),
    startingStrain: Math.max(0, merged.startingStrain),
    strainMultiplier: Math.max(1, Math.min(2, merged.strainMultiplier)),
    factoriesPerPlayer: Math.min(6, Math.max(1, Math.round(merged.factoriesPerPlayer))),
    deckRunesPerType: Math.max(1, Math.round(merged.deckRunesPerType)),
    targetRuneScore: Math.max(1, Math.round(merged.targetRuneScore)),
    patternLinesLockOnComplete: Boolean(merged.patternLinesLockOnComplete),
  };
}

/**
 * Derive quick play sizing for factories and rune pool based on wall size.
 */
export function getQuickPlayConfig(runeTypeCount: RuneTypeCount): QuickPlayConfig {
  const sizingByBoardSize: Record<RuneTypeCount, { factoriesPerPlayer: number; totalRunesPerPlayer: number; startingHealth: number; overflowCapacity: number }> = {
    3: { factoriesPerPlayer: 2, totalRunesPerPlayer: 24, startingHealth: 25, overflowCapacity: 6 },
    4: { factoriesPerPlayer: 2, totalRunesPerPlayer: 24, startingHealth: 50, overflowCapacity: 8 },
    5: { factoriesPerPlayer: 3, totalRunesPerPlayer: 36, startingHealth: 100, overflowCapacity: 10 },
    6: { factoriesPerPlayer: 4, totalRunesPerPlayer: 48, startingHealth: 150, overflowCapacity: 12 },
  };

  const baseSizing = sizingByBoardSize[runeTypeCount];
  return {
    ...baseSizing,
    runesPerRuneforge: DEFAULT_RUNES_PER_RUNEFORGE,
  };
}

/**
 * Create a mock player deck (for now, just basic runes)
 */
export function createStartingDeck(
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
        effects: getRuneEffectsForType(runeType),
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
  totalRunesPerPlayer?: number,
  overflowCapacity?: number,
  maxHealthOverride?: number,
): Player {
  return {
    id,
    name,
    type,
    patternLines: createPatternLines(runeTypeCount),
    wall: createEmptyWall(runeTypeCount),
    floorLine: {
      runes: [],
      maxCapacity: overflowCapacity ?? 10,
    },
    health: startingHealth,
    maxHealth: maxHealthOverride ?? startingHealth,
    deck: createStartingDeck(id, runeTypeCount, totalRunesPerPlayer),
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
 * Create runeforges for a solo run (only the human player gets runeforges)
 */
export function createSoloFactories(player: Player, perPlayerCount: number): Runeforge[] {
  return Array(perPlayerCount)
    .fill(null)
    .map((_, index) => ({
      id: `${player.id}-runeforge-${index + 1}`,
      ownerId: player.id,
      runes: [],
    }));
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
export function initializeGame(runeTypeCount: RuneTypeCount = 5): GameState {
  const playerControllers: PlayerControllers = {
    bottom: { type: 'human' },
    top: { type: 'computer', difficulty: 'normal' },
  };

  const quickPlayConfig = getQuickPlayConfig(runeTypeCount);

  const player1 = createPlayer(
    'player-1',
    'Player',
    'human',
    quickPlayConfig.startingHealth,
    runeTypeCount,
    quickPlayConfig.totalRunesPerPlayer,
    quickPlayConfig.overflowCapacity
  );
  const player2 = createPlayer(
    'player-2',
    'Opponent',
    'computer',
    quickPlayConfig.startingHealth,
    runeTypeCount,
    quickPlayConfig.totalRunesPerPlayer,
    quickPlayConfig.overflowCapacity
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
    matchType: 'versus',
    runeTypeCount,
    factoriesPerPlayer: quickPlayConfig.factoriesPerPlayer,
    totalRunesPerPlayer: quickPlayConfig.totalRunesPerPlayer,
    runesPerRuneforge: quickPlayConfig.runesPerRuneforge,
    startingHealth: quickPlayConfig.startingHealth,
    overflowCapacity: quickPlayConfig.overflowCapacity,
    strain: DEFAULT_STARTING_STRAIN,
    strainMultiplier: DEFAULT_STRAIN_MULTIPLIER,
    soloStartingStrain: DEFAULT_STARTING_STRAIN,
    soloDeckTemplate: [],
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
    roundHistory: [],
    roundDamage: [0, 0],
    voidEffectPending: false,
    frostEffectPending: false,
    frozenPatternLines: {
      [player1.id]: [],
      [player2.id]: [],
    },
    lockedPatternLines: {
      [player1.id]: [],
      [player2.id]: [],
    },
    shouldTriggerEndRound: false,
    runePowerTotal: 0,
    soloTargetScore: 0,
    soloOutcome: null,
    soloPatternLineLock: false,
    soloWinStreak: 0,
    deckDraftState: null,
    soloBaseTargetScore: 0,
  };
}

/**
 * Initialize a solo run with the same board sizing options as quick play
 */
export function initializeSoloGame(
  runeTypeCount: RuneTypeCount = 5,
  config?: Partial<SoloRunConfig>,
  options?: SoloInitializationOptions
): GameState {
  const playerControllers: PlayerControllers = {
    bottom: { type: 'human' },
    top: { type: 'human' },
  };

  const soloConfig = normalizeSoloConfig(config);
  const quickPlayConfig = getQuickPlayConfig(runeTypeCount);
  const soloRuneforgeCount = soloConfig.factoriesPerPlayer;
  const targetScore = options?.targetScore ?? soloConfig.targetRuneScore;
  const soloDeckSize = options?.startingDeck?.length ?? soloConfig.deckRunesPerType * runeTypeCount;
  const winStreak = options?.winStreak ?? 0;
  const soloMaxHealth = Math.max(SOLO_MAX_HEALTH, soloConfig.startingHealth);

  const soloPlayer = createPlayer(
    'player-1',
    'Arcane Apprentice',
    'human',
    soloConfig.startingHealth,
    runeTypeCount,
    soloDeckSize,
    quickPlayConfig.overflowCapacity,
    soloMaxHealth,
  );
  if (options?.startingDeck) {
    soloPlayer.deck = [...options.startingDeck];
  }
  const startingDeckTemplate = [...soloPlayer.deck];

  const echoPlayer = createPlayer(
    'solo-echo',
    'Echo',
    'human',
    soloConfig.startingHealth,
    runeTypeCount,
    0,
    quickPlayConfig.overflowCapacity,
    soloMaxHealth,
  );
  echoPlayer.deck = [];

  const soloFactories = createSoloFactories(soloPlayer, soloRuneforgeCount);
  const { runeforges: filledRuneforges, decksByPlayer } = fillFactories(
    soloFactories,
    {
      [soloPlayer.id]: soloPlayer.deck,
    },
    quickPlayConfig.runesPerRuneforge
  );

  soloPlayer.deck = decksByPlayer[soloPlayer.id] ?? [];

  return {
    gameStarted: false,
    matchType: 'solo',
    runeTypeCount,
    factoriesPerPlayer: soloRuneforgeCount,
    totalRunesPerPlayer: soloDeckSize,
    runesPerRuneforge: quickPlayConfig.runesPerRuneforge,
    startingHealth: soloConfig.startingHealth,
    overflowCapacity: quickPlayConfig.overflowCapacity,
    strain: soloConfig.startingStrain,
    strainMultiplier: soloConfig.strainMultiplier,
    soloStartingStrain: soloConfig.startingStrain,
    playerControllers,
    players: [soloPlayer, echoPlayer],
    soloDeckTemplate: startingDeckTemplate,
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
    roundHistory: [],
    roundDamage: [0, 0],
    voidEffectPending: false,
    frostEffectPending: false,
    frozenPatternLines: {
      [soloPlayer.id]: [],
      [echoPlayer.id]: [],
    },
    lockedPatternLines: {
      [soloPlayer.id]: [],
      [echoPlayer.id]: [],
    },
    shouldTriggerEndRound: false,
    runePowerTotal: 0,
    soloTargetScore: targetScore,
    soloOutcome: null,
    soloPatternLineLock: soloConfig.patternLinesLockOnComplete,
    soloWinStreak: winStreak,
    deckDraftState: null,
    soloBaseTargetScore: soloConfig.targetRuneScore,
  };
}
