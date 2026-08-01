/** The canonical catalogue for every player and enemy rune card. */
import fireCard from '../assets/runes/cards/card_fireball.png';
import scorchCard from '../assets/runes/cards/card_scorch.png';
import frostCard from '../assets/runes/cards/card_frost_shield.png';
import barricadeCard from '../assets/runes/cards/card_barricade.png';
import throwRockCard from '../assets/runes/cards/card_throw_rock.png';
import headwindCard from '../assets/runes/cards/card_headwind.png';
import lifeCard from '../assets/runes/cards/card_heal.png';
import lightningCard from '../assets/runes/cards/card_lightning_bolt.png';
import windCard from '../assets/runes/cards/card_tornado.png';
import voidCard from '../assets/runes/cards/card_void_tendrils.png';
import hideCard from '../assets/runes/cards/card_hide.png';
import avalancheCard from '../assets/runes/cards/card_avalanche.png';
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
  Firebolt: { templateId: 'fire-common-spark', name: 'Firebolt', runeTypes: ['Fire'], rarity: 'common', cardImageSrc: fireCard, tokenImageSrc: fireToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })], passiveEffectRefs: [] },
  'Fire Blast': { templateId: 'fire-uncommon-adjacent', name: 'Fire Blast', runeTypes: ['Fire'], rarity: 'uncommon', cardImageSrc: fireCard, tokenImageSrc: fireToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.damageAdjacent', { amount: 1 })], passiveEffectRefs: [] },
  Pyroblast: { templateId: 'fire-rare-fragile', name: 'Pyroblast', runeTypes: ['Fire'], rarity: 'rare', cardImageSrc: fireCard, tokenImageSrc: fireToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.damageFragile', { amount: 20, reduction: 3, fragileType: 'Frost' })], passiveEffectRefs: [] },
  Burn: { templateId: 'fire-epic-add-damage', name: 'Burn', runeTypes: ['Fire'], rarity: 'epic', cardImageSrc: fireCard, tokenImageSrc: fireToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.addDamage', { amount: 10, runeType: 'Fire' })] },
  'Frost Shield': { templateId: 'frost-common-armor', name: 'Frost Shield', runeTypes: ['Frost'], rarity: 'common', cardImageSrc: frostCard, tokenImageSrc: frostToken, manaCost: 3, castEffectRefs: [createEffectRef('cast.armor', { amount: 5 })], passiveEffectRefs: [] },
  'Ice Block': { templateId: 'frost-uncommon-adjacent', name: 'Ice Block', runeTypes: ['Frost'], rarity: 'uncommon', cardImageSrc: frostCard, tokenImageSrc: frostToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.armorAdjacent', { amount: 3 })], passiveEffectRefs: [] },
  'Freezing Cold': { templateId: 'frost-rare-synergy', name: 'Freezing Cold', runeTypes: ['Frost'], rarity: 'rare', cardImageSrc: frostCard, tokenImageSrc: frostToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.armorEndTurnSynergy', { amount: 3, synergyType: 'Frost' })] },
  'Icy Veins': { templateId: 'frost-epic-armor-boost', name: 'Icy Veins', runeTypes: ['Frost'], rarity: 'epic', cardImageSrc: frostCard, tokenImageSrc: frostToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.armorBoost', { amount: 20 })] },
  Barricade: { templateId: 'life-common-healing', name: 'Barricade', runeTypes: ['Life'], rarity: 'common', cardImageSrc: barricadeCard, tokenImageSrc: lifeToken, manaCost: 3, castEffectRefs: [createEffectRef('cast.armor', { amount: 5 })], passiveEffectRefs: [] },
  Lifeline: { templateId: 'life-uncommon-health-increase', name: 'Lifeline', runeTypes: ['Life'], rarity: 'uncommon', cardImageSrc: lifeCard, tokenImageSrc: lifeToken, manaCost: 5, castEffectRefs: [createEffectRef('cast.healthIncrease', { amount: 5 })], passiveEffectRefs: [] },
  'Healing Rain': { templateId: 'life-rare-healing-start-turn', name: 'Healing Rain', runeTypes: ['Life'], rarity: 'rare', cardImageSrc: lifeCard, tokenImageSrc: lifeToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.healingStartTurnSynergy', { amount: 4, synergyType: 'Life' })] },
  Immortality: { templateId: 'life-epic-heal-synergy', name: 'Immortality', runeTypes: ['Life'], rarity: 'epic', cardImageSrc: lifeCard, tokenImageSrc: lifeToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.healSynergy', { amount: 30, synergyType: 'Life' })], passiveEffectRefs: [] },
  'Void Tendrils': { templateId: 'void-common-damage', name: 'Void Tendrils', runeTypes: ['Void'], rarity: 'common', cardImageSrc: voidCard, tokenImageSrc: voidToken, manaCost: 5, castEffectRefs: [createEffectRef('cast.damage', { amount: 10 })], passiveEffectRefs: [] },
  'Void Pulse': { templateId: 'void-rare-pulse-synergy', name: 'Void Pulse', runeTypes: ['Void'], rarity: 'rare', cardImageSrc: voidCard, tokenImageSrc: voidToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.pulseSynergy', { amount: 1, synergyType: 'Void' })] },
  'Void 4': { templateId: 'void-epic-vampire', name: 'Void 4', runeTypes: ['Void'], rarity: 'epic', cardImageSrc: voidCard, tokenImageSrc: voidToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.vampire', { percent: 50 })] },
  Tornado: { templateId: 'wind-common-draw', name: 'Tornado', runeTypes: ['Wind'], rarity: 'common', cardImageSrc: windCard, tokenImageSrc: windToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })], passiveEffectRefs: [] },
  Headwind: { templateId: 'wind-uncommon-headwind', name: 'Headwind', runeTypes: ['Wind'], rarity: 'uncommon', cardImageSrc: headwindCard, tokenImageSrc: windToken, manaCost: 3, castEffectRefs: [], passiveEffectRefs: [createRuneRemovalEffectRef({
    kind: 'consume',
    trigger: 'onIncomingDamage',
    selection: 'random',
    runeType: 'Wind',
    payload: createEffectRef('passive.reduceDamage', { amount: 5 }),
  })] },
  Tailwind: { templateId: 'wind-rare-drawing-start-turn', name: 'Tailwind', runeTypes: ['Wind'], rarity: 'rare', cardImageSrc: windCard, tokenImageSrc: windToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.drawAdjacent')], passiveEffectRefs: [] },
  'Perfect Storm': { templateId: 'wind-epic-return-adjacent', name: 'Perfect Storm', runeTypes: ['Wind'], rarity: 'epic', cardImageSrc: windCard, tokenImageSrc: windToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.returnAdjacent')], passiveEffectRefs: [] },
  'Lightning Bolt': { templateId: 'lightning-common-damage', name: 'Lightning Bolt', runeTypes: ['Lightning'], rarity: 'common', cardImageSrc: lightningCard, tokenImageSrc: lightningToken, manaCost: 1, castEffectRefs: [createEffectRef('cast.damage', { amount: 2 })], passiveEffectRefs: [] },
  'Chain Lightning': { templateId: 'lightning-uncommon-damage-boost', name: 'Chain Lightning', runeTypes: ['Lightning'], rarity: 'uncommon', cardImageSrc: lightningCard, tokenImageSrc: lightningToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.adjacentDamageBoost', { amount: 2 })] },
  'Electric Surge': { templateId: 'lightning-rare-explosive', name: 'Electric Surge', runeTypes: ['Lightning'], rarity: 'rare', cardImageSrc: lightningCard, tokenImageSrc: lightningToken, manaCost: 2, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.explosive', { amount: 30 })] },
  'Perfect Synergy': { templateId: 'lightning-epic-retrigger-adjacent', name: 'Perfect Synergy', runeTypes: ['Lightning'], rarity: 'epic', cardImageSrc: lightningCard, tokenImageSrc: lightningToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.retriggerAdjacent')], passiveEffectRefs: [] },
  'Throw Rock': { templateId: 'goblin-throw-rock', name: 'Throw Rock', runeTypes: ['Life'], rarity: 'common', cardImageSrc: throwRockCard, tokenImageSrc: lifeToken, manaCost: 1, castEffectRefs: [createEffectRef('cast.damage', { amount: 3 })], passiveEffectRefs: [] },
  Hide: { templateId: 'goblin-hide', name: 'Hide', runeTypes: ['Life'], rarity: 'common', cardImageSrc: hideCard, tokenImageSrc: lifeToken, manaCost: 1, castEffectRefs: [createEffectRef('cast.armor', { amount: 3 })], passiveEffectRefs: [] },
  Scorch: { templateId: 'goblin-scorch', name: 'Scorch', runeTypes: ['Fire'], rarity: 'common', cardImageSrc: scorchCard, tokenImageSrc: fireToken, manaCost: 3, castEffectRefs: [], passiveEffectRefs: [createEffectRef('passive.damageEndTurn', { amount: 3 })] },
  'Hurl Rock': { templateId: 'golem-hurl-rock', name: 'Hurl Rock', runeTypes: ['Life'], rarity: 'common', cardImageSrc: throwRockCard, tokenImageSrc: lifeToken, manaCost: 2, castEffectRefs: [createEffectRef('cast.damage', { amount: 8 })], passiveEffectRefs: [] },
  Avalanche: { templateId: 'golem-avalanche', name: 'Avalanche', runeTypes: ['Life'], rarity: 'common', cardImageSrc: avalancheCard, tokenImageSrc: lifeToken, manaCost: 5, castEffectRefs: [createRuneRemovalEffectRef({
    kind: 'destroy',
    trigger: 'onCast',
    selection: 'manual',
  })], passiveEffectRefs: [] },
} satisfies Record<string, CardDefinition>;

export type CardName = keyof typeof CARD_DEFINITIONS;
