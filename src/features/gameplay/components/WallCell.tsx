/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell, RuneType, Rune } from '../../../types/game';
import { motion } from 'framer-motion';
import { RUNE_SIZE_CONFIG } from '../../../styles/tokens';
import { runeAsset } from '../../../components/runeAssets';

interface WallCellProps {
  type: RuneType;
  rune: Rune | null;
  pulseKey?: number;
}

export function WallCell({ type, rune, pulseKey }: WallCellProps) {
  const imageDimension = RUNE_SIZE_CONFIG['large'].dimension;
  const borderColor = rune === null ? 'border-slate-600 opacity-50' : 'border-slate-400';
  const backgroundColor = rune === null ? '' : 'bg-sky-700/50';
  const image = runeAsset(type, rune?.effects?.[0]?.rarity ?? 'common');
  return (
    <div
      className={`border rounded-xl ${borderColor} ${backgroundColor} align-center p-1`}
      style={{ width: imageDimension, height: imageDimension }}>
      <motion.img
        key={pulseKey}
        initial={{ scale: 1 }}
        animate={pulseKey ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        src={image}
        style={{
          objectFit: 'contain',
        }} />
    </div>
  );

}
