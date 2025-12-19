import type { Rune, RuneRarity, RuneType } from '../types/game';
import fireRune from '../assets/runes/fire_rune.svg';
import fireRuneUncommon from '../assets/runes/fire_rune_uncommon.svg';
import fireRuneRare from '../assets/runes/fire_rune_rare.svg';
import fireRuneEpic from '../assets/runes/fire_rune_epic.svg';
import frostRune from '../assets/runes/frost_rune.svg';
import frostRuneUncommon from '../assets/runes/frost_rune_uncommon.svg';
import frostRuneRare from '../assets/runes/frost_rune_rare.svg';
import frostRuneEpic from '../assets/runes/frost_rune_epic.svg';
import lifeRune from '../assets/runes/life_rune.svg';
import lifeRuneUncommon from '../assets/runes/life_rune_uncommon.svg';
import lifeRuneRare from '../assets/runes/life_rune_rare.svg';
import lifeRuneEpic from '../assets/runes/life_rune_epic.svg';
import voidRune from '../assets/runes/void_rune.svg';
import voidRuneUncommon from '../assets/runes/void_rune_uncommon.svg';
import voidRuneRare from '../assets/runes/void_rune_rare.svg';
import voidRuneEpic from '../assets/runes/void_rune_epic.svg';
import windRune from '../assets/runes/wind_rune.svg';
import windRuneUncommon from '../assets/runes/wind_rune_uncommon.svg';
import windRuneRare from '../assets/runes/wind_rune_rare.svg';
import windRuneEpic from '../assets/runes/wind_rune_epic.svg';
import lightningRune from '../assets/runes/lightning_rune.svg';
import lightningRuneUncommon from '../assets/runes/lightning_rune_uncommon.svg';
import lightningRuneRare from '../assets/runes/lightning_rune_rare.svg';
import lightningRuneEpic from '../assets/runes/lightning_rune_epic.svg';

const RUNE_ASSETS = {
    Fire: fireRune,
    Frost: frostRune,
    Life: lifeRune,
    Void: voidRune,
    Wind: windRune,
    Lightning: lightningRune,
};

const RUNE_UNCOMMON_ASSETS = {
    Fire: fireRuneUncommon,
    Frost: frostRuneUncommon,
    Life: lifeRuneUncommon,
    Void: voidRuneUncommon,
    Wind: windRuneUncommon,
    Lightning: lightningRuneUncommon,
};

const RUNE_RARE_ASSETS = {
    Fire: fireRuneRare,
    Frost: frostRuneRare,
    Life: lifeRuneRare,
    Void: voidRuneRare,
    Wind: windRuneRare,
    Lightning: lightningRuneRare,
};

const RUNE_EPIC_ASSETS = {
    Fire: fireRuneEpic,
    Frost: frostRuneEpic,
    Life: lifeRuneEpic,
    Void: voidRuneEpic,
    Wind: windRuneEpic,
    Lightning: lightningRuneEpic,
};

const RUNE_ASSETS_BY_RARITY: Record<RuneRarity, Record<RuneType, string>> = {
    common: RUNE_ASSETS,
    uncommon: RUNE_UNCOMMON_ASSETS,
    rare: RUNE_RARE_ASSETS,
    epic: RUNE_EPIC_ASSETS,
};

export function commonRuneAsset(runeType: RuneType): string {
    return RUNE_ASSETS[runeType];
}

export function runeAsset(runeType: RuneType, rarity: RuneRarity): string {
    return RUNE_ASSETS_BY_RARITY[rarity][runeType];
}

export function getRuneAsset(rune: Rune): string {
    return runeAsset(rune.runeType, rune.rarity);
}