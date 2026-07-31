/** The canonical catalogue for encounter monsters and their rewards. */
import goblinImageSrc from '../assets/enemies/goblin.png';
import golemImageSrc from '../assets/enemies/golem.png';
import type { MonsterId, RuneType } from '../types/game';
import type { CardName } from './cardCatalog';

export interface MonsterTurnCard {
  idSuffix: string;
  cardName: CardName;
  damage: number;
}

export interface MonsterDefinition {
  id: MonsterId;
  name: string;
  imageSrc: string;
  isBoss: boolean;
  maxHealth: number;
  armor: number;
  acceptedRuneTypes: readonly RuneType[];
  arcaneDustRewardRange: readonly [minimum: number, maximum: number];
  rewardCardNames: readonly CardName[];
  turnCycle: readonly (readonly MonsterTurnCard[])[];
}

export const MONSTER_CATALOG = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    imageSrc: goblinImageSrc,
    isBoss: false,
    maxHealth: 20,
    armor: 0,
    acceptedRuneTypes: ['Life'],
    arcaneDustRewardRange: [4, 7],
    rewardCardNames: ['Throw Rock', 'Hide', 'Scorch', 'Lifeline'],
    turnCycle: [[
      { idSuffix: 'throw-rock-0', cardName: 'Throw Rock', damage: 3 },
      { idSuffix: 'throw-rock-1', cardName: 'Throw Rock', damage: 3 },
      { idSuffix: 'throw-rock-2', cardName: 'Throw Rock', damage: 3 },
      { idSuffix: 'hide', cardName: 'Hide', damage: 0 },
    ]],
  },
  'golem-lord': {
    id: 'golem-lord',
    name: 'Golem Lord',
    imageSrc: golemImageSrc,
    isBoss: true,
    maxHealth: 50,
    armor: 0,
    acceptedRuneTypes: ['Life'],
    arcaneDustRewardRange: [0, 0],
    rewardCardNames: [],
    turnCycle: [
      [
        { idSuffix: 'barricade-0', cardName: 'Barricade', damage: 0 },
        { idSuffix: 'barricade-1', cardName: 'Barricade', damage: 0 },
        { idSuffix: 'barricade-2', cardName: 'Barricade', damage: 0 },
        { idSuffix: 'barricade-3', cardName: 'Barricade', damage: 0 },
      ],
      [
        { idSuffix: 'hurl-rock-0', cardName: 'Hurl Rock', damage: 8 },
        { idSuffix: 'hurl-rock-1', cardName: 'Hurl Rock', damage: 8 },
        { idSuffix: 'hurl-rock-2', cardName: 'Hurl Rock', damage: 8 },
      ],
      [
        { idSuffix: 'avalanche', cardName: 'Avalanche', damage: 0 },
      ],
    ],
  },
} satisfies Record<MonsterId, MonsterDefinition>;

export function getMonsterDefinition(monsterId: string): MonsterDefinition | null {
  return MONSTER_CATALOG[monsterId as MonsterId] ?? null;
}
