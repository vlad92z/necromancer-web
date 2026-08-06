/** The canonical catalogue for every player and enemy rune card. */
import fireboltImg from '../assets/runes/cards/card_fireball.png';
import scorchImg from '../assets/runes/cards/card_scorch.png';
import frostShieldImg from '../assets/runes/cards/card_frost_shield.png';
import barricadeImg from '../assets/runes/cards/card_barricade.png';
import throwRockImg from '../assets/runes/cards/card_throw_rock.png';
import headwindImg from '../assets/runes/cards/card_headwind.png';
import healImg from '../assets/runes/cards/card_lifeline.png';
import lightningBoltImg from '../assets/runes/cards/card_lightning_bolt.png';
import tornadoImg from '../assets/runes/cards/card_tornado.png';
import voidTendrilsImg from '../assets/runes/cards/card_void_tendrils.png';
import hideImg from '../assets/runes/cards/card_hide.png';
import avalancheImg from '../assets/runes/cards/card_avalanche.png';
import amplifyMagicImg from '../assets/runes/cards/card_amplify_magic.png';
import shadowBoltImg from '../assets/runes/cards/card_shadow_bolt.png';
import voidOrb1 from '../assets/combat/spells/void/orb_void_1.png';
import voidOrb2 from '../assets/combat/spells/void/orb_void_2.png';
import voidOrb3 from '../assets/combat/spells/void/orb_void_3.png';
import voidOrb4 from '../assets/combat/spells/void/orb_void_4.png';
import voidOrb5 from '../assets/combat/spells/void/orb_void_5.png';
import voidOrb6 from '../assets/combat/spells/void/orb_void_6.png';
import voidOrb7 from '../assets/combat/spells/void/orb_void_7.png';
import fireOrb1 from '../assets/combat/spells/fire/orb_fire_1.png';
import fireOrb2 from '../assets/combat/spells/fire/orb_fire_2.png';
import fireOrb3 from '../assets/combat/spells/fire/orb_fire_3.png';
import fireOrb4 from '../assets/combat/spells/fire/orb_fire_4.png';
import fireOrb5 from '../assets/combat/spells/fire/orb_fire_5.png';
import fireOrb6 from '../assets/combat/spells/fire/orb_fire_6.png';
import fireOrb7 from '../assets/combat/spells/fire/orb_fire_7.png';
import stoneOrb1 from '../assets/combat/spells/life/orb_stone_1.png';
import stoneOrb2 from '../assets/combat/spells/life/orb_stone_2.png';
import stoneOrb3 from '../assets/combat/spells/life/orb_stone_3.png';
import stoneOrb4 from '../assets/combat/spells/life/orb_stone_4.png';
import stoneOrb5 from '../assets/combat/spells/life/orb_stone_5.png';
import runeFireSound from '../assets/sounds/rune_fire.mp3';
import runeFrostSound from '../assets/sounds/rune_frost.mp3';
import runeLifeSound from '../assets/sounds/rune_life.mp3';
import runeLightningSound from '../assets/sounds/rune_lightning.mp3';
import runeVoidSound from '../assets/sounds/rune_void.mp3';
import runeWindSound from '../assets/sounds/rune_wind.mp3';
import spellStoneSound from '../assets/sounds/spell_stone.mp3';
import fireToken from '../assets/runes/tokens/token_fire.png';
import frostToken from '../assets/runes/tokens/token_frost.png';
import lifeToken from '../assets/runes/tokens/token_life.png';
import voidToken from '../assets/runes/tokens/token_void.png';
import windToken from '../assets/runes/tokens/token_wind.png';
import lightningToken from '../assets/runes/tokens/token_lightning.png';
import type { Rune, RuneSpellAnimation } from '../types/game';
import { createEffectRef } from './effectCatalog';
import { createRuneRemovalEffectRef } from './runeRemoval';

export type CardDefinition = Omit<Rune, 'id' | 'spellAnimation' | 'spellSound'> & {
  templateId: string;
  spellAnimation: RuneSpellAnimation;
  spellSound: string;
};

const voidOrbSpellAnimation = {
  frames: [voidOrb1, voidOrb2, voidOrb3, voidOrb4, voidOrb5, voidOrb6, voidOrb7, voidOrb6, voidOrb5, voidOrb4, voidOrb3, voidOrb2, voidOrb1],
  frameDurationMs: 75,
} as const;

const fireOrbSpellAnimation = {
  frames: [fireOrb1, fireOrb2, fireOrb3, fireOrb4, fireOrb5, fireOrb6, fireOrb7, fireOrb6, fireOrb5, fireOrb4, fireOrb3, fireOrb2, fireOrb1],
  frameDurationMs: 75,
} as const;

const stoneOrbSpellAnimation = {
  frames: [stoneOrb1, stoneOrb2, stoneOrb3, stoneOrb4, stoneOrb5, stoneOrb5, stoneOrb5, stoneOrb4, stoneOrb3, stoneOrb2, stoneOrb1],
  frameDurationMs: 150,
} as const;

/** Keys are the canonical card names; each entry deliberately owns its card and token art. */
export const CARD_DEFINITIONS = {
  Firebolt: { templateId: 'firebolt', name: 'Firebolt', runeTypes: ['Fire'], rarity: 'common', cardImageSrc: fireboltImg, tokenImageSrc: fireToken, spellAnimation: fireOrbSpellAnimation, spellSound: runeFireSound, manaCost: 2, castEffectRefs: [createEffectRef('cast.damageBoard', { amount: 1 })], passiveEffectRefs: [] },
  FrostShield: { templateId: 'frost_shield', name: 'Frost Shield', runeTypes: ['Frost'], rarity: 'common', cardImageSrc: frostShieldImg, tokenImageSrc: frostToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeFrostSound, manaCost: 2, castEffectRefs: [createEffectRef('cast.shield', { amount: 3 })], passiveEffectRefs: [createEffectRef('passive.explosive', { amount: 3, removalKind: 'destroy' })] },
  Barricade: { templateId: 'barricade', name: 'Barricade', runeTypes: ['Life'], rarity: 'common', cardImageSrc: barricadeImg, tokenImageSrc: lifeToken, spellAnimation: stoneOrbSpellAnimation, spellSound: spellStoneSound, manaCost: 2, castEffectRefs: [createEffectRef('cast.shieldAdjacent', { amount: 2 })], passiveEffectRefs: [] },
  Heal: { templateId: 'heal', name: 'Heal', runeTypes: ['Life'], rarity: 'uncommon', cardImageSrc: healImg, tokenImageSrc: lifeToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeLifeSound, manaCost: 3, castEffectRefs: [createRuneRemovalEffectRef({ kind: 'consume', trigger: 'onCast', selection: 'manual', targetOwner: 'self', runeType: 'Life', payload: createEffectRef('cast.healing', { amount: 5 }) })], passiveEffectRefs: [] },
  VoidTendrils: { templateId: 'void_tendrils', name: 'Void Tendrils', runeTypes: ['Void'], rarity: 'common', cardImageSrc: voidTendrilsImg, tokenImageSrc: voidToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeVoidSound, manaCost: 3, castEffectRefs: [createRuneRemovalEffectRef({ kind: 'consume', trigger: 'onCast', selection: 'manual', targetOwner: 'self', payload: createEffectRef('cast.damage', { amount: 9 }) })], passiveEffectRefs: [] },
  Tornado: { templateId: 'tornado', name: 'Tornado', runeTypes: ['Wind'], rarity: 'common', cardImageSrc: tornadoImg, tokenImageSrc: windToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeWindSound, manaCost: 5, castEffectRefs: [createEffectRef('cast.damage', { amount: 15 })], passiveEffectRefs: [] },
  Headwind: { templateId: 'headwind', name: 'Headwind', runeTypes: ['Wind'], rarity: 'uncommon', cardImageSrc: headwindImg, tokenImageSrc: windToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeWindSound, manaCost: 3, castEffectRefs: [], passiveEffectRefs: [createRuneRemovalEffectRef({
    kind: 'destroy',
    trigger: 'onIncomingDamage',
    selection: 'random',
    targetOwner: 'self',
    count: 1,
    runeType: 'Wind',
    payload: createEffectRef('passive.reduceDamage', { amount: 5 }),
  })] },
  LightningBolt: { templateId: 'lightning_bolt', name: 'Lightning Bolt', runeTypes: ['Lightning'], rarity: 'common', cardImageSrc: lightningBoltImg, tokenImageSrc: lightningToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeLightningSound, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.explosive', { amount: 12, removalKind: 'consume' })] },
  ThrowRock: { templateId: 'throw_rock', name: 'Throw', runeTypes: ['Life'], rarity: 'common', cardImageSrc: throwRockImg, tokenImageSrc: lifeToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeLifeSound, manaCost: 1, castEffectRefs: [createEffectRef('cast.synergy', { amount: 1, synergyType: 'Life' })], passiveEffectRefs: [] },
  Hide: { templateId: 'hide', name: 'Hide', runeTypes: ['Life'], rarity: 'uncommon', cardImageSrc: hideImg, tokenImageSrc: lifeToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeLifeSound, manaCost: 0, castEffectRefs: [createRuneRemovalEffectRef({ kind: 'consume', trigger: 'onCast', selection: 'manual', targetOwner: 'self', runeType: 'Life', payload: createEffectRef('cast.shield', { amount: 3 }) })], passiveEffectRefs: [] },
  Scorch: { templateId: 'scorch', name: 'Scorch', runeTypes: ['Fire'], rarity: 'uncommon', cardImageSrc: scorchImg, tokenImageSrc: fireToken, spellAnimation: fireOrbSpellAnimation, spellSound: runeFireSound, manaCost: 2, castEffectRefs: [createEffectRef('cast.damageAdjacent', { amount: 2, runeType: 'Fire' })], passiveEffectRefs: [] },
  HurlRock: { templateId: 'hurl_rock', name: 'Hurl', runeTypes: ['Life'], rarity: 'uncommon', cardImageSrc: throwRockImg, tokenImageSrc: lifeToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeLifeSound, manaCost: 2, castEffectRefs: [createEffectRef('cast.damage', { amount: 8 })], passiveEffectRefs: [] },
  Avalanche: { templateId: 'avalanche', name: 'Avalanche', runeTypes: ['Life'], rarity: 'rare', cardImageSrc: avalancheImg, tokenImageSrc: lifeToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeLifeSound, manaCost: 5, castEffectRefs: [createRuneRemovalEffectRef({
    kind: 'destroy',
    trigger: 'onCast',
    selection: 'manual',
    targetOwner: 'opponent',
    count: 1,
  })], passiveEffectRefs: [] },
  AmplifyMagic: { templateId: 'amplify_magic', name: 'Amplify Magic', runeTypes: ['Frost'], rarity: 'common', cardImageSrc: amplifyMagicImg, tokenImageSrc: frostToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeFrostSound, manaCost: 3, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.damageBoost', { amount: 1 }), createRuneRemovalEffectRef({ kind: 'destroy', trigger: 'endTurn', selection: 'random', targetOwner: 'self', count: 1 })] },
  ShadowBolt: { templateId: 'shadow_bolt', name: 'Shadow Bolt', runeTypes: ['Void'], rarity: 'common', cardImageSrc: shadowBoltImg, tokenImageSrc: voidToken, spellAnimation: voidOrbSpellAnimation, spellSound: runeVoidSound, manaCost: 1, castEffectRefs: [createEffectRef('cast.synergy', { amount: 1, synergyType: 'Void' })], passiveEffectRefs: [] },
} satisfies Record<string, CardDefinition>;

export type CardName = keyof typeof CARD_DEFINITIONS;
