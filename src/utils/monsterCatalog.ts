/** The canonical catalogue for encounter monsters and their rewards. */
import goblinImageSrc from '../assets/enemies/goblin.png';
import golemImageSrc from '../assets/enemies/golem.png';
import witchImageSrc from '../assets/enemies/witch.png';
import shadeImageSrc from '../assets/enemies/shade.png';
import type { MonsterId } from '../types/game';
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
    maxHealth: 18,
    armor: 0,
    arcaneDustRewardRange: [4, 7],
    rewardCardNames: ['ThrowRock', 'Hide', 'Scorch', 'Heal'],
    turnCycle: [[
      { idSuffix: 'throw-rock-0', cardName: 'ThrowRock', damage: 3 },
      { idSuffix: 'throw-rock-1', cardName: 'ThrowRock', damage: 3 },
      { idSuffix: 'hide', cardName: 'Hide', damage: 0 },
    ]],
  },
  witch: {
    id: 'witch',
    name: 'Witch',
    imageSrc: witchImageSrc,
    isBoss: false,
    maxHealth: 15,
    armor: 0,
    arcaneDustRewardRange: [4, 7],
    rewardCardNames: ['LightningBolt', 'AmplifyMagic', 'Heal'],
    turnCycle: [
      [
        { idSuffix: 'firebolt-0', cardName: 'Firebolt', damage: 2 },
        { idSuffix: 'firebolt-1', cardName: 'Firebolt', damage: 2 },
      ],
      [
        { idSuffix: 'frost-shield-0', cardName: 'FrostShield', damage: 0 },
        { idSuffix: 'frost-shield-1', cardName: 'FrostShield', damage: 0 },
      ],
      [
        { idSuffix: 'amplify-magic', cardName: 'AmplifyMagic', damage: 0 },
      ],
    ],
  },
  shade: {
    id: 'shade',
    name: 'Shade',
    imageSrc: shadeImageSrc,
    isBoss: false,
    maxHealth: 28,
    armor: 0,
    arcaneDustRewardRange: [4, 7],
    rewardCardNames: ['ShadowBolt', 'VoidTendrils', 'Heal'],
    turnCycle: [[
      { idSuffix: 'shadow-bolt-0', cardName: 'ShadowBolt', damage: 0 },
      { idSuffix: 'shadow-bolt-1', cardName: 'ShadowBolt', damage: 0 },
      { idSuffix: 'heal', cardName: 'Heal', damage: 0 },
    ]],
  },
  'golem-lord': {
    id: 'golem-lord',
    name: 'Golem Lord',
    imageSrc: golemImageSrc,
    isBoss: true,
    maxHealth: 50,
    armor: 0,
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
        { idSuffix: 'hurl-rock-0', cardName: 'HurlRock', damage: 8 },
        { idSuffix: 'hurl-rock-1', cardName: 'HurlRock', damage: 8 },
        { idSuffix: 'hurl-rock-2', cardName: 'HurlRock', damage: 8 },
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
