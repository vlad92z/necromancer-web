/**
 * Combat resolution helpers for hand-driven spell-wall casting.
 */

import type { ArtefactId } from '../types/artefacts';
import type { EffectResolutionLog, Enemy, Player, Rune, RuneType, ScoringWall, SpellWallCharge } from '../types/game';
import { resolveCastEffects } from './effectResolver';
import { copyEffectRefs } from './runeEffects';

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
  completedRune: Rune | null;
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

export interface CompletedRuneEffectsInput {
  player: Player;
  enemy: Enemy | null;
  rune: Rune;
  activeArtefacts?: ArtefactId[];
}

export interface CompletedRuneEffectsResult {
  player: Player;
  enemy: Enemy | null;
  arcaneDustDelta: number;
  logs: EffectResolutionLog[];
}

export interface EnemyTurnInput {
  player: Player;
  enemy: Enemy | null;
}

export interface EnemyTurnResult {
  player: Player;
}

export interface VictoryDeckInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  wallCharges: SpellWallCharge[][];
}

export interface VictoryDeckResult {
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

export function countFilledWallRunesByType(wall: ScoringWall): Map<RuneType, number> {
  return wall.reduce<Map<RuneType, number>>((counts, row) => {
    row.forEach((cell) => {
      if (cell.runeType) {
        counts.set(cell.runeType, (counts.get(cell.runeType) ?? 0) + 1);
      }
    });
    return counts;
  }, new Map<RuneType, number>());
}

export function wallHasRuneType(wall: ScoringWall, runeType: RuneType): boolean {
  return wall.some((row) => row.some((cell) => cell.runeType === runeType));
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
      completedRune: null,
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
      completedRune: null,
    };
  }

  const nextWall = player.wall.map((wallRow) => [...wallRow]);
  nextWall[row][col] = {
    runeType: selectedRune.runeType,
    rarity: selectedRune.rarity,
    castEffectRefs: copyEffectRefs(selectedRune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(selectedRune.passiveEffectRefs),
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
    completedRune: selectedRune,
  };
}

export function resolveCompletedRuneEffects({
  player,
  enemy,
  rune,
  activeArtefacts = [],
}: CompletedRuneEffectsInput): CompletedRuneEffectsResult {
  const result = resolveCastEffects({
    player,
    enemy,
    castRune: rune,
    wall: player.wall,
    activeArtefacts,
  });

  return result;
}

export function resolveEnemyTurn({ player, enemy }: EnemyTurnInput): EnemyTurnResult {
  if (!enemy || enemy.intent.type !== 'Attack') {
    return { player };
  }

  const armorAbsorbed = Math.min(player.armor, enemy.intent.amount);
  const healthDamage = enemy.intent.amount - armorAbsorbed;

  return {
    player: {
      ...player,
      armor: player.armor - armorAbsorbed,
      health: Math.max(0, player.health - healthDamage),
    },
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

export function collectVictoryDeck({
  player,
  hand,
  discardPile,
  wallCharges,
}: VictoryDeckInput): VictoryDeckResult {
  const returnedRunesById = new Map<string, Rune>();

  const addRune = (rune: Rune) => {
    returnedRunesById.set(rune.id, rune);
  };

  player.deck.forEach(addRune);
  hand.forEach(addRune);
  discardPile.forEach(addRune);

  wallCharges.forEach((chargeRow) => {
    chargeRow.forEach((charge) => {
      charge.spentRunes.forEach(addRune);

      if (!charge.completedRuneId) {
        return;
      }

      const wallCell = player.wall[charge.row]?.[charge.col] ?? null;
      if (!wallCell?.runeType) {
        return;
      }

      addRune({
        id: charge.completedRuneId,
        runeType: wallCell.runeType,
        rarity: wallCell.rarity ?? 'common',
        castEffectRefs: copyEffectRefs(wallCell.castEffectRefs),
        passiveEffectRefs: copyEffectRefs(wallCell.passiveEffectRefs),
      });
    });
  });

  return {
    player: {
      ...player,
      deck: Array.from(returnedRunesById.values()),
    },
    hand: [],
    discardPile: [],
  };
}
