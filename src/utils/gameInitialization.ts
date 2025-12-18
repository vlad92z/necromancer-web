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
  startingHealth: number;
  overflowCapacity: number;
}

/**
 * Create a mock player deck (for now, just basic runes)
 */
export function createStartingDeck(playerId: string): Rune[] {
  const deck: Rune[] = [];
  const runeTypes = getRuneTypes();

  runeTypes.forEach((runeType) => {
    for (let i = 0; i <= 15; i++) {
      deck.push({
        id: `${playerId}-${runeType}-${i}`,
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
 * Fill runeforges with runes from the player's deck TODO: Move this outside of game initialization
 */
export function fillFactories(runeforges: Runeforge[], deck: Rune[]): { runeforges: Runeforge[]; updatedDeck: Rune[] } {
  let shuffledDeck = deck.sort(() => Math.random() - 0.5);
  const filledRuneforges = runeforges.map((runeforge) => {
    const runesToDeal = Math.min(shuffledDeck.length, 4);
    const runesForForge = shuffledDeck.slice(0, runesToDeal);
    shuffledDeck = shuffledDeck.slice(runesToDeal);

    return {
      ...runeforge,
      runes: runesForForge,
      disabled: Boolean(runeforge.disabled),
    };
  });
  console.log('Filled runeforges:', filledRuneforges.map(r => r.runes.map(rn => rn.id)));
  return { runeforges: filledRuneforges, updatedDeck: shuffledDeck, };
}

/**
 * Initialize a solo run using the fixed six-rune setup.
 */
export function initializeSoloGame(): GameState {
  const initialGameNumber = 1;
  const startingStrain = getOverloadDamageForGame(initialGameNumber);
  const targetScore = 12;
  const longestRun = 0; //TODO: Why does this matter?

  const soloPlayer: Player = {
    id: 'player-1',
    name: 'Arcane Apprentice',
    patternLines: createPatternLines(), // TODO is this complexity necessary?
    wall: createEmptyWall(), // TODO same here maybe?
    health: 666,
    maxHealth: 667,
    armor: -1,
    deck: createStartingDeck('player-1'),
  };

  const soloFactories = createSoloFactories(soloPlayer, 5);
  const { runeforges: filledRuneforges, updatedDeck } = fillFactories(soloFactories, soloPlayer.deck);

  soloPlayer.deck = updatedDeck;

  return {
    gameStarted: false,
    strain: startingStrain,
    player: soloPlayer,
    runeforges: filledRuneforges.map((runeforge) => ({ ...runeforge, disabled: false })),
    runeforgeDraftStage: 'single',
    turnPhase: 'select',
    game: initialGameNumber,
    round: 1,
    tooltipCards: createDefaultTooltipCards(),
    tooltipOverrideActive: false,
    selectedRunes: [],
    overloadRunes: [],
    selectionTimestamp: null,
    draftSource: null,
    animatingRunes: [],
    scoringSequence: null,
    pendingPlacement: null,
    overloadSoundPending: false,
    channelSoundPending: false,
    lockedPatternLines: {
      [soloPlayer.id]: []
    },
    shouldTriggerEndRound: false,
    runePowerTotal: 0,
    targetScore: targetScore,
    outcome: null,
    longestRun,
    deckDraftState: null,
    baseTargetScore: 237,
    deckDraftReadyForNextGame: false,
    activeArtefacts: [],
    victoryDraftPicks: 1, //TODO rethink
  };
}
