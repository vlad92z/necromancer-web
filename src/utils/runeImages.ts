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
import fireToken from '../assets/runes/tokens/token_fire.png';
import frostToken from '../assets/runes/tokens/token_frost.png';
import lifeToken from '../assets/runes/tokens/token_life.png';
import voidToken from '../assets/runes/tokens/token_void.png';
import windToken from '../assets/runes/tokens/token_wind.png';
import lightningToken from '../assets/runes/tokens/token_lightning.png';
import type { RuneType } from '../types/game';

export interface RuneImageSources {
  cardImageSrc: string;
  tokenImageSrc: string;
}

/**
 * Artwork assigned to the rune cards that exist today.
 * New rune templates should provide their own image sources explicitly.
 */
export const CURRENT_RUNE_IMAGE_SOURCES: Record<RuneType, RuneImageSources> = {
  Fire: { cardImageSrc: fireCard, tokenImageSrc: fireToken },
  Frost: { cardImageSrc: frostCard, tokenImageSrc: frostToken },
  Life: { cardImageSrc: lifeCard, tokenImageSrc: lifeToken },
  Void: { cardImageSrc: voidCard, tokenImageSrc: voidToken },
  Wind: { cardImageSrc: windCard, tokenImageSrc: windToken },
  Lightning: { cardImageSrc: lightningCard, tokenImageSrc: lightningToken },
};

export const BARRICADE_RUNE_IMAGE_SOURCES: RuneImageSources = {
  cardImageSrc: barricadeCard,
  tokenImageSrc: lifeToken,
};

export const SCORCH_IMAGE_SOURCES: RuneImageSources = {
  cardImageSrc: scorchCard,
  tokenImageSrc: fireToken,
};

export const HIDE_RUNE_IMAGE_SOURCES: RuneImageSources = {
  cardImageSrc: hideCard,
  tokenImageSrc: lifeToken,
};

export const THROW_ROCK_RUNE_IMAGE_SOURCES: RuneImageSources = {
  cardImageSrc: throwRockCard,
  tokenImageSrc: lifeToken,
};

export const HEADWIND_RUNE_IMAGE_SOURCES: RuneImageSources = {
  cardImageSrc: headwindCard,
  tokenImageSrc: windToken,
};
