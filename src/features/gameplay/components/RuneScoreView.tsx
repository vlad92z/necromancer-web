/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { useSoloGameStore } from '../../../state/stores/soloGameStore';

export function RuneScoreView() {
  const currentScore = useSoloGameStore((state) => state.runeScore.current);
  const targetScore = useSoloGameStore((state) => state.runeScore.target);
  const progress = Math.min(1, currentScore / targetScore);
  const progressPercent = Math.round(progress * 100);
  const animatedValue = useMotionValue(currentScore);
  const [displayedValue, setDisplayedValue] = useState(currentScore);
  useMotionValueEvent(animatedValue, 'change', (value) => {
    setDisplayedValue(Math.round(value));
  });

  return (
    <div className={`w-full flex flex-col gap-2 py-3 px-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">RUNE SCORE</div>
        <motion.span className='flex items-center gap-2 min-w-[120px] justify-end text-yellow-400 font-extrabold text-base text-right whitespace-nowrap flex-shrink-0'>
          {`${displayedValue} / ${targetScore}`}
        </motion.span>
      </div>
      {/* Progress Container */}
      <div className={'rounded-full overflow-hidden relative h-[10px] bg-blue-500/30'}>
        {/* Progress Animation */}
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-400`}
          initial={{ width: `${progressPercent}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
