import { create } from "zustand";
import type { Artefact } from "../types/artefacts";
import type { PatternLine, PlayerStats, Rune, SoloGameState, SpellWall } from "../types/game";
import { applySoloOverloadDamage, getOverloadDamageForGame } from "./overload";
import { getBaseRuneEffectForType } from "./runeEffects";
import { getRuneType } from "./runeHelpers";
import { SOLO_RUN_CONFIG } from "./soloRunConfig";

export function createSpellWall(): SpellWall {
  const runeTypes = SOLO_RUN_CONFIG.runeTypes;
  const size = runeTypes.length;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const runeType = getRuneType(row, col);
      return { runeType, rune: null };
    })
  );
}

export function createPatternLines(count: number = SOLO_RUN_CONFIG.wallSize): PatternLine[] {
  const lines: PatternLine[] = [];
  for (let capacity = 1; capacity <= count; capacity++) {
    lines.push({ capacity: capacity, runes: [], isLocked: false, hideRunes: true });
  }
  return lines;
}

function startingPlayer(): PlayerStats {
    const config = SOLO_RUN_CONFIG;
    return {
        currentHealth: config.startingHealth,
        maxHealth: config.startingHealth,
        currentArmor: 0,
    }
}

export function createStartingDeck(): Rune[] {
  const config = SOLO_RUN_CONFIG;
  const deck: Rune[] = [];

  config.runeTypes.forEach((runeType) => {
    for (let i = 0; i <= 15; i++) {
      deck.push({
        id: `${runeType}-${i}`,
        runeType,
        effect: getBaseRuneEffectForType(runeType),
        rarity: 'common',
      });
    }
  });
  return deck;
}

/**
 * drawRunesFromDeck - draw runes and cap hand size, tracking overflow runes.
 */
export function drawRunesFromDeck(
  shuffledDeck: Rune[],
  hand: Rune[]
): { newDeck: Rune[]; newHand: Rune[]; overflowRunes: Rune[] } {
  const config = SOLO_RUN_CONFIG;
  const runesToDeal = Math.min(shuffledDeck.length, config.drawCound);
  const runesDrawn = shuffledDeck.slice(0, runesToDeal);
  const updatedDeck = shuffledDeck.slice(runesToDeal);

  // Respect max hand size by sending extra drawn runes to overload.
  const remainingCapacity = Math.max(0, config.maxHandSize - hand.length);
  const runesForHand = runesDrawn.slice(0, remainingCapacity);
  const overflowRunes = runesDrawn.slice(remainingCapacity);
  const updatedHand = [...runesForHand, ...hand];

  return { newDeck: updatedDeck, newHand: updatedHand, overflowRunes };
}

/**
 * nextGame - create a fresh solo game state for a new run.
 */
export function nextGame(
    gameIndex: number = 0,
    player: PlayerStats = startingPlayer(),
    activeArtefacts: Artefact[] = [], //TODO: Get this from global state
    fullDeck: Rune[] = createStartingDeck(),
) : SoloGameState {
    const shuffledDeck = fullDeck.sort(() => Math.random() - 0.5);
    const { newDeck: deck, newHand: hand, overflowRunes } = drawRunesFromDeck(shuffledDeck, []);
    const overloadDamage = getOverloadDamageForGame(gameIndex);
    const basePlayerStats = { ...player, currentArmor: 0 };
    const { nextStats } = applySoloOverloadDamage(basePlayerStats, overflowRunes, overloadDamage);
    return {
        status: 'not-started',
        playerStats: nextStats,
        runeScore: {
            current: 0,
            target: SOLO_RUN_CONFIG.baseTargetScore * (gameIndex + 1),
        },
        overloadDamage,
        activeArtefacts,
        deck: {
            remainingRunes: deck,
            allRunes: fullDeck,
            overloadedRunes: overflowRunes,
        },
        playerHand: hand,
        gameIndex,
        roundIndex: 0,
        spellWall: createSpellWall(),
        patternLines: createPatternLines(),
    }
}
