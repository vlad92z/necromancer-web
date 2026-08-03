import { describe, expect, it } from 'vitest';
import { MONSTER_CATALOG } from './monsterCatalog';
import { createEncounterState, createInitialSoloRunState } from './soloRunFactory';
import { SPELL_WALL_SIDE_LENGTH } from './spellWall';

describe('solo run factory', () => {
  it('keeps map-phase state free of a prebuilt encounter', () => {
    const state = createInitialSoloRunState();

    expect(state.soloPhase).toBe('map');
    expect(state.enemy).toBeNull();
    expect(state.hand).toEqual([]);
    expect(state.player.deck).toHaveLength(state.fullDeck.length);
  });

  it('creates a neutral 5 by 5 encounter board from the monster catalogue', () => {
    const run = createInitialSoloRunState();
    const encounter = createEncounterState({
      monsterId: 'goblin',
      player: run.player,
      fullDeck: run.fullDeck,
    });

    expect(encounter.enemy).toMatchObject({
      health: MONSTER_CATALOG.goblin.maxHealth,
      maxHealth: MONSTER_CATALOG.goblin.maxHealth,
    });
    expect(encounter.player.wall).toHaveLength(SPELL_WALL_SIDE_LENGTH);
    expect(encounter.player.wall.every((row) => row.length === SPELL_WALL_SIDE_LENGTH)).toBe(true);
    expect(encounter.enemyBoard).toHaveLength(SPELL_WALL_SIDE_LENGTH);
    expect(encounter.enemyBoard.every((row) => row.length === SPELL_WALL_SIDE_LENGTH)).toBe(true);
  });
});
