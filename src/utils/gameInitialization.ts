/**
 * Game initialization utilities
 */

import type {
  GameState,
  Player,
  Runeforge,
  PatternLine,
  ScoringWall,
  Rune,
  RuneType,
  TooltipCard,
} from '../types/game';
import { getRuneEffectsForType } from './runeEffects';
import { getOverloadDamageForGame } from './overload';

export const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
const WALL_SIZE = RUNE_TYPES.length;

/**
 * Create an empty scoring wall (fixed 6x6)
 */
export function createEmptyWall(size: number = WALL_SIZE): ScoringWall {
  return Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => ({ runeType: null, effects: null }))
    );
}

/**
 * Create initial pattern lines (fixed 6 lines, capacities 1-6)
 */
export function createPatternLines(count: number = WALL_SIZE): PatternLine[] {
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
 * Get all rune types in the fixed order used by the game.
 */
export function getRuneTypes(): RuneType[] {
  return [...RUNE_TYPES];
}

export interface SoloSizingConfig {
  factoriesPerPlayer: number;
  totalRunesPerPlayer: number;
  runesPerRuneforge: number;
  overflowCapacity: number;
}

export interface SoloInitializationOptions {
  startingDeck?: Rune[];
  targetScore?: number;
  longestRun?: number;
}

/**
 * Derive solo sizing for factories and rune pool (fixed wall size).
 */
export function getSoloSizingConfig(): SoloSizingConfig {
  const baseSizing = {
    factoriesPerPlayer: 4,
    totalRunesPerPlayer: 48,
    overflowCapacity: 12,
  };
  return {
    ...baseSizing,
    runesPerRuneforge: 4,
  };
}

/**
 * Create a mock player deck (for now, just basic runes)
 */
export function createStartingDeck(
  totalRunesPerPlayer?: number
): Rune[] {
  const deck: Rune[] = [];
  const runeTypes = getRuneTypes();
  const runesToGenerate = totalRunesPerPlayer ?? runeTypes.length * 8;
  const baseRunesPerType = Math.floor(runesToGenerate / runeTypes.length);
  let remainder = runesToGenerate - baseRunesPerType * runeTypes.length;

  runeTypes.forEach((runeType) => {
    const extra = remainder > 0 ? 1 : 0;
    const typeCount = baseRunesPerType + extra;
    remainder -= extra;

    for (let i = 0; i < typeCount; i++) {
      deck.push({
        id: `player-1-${runeType}-${i}`,
        runeType,
        effects: getRuneEffectsForType(runeType),
      });
    }
  });
  
  return deck;
}

export function createDefaultTooltipCards(): TooltipCard[] {
  return [];
  // return Array.from({ length: 5 }, (_, index) => ({
  //   id: `life-rune-tooltip-${index + 1}`,
  //   runeType: 'Life',
  //   title: 'Life Rune',
  //   description: 'Healing +3',
  // }));
}

/**
 * Create a player
 */
export function createPlayer(
  id: string,
  name: string,
  startingHealth: number = 300,
  deck: Rune[],
  maxHealthOverride?: number,
): Player {
  return {
    id,
    name,
    patternLines: createPatternLines(WALL_SIZE),
    wall: createEmptyWall(WALL_SIZE),
    health: startingHealth,
    maxHealth: maxHealthOverride ?? startingHealth,
    armor: 0,
    deck: deck,
  };
}

/**
 * Create empty runeforges for each player
 */
export function createEmptyFactories(player: Player, perPlayerCount: number): Runeforge[] {
  return Array(perPlayerCount)
      .fill(null)
      .map((_, index) => ({
        id: `${player.id}-runeforge-${index + 1}`,
        ownerId: player.id,
        runes: [],
        disabled: false,
      }))
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
      disabled: false,
    }));
}

/**
 * Fill runeforges with runes from their owner's deck
 * Each runeforge pulls only from its owning player's deck
 */
export function fillFactories(
  runeforges: Runeforge[],
  deck: Rune[],
  runesPerRuneforge: number = 4
): { runeforges: Runeforge[]; deck: Rune[] } {
  let shuffledDeck = deck.sort(() => Math.random() - 0.5);
  const filledRuneforges = runeforges.map((runeforge) => {
    const runesToDeal = Math.min(shuffledDeck.length, runesPerRuneforge);
    const runesForForge = shuffledDeck.slice(0, runesToDeal);
    shuffledDeck = shuffledDeck.slice(runesToDeal);

    return {
      ...runeforge,
      runes: runesForForge,
      disabled: Boolean(runeforge.disabled),
    };
  });

  return {
    runeforges: filledRuneforges,
    deck: shuffledDeck,
  };
}

/**
 * Initialize a solo run using the fixed six-rune setup.
 */
export function initializeSoloGame(targetScore: number = 10, fullDeck: Rune[] = createStartingDeck(100)): GameState {
  // const soloConfig = normalizeSoloConfig(config);
  const initialGameNumber = 1;
  const startingStrain = getOverloadDamageForGame(initialGameNumber);
  const soloSizingConfig = getSoloSizingConfig();
  const soloRuneforgeCount = 5;
  const longestRun = 0; //TODO: why is this even needed?
  const soloMaxHealth = 100;

  const player = createPlayer(
    'player-1',
    'Arcane Apprentice',
    soloMaxHealth,
    fullDeck,
    soloMaxHealth,
  );
  const soloFactories = createSoloFactories(player, soloRuneforgeCount);
  const { runeforges: filledRuneforges, deck } = fillFactories(
    soloFactories,
    player.deck,
    soloSizingConfig.runesPerRuneforge
  );

  player.deck = deck;

  return {
    gameStarted: false,
    factoriesPerPlayer: soloRuneforgeCount,
    runesPerRuneforge: soloSizingConfig.runesPerRuneforge,
    startingHealth: player.maxHealth,
    overflowCapacity: soloSizingConfig.overflowCapacity,
    overloadDamage: startingStrain,
    startingStrain,
    player: player,
    fullDeck: fullDeck,
    runeforges: filledRuneforges.map((runeforge) => ({ ...runeforge, disabled: false })),
    runeforgeDraftStage: 'single',
    turnPhase: 'select',
    gameIndex: initialGameNumber,
    round: 1,
    tooltipCards: createDefaultTooltipCards(),
    tooltipOverrideActive: false,
    overloadRunes: [],
    animatingRunes: [],
    scoringSequence: null,
    pendingPlacement: null,
    overloadSoundPending: false,
    channelSoundPending: false,
    lockedPatternLines: [],
    shouldTriggerEndRound: false,
    runePowerTotal: 0,
    targetScore: targetScore,
    isDefeat: false,
    patternLineLock: true,
    longestRun,
    deckDraftState: null,
    baseTargetScore: 10,
    deckDraftReadyForNextGame: false,
    activeArtefacts: [],
  };
}
