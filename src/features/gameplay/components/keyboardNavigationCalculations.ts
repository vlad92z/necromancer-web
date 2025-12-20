/**
 * keyboardNavigationCalculations - helper functions for resolving keyboard navigation targets.
 */

import type { PatternLine, Rune } from '../../../types/game';
import type { ActiveElement, NavigationDirection } from './keyboardNavigation';

export interface RuneforgeSlotLayout {
  runeforgeId: string;
  disabled: boolean;
  slots: Array<Rune | null>;
}

export interface RunePosition {
  runeforgeIndex: number;
  runeIndex: number;
  runeId: string;
}

export const RUNEFORGE_TO_PATTERN_LINE_MAP: number[] = [0, 1, 3, 4, 5];

/**
 * buildPatternLineToRuneforgeMap - creates the reverse lookup for line-to-runeforge navigation.
 */
export function buildPatternLineToRuneforgeMap(runeforgeToPatternLineMap: readonly number[]): Map<number, number> {
  const map = new Map<number, number>();
  runeforgeToPatternLineMap.forEach((lineIndex, runeforgeIndex) => {
    if (typeof lineIndex === 'number') {
      map.set(lineIndex, runeforgeIndex);
    }
  });
  return map;
}

/**
 * getFirstPatternLineElement - resolves the first pattern line focus target.
 */
export function getFirstPatternLineElement(patternLineCount: number): ActiveElement | null {
  return patternLineCount > 0 ? { type: 'pattern-line', lineIndex: 0 } : null;
}

/**
 * resolvePatternLineForRuneforge - maps a runeforge index to a pattern line element.
 */
export function resolvePatternLineForRuneforge(
  runeforgeIndex: number,
  runeforgeToPatternLineMap: readonly number[],
  patternLines: PatternLine[],
): ActiveElement | null {
  const lineIndex = runeforgeToPatternLineMap[runeforgeIndex];
  if (typeof lineIndex !== 'number') {
    return null;
  }
  if (!patternLines[lineIndex]) {
    return null;
  }
  return { type: 'pattern-line', lineIndex };
}

/**
 * resolveRuneforgeForPatternLine - maps a pattern line index to a runeforge index.
 */
export function resolveRuneforgeForPatternLine(
  lineIndex: number,
  patternLineToRuneforgeMap: Map<number, number>,
): number | null {
  const mapped = patternLineToRuneforgeMap.get(lineIndex);
  return typeof mapped === 'number' ? mapped : null;
}

/**
 * buildPlacementTargets - builds the list of valid placement focus targets.
 */
export function buildPlacementTargets(
  hasSelectedRunes: boolean,
  patternLines: PatternLine[],
  isPatternLineValidTarget: (lineIndex: number) => boolean,
): ActiveElement[] {
  if (!hasSelectedRunes) {
    return [];
  }

  const targets: ActiveElement[] = [{ type: 'overload' }];
  patternLines.forEach((_, lineIndex) => {
    if (isPatternLineValidTarget(lineIndex)) {
      targets.push({ type: 'pattern-line', lineIndex });
    }
  });

  return targets;
}

/**
 * pickDefaultPlacementTarget - resolves the default focus when placing runes.
 */
export function pickDefaultPlacementTarget(targets: ActiveElement[]): ActiveElement | null {
  if (targets.length === 0) {
    return null;
  }
  const firstPlaceableLine = targets.find((target) => target.type === 'pattern-line');
  return firstPlaceableLine ?? targets[0];
}

/**
 * buildAvailableRunePositions - flattens runeforge slot layouts into focusable rune positions.
 */
export function buildAvailableRunePositions(runeforgeSlotLayouts: RuneforgeSlotLayout[]): RunePosition[] {
  return runeforgeSlotLayouts.flatMap((layout, runeforgeIndex) => {
    if (layout.disabled) {
      return [];
    }
    return layout.slots
      .map((slotRune, runeIndex) => (slotRune ? { runeforgeIndex, runeIndex, runeId: slotRune.id } : null))
      .filter((position): position is RunePosition => position !== null);
  });
}

/**
 * pickFirstAvailableRune - finds the first selectable rune across runeforges.
 */
export function pickFirstAvailableRune(runeforgeSlotLayouts: RuneforgeSlotLayout[]): ActiveElement | null {
  for (let rowIndex = 0; rowIndex < runeforgeSlotLayouts.length; rowIndex += 1) {
    const layout = runeforgeSlotLayouts[rowIndex];
    if (layout.disabled) {
      continue;
    }
    const firstRuneIndex = layout.slots.findIndex((slot) => slot !== null);
    if (firstRuneIndex !== -1) {
      return { type: 'runeforge-rune', runeforgeIndex: rowIndex, runeIndex: firstRuneIndex };
    }
  }
  return null;
}

/**
 * chooseBestCandidate - selects the rune position with the lowest score tuple.
 */
export function chooseBestCandidate(
  candidates: RunePosition[],
  score: (candidate: RunePosition) => [number, number],
): RunePosition | null {
  let best: RunePosition | null = null;
  let bestScore: [number, number] | null = null;

  candidates.forEach((candidate) => {
    const candidateScore = score(candidate);
    if (!bestScore || candidateScore[0] < bestScore[0] || (candidateScore[0] === bestScore[0] && candidateScore[1] < bestScore[1])) {
      best = candidate;
      bestScore = candidateScore;
    }
  });

  return best;
}

/**
 * pickFirstRuneInRuneforge - finds the first rune in a specific runeforge row.
 */
export function pickFirstRuneInRuneforge(
  runeforgeIndex: number,
  availableRunePositions: RunePosition[],
): ActiveElement | null {
  const candidates = availableRunePositions.filter((position) => position.runeforgeIndex === runeforgeIndex);
  if (candidates.length === 0) {
    return null;
  }
  const best = chooseBestCandidate(candidates, (candidate) => [candidate.runeIndex, 0]);
  return best ? { type: 'runeforge-rune', runeforgeIndex: best.runeforgeIndex, runeIndex: best.runeIndex } : null;
}

/**
 * navigateFromSettingsButton - resolves focus changes from the settings button.
 */
export function navigateFromSettingsButton(
  direction: NavigationDirection,
  current: ActiveElement,
  getFallbackRune: () => ActiveElement | null,
): ActiveElement | null {
  if (direction === 'right') {
    return { type: 'overload' };
  }
  if (direction === 'down') {
    const fallback = getFallbackRune();
    return fallback ?? current;
  }
  return current;
}

/**
 * navigateFromOverloadButton - resolves focus changes from the overload button.
 */
export function navigateFromOverloadButton(
  direction: NavigationDirection,
  current: ActiveElement,
  firstPatternLineElement: ActiveElement | null,
  getFallbackRune: () => ActiveElement | null,
): ActiveElement | null {
  if (direction === 'right') {
    return { type: 'deck' };
  }
  if (direction === 'left') {
    return { type: 'settings' };
  }
  if (direction === 'down') {
    if (firstPatternLineElement) {
      return firstPatternLineElement;
    }
    const fallback = getFallbackRune();
    return fallback ?? current;
  }
  return current;
}

/**
 * navigateFromDeckButton - resolves focus changes from the deck button.
 */
export function navigateFromDeckButton(
  direction: NavigationDirection,
  current: ActiveElement,
  firstPatternLineElement: ActiveElement | null,
  getFallbackRune: () => ActiveElement | null,
): ActiveElement | null {
  if (direction === 'left') {
    return { type: 'overload' };
  }
  if (direction === 'down') {
    if (firstPatternLineElement) {
      return firstPatternLineElement;
    }
    const fallback = getFallbackRune();
    return fallback ?? current;
  }
  return current;
}

/**
 * navigateFromPatternLine - resolves focus changes from a pattern line.
 */
export function navigateFromPatternLine(
  direction: NavigationDirection,
  current: { type: 'pattern-line'; lineIndex: number },
  patternLineCount: number,
  selectedRunesCount: number,
  resolveRuneforgeIndex: (lineIndex: number) => number | null,
  getFirstRuneInRuneforge: (runeforgeIndex: number) => ActiveElement | null,
  getFallbackRune: () => ActiveElement | null,
): ActiveElement | null {
  if (direction === 'up') {
    if (current.lineIndex === 0) {
      return { type: 'overload' };
    }
    return { type: 'pattern-line', lineIndex: Math.max(0, current.lineIndex - 1) };
  }
  if (direction === 'down') {
    const lastIndex = patternLineCount - 1;
    if (lastIndex < 0) {
      return current;
    }
    return { type: 'pattern-line', lineIndex: Math.min(lastIndex, current.lineIndex + 1) };
  }

  if (direction === 'left' && selectedRunesCount === 0) {
    const mappedRuneforgeIndex = resolveRuneforgeIndex(current.lineIndex);
    if (mappedRuneforgeIndex !== null) {
      const mappedRune = getFirstRuneInRuneforge(mappedRuneforgeIndex);
      if (mappedRune) {
        return mappedRune;
      }
    }
    const fallback = getFallbackRune();
    return fallback ?? current;
  }
  return current;
}

/**
 * selectClosestRuneFromRuneforge - finds the next rune focus based on direction.
 */
export function selectClosestRuneFromRuneforge(
  direction: NavigationDirection,
  current: { type: 'runeforge-rune'; runeforgeIndex: number; runeIndex: number },
  availableRunePositions: RunePosition[],
  getFallbackRune: () => ActiveElement | null,
  resolvePatternLine: (runeforgeIndex: number) => ActiveElement | null,
): ActiveElement | null {
  const currentRune = availableRunePositions.find(
    (position) => position.runeforgeIndex === current.runeforgeIndex && position.runeIndex === current.runeIndex,
  );

  if (!currentRune) {
    return getFallbackRune();
  }
  const sameRowCandidates = availableRunePositions.filter((position) => position.runeforgeIndex === currentRune.runeforgeIndex);
  switch (direction) {
    case 'left': {
      const leftCandidates = sameRowCandidates.filter((position) => position.runeIndex < currentRune.runeIndex);
      const bestLeft = chooseBestCandidate(leftCandidates, (candidate) => [currentRune.runeIndex - candidate.runeIndex, 0]);
      if (bestLeft) {
        return { type: 'runeforge-rune', runeforgeIndex: bestLeft.runeforgeIndex, runeIndex: bestLeft.runeIndex };
      }

      const anyLeft = availableRunePositions.filter((position) => position.runeIndex < currentRune.runeIndex);
      const bestAnyLeft = chooseBestCandidate(
        anyLeft,
        (candidate) => [currentRune.runeIndex - candidate.runeIndex, Math.abs(candidate.runeforgeIndex - currentRune.runeforgeIndex)],
      );
      return bestAnyLeft
        ? { type: 'runeforge-rune', runeforgeIndex: bestAnyLeft.runeforgeIndex, runeIndex: bestAnyLeft.runeIndex }
        : current;
    }
    case 'right': {
      const rightCandidates = sameRowCandidates.filter((position) => position.runeIndex > currentRune.runeIndex);
      const bestRight = chooseBestCandidate(rightCandidates, (candidate) => [candidate.runeIndex - currentRune.runeIndex, 0]);
      if (bestRight) {
        return { type: 'runeforge-rune', runeforgeIndex: bestRight.runeforgeIndex, runeIndex: bestRight.runeIndex };
      }

      const anyRight = availableRunePositions.filter((position) => position.runeIndex > currentRune.runeIndex);
      const bestAnyRight = chooseBestCandidate(
        anyRight,
        (candidate) => [candidate.runeIndex - currentRune.runeIndex, Math.abs(candidate.runeforgeIndex - currentRune.runeforgeIndex)],
      );
      if (bestAnyRight) {
        return { type: 'runeforge-rune', runeforgeIndex: bestAnyRight.runeforgeIndex, runeIndex: bestAnyRight.runeIndex };
      }

      const mappedPatternLine = resolvePatternLine(currentRune.runeforgeIndex);
      return mappedPatternLine ?? current;
    }
    case 'up': {
      const above = availableRunePositions.filter((position) => position.runeforgeIndex < currentRune.runeforgeIndex);
      const bestAbove = chooseBestCandidate(
        above,
        (candidate) => [currentRune.runeforgeIndex - candidate.runeforgeIndex, Math.abs(candidate.runeIndex - currentRune.runeIndex)],
      );
      if (bestAbove) {
        return { type: 'runeforge-rune', runeforgeIndex: bestAbove.runeforgeIndex, runeIndex: bestAbove.runeIndex };
      }

      return { type: 'settings' };
    }
    case 'down': {
      const below = availableRunePositions.filter((position) => position.runeforgeIndex > currentRune.runeforgeIndex);
      const bestBelow = chooseBestCandidate(
        below,
        (candidate) => [candidate.runeforgeIndex - currentRune.runeforgeIndex, Math.abs(candidate.runeIndex - currentRune.runeIndex)],
      );
      return bestBelow
        ? { type: 'runeforge-rune', runeforgeIndex: bestBelow.runeforgeIndex, runeIndex: bestBelow.runeIndex }
        : current;
    }
    default:
      return current;
  }
}

/**
 * resolveNextElement - resolves keyboard navigation when no runes are selected.
 */
export function resolveNextElement(
  direction: NavigationDirection,
  current: ActiveElement | null,
  availableRunePositions: RunePosition[],
  firstPatternLineElement: ActiveElement | null,
  patternLineCount: number,
  selectedRunesCount: number,
  resolveRuneforgeIndex: (lineIndex: number) => number | null,
  resolvePatternLine: (runeforgeIndex: number) => ActiveElement | null,
  getFirstRuneInRuneforge: (runeforgeIndex: number) => ActiveElement | null,
  getFallbackRune: () => ActiveElement | null,
): ActiveElement | null {
  if (current?.type === 'settings') {
    return navigateFromSettingsButton(direction, current, getFallbackRune);
  }

  if (current?.type === 'overload') {
    return navigateFromOverloadButton(direction, current, firstPatternLineElement, getFallbackRune);
  }

  if (current?.type === 'deck') {
    return navigateFromDeckButton(direction, current, firstPatternLineElement, getFallbackRune);
  }

  if (current?.type === 'pattern-line') {
    return navigateFromPatternLine(
      direction,
      current,
      patternLineCount,
      selectedRunesCount,
      resolveRuneforgeIndex,
      getFirstRuneInRuneforge,
      getFallbackRune,
    );
  }

  if (availableRunePositions.length === 0) {
    return current;
  }

  if (!current || current.type !== 'runeforge-rune') {
    return getFallbackRune();
  }

  return selectClosestRuneFromRuneforge(direction, current, availableRunePositions, getFallbackRune, resolvePatternLine);
}

/**
 * resolvePlacementNavigation - resolves navigation between placement targets.
 */
export function resolvePlacementNavigation(
  direction: Extract<NavigationDirection, 'up' | 'down'>,
  current: ActiveElement | null,
  targets: ActiveElement[],
): ActiveElement | null {
  if (targets.length === 0) {
    return null;
  }

  const findIndex = (element: ActiveElement | null): number => {
    if (!element) {
      return -1;
    }

    return targets.findIndex((target) => {
      if (target.type !== element.type) {
        return false;
      }

      if (target.type === 'pattern-line' && element.type === 'pattern-line') {
        return target.lineIndex === element.lineIndex;
      }

      return true;
    });
  };

  const currentIndex = findIndex(current);
  const firstPlaceableLine = targets.find((target) => target.type === 'pattern-line') ?? targets[0];

  if (currentIndex === -1) {
    return firstPlaceableLine;
  }

  if (direction === 'up') {
    const nextIndex = Math.max(0, currentIndex - 1);
    return targets[nextIndex];
  }

  const nextIndex = Math.min(targets.length - 1, currentIndex + 1);
  return targets[nextIndex];
}

/**
 * resolveKeyboardNavigationTarget - determines the next active element based on current input.
 */
export function resolveKeyboardNavigationTarget(
  direction: NavigationDirection,
  current: ActiveElement | null,
  hasSelectedRunes: boolean,
  isPatternLineValidTarget: (lineIndex: number) => boolean,
  pickDefaultPlacement: () => ActiveElement | null,
  resolveNext: (direction: NavigationDirection, current: ActiveElement | null) => ActiveElement | null,
  resolvePlacement: (direction: Extract<NavigationDirection, 'up' | 'down'>, current: ActiveElement | null) => ActiveElement | null,
): ActiveElement | null {
  if (hasSelectedRunes) {
    if (direction === 'left' || direction === 'right') {
      return current ?? null;
    }

    if (direction !== 'up' && direction !== 'down') {
      return current ?? null;
    }

    const next = resolvePlacement(direction, current);
    if (next) {
      return next;
    }

    if (current?.type === 'pattern-line' && isPatternLineValidTarget(current.lineIndex)) {
      return current;
    }

    if (current?.type === 'overload') {
      return current;
    }

    return pickDefaultPlacement() ?? current ?? null;
  }

  const next = resolveNext(direction, current);
  if (!next) {
    return current ?? null;
  }

  if (
    current?.type === 'runeforge-rune'
    && next.type === 'runeforge-rune'
    && current.runeforgeIndex === next.runeforgeIndex
    && current.runeIndex === next.runeIndex
  ) {
    return current;
  }

  return next;
}
