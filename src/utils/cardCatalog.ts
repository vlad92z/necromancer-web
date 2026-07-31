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
import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createEffectRef } from './effectCatalog';

export type CardDefinition = Omit<Rune, 'id'> & {
  templateId: string;
  pool: 'standard' | 'goblin' | 'golem';
};

const standard = (templateId: string, name: string, runeType: RuneType, rarity: RuneEffectRarity, cardImageSrc: string, tokenImageSrc: string, manaCost: number, castEffectRefs: EffectRef[] = [], passiveEffectRefs: EffectRef[] = []): CardDefinition => ({ templateId, name, runeTypes: [runeType], rarity, cardImageSrc, tokenImageSrc, manaCost, castEffectRefs, passiveEffectRefs, pool: 'standard' });
const goblin = (templateId: string, name: string, runeType: RuneType, cardImageSrc: string, tokenImageSrc: string, manaCost: number, castEffectRefs: EffectRef[] = [], passiveEffectRefs: EffectRef[] = []): CardDefinition => ({ templateId, name, runeTypes: [runeType], rarity: 'common', cardImageSrc, tokenImageSrc, manaCost, castEffectRefs, passiveEffectRefs, pool: 'goblin' });
const golem = (templateId: string, name: string, runeType: RuneType, cardImageSrc: string, tokenImageSrc: string, manaCost: number, castEffectRefs: EffectRef[] = []): CardDefinition => ({ templateId, name, runeTypes: [runeType], rarity: 'common', cardImageSrc, tokenImageSrc, manaCost, castEffectRefs, passiveEffectRefs: [], pool: 'golem' });

/** Keys are the canonical card names; each entry deliberately owns its card and token art. */
export const CARD_DEFINITIONS = {
  Firebolt: standard('fire-common-spark', 'Firebolt', 'Fire', 'common', fireCard, fireToken, 2, [createEffectRef('cast.damage', { amount: 5 })]),
  'Fire Blast': standard('fire-uncommon-adjacent', 'Fire Blast', 'Fire', 'uncommon', fireCard, fireToken, 2, [createEffectRef('cast.damageAdjacent', { amount: 1 })]),
  Pyroblast: standard('fire-rare-fragile', 'Pyroblast', 'Fire', 'rare', fireCard, fireToken, 2, [createEffectRef('cast.damageFragile', { amount: 20, reduction: 3, fragileType: 'Frost' })]),
  Burn: standard('fire-epic-add-damage', 'Burn', 'Fire', 'epic', fireCard, fireToken, 2, [], [createEffectRef('passive.addDamage', { amount: 10, runeType: 'Fire' })]),
  'Frost Shield': standard('frost-common-armor', 'Frost Shield', 'Frost', 'common', frostCard, frostToken, 3, [createEffectRef('cast.armor', { amount: 5 })]),
  'Ice Block': standard('frost-uncommon-adjacent', 'Ice Block', 'Frost', 'uncommon', frostCard, frostToken, 2, [createEffectRef('cast.armorAdjacent', { amount: 3 })]),
  'Freezing Cold': standard('frost-rare-synergy', 'Freezing Cold', 'Frost', 'rare', frostCard, frostToken, 2, [], [createEffectRef('passive.armorEndTurnSynergy', { amount: 3, synergyType: 'Frost' })]),
  'Icy Veins': standard('frost-epic-armor-boost', 'Icy Veins', 'Frost', 'epic', frostCard, frostToken, 2, [], [createEffectRef('passive.armorBoost', { amount: 20 })]),
  Barricade: standard('life-common-healing', 'Barricade', 'Life', 'common', barricadeCard, lifeToken, 3, [createEffectRef('cast.armor', { amount: 5 })]),
  Lifeline: standard('life-uncommon-health-increase', 'Lifeline', 'Life', 'uncommon', lifeCard, lifeToken, 5, [createEffectRef('cast.healthIncrease', { amount: 5 })]),
  'Healing Rain': standard('life-rare-healing-start-turn', 'Healing Rain', 'Life', 'rare', lifeCard, lifeToken, 2, [], [createEffectRef('passive.healingStartTurnSynergy', { amount: 4, synergyType: 'Life' })]),
  Immortality: standard('life-epic-heal-synergy', 'Immortality', 'Life', 'epic', lifeCard, lifeToken, 2, [createEffectRef('cast.healSynergy', { amount: 30, synergyType: 'Life' })]),
  'Void Tendrils': standard('void-common-damage', 'Void Tendrils', 'Void', 'common', voidCard, voidToken, 5, [createEffectRef('cast.damage', { amount: 10 })]),
  'Void Blast': standard('void-uncommon-consuming', 'Void Blast', 'Void', 'uncommon', voidCard, voidToken, 2, [createEffectRef('cast.damageConsuming', { amount: 2 })]),
  'Void Pulse': standard('void-rare-pulse-synergy', 'Void Pulse', 'Void', 'rare', voidCard, voidToken, 2, [], [createEffectRef('passive.pulseSynergy', { amount: 1, synergyType: 'Void' })]),
  'Void 4': standard('void-epic-vampire', 'Void 4', 'Void', 'epic', voidCard, voidToken, 2, [], [createEffectRef('passive.vampire', { percent: 50 })]),
  Tornado: standard('wind-common-draw', 'Tornado', 'Wind', 'common', windCard, windToken, 2, [createEffectRef('cast.damage', { amount: 5 })]),
  Headwind: standard('wind-uncommon-draw-adjacent', 'Headwind', 'Wind', 'uncommon', headwindCard, windToken, 4, [], [createEffectRef('passive.reduceDamage', { amount: 1 })]),
  Tailwind: standard('wind-rare-drawing-start-turn', 'Tailwind', 'Wind', 'rare', windCard, windToken, 2, [createEffectRef('cast.drawAdjacent')]),
  'Perfect Storm': standard('wind-epic-return-adjacent', 'Perfect Storm', 'Wind', 'epic', windCard, windToken, 2, [createEffectRef('cast.returnAdjacent')]),
  'Lightning Bolt': standard('lightning-common-damage', 'Lightning Bolt', 'Lightning', 'common', lightningCard, lightningToken, 1, [createEffectRef('cast.damage', { amount: 2 })]),
  'Chain Lightning': standard('lightning-uncommon-damage-boost', 'Chain Lightning', 'Lightning', 'uncommon', lightningCard, lightningToken, 2, [], [createEffectRef('passive.adjacentDamageBoost', { amount: 2 })]),
  'Electric Surge': standard('lightning-rare-explosive', 'Electric Surge', 'Lightning', 'rare', lightningCard, lightningToken, 2, [], [createEffectRef('passive.explosive', { amount: 30 })]),
  'Perfect Synergy': standard('lightning-epic-retrigger-adjacent', 'Perfect Synergy', 'Lightning', 'epic', lightningCard, lightningToken, 2, [createEffectRef('cast.retriggerAdjacent')]),
  'Throw Rock': goblin('goblin-throw-rock', 'Throw Rock', 'Life', throwRockCard, lifeToken, 1, [createEffectRef('cast.damage', { amount: 3 })]),
  Hide: goblin('goblin-hide', 'Hide', 'Life', hideCard, lifeToken, 1, [createEffectRef('cast.armor', { amount: 3 })]),
  Scorch: goblin('goblin-scorch', 'Scorch', 'Fire', scorchCard, fireToken, 3, [], [createEffectRef('passive.damageEndTurn', { amount: 3 })]),
  'Hurl Rock': golem('golem-hurl-rock', 'Hurl Rock', 'Life', throwRockCard, lifeToken, 2, [createEffectRef('cast.damage', { amount: 8 })]),
  Avalanche: golem('golem-avalanche', 'Avalanche', 'Life', avalancheCard, lifeToken, 5, [createEffectRef('enemy.destroyMostFilledRow')]),
} satisfies Record<string, CardDefinition>;

export type CardName = keyof typeof CARD_DEFINITIONS;
