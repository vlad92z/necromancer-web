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
import { SOLO_RUN_CONFIG } from './soloRunConfig';
import { create } from 'zustand';

export const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
const WALL_SIZE = RUNE_TYPES.length;

/**
 * Create an empty scoring wall (fixed 6x6)
 */
export function createEmptyWall(size: number = SOLO_RUN_CONFIG.wallSize): ScoringWall {
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
export function createPatternLines(count: number = SOLO_RUN_CONFIG.wallSize): PatternLine[] {
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

export interface SoloSizingConfig {
  factoriesPerPlayer: number;
  totalRunesPerPlayer: number;
  startingHealth: number;
  overflowCapacity: number;
}

/**
 * Create a mock player deck (for now, just basic runes)
 */
export function createStartingDeck(playerId: string = SOLO_RUN_CONFIG.playerId): Rune[] {
  const deck: Rune[] = [];

  RUNE_TYPES.forEach((runeType) => {
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
export function createRuneforges(playerId: string = SOLO_RUN_CONFIG.playerId): Runeforge[] {
  return Array(SOLO_RUN_CONFIG.runeforgeCount)
    .fill(null)
    .map((_, index) => ({
      id: `${playerId}-runeforge-${index + 1}`,
      ownerId: playerId,
      runes: [],
      disabled: false,
    }));
}

/**
 * Fill runeforges with runes from the player's deck TODO: Move this outside of game initialization
 */
export function fillRuneforges(runeforges: Runeforge[], deck: Rune[]): { runeforges: Runeforge[]; updatedDeck: Rune[] } {
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

function createPlayer(): Player {
  const config = SOLO_RUN_CONFIG
  return {
    id: config.playerId,
    name: config.playerName,
    patternLines: createPatternLines(),
    wall: createEmptyWall(),
    health: config.startingHealth,
    maxHealth: config.startingHealth,
    armor: config.startingArmor,
    deck: createStartingDeck(),
  };
}

export function nextGame(
  gameIndex: number = 0,
  player: Player = createPlayer(),
): GameState {
  const targetScore = SOLO_RUN_CONFIG.baseTargetScore * (gameIndex + 1);
  const runeforges = createRuneforges();
  const {
    runeforges: filledRuneforges,
    updatedDeck: updatedDeck
  } = fillRuneforges(runeforges, player.deck);
  player.deck = updatedDeck;
  return {
    gameStarted: false,
    strain: getOverloadDamageForGame(gameIndex),
    player: player,
    runeforges: filledRuneforges,
    runeforgeDraftStage: 'single',
    turnPhase: 'select',
    gameIndex: gameIndex,
    round: 0,
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
    lockedPatternLines: [],
    shouldTriggerEndRound: false,
    runePowerTotal: 0,
    targetScore: targetScore,
    outcome: null,
    longestRun: 122, //TODO WHY
    deckDraftState: null,
    baseTargetScore: 237,
    deckDraftReadyForNextGame: false,
    activeArtefacts: [],
    victoryDraftPicks: 1, //TODO rethink
  };
}
