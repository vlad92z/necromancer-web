/**
 * Keyboard navigation helpers and active element typing for gameplay views.
 */

export type ActiveElement =
  | { type: 'settings' }
  | { type: 'rune-zone'; zone: 'draw' | 'discard' | 'deck' }
  | { type: 'scoring-wall'; row: number; col: number }
  | { type: 'artefact'; artefactIndex: number };

export type NavigationDirection = 'left' | 'right' | 'up' | 'down';
