import type { DeckDraftEffect, RuneEffectRarity } from '../types/game';

export const DECK_DRAFTING_CONFIG = {
    runeforgeCount: 3,
    basePicks: 1,
    rarityOrder: ['common', 'uncommon', 'rare', 'epic'] as RuneEffectRarity[],
    rareChanceMultiplier: 5,
    epicChanceMultiplier: 1,
    draftEffects: [
        { type: 'heal', amount: 50 },
        { type: 'maxHealth', amount: 25 },
        { type: 'betterRunes', rarityStep: 1 },
    ] as DeckDraftEffect[]
}