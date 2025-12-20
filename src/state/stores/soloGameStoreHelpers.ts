/**
 * soloGameStoreHelpers - reusable helpers for solo game store actions.
 */

import type { PatternLine, Rune, SoloGameState, SpellWall } from '../../types/game';
import { applySoloOverloadDamage } from '../../utils/overload';
import { getColumn } from '../../utils/runeHelpers';
import { drawRunesFromDeck } from '../../utils/soloGameInitialization';

/**
 * canPlaceSelectionOnPatternLine - validate selection and target line using a minimal state slice.
 */
export function canPlaceSelectionOnPatternLine(
  patternLineIndex: number,
  selectedRunes: Rune[],
  patternLines: PatternLine[],
  spellWall: SpellWall
): boolean {
  if (selectedRunes.length === 0) {
    return false;
  }

  const patternLine = patternLines[patternLineIndex];
  if (!patternLine || patternLine.isLocked) {
    return false;
  }

  const selectedRuneType = selectedRunes[0].runeType;
  const currentPatternLineCount = patternLine.runes.length;
  if (currentPatternLineCount > 0 && selectedRuneType !== patternLine.runes[0].runeType) {
    return false;
  }

  if (currentPatternLineCount >= patternLine.capacity) {
    console.log('Invalid game state: pattern line is over capacity', { patternLineIndex, currentPatternLineCount });
    return false;
  }

  const row = patternLineIndex;
  const col = getColumn(row, selectedRuneType);
  if (spellWall[row]?.[col]?.rune !== null) {
    console.log('placeSelectionOnPatternLine: rune type already on spellWall', { patternLineIndex, row, col });
    return false;
  }

  return true;
}

/**
 * placeSelectionOnPatternLine - place selected runes onto a pattern line.
 */
export function placeSelectionOnPatternLine(
  state: SoloGameState,
  patternLineIndex: number,
  selectedRunes: Rune[]
): SoloGameState {
  const isPlacementValid = canPlaceSelectionOnPatternLine(patternLineIndex, selectedRunes, state.patternLines, state.spellWall)
  const patternLine = state.patternLines[patternLineIndex];
  if (!patternLine || !isPlacementValid) {
    return state;
  }

  // Apply selection to the pattern line and compute overflow damage.
  const currentPatternLineCount = patternLine.runes.length;
  const availableSpace = patternLine.capacity - currentPatternLineCount;
  const runesToPlace = Math.min(selectedRunes.length, availableSpace);
  const overflowRunes = selectedRunes.slice(runesToPlace);
  const placedRunes = selectedRunes.slice(0, runesToPlace);
  const updatedRunes = [...patternLine.runes, ...placedRunes];
  const updatedPatternLines = [...state.patternLines];
  updatedPatternLines[patternLineIndex] = {
    ...patternLine,
    runes: updatedRunes,
  };

  // Apply overload damage from placement overflow before dealing new runes.
  const { nextStats: placementStats } = applySoloOverloadDamage(state.playerStats, overflowRunes, state.overloadDamage);

  // Remove all placed runes from the player hand.
  const selectedIds = new Set(selectedRunes.map((rune) => rune.id));
  const handAfterPlacement = state.playerHand.filter((rune) => !selectedIds.has(rune.id));

  // Track overflow runes in the deck for later handling.
  let newDeck = state.deck;
  if (overflowRunes.length > 0) {
    newDeck.overloadedRunes = [...newDeck.overloadedRunes, ...overflowRunes];
  }

  // Deal a fresh set of runes after placement using the existing deck order.
  const {
    newDeck: remainingRunes,
    newHand: newHand,
    overflowRunes: drawOverflowRunes,
  } = drawRunesFromDeck(newDeck.remainingRunes, handAfterPlacement);
  newDeck.remainingRunes = remainingRunes;

  // Apply overload damage from overdraw and collect overflowed runes.
  const { nextStats } = applySoloOverloadDamage(placementStats, drawOverflowRunes, state.overloadDamage);
  if (drawOverflowRunes.length > 0) {
    newDeck.overloadedRunes = [...newDeck.overloadedRunes, ...drawOverflowRunes];
  }

  const nextStatus = nextStats.currentHealth === 0 ? 'defeat' : 'in-progress';

  // Lock pattern line and move rune to spell wall if complete.
  const newSpellWall = [...state.spellWall];
  const isPatternLineComplete = updatedRunes.length === patternLine.capacity;
  if (isPatternLineComplete) {
    const primaryRune = updatedRunes[0];
    const targetColumn = getColumn(patternLineIndex, primaryRune.runeType);
    newSpellWall[patternLineIndex][targetColumn].rune = primaryRune;
    updatedPatternLines[patternLineIndex] = { ...patternLine, runes: [], isLocked: true };
  }

  return {
    ...state,
    status: nextStatus,
    playerStats: nextStats,
    deck: newDeck,
    playerHand: newHand,
    patternLines: updatedPatternLines,
    spellWall: newSpellWall,
  };
}
