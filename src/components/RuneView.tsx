import { motion } from 'framer-motion';
import type { RuneEffectRarity, RuneType } from "../types/game";
import { runeAsset } from "./runeAssets";

export interface RuneViewProps {
  type: RuneType;
  rarity: RuneEffectRarity;
  runePulseKey?: number;
  runePulseScale?: number;
}

export function RuneView({ type, rarity, runePulseKey, runePulseScale = 1 }: RuneViewProps) {
  const image = runeAsset(type, rarity);

  return (
    <motion.img
      key={runePulseKey ?? 'rune-static'}
      initial={{ scale: 1 }}
      animate={runePulseKey ? { scale: [1, runePulseScale, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      src={image}
      style={{
        objectFit: 'contain',
      }}
    />
  );
}