import { describe, expect, it } from 'vitest';
import type { MonsterId } from '../types/game';
import { getArenaMonsterDetails } from './arenaCatalog';
import { MONSTER_CATALOG } from './monsterCatalog';

describe('arenaCatalog', () => {
  it('maps every catalogue monster to its ordered turns and complete loot pool', () => {
    Object.values(MONSTER_CATALOG).forEach((monster) => {
      const details = getArenaMonsterDetails(monster.id as MonsterId);

      expect(details.monster).toBe(monster);
      expect(details.turns.map((turn) => turn.map((rune) => rune.name))).toEqual(
        monster.turnCycle.map((turn) => turn.map(({ cardName }) => cardName)),
      );
      expect(details.loot.map((rune) => rune.name)).toEqual(monster.rewardCardNames);
    });
  });

  it('shows the Golem Lord three-turn cycle with no card loot', () => {
    const details = getArenaMonsterDetails('golem-lord');

    expect(details.turns).toHaveLength(3);
    expect(details.turns.map((turn) => turn.map((rune) => rune.name))).toEqual([
      ['Barricade', 'Barricade', 'Barricade', 'Barricade'],
      ['Hurl Rock', 'Hurl Rock', 'Hurl Rock'],
      ['Avalanche'],
    ]);
    expect(details.loot).toEqual([]);
  });
});
