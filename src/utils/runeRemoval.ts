import type {
  Rune,
  RuneConsumeEffectRef,
  RuneDestroyEffectRef,
  RuneEffectRef,
  RuneRemovalEffectRef,
  RuneType,
  ScoringWall,
  WallCell,
  WallPosition,
} from '../types/game';

export function isRuneRemovalEffectRef(effectRef: RuneEffectRef): effectRef is RuneRemovalEffectRef {
  if (!('trigger' in effectRef) || !('selection' in effectRef) || !('targetOwner' in effectRef)) {
    return false;
  }
  if ((effectRef.targetOwner !== 'self' && effectRef.targetOwner !== 'opponent')
    || (effectRef.selection !== 'manual' && effectRef.selection !== 'random')) {
    return false;
  }
  if (effectRef.effectId === 'rune.consume') return effectRef.trigger === 'onCast';
  return effectRef.effectId === 'rune.destroy'
    && Number.isInteger(effectRef.count)
    && effectRef.count > 0;
}

export function copyRuneEffectRef(effectRef: RuneEffectRef): RuneEffectRef {
  if (isRuneRemovalEffectRef(effectRef)) {
    return {
      effectId: effectRef.effectId,
      trigger: effectRef.trigger,
      selection: effectRef.selection,
      targetOwner: effectRef.targetOwner,
      ...(effectRef.effectId === 'rune.destroy' ? { count: effectRef.count } : {}),
      ...(effectRef.runeType ? { runeType: effectRef.runeType } : {}),
      ...(effectRef.payload ? {
        payload: {
          effectId: effectRef.payload.effectId,
          ...(effectRef.payload.params ? { params: { ...effectRef.payload.params } } : {}),
        },
      } : {}),
    };
  }

  return {
    effectId: effectRef.effectId,
    ...(effectRef.params ? { params: { ...effectRef.params } } : {}),
  };
}

interface RuneRemovalEffectInputBase {
  trigger: RuneRemovalEffectRef['trigger'];
  selection: RuneRemovalEffectRef['selection'];
  targetOwner?: RuneRemovalEffectRef['targetOwner'];
  runeType?: RuneType;
  payload?: RuneRemovalEffectRef['payload'];
}

export function createRuneRemovalEffectRef(input: RuneRemovalEffectInputBase & { kind: 'consume' }): RuneConsumeEffectRef;
export function createRuneRemovalEffectRef(input: RuneRemovalEffectInputBase & { kind: 'destroy'; count?: number }): RuneDestroyEffectRef;
export function createRuneRemovalEffectRef({
  kind,
  trigger,
  selection,
  targetOwner = 'self',
  count = 1,
  runeType,
  payload,
}: RuneRemovalEffectInputBase & { kind: 'consume' | 'destroy'; count?: number }): RuneRemovalEffectRef {
  const shared = {
    selection,
    targetOwner,
    ...(runeType ? { runeType } : {}),
    ...(payload ? { payload: copyRuneEffectRef(payload) } : {}),
  };
  if (kind === 'consume') {
    return { effectId: 'rune.consume', trigger: 'onCast', ...shared } satisfies RuneConsumeEffectRef;
  }
  return {
    effectId: 'rune.destroy',
    trigger,
    count: Math.max(1, Math.floor(count)),
    ...shared,
  } satisfies RuneDestroyEffectRef;
}

export function isCompletedWallCell(cell: WallCell | null | undefined): cell is WallCell & { id: string } {
  return Boolean(cell?.id && cell.runeTypes.length > 0);
}

export function getRuneRemovalCandidates({
  wall,
  runeType,
  excludedRuneId,
}: {
  wall: ScoringWall;
  runeType?: RuneType;
  excludedRuneId?: string | null;
}): WallPosition[] {
  return wall.flatMap((row, rowIndex) => row.flatMap((cell, colIndex) => (
    isCompletedWallCell(cell)
      && cell.id !== excludedRuneId
      && (!runeType || cell.runeTypes.includes(runeType))
      ? [{ row: rowIndex, col: colIndex }]
      : []
  )));
}

export function chooseRandomRunePosition(
  positions: WallPosition[],
  random: () => number,
): WallPosition | null {
  if (positions.length === 0) return null;
  const index = Math.min(positions.length - 1, Math.max(0, Math.floor(random() * positions.length)));
  return positions[index] ?? null;
}

export function runeFromWallCell(cell: WallCell): Rune | null {
  if (!isCompletedWallCell(cell)) return null;

  return {
    id: cell.id,
    name: cell.name ?? `${cell.runeTypes[0]} Rune`,
    runeTypes: [...cell.runeTypes],
    rarity: cell.rarity ?? 'common',
    cardImageSrc: cell.cardImageSrc ?? '',
    tokenImageSrc: cell.tokenImageSrc ?? '',
    ...(cell.spellSound ? { spellSound: cell.spellSound } : {}),
    ...(typeof cell.manaCost === 'number' ? { manaCost: cell.manaCost } : {}),
    castEffectRefs: (cell.castEffectRefs ?? []).map(copyRuneEffectRef),
    passiveEffectRefs: (cell.passiveEffectRefs ?? []).map(copyRuneEffectRef),
  };
}

export function createEmptyWallCell(): WallCell {
  return {
    id: null,
    name: null,
    runeTypes: [],
    rarity: null,
    cardImageSrc: null,
    tokenImageSrc: null,
    manaCost: null,
    castEffectRefs: null,
    passiveEffectRefs: null,
    shield: null,
  };
}

export function removeRuneAtPosition(
  wall: ScoringWall,
  position: WallPosition,
): { wall: ScoringWall; removedRune: Rune | null } {
  const cell = wall[position.row]?.[position.col];
  if (!cell) return { wall, removedRune: null };
  const removedRune = runeFromWallCell(cell);
  if (!removedRune) return { wall, removedRune: null };

  const nextWall = wall.map((row) => row.map((entry) => ({
    ...entry,
    runeTypes: [...entry.runeTypes],
    castEffectRefs: entry.castEffectRefs?.map(copyRuneEffectRef) ?? null,
    passiveEffectRefs: entry.passiveEffectRefs?.map(copyRuneEffectRef) ?? null,
  })));
  nextWall[position.row][position.col] = createEmptyWallCell();
  return { wall: nextWall, removedRune };
}

export function placeRuneAtPosition(
  wall: ScoringWall,
  position: WallPosition,
  rune: Rune,
): ScoringWall {
  if (!wall[position.row]?.[position.col]) return wall;
  const nextWall = wall.map((row) => row.map((entry) => ({
    ...entry,
    runeTypes: [...entry.runeTypes],
    castEffectRefs: entry.castEffectRefs?.map(copyRuneEffectRef) ?? null,
    passiveEffectRefs: entry.passiveEffectRefs?.map(copyRuneEffectRef) ?? null,
  })));
  nextWall[position.row][position.col] = {
    id: rune.id,
    name: rune.name,
    runeTypes: [...rune.runeTypes],
    rarity: rune.rarity,
    cardImageSrc: rune.cardImageSrc,
    tokenImageSrc: rune.tokenImageSrc,
    spellSound: rune.spellSound ?? null,
    manaCost: rune.manaCost ?? 2,
    castEffectRefs: rune.castEffectRefs.map(copyRuneEffectRef),
    passiveEffectRefs: rune.passiveEffectRefs.map(copyRuneEffectRef),
    shield: null,
  };
  return nextWall;
}

export function wallHasRuneId(wall: ScoringWall, runeId: string): boolean {
  return wall.some((row) => row.some((cell) => cell.id === runeId));
}
