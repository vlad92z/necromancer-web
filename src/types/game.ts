/**
 * Core game types for Massive Spell: Arcane Arena
 */

import type { Artefact, ArtefactId } from './artefacts';

export type RuneType = 'Fire' | 'Frost' | 'Life' | 'Void' | 'Wind' | 'Lightning';

export type RuneRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type RuneEffect =
  | { type: 'Damage'; amount: number }
  | { type: 'Healing'; amount: number }
  | { type: 'Synergy'; amount: number; synergyType: RuneType }
  | { type: 'Fortune'; amount: number }
  | { type: 'Fragile'; amount: number; fragileType: RuneType }
  | { type: 'Channel'; amount: number }
  | { type: 'ChannelSynergy'; amount: number; synergyType: RuneType }
  | { type: 'Armor'; amount: number }
  | { type: 'ArmorSynergy'; amount: number; synergyType: RuneType }

/**
 * A rune in the game
 */
export interface Rune {
  id: string;
  runeType: RuneType;
  effect: RuneEffect;
  rarity: RuneRarity;
}

export type DeckDraftEffect =
  | { type: 'heal'; amount: number }
  | { type: 'maxHealth'; amount: number }
  | { type: 'betterRunes'; rarityStep: number };

export type TooltipCardVariant = 'default' | 'nonPrimary' | 'overload';

export interface TooltipCard {
  id: string;
  title: string;
  description: string;
  runeRarity: RuneRarity;
  imageSrc: string;
  variant: TooltipCardVariant;
}

/**
 * A runeforge containing runes to select and cast
 */
export interface Runeforge {
  id: string;
  ownerId: Player['id'];
  runes: Rune[];
  disabled: boolean;
}

/**
 * A drafting runeforge for the the deck drafting phase
 */
export interface DraftRuneforge {
  id: string;
  runes: Rune[];
  deckDraftEffect: DeckDraftEffect;
}

/**
 * Pattern line (1-5 tiers, each requiring matching runes to complete)
 */
export interface PatternLine {
  capacity: number; // Line capacity (1-6 runes)
  runes: Rune[]; // Runes currently placed in this line
  isLocked: boolean;
}

/**
 * A position in the scoring wall/grid
 */
export interface SpellWallCell {
  runeType: RuneType;
  rune: Rune | null;
}

/**
 * The scoring grid/wall
 */
export type SpellWall = SpellWallCell[][];

export interface PlayerStats {
  currentHealth: number;
  maxHealth: number;
  currentArmor: number;
}

export interface RuneScore {
  current: number;
  target: number;
}

export interface Deck {
  remainingRunes: Rune[];
  allRunes: Rune[];
  overloadedRunes: Rune[];
}

/**
 * Contains information about the current state of an active game
 */
export interface SoloGameState {
  status: 'in-progress' | 'defeat' | 'not-started';
  playerStats: PlayerStats;
  runeScore: RuneScore;
  overloadDamage: number;
  activeArtefacts: Artefact[];
  deck: Deck;
  playerHand: Rune[];
  gameIndex: number;
  roundIndex: number;
  spellWall: SpellWall;
  patternLines: PatternLine[];
}

/**
 * Player state
 */
export interface Player {
  id: string;
  name: string;
  patternLines: PatternLine[];
  wall: SpellWall;
  health: number; // Current health (starts at configurable amount)
  maxHealth: number; // Maximum health cap (initialized at game start)
  armor: number; // Temporary shield that absorbs damage before health
  deck: Rune[]; // Player's deck of runes for this run
}

/**
 * Turn phase
 */
export type TurnPhase = 'select' | 'place' | 'cast' | 'scoring' | 'end-of-round' | 'deck-draft' | 'game-over';

/**
 * Animation state for rune movement
 */
export interface AnimatingRune {
  id: string;
  runeType: RuneType;
  rune: Rune;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size?: number;
  shouldDisappear?: boolean;
}

export interface ScoringStep {
  row: number;
  col: number;
  runeType: RuneType;
  damageDelta: number;
  healingDelta: number;
  arcaneDustDelta: number;
  armorDelta: number;
  delayMs: number;
}

export interface ScoringSequenceState {
  steps: ScoringStep[];
  activeIndex: number;
  sequenceId: number;
  startHealth: number;
  startArmor: number;
  startRunePowerTotal: number;
  startArcaneDust: number;
  maxHealth: number;
  displayHealth: number;
  displayArmor: number;
  displayRunePowerTotal: number;
  displayArcaneDust: number;
  targetHealth: number;
  targetArmor: number;
  targetRunePowerTotal: number;
  targetArcaneDust: number;
}

/**
 * Main game state
 */
export interface GameState {
  gameStarted: boolean; // Whether the game has been started (false shows start screen)
  player: Player;
  runeforges: Runeforge[];
  runeforgeDraftStage: 'single' | 'global';
  tooltipCards: TooltipCard[]; // Cards displayed in the tooltip view
  tooltipOverrideActive: boolean; // Force tooltipCards to show even when runes are selected TODO REMOVE
  turnPhase: TurnPhase;
  gameIndex: number; // Current game in this run (increments after each deck draft)
  round: number; // Current round number within the active game run
  overloadDamage: number;
  selectedRunes: Rune[]; // Runes currently selected by active player
  overloadRunes: Rune[]; // Runes that have been overloaded (placed on floor) during this game
  draftSource:
    | {
        type: 'runeforge';
        runeforgeId: string;
        movedToCenter: Rune[];
        originalRunes: Rune[];
        affectedRuneforges?: { runeforgeId: string; originalRunes: Rune[] }[];
        previousDisabledRuneforgeIds?: string[];
        previousRuneforgeDraftStage?: 'single' | 'global';
        selectionMode?: 'single' | 'global';
      }
    | null; // Where the selected runes came from (and original forge state)
  animatingRunes: AnimatingRune[]; // Runes currently being animated
  pendingPlacement: { patternLineIndex: number } | { floor: true } | null; // Placement action pending animation completion
  scoringSequence: ScoringSequenceState | null; // Active scoring pulses/sequence
  overloadSoundPending: boolean; // Flag to trigger overload damage SFX during placement
  channelSoundPending: boolean; // Flag to trigger lightning SFX when channel effects resolve
  selectionTimestamp: number | null; // When the current selection was made (ms since epoch)
  lockedPatternLines: number[]; // Pattern line indices locked until next round (solo toggle)
  shouldTriggerEndRound: boolean; // Flag to trigger endround in component useEffect //TODO NOT NEEDED
  runePowerTotal: number; // Solo score accumulator
  targetScore: number; // Solo target score required for victory
  isDefeat: boolean; // Solo result (victory/defeat)
  deckDraftState: DeckDraftState | null; // Deck drafting flow after victory
  baseTargetScore: number; // Configured starting target for reset scenarios //TODO remove
  deckDraftReadyForNextGame: boolean; // Indicates deck draft is done and waiting for player to start next run //TODO Needed?
  activeArtefacts: ArtefactId[]; // Artefacts active for this game run
  victoryDraftPicks: number; // Number of draft picks granted after a victory //TODO remove
}

export interface DeckDraftState {
  runeforges: DraftRuneforge[];
  picksRemaining: number;
  totalPicks: number;
  selectionLimit: number;
  selectionsThisOffer: number;
}
