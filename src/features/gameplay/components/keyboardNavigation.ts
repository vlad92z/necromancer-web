/**
 * Keyboard navigation helpers and active element typing for gameplay views.
 */

export type ActiveElement =
  | { type: 'settings' }
  | { type: 'overload' }
  | { type: 'deck' }
  | { type: 'runeforge-rune'; runeforgeIndex: number; runeIndex: number }
  | { type: 'pattern-line'; lineIndex: number }
  | { type: 'scoring-wall'; row: number; col: number }
  | { type: 'artefact'; artefactIndex: number };

export type NavigationDirection = 'left' | 'right' | 'up' | 'down';
