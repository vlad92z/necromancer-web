/**
 * Keyboard navigation controller for gameplay surface.
 * Centralizes arrow/enter/escape handling and target selection.
 */

import type { ActiveElement } from '../types/game';
import type { NavigationDirection } from './navigationGrid';

const GAME_TARGETS: ActiveElement[][] = [
  [{ type: 'settings' }, { type: 'deck' }, { type: 'overload' }],
  [
    {type: 'runeforge-rune', runeforgeIndex: 0,runeIndex: 0},
    {type: 'runeforge-rune', runeforgeIndex: 0, runeIndex: 1},
    {type: 'runeforge-rune', runeforgeIndex: 0, runeIndex: 2},
    {type: 'runeforge-rune', runeforgeIndex: 0, runeIndex: 3},
    {type: 'runeforge-rune', runeforgeIndex: 0, runeIndex: 4},
    {type: 'pattern-line', lineIndex: 0 },
    {type: 'scoring-wall', row: 0, col: 0},
    {type: 'scoring-wall', row: 0, col: 1},
    {type: 'scoring-wall', row: 0, col: 2},
    {type: 'scoring-wall', row: 0, col: 3},
    {type: 'scoring-wall', row: 0, col: 4},
    {type: 'scoring-wall', row: 0, col: 5},
    {type: 'scoring-wall', row: 0, col: 6},
  ],
  [
    {type: 'runeforge-rune', runeforgeIndex: 1, runeIndex: 0},
    {type: 'runeforge-rune', runeforgeIndex: 1, runeIndex: 1},
    {type: 'runeforge-rune', runeforgeIndex: 1, runeIndex: 2},
    {type: 'runeforge-rune', runeforgeIndex: 1, runeIndex: 3},
    {type: 'runeforge-rune', runeforgeIndex: 1, runeIndex: 4},
    {type: 'pattern-line', lineIndex: 1 },
    {type: 'scoring-wall', row: 1, col: 0},
    {type: 'scoring-wall', row: 1, col: 1},
    {type: 'scoring-wall', row: 1, col: 2},
    {type: 'scoring-wall', row: 1, col: 3},
    {type: 'scoring-wall', row: 1, col: 4},
    {type: 'scoring-wall', row: 1, col: 5},
    {type: 'scoring-wall', row: 1, col: 6},
  ],
  [
    {type: 'runeforge-rune', runeforgeIndex: 2, runeIndex: 0},
    {type: 'runeforge-rune', runeforgeIndex: 2, runeIndex: 1},
    {type: 'runeforge-rune', runeforgeIndex: 2, runeIndex: 2},
    {type: 'runeforge-rune', runeforgeIndex: 2, runeIndex: 3},
    {type: 'runeforge-rune', runeforgeIndex: 2, runeIndex: 4},
    {type: 'pattern-line', lineIndex: 2 },
    {type: 'scoring-wall', row: 2, col: 0},
    {type: 'scoring-wall', row: 2, col: 1},
    {type: 'scoring-wall', row: 2, col: 2},
    {type: 'scoring-wall', row: 2, col: 3},
    {type: 'scoring-wall', row: 2, col: 4},
    {type: 'scoring-wall', row: 2, col: 5},
    {type: 'scoring-wall', row: 2, col: 6},
  ],
  [
    {type: 'runeforge-rune', runeforgeIndex: 3, runeIndex: 0},
    {type: 'runeforge-rune', runeforgeIndex: 3, runeIndex: 1},
    {type: 'runeforge-rune', runeforgeIndex: 3, runeIndex: 2},
    {type: 'runeforge-rune', runeforgeIndex: 3, runeIndex: 3},
    {type: 'runeforge-rune', runeforgeIndex: 3, runeIndex: 4},
    {type: 'pattern-line', lineIndex: 3 },
    {type: 'scoring-wall', row: 3, col: 0},
    {type: 'scoring-wall', row: 3, col: 1},
    {type: 'scoring-wall', row: 3, col: 2},
    {type: 'scoring-wall', row: 3, col: 3},
    {type: 'scoring-wall', row: 3, col: 4},
    {type: 'scoring-wall', row: 3, col: 5},
    {type: 'scoring-wall', row: 3, col: 6},
  ],
  [
    {type: 'runeforge-rune', runeforgeIndex: 4, runeIndex: 0},
    {type: 'runeforge-rune', runeforgeIndex: 4, runeIndex: 1},
    {type: 'runeforge-rune', runeforgeIndex: 4, runeIndex: 2},
    {type: 'runeforge-rune', runeforgeIndex: 4, runeIndex: 3},
    {type: 'runeforge-rune', runeforgeIndex: 4, runeIndex: 4},
    {type: 'pattern-line', lineIndex: 4 },
    {type: 'scoring-wall', row: 4, col: 0},
    {type: 'scoring-wall', row: 4, col: 1},
    {type: 'scoring-wall', row: 4, col: 2},
    {type: 'scoring-wall', row: 4, col: 3},
    {type: 'scoring-wall', row: 4, col: 4},
    {type: 'scoring-wall', row: 4, col: 5},
    {type: 'scoring-wall', row: 4, col: 6},
  ],
  [
    {type: 'runeforge-rune', runeforgeIndex: 5, runeIndex: 0},
    {type: 'runeforge-rune', runeforgeIndex: 5, runeIndex: 1},
    {type: 'runeforge-rune', runeforgeIndex: 5, runeIndex: 2},
    {type: 'runeforge-rune', runeforgeIndex: 5, runeIndex: 3},
    {type: 'runeforge-rune', runeforgeIndex: 5, runeIndex: 4},
    {type: 'pattern-line', lineIndex: 5 },
    {type: 'scoring-wall', row: 5, col: 0},
    {type: 'scoring-wall', row: 5, col: 1},
    {type: 'scoring-wall', row: 5, col: 2},
    {type: 'scoring-wall', row: 5, col: 3},
    {type: 'scoring-wall', row: 5, col: 4},
    {type: 'scoring-wall', row: 5, col: 5},
    {type: 'scoring-wall', row: 5, col: 6},
  ],
  [
    {type: 'artefact', artefactIndex: 0},
    {type: 'artefact', artefactIndex: 1},
    {type: 'artefact', artefactIndex: 2},
    {type: 'artefact', artefactIndex: 3},
    {type: 'artefact', artefactIndex: 4},
    {type: 'artefact', artefactIndex: 5},
        {type: 'pattern-line', lineIndex: 6 },
    {type: 'scoring-wall', row: 6, col: 0},
    {type: 'scoring-wall', row: 6, col: 1},
    {type: 'scoring-wall', row: 6, col: 2},
    {type: 'scoring-wall', row: 6, col: 3},
    {type: 'scoring-wall', row: 6, col: 4},
    {type: 'scoring-wall', row: 6, col: 5},
    {type: 'scoring-wall', row: 6, col: 6},
  ]
];

export interface KeyboardNavigationContext {
  activeElement: ActiveElement | null;
  hasSelectedRunes: boolean;
  isDeckDrafting: boolean;
  showSettingsOverlay: boolean;
  showDeckOverlay: boolean;
  showOverloadOverlay: boolean;
  showRulesOverlay: boolean;
  validPatternLineIndexes: number[];
  occupiedPatternLineIndexes: number[];
  moveActiveElement: (direction: NavigationDirection) => void;
  setActiveElement: (element: ActiveElement) => void;
  handleSelectActiveElement: (element: ActiveElement | null) => void;
  handleCancelSelection: () => void;
  handleOpenSettings: () => void;
}

function buildVerticalTargets(
  hasSelectedRunes: boolean,
  validPatternLineIndexes: number[],
  occupiedPatternLineIndexes: number[],
  direction: 'up' | 'down'
): ActiveElement[] {
  if (hasSelectedRunes) {
    const patternTargets: ActiveElement[] = validPatternLineIndexes.map((lineIndex) => ({ type: 'pattern-line', lineIndex }));
    const targets: ActiveElement[] = [{ type: 'overload' }, ...patternTargets];
    return targets;
  }

  const patternTargets = occupiedPatternLineIndexes.map((lineIndex) => ({ type: 'pattern-line' as const, lineIndex }));
  if (direction === 'up') {
    return [{ type: 'overload' }, ...patternTargets];
  }
  if (patternTargets.length === 0) {
    return [{ type: 'overload' }];
  }
  return patternTargets;
}

export function handleKeyboardNavigation(event: KeyboardEvent, context: KeyboardNavigationContext): void {
  const {
    activeElement,
    hasSelectedRunes,
    isDeckDrafting,
    showDeckOverlay,
    showOverloadOverlay,
    showRulesOverlay,
    showSettingsOverlay,
    validPatternLineIndexes,
    occupiedPatternLineIndexes,
    moveActiveElement,
    setActiveElement,
    handleSelectActiveElement,
    handleCancelSelection,
    handleOpenSettings,
  } = context;
  console.log('Keyboard event:', event.key);
  const overlaysOpen = showSettingsOverlay || showDeckOverlay || showOverloadOverlay || showRulesOverlay || isDeckDrafting;

  if (event.key === 'Escape') {
    if (hasSelectedRunes) {
      event.preventDefault();
      handleCancelSelection();
    } else {
      handleOpenSettings();
    }
    return;
  }

  if (overlaysOpen) {
    return;
  }

  const handleVerticalSelection = (direction: 'up' | 'down') => {
    console.log('Handling vertical selection:', direction);
    const targets = buildVerticalTargets(hasSelectedRunes, validPatternLineIndexes, occupiedPatternLineIndexes, direction);
    return;
    if (targets.length === 0) {
      moveActiveElement(direction);
      return;
    }

    const currentIndex = targets.findIndex((target) =>
      activeElement &&
      target.type === activeElement.type &&
      ((target.type === 'overload' && activeElement.type === 'overload') ||
        (target.type === 'pattern-line' &&
          activeElement.type === 'pattern-line' &&
          target.lineIndex === activeElement.lineIndex))
    );
    const nextIndex = direction === 'up'
      ? Math.max(0, currentIndex <= 0 ? 0 : currentIndex - 1)
      : Math.min(targets.length - 1, currentIndex === -1 ? 0 : currentIndex + 1);
    const nextTarget = targets[nextIndex] ?? targets[targets.length - 1];
    if (nextTarget) {
      setActiveElement(nextTarget);
    }
  };

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    handleVerticalSelection('up');
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    handleVerticalSelection('down');
    return;
  }

  if (event.key === 'ArrowLeft') {
    if (!hasSelectedRunes) {
      event.preventDefault();
      moveActiveElement('left');
    }
    return;
  }

  if (event.key === 'ArrowRight') {
    if (!hasSelectedRunes) {
      event.preventDefault();
      moveActiveElement('right');
    }
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleSelectActiveElement(activeElement);
  }
}
