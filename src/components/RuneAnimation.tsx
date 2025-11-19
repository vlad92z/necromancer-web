/**
 * RuneAnimation component - animates runes moving from source to destination
 */

import { motion } from 'framer-motion';
import { RuneCell } from './RuneCell';
import type { AnimatingRune, Rune } from '../types/game';

interface RuneAnimationProps {
  animatingRunes: AnimatingRune[];
  onAnimationComplete: () => void;
}

export function RuneAnimation({ animatingRunes, onAnimationComplete }: RuneAnimationProps) {
  if (animatingRunes.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      {animatingRunes.map((rune, index) => {
        const runeObj: Rune = {
          id: rune.id,
          runeType: rune.runeType,
          effect: { type: 'None' },
        };
        
        return (
          <motion.div
            key={rune.id}
            initial={{
              x: rune.startX,
              y: rune.startY,
              scale: 1,
            }}
            animate={{
              x: rune.endX,
              y: rune.endY,
              scale: 1.2,
            }}
            transition={{
              duration: 0.5,
              delay: index * 0.05, // Stagger animations slightly
              ease: [0.4, 0.0, 0.2, 1], // Custom easing
            }}
            onAnimationComplete={() => {
              // Only trigger callback on last rune
              if (index === animatingRunes.length - 1) {
                onAnimationComplete();
              }
            }}
            style={{
              position: 'absolute',
              width: '48px',
              height: '48px',
            }}
          >
            <RuneCell
              rune={runeObj}
              variant="selected"
              forceVariant="runeforge"
              size="medium"
            />
          </motion.div>
        );
      })}
    </div>
  );
}
