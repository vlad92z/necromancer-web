/**
 * RuneAnimation component - animates runes moving from source to destination
 */

import { motion } from 'framer-motion';
import { RuneCell } from './RuneCell';
import type { AnimatingRune, Rune, RuneEffect, RuneType } from '../types/game';
import { getRuneEffectsForType } from '../utils/runeEffects';

interface RuneAnimationProps {
  animatingRunes: AnimatingRune[];
  onAnimationComplete: () => void;
}

// Constants for animation easing
const ANIMATION_EASE = [0.4, 0.0, 0.2, 1] as const;
const RUNE_EFFECT_CACHE = new Map<RuneType, RuneEffect[]>();

const getCachedRuneEffects = (runeType: RuneType) => {
  const cached = RUNE_EFFECT_CACHE.get(runeType);
  if (cached) {
    return cached;
  }
  const effects = getRuneEffectsForType(runeType);
  RUNE_EFFECT_CACHE.set(runeType, effects);
  return effects;
};

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
          effects: getCachedRuneEffects(rune.runeType),
        };
        
        // If shouldDisappear is true, add a fade out and scale down animation
        const animateProps = rune.shouldDisappear
          ? {
              x: [rune.startX, rune.endX + 7, rune.endX + 7],
              y: [rune.startY, rune.endY + 7, rune.endY + 7],
              scale: [1, 1, 0],
              opacity: [1, 1, 0],
            }
          : {
              x: rune.endX + 7,
              y: rune.endY + 7,
              scale: 1,
            };

        const transitionProps = rune.shouldDisappear
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
            key={rune.id}
            initial={{
              x: rune.startX,
              y: rune.startY,
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
              position: 'absolute',
              width: '60px',
              height: '60px',
            }}
          >
            <RuneCell
              rune={runeObj}
              variant="selected"
              forceVariant="runeforge"
              size="medium"
              showEffect
            />
          </motion.div>
        );
      })}
    </div>
  );
}
