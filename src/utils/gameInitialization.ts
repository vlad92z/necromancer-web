/**
 * @deprecated Import from `soloRunFactory`, `spellWall`, or `monsterFactory`.
 * Kept temporarily for test and external-call compatibility.
 */
export {
  createEncounterState,
  createInitialSoloRunState as initializeSoloGame,
  createPlayer,
  createRuneSoundSignals,
  createStartingDeck,
  DEFAULT_HAND_SIZE,
  DEFAULT_PLAYER_MANA,
  PLAYER_RUNE_TYPES as RUNE_TYPES,
  STARTING_DECK,
} from './soloRunFactory';
export {
  createEmptySpellWall as createEmptyWall,
  SPELL_WALL_SIDE_LENGTH as WALL_SIZE,
} from './spellWall';
export {
  createMonsterEnemy,
  createEnemyTurnRunes,
  rollEnemyArcaneDustReward,
} from './monsterFactory';

import type { Enemy, MonsterId, ScoringWall } from '../types/game';
import { createMonsterEnemy } from './monsterFactory';
import { createEmptySpellWall } from './spellWall';

/** @deprecated Use createMonsterEnemy('goblin'). */
export function createGoblinEnemy(): Enemy {
  return createMonsterEnemy('goblin');
}

/** @deprecated All current monster boards are neutral spell walls. */
export function createMonsterSpellBoard(_monsterId: MonsterId, size?: number): ScoringWall {
  return createEmptySpellWall(size);
}

/** @deprecated Use createEmptySpellWall. */
export function createEnemySpellBoard(size?: number): ScoringWall {
  return createEmptySpellWall(size);
}
