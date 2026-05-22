/**
 * Combat resolution helpers for hand-driven spell-wall casting.
 */

import type { Player, Rune, SpellWallCharge } from '../types/game';
import { copyRuneEffects } from './runeEffects';

const DEFAULT_HAND_SIZE = 6;

export type WallCastStatus = 'invalid' | 'charged' | 'completed';

export interface WallCastInput {
  player: Player;
  hand: Rune[];
  wallCharges: SpellWallCharge[][];
  selectedHandRuneId: string | null;
  row: number;
  col: number;
}

export interface WallCastResult {
  status: WallCastStatus;
  player: Player;
  hand: Rune[];
  wallCharges: SpellWallCharge[][];
  selectedHandRuneId: string | null;
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

function shuffleRunes(runes: Rune[]): Rune[] {
  return [...runes].sort(() => Math.random() - 0.5);
}

function cloneWallCharges(wallCharges: SpellWallCharge[][]): SpellWallCharge[][] {
  return wallCharges.map((chargeRow) =>
    chargeRow.map((charge) => ({
      ...charge,
      spentRunes: [...charge.spentRunes],
    }))
  );
}

export function castRuneToWallSlot({
  player,
  hand,
  wallCharges,
  selectedHandRuneId,
  row,
  col,
}: WallCastInput): WallCastResult {
  const selectedRune = selectedHandRuneId
    ? hand.find((rune) => rune.id === selectedHandRuneId) ?? null
    : null;
  const targetCharge = wallCharges[row]?.[col] ?? null;
  const targetCell = player.wall[row]?.[col] ?? null;

  if (
    !selectedRune ||
    !targetCharge ||
    !targetCell ||
    targetCell.runeType !== null ||
    targetCharge.currentCount >= targetCharge.requiredCount ||
    selectedRune.runeType !== targetCharge.runeType
  ) {
    return {
      status: 'invalid',
      player,
      hand,
      wallCharges,
      selectedHandRuneId,
    };
  }

  const nextHand = hand.filter((rune) => rune.id !== selectedRune.id);
  const nextWallCharges = cloneWallCharges(wallCharges);
  const nextCharge = nextWallCharges[row][col];
  const nextCurrentCount = Math.min(nextCharge.requiredCount, nextCharge.currentCount + 1);
  const isCompleted = nextCurrentCount >= nextCharge.requiredCount;

  nextWallCharges[row][col] = {
    ...nextCharge,
    currentCount: nextCurrentCount,
    spentRunes: isCompleted ? nextCharge.spentRunes : [...nextCharge.spentRunes, selectedRune],
    completedRuneId: isCompleted ? selectedRune.id : nextCharge.completedRuneId,
  };

  if (!isCompleted) {
    return {
      status: 'charged',
      player,
      hand: nextHand,
      wallCharges: nextWallCharges,
      selectedHandRuneId: null,
    };
  }

  const nextWall = player.wall.map((wallRow) => [...wallRow]);
  nextWall[row][col] = {
    runeType: selectedRune.runeType,
    effects: copyRuneEffects(selectedRune.effects),
  };

  return {
    status: 'completed',
    player: {
      ...player,
      wall: nextWall,
    },
    hand: nextHand,
    wallCharges: nextWallCharges,
    selectedHandRuneId: null,
  };
}

export function endPlayerTurn({
  player,
  hand,
  discardPile,
  handSize = DEFAULT_HAND_SIZE,
  shuffleRunes: shuffle = shuffleRunes,
}: EndPlayerTurnInput): EndPlayerTurnResult {
  let drawDeck = [...player.deck];
  let nextDiscardPile = [...discardPile, ...hand];
  let nextHand: Rune[] = [];

  const drawFromDeck = () => {
    const drawCount = Math.min(handSize - nextHand.length, drawDeck.length);
    if (drawCount <= 0) {
      return;
    }

    nextHand = [...nextHand, ...drawDeck.slice(0, drawCount)];
    drawDeck = drawDeck.slice(drawCount);
  };

  drawFromDeck();

  if (nextHand.length < handSize && nextDiscardPile.length > 0) {
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
