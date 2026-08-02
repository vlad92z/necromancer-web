import { describe, expect, it } from 'vitest';
import { createGoblinEnemy, createEnemyTurnRunes, createMonsterEnemy, createMonsterSpellBoard } from './gameInitialization';
import { CARD_DEFINITIONS } from './cardCatalog';
import { MONSTER_CATALOG } from './monsterCatalog';
import { getRuneEffectDescription } from './runeEffects';

describe('monsterCatalog', () => {
  it('is the source for Goblin encounter and reward metadata', () => {
    const goblin = createGoblinEnemy();

    expect(goblin).toMatchObject({
      id: MONSTER_CATALOG.goblin.id,
      name: MONSTER_CATALOG.goblin.name,
      imageSrc: MONSTER_CATALOG.goblin.imageSrc,
      maxHealth: MONSTER_CATALOG.goblin.maxHealth,
      arcaneDustRewardRange: MONSTER_CATALOG.goblin.arcaneDustRewardRange,
    });
    expect(MONSTER_CATALOG.goblin.rewardCardNames).toEqual(['ThrowRock', 'Hide', 'Scorch', 'Heal']);
  });

  it('uses the catalogue turn cards to create Goblin actions', () => {
    expect(createEnemyTurnRunes('goblin', 1).map(({ name, damage }) => ({ name, damage }))).toEqual(
      MONSTER_CATALOG.goblin.turnCycle[0].map(({ cardName, damage }) => ({
        name: CARD_DEFINITIONS[cardName].name,
        damage,
      })),
    );
  });

  it('defines the Witch with its three-turn spell cycle and loot', () => {
    const witch = createMonsterEnemy('witch');

    expect(witch).toMatchObject({
      id: 'witch',
      name: 'Witch',
      health: 15,
      maxHealth: 15,
      imageSrc: expect.stringContaining('witch.png'),
    });
    expect(MONSTER_CATALOG.witch.rewardCardNames).toEqual(['LightningBolt', 'AmplifyMagic', 'Heal']);
    expect(createEnemyTurnRunes('witch', 0).map((rune) => rune.name)).toEqual(['Firebolt', 'Firebolt']);
    expect(createEnemyTurnRunes('witch', 1).map((rune) => rune.name)).toEqual(['Frost Shield', 'Frost Shield']);
    expect(createEnemyTurnRunes('witch', 2)[0]).toMatchObject({
      name: 'Amplify Magic',
      manaCost: 3,
      cardImageSrc: expect.stringContaining('card_amplify_magic.png'),
      passiveEffectRefs: [{ effectId: 'passive.damageBoost', params: { amount: 1 } }],
    });
    expect(createEnemyTurnRunes('witch', 3).map((rune) => rune.name)).toEqual(['Firebolt', 'Firebolt']);
  });

  it('defines Shade with two Shadow Bolts and Heal every turn', () => {
    const shade = createMonsterEnemy('shade');

    expect(shade).toMatchObject({
      id: 'shade',
      name: 'Shade',
      health: 28,
      maxHealth: 28,
      imageSrc: expect.stringContaining('shade.png'),
    });
    expect(MONSTER_CATALOG.shade.rewardCardNames).toEqual(['ShadowBolt', 'VoidTendrils', 'Heal']);
    expect(createEnemyTurnRunes('shade', 0)).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Shadow Bolt', manaCost: 2, runeTypes: ['Void'] }),
      expect.objectContaining({ name: 'Heal', manaCost: 3 }),
    ]));
    expect(createEnemyTurnRunes('shade', 0).filter((rune) => rune.name === 'Shadow Bolt')).toHaveLength(2);
    expect(createEnemyTurnRunes('shade', 1).map((rune) => rune.name)).toEqual([
      'Shadow Bolt', 'Shadow Bolt', 'Heal',
    ]);
  });

  it('defines Golem Lord and its repeating three-turn card cycle', () => {
    const golem = createMonsterEnemy('golem-lord');

    expect(golem).toMatchObject({
      id: 'golem-lord',
      name: 'Golem Lord',
      isBoss: true,
      health: 50,
      maxHealth: 50,
      imageSrc: expect.stringContaining('golem.png'),
    });
    expect(createMonsterSpellBoard('golem-lord').flat().every((cell) => cell.runeTypes.length === 0)).toBe(true);
    expect(createEnemyTurnRunes('golem-lord', 0).map((rune) => rune.name)).toEqual([
      'Barricade', 'Barricade', 'Barricade', 'Barricade',
    ]);
    expect(createEnemyTurnRunes('golem-lord', 1)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'Hurl Rock',
        manaCost: 2,
        damage: 8,
        cardImageSrc: expect.stringContaining('card_throw_rock.png'),
        castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 8 } }],
      }),
    ]));
    expect(createEnemyTurnRunes('golem-lord', 1)).toHaveLength(3);
    const avalanche = createEnemyTurnRunes('golem-lord', 2)[0]!;
    expect(avalanche).toMatchObject({
      name: 'Avalanche',
      manaCost: 5,
      damage: 0,
      cardImageSrc: expect.stringContaining('card_avalanche.png'),
      castEffectRefs: [{ effectId: 'rune.destroy', trigger: 'onCast', selection: 'manual' }],
    });
    expect(getRuneEffectDescription(avalanche)).toBe('• Destroy 1 Enemy Rune');
    expect(createEnemyTurnRunes('golem-lord', 3).map((rune) => rune.name)).toEqual([
      'Barricade', 'Barricade', 'Barricade', 'Barricade',
    ]);
  });
});
