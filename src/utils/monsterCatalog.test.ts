import { describe, expect, it } from 'vitest';
import { createGoblinEnemy, createEnemyTurnRunes } from './gameInitialization';
import { MONSTER_CATALOG } from './monsterCatalog';

describe('monsterCatalog', () => {
  it('is the source for Goblin encounter and reward metadata', () => {
    const goblin = createGoblinEnemy();

    expect(goblin).toMatchObject({
      id: MONSTER_CATALOG.goblin.id,
      name: MONSTER_CATALOG.goblin.name,
      imageSrc: MONSTER_CATALOG.goblin.imageSrc,
      maxHealth: MONSTER_CATALOG.goblin.maxHealth,
      armor: MONSTER_CATALOG.goblin.armor,
      arcaneDustRewardRange: MONSTER_CATALOG.goblin.arcaneDustRewardRange,
    });
    expect(MONSTER_CATALOG.goblin.rewardCardNames).toEqual(['Throw Rock', 'Hide', 'Scorch', 'Lifeline']);
  });

  it('uses the catalogue turn cards to create Goblin actions', () => {
    expect(createEnemyTurnRunes(1).map(({ name, damage }) => ({ name, damage }))).toEqual(
      MONSTER_CATALOG.goblin.turnCards.map(({ cardName, damage }) => ({ name: cardName, damage })),
    );
  });
});
