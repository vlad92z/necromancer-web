/**
 * soloGameStoreHelpers - reusable helpers for solo game store actions.
 */

import type { PlayerStats, Rune, SoloGameState } from '../../types/game';
import { getColumn } from '../../utils/runeHelpers';

/**
 * applySoloOverloadDamage - apply overflow damage to player stats.
 */
export function applySoloOverloadDamage(
  playerStats: PlayerStats,
  overflowRunes: Rune[],
  overloadDamagePerRune: number
): { nextStats: PlayerStats; appliedDamage: number } {
  if (overflowRunes.length === 0) {
    return { nextStats: playerStats, appliedDamage: 0 };
  }

  const baseDamage = overflowRunes.length * overloadDamagePerRune;
  const armorAbsorbed = Math.min(playerStats.currentArmor, baseDamage);
  const remainingDamage = baseDamage - armorAbsorbed;
  const nextArmor = playerStats.currentArmor - armorAbsorbed;
  const nextHealth = Math.max(0, playerStats.currentHealth - remainingDamage);

  return {
    nextStats: {
      ...playerStats,
      currentArmor: nextArmor,
      currentHealth: nextHealth,
    },
    appliedDamage: remainingDamage,
  };
}

/**
 * canPlaceSelectionOnPatternLine - validate selection and target line using a minimal state slice.
 */
export function canPlaceSelectionOnPatternLine(
  state: Pick<SoloGameState, 'patternLines' | 'spellWall'>,
  patternLineIndex: number,
  selectedRunes: Rune[]
): boolean {
  if (selectedRunes.length === 0) {
    return false;
  }

  const patternLine = state.patternLines[patternLineIndex];
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
  if (state.spellWall[row]?.[col]?.rune !== null) {
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
  if (
    !canPlaceSelectionOnPatternLine(
      { patternLines: state.patternLines, spellWall: state.spellWall },
      patternLineIndex,
      selectedRunes
    )
  ) {
    return state;
  }

  const patternLine = state.patternLines[patternLineIndex];
  if (!patternLine) {
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

  const { nextStats } = applySoloOverloadDamage(
    state.playerStats,
    overflowRunes,
    state.overloadDamage
  );

  // Remove all placed runes from the player hand.
  const selectedIds = new Set(selectedRunes.map((rune) => rune.id));
  const updatedHand = state.playerHand.filter((rune) => !selectedIds.has(rune.id));

  // Track overflow runes in the deck for later handling.
  const updatedDeck = overflowRunes.length > 0
    ? {
        ...state.deck,
        overloadedRunes: [...state.deck.overloadedRunes, ...overflowRunes],
      }
    : state.deck;

  const nextStatus = nextStats.currentHealth === 0 ? 'defeat' : 'in-progress';
  // If the line is complete, move the primary rune to the spell wall and lock the line.
  const isPatternLineComplete = updatedRunes.length === patternLine.capacity;
  const updatedSpellWall = isPatternLineComplete
    ? state.spellWall.map((row, rowIndex) => {
        if (rowIndex !== patternLineIndex) {
          return row;
        }
        const primaryRune = updatedRunes[0];
        const targetColumn = getColumn(patternLineIndex, primaryRune.runeType);
        return row.map((cell, colIndex) => (
          colIndex === targetColumn ? { ...cell, rune: primaryRune } : cell
        ));
      })
    : state.spellWall;

  if (isPatternLineComplete) {
    updatedPatternLines[patternLineIndex] = {
      ...patternLine,
      runes: [],
      isLocked: true,
    };
  }

  return {
    ...state,
    status: nextStatus,
    playerStats: nextStats,
    deck: updatedDeck,
    playerHand: updatedHand,
    patternLines: updatedPatternLines,
    spellWall: updatedSpellWall,
  };
}
