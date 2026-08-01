/** The canonical catalogue for every player and enemy rune card. */
import fireboltImg from '../assets/runes/cards/card_fireball.png';
import scorchImg from '../assets/runes/cards/card_scorch.png';
import frostShieldImg from '../assets/runes/cards/card_frost_shield.png';
import barricadeImg from '../assets/runes/cards/card_barricade.png';
import throwRockImg from '../assets/runes/cards/card_throw_rock.png';
import headwindImg from '../assets/runes/cards/card_headwind.png';
import lifelineImg from '../assets/runes/cards/card_lifeline.png';
import lightningBoltImg from '../assets/runes/cards/card_lightning_bolt.png';
import tornadoImg from '../assets/runes/cards/card_tornado.png';
import voidTendrilsImg from '../assets/runes/cards/card_void_tendrils.png';
import hideImg from '../assets/runes/cards/card_hide.png';
import avalancheImg from '../assets/runes/cards/card_avalanche.png';
import fireToken from '../assets/runes/tokens/token_fire.png';
import frostToken from '../assets/runes/tokens/token_frost.png';
import lifeToken from '../assets/runes/tokens/token_life.png';
import voidToken from '../assets/runes/tokens/token_void.png';
import windToken from '../assets/runes/tokens/token_wind.png';
import lightningToken from '../assets/runes/tokens/token_lightning.png';
import type { Rune } from '../types/game';
import { createEffectRef } from './effectCatalog';
import { createRuneRemovalEffectRef } from './runeRemoval';

export type CardDefinition = Omit<Rune, 'id'> & {
  templateId: string;
};

/** Keys are the canonical card names; each entry deliberately owns its card and token art. */
export const CARD_DEFINITIONS = {
  Firebolt: { templateId: 'firebolt', name: 'Firebolt', runeTypes: ['Fire'], rarity: 'common', cardImageSrc: fireboltImg, tokenImageSrc: fireToken, manaCost: 1, castEffectRefs: [createEffectRef('cast.consumeAdjacent', { amount: 1 })], passiveEffectRefs: [] },
  FrostShield: { templateId: 'frost_shield', name: 'Frost Shield', runeTypes: ['Frost'], rarity: 'common', cardImageSrc: frostShieldImg, tokenImageSrc: frostToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.armor', { amount: 3 })], passiveEffectRefs: [] },
  Barricade: { templateId: 'barricade', name: 'Barricade', runeTypes: ['Life'], rarity: 'common', cardImageSrc: barricadeImg, tokenImageSrc: lifeToken, manaCost: 3, castEffectRefs: [createEffectRef('cast.armor', { amount: 5 })], passiveEffectRefs: [] },
  Lifeline: { templateId: 'lifeline', name: 'Lifeline', runeTypes: ['Life'], rarity: 'uncommon', cardImageSrc: lifelineImg, tokenImageSrc: lifeToken, manaCost: 5, castEffectRefs: [createEffectRef('cast.healthIncrease', { amount: 5 })], passiveEffectRefs: [] },
  VoidTendrils: { templateId: 'void_tendrils', name: 'Void Tendrils', runeTypes: ['Void'], rarity: 'common', cardImageSrc: voidTendrilsImg, tokenImageSrc: voidToken, manaCost: 5, castEffectRefs: [createEffectRef('cast.damage', { amount: 10 })], passiveEffectRefs: [] },
  Tornado: { templateId: 'tornado', name: 'Tornado', runeTypes: ['Wind'], rarity: 'common', cardImageSrc: tornadoImg, tokenImageSrc: windToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })], passiveEffectRefs: [] },
  Headwind: { templateId: 'headwind', name: 'Headwind', runeTypes: ['Wind'], rarity: 'uncommon', cardImageSrc: headwindImg, tokenImageSrc: windToken, manaCost: 3, castEffectRefs: [], passiveEffectRefs: [createRuneRemovalEffectRef({
    kind: 'consume',
    trigger: 'onIncomingDamage',
    selection: 'random',
    runeType: 'Wind',
    payload: createEffectRef('passive.reduceDamage', { amount: 5 }),
  })] },
  LightningBolt: { templateId: 'lightning_bolt', name: 'Lightning Bolt', runeTypes: ['Lightning'], rarity: 'common', cardImageSrc: lightningBoltImg, tokenImageSrc: lightningToken, manaCost: 1, castEffectRefs: [createEffectRef('cast.damage', { amount: 2 })], passiveEffectRefs: [] },
  Throw: { templateId: 'throw', name: 'Throw', runeTypes: ['Life'], rarity: 'common', cardImageSrc: throwRockImg, tokenImageSrc: lifeToken, manaCost: 1, castEffectRefs: [createEffectRef('cast.damage', { amount: 3 })], passiveEffectRefs: [] },
  Hide: { templateId: 'hide', name: 'Hide', runeTypes: ['Life'], rarity: 'uncommon', cardImageSrc: hideImg, tokenImageSrc: lifeToken, manaCost: 0, castEffectRefs: [createRuneRemovalEffectRef({ kind: 'consume', trigger: 'onCast', selection: 'manual', payload: createEffectRef('cast.armor', { amount: 3 }) })], passiveEffectRefs: [] },
  Scorch: { templateId: 'scorch', name: 'Scorch', runeTypes: ['Fire'], rarity: 'uncommon', cardImageSrc: scorchImg, tokenImageSrc: fireToken, manaCost: 3, castEffectRefs: [], passiveEffectRefs: [createRuneRemovalEffectRef({ kind: 'consume', trigger: 'endTurn', selection: 'manual', runeType: 'Life', payload: createEffectRef('cast.damage', { amount: 5 }) })] },
  Hurl: { templateId: 'hurl', name: 'Hurl', runeTypes: ['Life'], rarity: 'uncommon', cardImageSrc: throwRockImg, tokenImageSrc: lifeToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.damage', { amount: 8 })], passiveEffectRefs: [] },
  Avalanche: { templateId: 'avalanche', name: 'Avalanche', runeTypes: ['Life'], rarity: 'rare', cardImageSrc: avalancheImg, tokenImageSrc: lifeToken, manaCost: 5, castEffectRefs: [createRuneRemovalEffectRef({
    kind: 'destroy',
    trigger: 'onCast',
    selection: 'manual',
  })], passiveEffectRefs: [] },
} satisfies Record<string, CardDefinition>;

export type CardName = keyof typeof CARD_DEFINITIONS;
