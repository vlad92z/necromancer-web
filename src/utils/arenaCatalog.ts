/** Read-only Arena presentation data derived from the canonical catalogues. */
import type { EnemyRune, MonsterId, Rune } from '../types/game';
import { createEnemyTurnRunes } from './monsterFactory';
import { MONSTER_CATALOG, type MonsterDefinition } from './monsterCatalog';
import { createRuneFromCardName } from './runeEffects';

export interface ArenaMonsterDetails {
  monster: MonsterDefinition;
  turns: EnemyRune[][];
  loot: Rune[];
}

export function getArenaMonsterDetails(monsterId: MonsterId): ArenaMonsterDetails {
  const monster = MONSTER_CATALOG[monsterId];

  return {
    monster,
    turns: monster.turnCycle.map((_, turnIndex) => createEnemyTurnRunes(monsterId, turnIndex)),
    loot: monster.rewardCardNames.map((cardName, index) => createRuneFromCardName({
      id: `arena-${monsterId}-loot-${index}`,
      cardName,
    })),
  };
}
