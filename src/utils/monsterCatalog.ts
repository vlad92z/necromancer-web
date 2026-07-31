/** The canonical catalogue for encounter monsters and their rewards. */
import goblinImageSrc from '../assets/enemies/goblin.png';
import type { MonsterId } from '../types/game';
import type { CardName } from './cardCatalog';

export interface MonsterTurnCard {
  idSuffix: string;
  cardName: CardName;
  damage: number;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  imageSrc: string;
  maxHealth: number;
  armor: number;
  arcaneDustRewardRange: readonly [minimum: number, maximum: number];
  rewardCardNames: readonly CardName[];
  turnCards: readonly MonsterTurnCard[];
}

export const MONSTER_CATALOG = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    imageSrc: goblinImageSrc,
    maxHealth: 20,
    armor: 0,
    arcaneDustRewardRange: [4, 7],
    rewardCardNames: ['Throw Rock', 'Hide', 'Scorch', 'Lifeline'],
    turnCards: [
      { idSuffix: 'throw-rock-0', cardName: 'Throw Rock', damage: 3 },
      { idSuffix: 'throw-rock-1', cardName: 'Throw Rock', damage: 3 },
      { idSuffix: 'throw-rock-2', cardName: 'Throw Rock', damage: 3 },
      { idSuffix: 'hide', cardName: 'Hide', damage: 0 },
    ],
  },
} satisfies Record<string, MonsterDefinition>;

export function getMonsterDefinition(monsterId: string): MonsterDefinition | null {
  return MONSTER_CATALOG[monsterId as MonsterId] ?? null;
}
