/**
 * Combat resolution helpers for hand-driven spell-wall casting.
 */

import type { ArtefactId } from '../types/artefacts';
import type { EffectResolutionLog, Enemy, EnemyRune, Player, Rune, RuneType, ScoringWall } from '../types/game';
import { resolveCastEffects, resolveEndTurnEffects, resolveStartTurnEffects } from './effectResolver';
import type { DrawTypeRequest, WallPosition } from './effectResolver';
import { createEmptyWall, createEnemyTurnRunes } from './gameInitialization';
import { copyEffectRefs } from './runeEffects';
import { getWallSlotFamily, isRuneTypeAcceptedBySlotFamily } from './scoring';

const DEFAULT_HAND_SIZE = 6;
export const EXTRA_DRAW_HAND_LIMIT = 10;

export type WallCastStatus = 'invalid' | 'completed';

export interface WallCastInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  selectedHandRuneId: string | null;
  row: number;
  col: number;
  createCompletedRuneId?: (rune: Rune, position: WallPosition) => string;
}

export interface WallCastResult {
  status: WallCastStatus;
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  selectedHandRuneId: string | null;
  completedRune: Rune | null;
  completedPosition: WallPosition | null;
}

export interface EndPlayerTurnInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  handSize?: number;
  shuffleRunes?: (runes: Rune[]) => Rune[];
}

export interface EndPlayerTurnResult {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
}

export interface DrawRunesInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  drawCount: number;
  handLimit?: number;
  shuffleRunes?: (runes: Rune[]) => Rune[];
}

export interface DrawRunesOfTypeInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  drawTypeRequests: DrawTypeRequest[];
  handLimit?: number;
}

export interface DrawRunesResult {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
}

export interface CompletedRuneCastEffectsInput {
  player: Player;
  enemy: Enemy | null;
  rune: Rune;
  activeArtefacts?: ArtefactId[];
  sourcePosition?: WallPosition | null;
  suppressedRunes?: Rune[];
  handSize?: number;
}

export interface CompletedRuneCastEffectsResult {
  player: Player;
  enemy: Enemy | null;
  suppressedRunes: Rune[];
  returnedRunes: Rune[];
  returnedOverflowRunes: Rune[];
  wallChanged: boolean;
  arcaneDustDelta: number;
  drawCount: number;
  drawTypeRequests: DrawTypeRequest[];
  logs: EffectResolutionLog[];
}

export interface EndTurnEffectsInput {
  player: Player;
  enemy: Enemy | null;
  activeArtefacts?: ArtefactId[];
}

export interface EndTurnEffectsResult {
  player: Player;
  enemy: Enemy | null;
  logs: EffectResolutionLog[];
}

export interface StartTurnEffectsInput {
  player: Player;
  activeArtefacts?: ArtefactId[];
}

export interface StartTurnEffectsResult {
  player: Player;
  drawCount: number;
  logs: EffectResolutionLog[];
}

export interface EnemyTurnInput {
  player: Player;
  enemy: Enemy | null;
  enemyBoard?: ScoringWall;
  enemyQueuedRunes?: EnemyRune[];
  turnNumber?: number;
  random?: () => number;
}

export interface EnemyTurnResult {
  player: Player;
  enemyBoard: ScoringWall;
  enemyQueuedRunes: EnemyRune[];
  boardFull: boolean;
  logs: EffectResolutionLog[];
  healthDamage: number;
}

export interface VictoryDeckInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  suppressedRunes?: Rune[];
}

export interface VictoryDeckResult {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
}

function shuffleRunes(runes: Rune[]): Rune[] {
  return [...runes].sort(() => Math.random() - 0.5);
}

function cloneRune(rune: Rune): Rune {
  return {
    ...rune,
    castEffectRefs: copyEffectRefs(rune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(rune.passiveEffectRefs),
  };
}

function createDefaultCompletedRuneId(rune: Rune, position: WallPosition): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `${rune.id}-wall-${position.row}-${position.col}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function countFilledWallRunesByType(wall: ScoringWall): Map<RuneType, number> {
  return wall.reduce<Map<RuneType, number>>((counts, row) => {
    row.forEach((cell) => {
      if (cell.runeType && cell.id) {
        counts.set(cell.runeType, (counts.get(cell.runeType) ?? 0) + 1);
      }
    });
    return counts;
  }, new Map<RuneType, number>());
}

export function wallHasRuneType(wall: ScoringWall, runeType: RuneType): boolean {
  return wall.some((row) => row.some((cell) => cell.runeType === runeType && cell.id !== null));
}

export function drawRunes({
  player,
  hand,
  discardPile,
  drawCount,
  handLimit = EXTRA_DRAW_HAND_LIMIT,
  shuffleRunes: shuffle = shuffleRunes,
}: DrawRunesInput): DrawRunesResult {
  let drawDeck = [...player.deck];
  let nextDiscardPile = [...discardPile];
  let nextHand = [...hand];
  const targetHandSize = Math.min(handLimit, nextHand.length + Math.max(0, drawCount));

  const drawFromDeck = () => {
    const count = Math.min(targetHandSize - nextHand.length, drawDeck.length);
    if (count <= 0) {
      return;
    }

    nextHand = [...nextHand, ...drawDeck.slice(0, count)];
    drawDeck = drawDeck.slice(count);
  };

  drawFromDeck();

  if (nextHand.length < targetHandSize && nextDiscardPile.length > 0) {
    drawDeck = shuffle(nextDiscardPile);
    nextDiscardPile = [];
    drawFromDeck();
  }

  return {
    player: {
      ...player,
      deck: drawDeck,
    },
    hand: nextHand,
    discardPile: nextDiscardPile,
  };
}

export function drawRunesOfType({
  player,
  hand,
  discardPile,
  drawTypeRequests,
  handLimit = EXTRA_DRAW_HAND_LIMIT,
}: DrawRunesOfTypeInput): DrawRunesResult {
  let drawDeck = [...player.deck];
  let nextHand = [...hand];

  drawTypeRequests.forEach(({ amount, targetType }) => {
    let remaining = Math.max(0, amount);
    if (remaining <= 0 || nextHand.length >= handLimit) {
      return;
    }

    const nextDrawDeck: Rune[] = [];
    const drawnRunes: Rune[] = [];

    drawDeck.forEach((rune) => {
      if (rune.runeType === targetType && remaining > 0 && nextHand.length + drawnRunes.length < handLimit) {
        drawnRunes.push(rune);
        remaining -= 1;
        return;
      }

      nextDrawDeck.push(rune);
    });

    nextHand = [...nextHand, ...drawnRunes];
    drawDeck = nextDrawDeck;
  });

  return {
    player: {
      ...player,
      deck: drawDeck,
    },
    hand: nextHand,
    discardPile,
  };
}

export function castRuneToWallSlot({
  player,
  hand,
  discardPile,
  selectedHandRuneId,
  row,
  col,
  createCompletedRuneId = createDefaultCompletedRuneId,
}: WallCastInput): WallCastResult {
  const selectedRune = selectedHandRuneId
    ? hand.find((rune) => rune.id === selectedHandRuneId) ?? null
    : null;
  const targetCell = player.wall[row]?.[col] ?? null;

  if (
    !selectedRune ||
    !targetCell ||
    targetCell.runeType !== null ||
    !isRuneTypeAcceptedBySlotFamily(selectedRune.runeType, getWallSlotFamily(row, col))
  ) {
    return {
      status: 'invalid',
      player,
      hand,
      discardPile,
      selectedHandRuneId,
      completedRune: null,
      completedPosition: null,
    };
  }

  const nextHand = hand.filter((rune) => rune.id !== selectedRune.id);
  const completedRuneId = createCompletedRuneId(selectedRune, { row, col });
  const completedRune = { ...cloneRune(selectedRune), id: completedRuneId };
  const nextWall = player.wall.map((wallRow) => [...wallRow]);
  nextWall[row][col] = {
    id: completedRune.id,
    runeType: completedRune.runeType,
    rarity: completedRune.rarity,
    castEffectRefs: copyEffectRefs(completedRune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(completedRune.passiveEffectRefs),
  };

  return {
    status: 'completed',
    player: {
      ...player,
      wall: nextWall,
    },
    hand: nextHand,
    discardPile: [...discardPile, selectedRune],
    selectedHandRuneId: null,
    completedRune,
    completedPosition: { row, col },
  };
}

export function resolveCompletedRuneCastEffects({
  player,
  enemy,
  rune,
  activeArtefacts = [],
  sourcePosition = null,
  suppressedRunes = [],
  handSize = 0,
}: CompletedRuneCastEffectsInput): CompletedRuneCastEffectsResult {
  const result = resolveCastEffects({
    player,
    enemy,
    castRune: rune,
    wall: player.wall,
    activeArtefacts,
    sourcePosition,
    suppressedRunes,
    handSize,
  });

  return {
    ...result,
    player: result.wallChanged ? {
      ...result.player,
      wall: result.wall,
    } : result.player,
  };
}

export function resolveEnemyTurn({
  player,
  enemy,
  enemyBoard = createEmptyWall(),
  enemyQueuedRunes = [],
  turnNumber = 0,
  random = Math.random,
}: EnemyTurnInput): EnemyTurnResult {
  if (!enemy) {
    return { player, enemyBoard, enemyQueuedRunes: [], boardFull: false, logs: [], healthDamage: 0 };
  }

  const runesToPlay = enemyQueuedRunes.length > 0
    ? [...enemyQueuedRunes]
    : createEnemyTurnRunes(turnNumber);
  let nextPlayer = player;
  const nextBoard = enemyBoard.map((row) => row.map((cell) => ({ ...cell })));
  let healthDamage = 0;

  for (const rune of runesToPlay) {
    const openSlots: Array<{ row: number; col: number }> = [];
    nextBoard.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
      if (!cell.id) openSlots.push({ row: rowIndex, col: colIndex });
    }));

    if (openSlots.length === 0) break;
    const slot = openSlots[Math.min(openSlots.length - 1, Math.floor(random() * openSlots.length))];
    if (!slot) break;

    nextBoard[slot.row][slot.col] = {
      id: rune.id,
      runeType: rune.runeType,
      rarity: rune.rarity,
      castEffectRefs: rune.castEffectRefs,
      passiveEffectRefs: rune.passiveEffectRefs,
    };
    const incomingDamage = Math.max(0, rune.damage);
    const armorAbsorbed = Math.min(nextPlayer.armor, incomingDamage);
    const runeHealthDamage = incomingDamage - armorAbsorbed;
    healthDamage += runeHealthDamage;
    nextPlayer = {
      ...nextPlayer,
      armor: nextPlayer.armor - armorAbsorbed,
      health: Math.max(0, nextPlayer.health - runeHealthDamage),
    };
  }

  return {
    player: nextPlayer,
    enemyBoard: nextBoard,
    enemyQueuedRunes: [],
    boardFull: nextBoard.every((row) => row.every((cell) => cell.id !== null)),
    logs: [],
    healthDamage,
  };
}

export function endPlayerTurn({
  player,
  hand,
  discardPile,
  handSize = DEFAULT_HAND_SIZE,
  shuffleRunes: shuffle = shuffleRunes,
}: EndPlayerTurnInput): EndPlayerTurnResult {
  return drawRunes({
    player,
    hand: [],
    discardPile: [...discardPile, ...hand],
    drawCount: handSize,
    handLimit: handSize,
    shuffleRunes: shuffle,
  });
}

export function resolveCompletedEndTurnEffects({
  player,
  enemy,
  activeArtefacts = [],
}: EndTurnEffectsInput): EndTurnEffectsResult {
  return resolveEndTurnEffects({
    player,
    enemy,
    wall: player.wall,
    activeArtefacts,
  });
}

export function resolveCompletedStartTurnEffects({
  player,
  activeArtefacts = [],
}: StartTurnEffectsInput): StartTurnEffectsResult {
  return resolveStartTurnEffects({
    player,
    wall: player.wall,
    activeArtefacts,
  });
}

export function collectVictoryDeck({ player }: VictoryDeckInput): VictoryDeckResult {
  return {
    player,
    hand: [],
    discardPile: [],
  };
}
