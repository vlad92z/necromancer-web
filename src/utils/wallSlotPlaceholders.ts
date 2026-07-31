import slotFire from '../assets/runes/slot_fire.png';
import slotFrost from '../assets/runes/slot_frost.png';
import slotLife from '../assets/runes/slot_life.png';
import slotLightning from '../assets/runes/slot_lightning.png';
import slotShadow from '../assets/runes/slot_shadow.png';
import slotWind from '../assets/runes/slot_wind.png';
import type { RuneType } from '../types/game';

export const WALL_SLOT_PLACEHOLDER_ASSETS: Record<RuneType, string> = {
  Fire: slotFire,
  Frost: slotFrost,
  Life: slotLife,
  Lightning: slotLightning,
  Void: slotShadow,
  Wind: slotWind,
};
