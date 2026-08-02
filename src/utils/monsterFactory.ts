import type { Enemy, EnemyRune, MonsterId } from '../types/game';
import type { CardName } from './cardCatalog';
import { MONSTER_CATALOG } from './monsterCatalog';
import { createRuneFromCardName } from './runeEffects';

export function createMonsterEnemy(monsterId: MonsterId): Enemy {
  const monster = MONSTER_CATALOG[monsterId];
  return {
    id: monster.id,
    name: monster.name,
    imageSrc: monster.imageSrc,
    isBoss: monster.isBoss,
    health: monster.maxHealth,
    maxHealth: monster.maxHealth,
    arcaneDustRewardRange: monster.arcaneDustRewardRange,
  };
}

export function rollEnemyArcaneDustReward(enemy: Enemy | null, random: () => number = Math.random): number {
  const range = enemy?.arcaneDustRewardRange;
  if (!range) return 0;

  const [minimum, maximum] = range;
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function createEnemyRune(id: string, cardName: CardName, damage: number): EnemyRune {
  return { ...createRuneFromCardName({ id, cardName }), damage };
}

export function createEnemyTurnRunes(monsterId: MonsterId, turnNumber: number): EnemyRune[] {
  const monster = MONSTER_CATALOG[monsterId];
  const turnCards = monster.turnCycle[turnNumber % monster.turnCycle.length] ?? [];
  return turnCards.map(({ idSuffix, cardName, damage }) => (
    createEnemyRune(`enemy-${turnNumber}-${idSuffix}`, cardName, damage)
  ));
}
