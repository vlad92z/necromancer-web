import placeholderFireVoid from '../assets/runes/placeholder_fire_void.svg';
import placeholderLifeFrost from '../assets/runes/placeholder_life_frost.svg';
import placeholderLightningWind from '../assets/runes/placeholder_lightning_wind.svg';
import type { WallSlotFamily } from '../types/game';

export const WALL_SLOT_PLACEHOLDER_ASSETS: Record<WallSlotFamily, string> = {
  fireVoid: placeholderFireVoid,
  lightningWind: placeholderLightningWind,
  lifeFrost: placeholderLifeFrost,
};
