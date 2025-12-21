/**
 * soloGameStoreHelpers - reusable helpers for solo game store actions.
 */

import type { Artefact, ArtefactId } from '../../types/artefacts';
import type { Deck, PatternLine, PlayerStats, Rune, RuneScore, RuneType, SoloGameState, SpellWall } from '../../types/game';
import { applySoloOverloadDamage, getOverloadDamageForRound } from '../../utils/overload';
import { getColumn } from '../../utils/runeHelpers';
import { resolveSegment } from '../../utils/scoring';
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
 * buildRuneTypeCountMap - builds a count map for rune types used in channel synergy effects.
 */
function buildRuneTypeCountMap(runes: Rune[]): Map<RuneType, number> {
  const counts = new Map<RuneType, number>();
  runes.forEach((rune) => {
    counts.set(rune.runeType, (counts.get(rune.runeType) ?? 0) + 1);
  });
  return counts;
}

/**
 * hasActiveArtefact - checks whether a solo run has an active artefact by id.
 */
function hasActiveArtefact(activeArtefacts: Artefact[], artefactId: ArtefactId): boolean {
  return activeArtefacts.some((artefact) => artefact.id === artefactId);
}

/**
 * getSoloDamageMultiplier - applies outgoing damage modifiers for solo artefacts.
 */
function getSoloDamageMultiplier(segmentSize: number, activeArtefacts: Artefact[]): number {
  let damageMultiplier = 1;
  if (segmentSize === 1 && hasActiveArtefact(activeArtefacts, 'tome')) {
    damageMultiplier *= 2;
  }
  return damageMultiplier;
}

/**
 * getSoloHealingMultiplier - applies outgoing healing modifiers for solo artefacts.
 */
function getSoloHealingMultiplier(segmentSize: number, activeArtefacts: Artefact[]): number {
  let healingMultiplier = 1;
  if (segmentSize === 1 && hasActiveArtefact(activeArtefacts, 'tome')) {
    healingMultiplier *= 2;
  }
  if (hasActiveArtefact(activeArtefacts, 'rod')) {
    healingMultiplier *= 2;
  }
  return healingMultiplier;
}

/**
 * getSoloArmorMultiplier - applies armor gain modifiers for solo artefacts.
 */
function getSoloArmorMultiplier(segmentSize: number, activeArtefacts: Artefact[]): number {
  let armorMultiplier = 1;
  if (segmentSize === 1 && hasActiveArtefact(activeArtefacts, 'tome')) {
    armorMultiplier *= 2;
  }
  if (hasActiveArtefact(activeArtefacts, 'potion')) {
    armorMultiplier *= 2;
  }
  return armorMultiplier;
}

interface CompletedPatternLineResult {
  nextPatternLines: PatternLine[];
  nextSpellWall: SpellWall;
  nextStats: PlayerStats;
  nextRuneScore: RuneScore;
}

/**
 * resolveCompletedPatternLine - updates the spell wall, stats, and score after a pattern line completes.
 */
function resolveCompletedPatternLine(
  patternLineIndex: number,
  patternLine: PatternLine,
  completedRunes: Rune[],
  spellWall: SpellWall,
  patternLines: PatternLine[],
  playerStats: PlayerStats,
  runeScore: RuneScore,
  deck: Deck,
  activeArtefacts: Artefact[]
): CompletedPatternLineResult {
  const nextSpellWall = [...spellWall];
  const nextPatternLines = [...patternLines];
  const primaryRune = completedRunes[0];
  const targetColumn = getColumn(patternLineIndex, primaryRune.runeType);
  nextSpellWall[patternLineIndex][targetColumn].rune = primaryRune;
  nextPatternLines[patternLineIndex] = { ...patternLine, runes: [], isLocked: true };

  // Resolve the connected segment effects immediately after placing the rune.
  const overloadRuneCounts = buildRuneTypeCountMap(deck.overloadedRunes);
  const resolvedSegment = resolveSegment(nextSpellWall, patternLineIndex, targetColumn, overloadRuneCounts);
  const damageMultiplier = getSoloDamageMultiplier(resolvedSegment.segmentSize, activeArtefacts);
  const healingMultiplier = getSoloHealingMultiplier(resolvedSegment.segmentSize, activeArtefacts);
  const armorMultiplier = getSoloArmorMultiplier(resolvedSegment.segmentSize, activeArtefacts);

  const totalDamage = resolvedSegment.damage * damageMultiplier;
  const totalHealing = resolvedSegment.healing * healingMultiplier;
  const totalArmor = resolvedSegment.armor * armorMultiplier;

  const nextHealth = Math.min(playerStats.maxHealth, playerStats.currentHealth + totalHealing);
  const nextArmor = Math.max(0, playerStats.currentArmor + totalArmor);

  const nextStats = {
    ...playerStats,
    currentHealth: nextHealth,
    currentArmor: nextArmor,
  };
  const nextRuneScore = {
    ...runeScore,
    current: runeScore.current + totalDamage,
  };

  return {
    nextPatternLines,
    nextSpellWall,
    nextStats,
    nextRuneScore,
  };
}

/**
 * placeSelectionOnPatternLine - place selected runes onto a pattern line.
 */
export function placeSelectionOnPatternLine(
  state: SoloGameState,
  patternLineIndex: number,
  selectedRunes: Rune[]
): SoloGameState {
  console.log('placeSelectionOnPatternLine', { patternLineIndex, selectedRunes });
  const isPlacementValid = canPlaceSelectionOnPatternLine(patternLineIndex, selectedRunes, state.patternLines, state.spellWall);
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
  let updatedPatternLines = [...state.patternLines];
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

  // Lock pattern line and move rune to spell wall if complete.
  let updatedSpellWall = [...state.spellWall];
  let updatedStats = nextStats;
  let updatedRuneScore = state.runeScore;
  const isPatternLineComplete = updatedRunes.length === patternLine.capacity;
  if (isPatternLineComplete) {
    const completionResult = resolveCompletedPatternLine(
      patternLineIndex,
      patternLine,
      updatedRunes,
      updatedSpellWall,
      updatedPatternLines,
      updatedStats,
      updatedRuneScore,
      newDeck,
      state.activeArtefacts
    );
    updatedPatternLines = completionResult.nextPatternLines;
    updatedSpellWall = completionResult.nextSpellWall;
    updatedStats = completionResult.nextStats;
    updatedRuneScore = completionResult.nextRuneScore;
  }

  const nextStatus = updatedStats.currentHealth === 0 ? 'defeat' : 'in-progress';

  return {
    ...state,
    status: nextStatus,
    playerStats: updatedStats,
    deck: newDeck,
    playerHand: newHand,
    patternLines: updatedPatternLines,
    spellWall: updatedSpellWall,
    runeScore: updatedRuneScore,
  };
}

/**
 * endSoloRound - overload the current hand, advance the round, and draw a new hand.
 */
export function endSoloRound(state: SoloGameState): SoloGameState {
  if (state.status !== 'in-progress') {
    return state;
  }

  const unlockedPatternLines = state.patternLines.map((line) => ({
    ...line,
    isLocked: false,
  }));
  const handToOverload = state.playerHand;
  const { nextStats: overloadStats } = applySoloOverloadDamage(
    state.playerStats,
    handToOverload,
    state.overloadDamage
  );

  const nextRoundIndex = state.roundIndex + 1;
  const nextOverloadDamage = getOverloadDamageForRound(state.gameIndex, nextRoundIndex);

  let nextDeck: Deck = {
    ...state.deck,
    overloadedRunes: [...state.deck.overloadedRunes, ...handToOverload],
  };

  const { newDeck: remainingRunes, newHand, overflowRunes } = drawRunesFromDeck(nextDeck.remainingRunes, []);
  nextDeck = {
    ...nextDeck,
    remainingRunes,
  };

  const { nextStats } = applySoloOverloadDamage(overloadStats, overflowRunes, nextOverloadDamage);
  if (overflowRunes.length > 0) {
    nextDeck = {
      ...nextDeck,
      overloadedRunes: [...nextDeck.overloadedRunes, ...overflowRunes],
    };
  }

  const nextStatus = nextStats.currentHealth === 0 ? 'defeat' : state.status;

  return {
    ...state,
    status: nextStatus,
    playerStats: nextStats,
    deck: nextDeck,
    playerHand: newHand,
    patternLines: unlockedPatternLines,
    roundIndex: nextRoundIndex,
    overloadDamage: nextOverloadDamage,
  };
}
