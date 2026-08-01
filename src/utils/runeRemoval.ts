import type {
  Rune,
  RuneEffectRef,
  RuneRemovalEffectRef,
  RuneType,
  ScoringWall,
  WallCell,
  WallPosition,
} from '../types/game';

export function isRuneRemovalEffectRef(effectRef: RuneEffectRef): effectRef is RuneRemovalEffectRef {
  return (effectRef.effectId === 'rune.consume' || effectRef.effectId === 'rune.destroy')
    && 'trigger' in effectRef
    && 'selection' in effectRef;
}

export function copyRuneEffectRef(effectRef: RuneEffectRef): RuneEffectRef {
  if (isRuneRemovalEffectRef(effectRef)) {
    return {
      effectId: effectRef.effectId,
      trigger: effectRef.trigger,
      selection: effectRef.selection,
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

export function createRuneRemovalEffectRef({
  kind,
  trigger,
  selection,
  runeType,
  payload,
}: {
  kind: 'consume' | 'destroy';
  trigger: RuneRemovalEffectRef['trigger'];
  selection: RuneRemovalEffectRef['selection'];
  runeType?: RuneType;
  payload?: RuneRemovalEffectRef['payload'];
}): RuneRemovalEffectRef {
  return {
    effectId: kind === 'consume' ? 'rune.consume' : 'rune.destroy',
    trigger,
    selection,
    ...(runeType ? { runeType } : {}),
    ...(payload ? { payload: copyRuneEffectRef(payload) } : {}),
  };
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

export function wallHasRuneId(wall: ScoringWall, runeId: string): boolean {
  return wall.some((row) => row.some((cell) => cell.id === runeId));
}
