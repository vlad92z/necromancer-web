/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';

type DeltaIndicator = { amount: number; key: number; type: 'gain' | 'loss' };

interface RuneScoreViewProps {
  score: number;
  maxScore: number;
}


export function RuneScoreView({
  score,
  maxScore
}: RuneScoreViewProps) {
  const progress = Math.min(1, score / maxScore);
  const progressPercent = Math.round(progress * 100);
  const previousValueRef = useRef(score);
  const sequenceRef = useRef(0);
  const [indicator, setIndicator] = useState<DeltaIndicator | null>(null);
  const animatedValue = useMotionValue(score);
  const [displayedValue, setDisplayedValue] = useState(score);
  useMotionValueEvent(animatedValue, 'change', (value) => {
    setDisplayedValue(Math.round(value));
  });

  const deltaGainClassName = 'text-sky-200 text-sm font-bold';
  const deltaLossClassName = "text-rose-300 text-sm font-bold";
  useEffect(() => {
    const controls = animate(animatedValue, score, {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => controls.stop();
  }, [animatedValue, score]);

  useEffect(() => {
    const previousValue = previousValueRef.current;

    if (score !== previousValue) {
      sequenceRef.current += 1;
      const isGain = score > previousValue;
      setIndicator({ amount: Math.abs(score - previousValue), key: sequenceRef.current, type: isGain ? 'gain' : 'loss' });
    }

    previousValueRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!indicator) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIndicator(null);
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [indicator]);

  return (
    <div className={`w-full flex flex-col gap-2 py-3 px-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">RUNE SCORE</div>
        
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          <AnimatePresence>
            {indicator && (
              <motion.span
                key={indicator.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={indicator.type === 'gain' ? deltaGainClassName : deltaLossClassName ?? deltaGainClassName}
              >
                {indicator.type === 'loss' ? '-' : '+'}
                {indicator.amount}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span className='text-yellow-400 font-extrabold text-base text-right whitespace-nowrap flex-shrink-0'>
            {`${displayedValue} / ${maxScore}`}
          </motion.span>
        </div>
      </div>
      <div className={'rounded-full overflow-hidden relative h-[10px] bg-blue-500/30'}>
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
