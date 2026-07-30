import fireCard from '../assets/runes/cards/card_fireball.png';
import frostCard from '../assets/runes/cards/card_frost_shield.png';
import lifeCard from '../assets/runes/cards/card_heal.png';
import lightningCard from '../assets/runes/cards/card_lightning_bolt.png';
import windCard from '../assets/runes/cards/card_tornado.png';
import voidCard from '../assets/runes/cards/card_void_tendrils.png';
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
