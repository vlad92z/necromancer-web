import fireCardCommon from '../assets/runes/fire_rune.png';
import fireCardUncommon from '../assets/runes/fire_rune_uncommon.png';
import fireCardRare from '../assets/runes/fire_rune_rare.png';
import fireCardEpic from '../assets/runes/fire_rune_epic.png';
import frostCardCommon from '../assets/runes/frost_rune.png';
import frostCardUncommon from '../assets/runes/frost_rune_uncommon.png';
import frostCardRare from '../assets/runes/frost_rune_rare.png';
import frostCardEpic from '../assets/runes/frost_rune_epic.png';
import lifeCardCommon from '../assets/runes/life_rune.png';
import lifeCardUncommon from '../assets/runes/life_rune_uncommon.png';
import lifeCardRare from '../assets/runes/life_rune_rare.png';
import lifeCardEpic from '../assets/runes/life_rune_epic.png';
import voidCardCommon from '../assets/runes/void_rune.png';
import voidCardUncommon from '../assets/runes/void_rune_uncommon.png';
import voidCardRare from '../assets/runes/void_rune_rare.png';
import voidCardEpic from '../assets/runes/void_rune_epic.png';
import windCardCommon from '../assets/runes/wind_rune.png';
import windCardUncommon from '../assets/runes/wind_rune_uncommon.png';
import windCardRare from '../assets/runes/wind_rune_rare.png';
import windCardEpic from '../assets/runes/wind_rune_epic.png';
import lightningCardCommon from '../assets/runes/lightning_rune.png';
import lightningCardUncommon from '../assets/runes/lightning_rune_uncommon.png';
import lightningCardRare from '../assets/runes/lightning_rune_rare.png';
import lightningCardEpic from '../assets/runes/lightning_rune_epic.png';
import fireToken from '../assets/runes/tokens/token_fire.png';
import frostToken from '../assets/runes/tokens/token_frost.png';
import lifeToken from '../assets/runes/tokens/token_life.png';
import voidToken from '../assets/runes/tokens/token_void.png';
import windToken from '../assets/runes/tokens/token_wind.png';
import lightningToken from '../assets/runes/tokens/token_lightning.png';
import type { RuneEffectRarity, RuneType } from '../types/game';

const CARD_IMAGES: Record<RuneType, Record<RuneEffectRarity, string>> = {
  Fire: { common: fireCardCommon, uncommon: fireCardUncommon, rare: fireCardRare, epic: fireCardEpic },
  Frost: { common: frostCardCommon, uncommon: frostCardUncommon, rare: frostCardRare, epic: frostCardEpic },
  Life: { common: lifeCardCommon, uncommon: lifeCardUncommon, rare: lifeCardRare, epic: lifeCardEpic },
  Void: { common: voidCardCommon, uncommon: voidCardUncommon, rare: voidCardRare, epic: voidCardEpic },
  Wind: { common: windCardCommon, uncommon: windCardUncommon, rare: windCardRare, epic: windCardEpic },
  Lightning: {
    common: lightningCardCommon,
    uncommon: lightningCardUncommon,
    rare: lightningCardRare,
    epic: lightningCardEpic,
  },
};

const TOKEN_IMAGES: Record<RuneType, string> = {
  Fire: fireToken,
  Frost: frostToken,
  Life: lifeToken,
  Void: voidToken,
  Wind: windToken,
  Lightning: lightningToken,
};

export interface RuneImageSources {
  cardImageSrc: string;
  tokenImageSrc: string;
}

export function getRuneImageSources(runeType: RuneType, rarity: RuneEffectRarity): RuneImageSources {
  return {
    cardImageSrc: CARD_IMAGES[runeType][rarity],
    tokenImageSrc: TOKEN_IMAGES[runeType],
  };
}
