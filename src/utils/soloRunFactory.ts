import type { CombatZoneState, GameState, MonsterId, Player, Rune, RuneType } from '../types/game';
import type { CardName } from './cardCatalog';
import { createMonsterEnemy } from './monsterFactory';
import { copyEffectRefs, createRuneFromCardName } from './runeEffects';
import { initializeSoloMap } from './soloMap';
import { createEmptySpellWall } from './spellWall';

export const PLAYER_RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
export const DEFAULT_HAND_SIZE = 5;
export const DEFAULT_PLAYER_MANA = 7;

const STARTING_DECK_DEFINITIONS: Array<{ id: string; cardName: CardName }> = [
  { id: 'player-1-0', cardName: 'Firebolt' },
  { id: 'player-1-1', cardName: 'Firebolt' },
  { id: 'player-1-2', cardName: 'Firebolt' },
  { id: 'player-1-4', cardName: 'Firebolt' },
  { id: 'player-1-5', cardName: 'Firebolt' },
  { id: 'player-1-6', cardName: 'Barricade' },
  { id: 'player-1-7', cardName: 'Barricade' },
  { id: 'player-1-8', cardName: 'Barricade' },
  { id: 'player-1-9', cardName: 'Barricade' },
  { id: 'player-1-10', cardName: 'Barricade' },
  { id: 'player-1-11', cardName: 'VoidTendrils' },
];

export const STARTING_DECK: Rune[] = STARTING_DECK_DEFINITIONS.map(({ id, cardName }) => createRuneFromCardName({ id, cardName }));

export function createStartingDeck(): Rune[] {
  return STARTING_DECK.map((rune) => ({
    ...rune,
    runeTypes: [...rune.runeTypes],
    castEffectRefs: copyEffectRefs(rune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(rune.passiveEffectRefs),
  }));
}

export function createRuneSoundSignals(): Record<RuneType, number> {
  return PLAYER_RUNE_TYPES.reduce<Record<RuneType, number>>((signals, runeType) => {
    signals[runeType] = 0;
    return signals;
  }, {} as Record<RuneType, number>);
}

export function createPlayer(id: string, name: string, startingHealth: number, deck: Rune[], maxHealth: number): Player {
  return {
    id, name, wall: createEmptySpellWall(), health: startingHealth, maxHealth,
    mana: DEFAULT_PLAYER_MANA, maxMana: DEFAULT_PLAYER_MANA, deck,
  };
}

function shuffleRunes(runes: Rune[]): Rune[] {
  return [...runes].sort(() => Math.random() - 0.5);
}

export function createEncounterState({ monsterId, player, fullDeck }: {
  monsterId: MonsterId;
  player: Player;
  fullDeck: Rune[];
}): CombatZoneState & { player: Player } {
  const activeDeck = shuffleRunes(fullDeck);
  const hand = activeDeck.slice(0, DEFAULT_HAND_SIZE);
  return {
    player: {
      ...player,
      wall: createEmptySpellWall(),
      mana: player.maxMana,
      deck: activeDeck.slice(DEFAULT_HAND_SIZE),
    },
    enemy: createMonsterEnemy(monsterId),
    combatPhase: 'player-turn',
    hand,
    discardPile: [],
    playerDestroyedRunes: [],
    enemyDestroyedRunes: [],
    suppressedRunes: [],
    selectedHandRuneId: null,
    enemyBoard: createEmptySpellWall(),
    enemyQueuedRunes: [],
    enemyTurnNumber: 0,
    pendingCombatResolution: null,
  };
}

export function createInitialSoloRunState(fullDeck: Rune[] = createStartingDeck()): GameState {
  const maxHealth = 75;
  const deckTemplate = [...fullDeck];
  const player = createPlayer('player-1', 'Arcane Apprentice', maxHealth, deckTemplate, maxHealth);
  return {
    gameStarted: false,
    soloPhase: 'map',
    soloMap: initializeSoloMap(),
    startingHealth: player.maxHealth,
    player,
    fullDeck: deckTemplate,
    gameIndex: 1,
    arcaneDust: 0,
    isDefeat: false,
    isVictory: false,
    longestRun: 0,
    deckDraftState: null,
    activeArtefacts: [],
    runeSoundSignals: createRuneSoundSignals(),
    spellAnimationEvent: null,
    enemyAttackSoundSignal: 0,
    shieldSoundSignal: 0,
    enemy: null,
    combatPhase: 'player-turn',
    hand: [],
    discardPile: [],
    playerDestroyedRunes: [],
    enemyDestroyedRunes: [],
    suppressedRunes: [],
    selectedHandRuneId: null,
    enemyBoard: createEmptySpellWall(),
    enemyQueuedRunes: [],
    enemyTurnNumber: 0,
    pendingCombatResolution: null,
  };
}
