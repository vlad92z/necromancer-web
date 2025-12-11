/**
 * RuneAnimation component - animates runes moving from source to destination
 */

import { motion } from 'framer-motion';
import { RuneCell } from './RuneCell';
import type { AnimatingRune } from '../types/game';
import { RUNE_SIZE_CONFIG } from '../styles/tokens';

interface RuneAnimationProps {
  animatingRunes: AnimatingRune[];
  onAnimationComplete: () => void;
}

// Constants for animation easing
const ANIMATION_EASE = [0.4, 0.0, 0.2, 1] as const;

export function RuneAnimation({ animatingRunes, onAnimationComplete }: RuneAnimationProps) {
  if (animatingRunes.length === 0) return null;

  const positionOffset = 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      {animatingRunes.map((animatingRune, index) => {
        // If shouldDisappear is true, add a fade out and scale down animation
        // Small correction to compensate for visual centering
        const finalX = animatingRune.endX + positionOffset;
        const finalY = animatingRune.endY + positionOffset;
        const startX = animatingRune.startX + positionOffset;
        const startY = animatingRune.startY + positionOffset;
        const runeSize = animatingRune.size ?? RUNE_SIZE_CONFIG.large.dimension;
        const runeScale = runeSize / RUNE_SIZE_CONFIG.large.dimension;

        const animateProps = animatingRune.shouldDisappear
          ? {
              x: [startX, finalX, finalX],
              y: [startY, finalY, finalY],
              scale: [1, 1, 0],
              opacity: [1, 1, 0],
            }
          : {
              x: finalX,
              y: finalY,
              scale: 1,
            };

        const transitionProps = animatingRune.shouldDisappear
          ? {
              duration: 0.7,
              delay: index * 0.05,
              times: [0, 0.7, 1], // Reach destination at 70%, then disappear
              ease: ANIMATION_EASE,
            }
          : {
              duration: 0.5,
              delay: index * 0.05,
              ease: ANIMATION_EASE,
            };
        
        return (
          <motion.div
            key={animatingRune.id}
            initial={{
              x: startX,
              y: startY,
              scale: 1,
              opacity: 1,
            }}
            animate={animateProps}
            transition={transitionProps}
            onAnimationComplete={() => {
              // Only trigger callback on last rune
              if (index === animatingRunes.length - 1) {
                onAnimationComplete();
              }
            }}
            style={{
              width: runeSize,
              height: runeSize,
            }}
          >
            <div
              style={{
                width: RUNE_SIZE_CONFIG.large.dimension,
                height: RUNE_SIZE_CONFIG.large.dimension,
                transform: `scale(${runeScale})`,
                transformOrigin: 'top left',
              }}
            >
              <RuneCell
                rune={animatingRune.rune}
                variant="selected"
                forceVariant="runeforge"
                size="large"
                showEffect
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
