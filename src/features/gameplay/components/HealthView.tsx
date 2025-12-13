/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';

type DeltaIndicator = { amount: number; key: number; type: 'gain' | 'loss' };

interface HealthViewProps {
  health: number;
  maxHealth: number;
}


export function HealthView({
  health,
  maxHealth
}: HealthViewProps) {
  const progress = Math.min(1, health / maxHealth);
  const progressPercent = Math.round(progress * 100);
  const previousValueRef = useRef(health);
  const sequenceRef = useRef(0);
  const [indicator, setIndicator] = useState<DeltaIndicator | null>(null);
  const animatedValue = useMotionValue(health);
  const [displayedValue, setDisplayedValue] = useState(health);
  useMotionValueEvent(animatedValue, 'change', (value) => {
    setDisplayedValue(Math.round(value));
  });

  const deltaGainClassName = 'text-emerald-300 text-sm font-bold';
  const deltaLossClassName = "text-rose-300 text-sm font-bold";
  let deltaIndicator: { amount: number; key: number; type: 'gain' | 'loss' } | null = null;

  useEffect(() => {
    const controls = animate(animatedValue, health, {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => controls.stop();
  }, [animatedValue, health]);

  useEffect(() => {
    const previousValue = previousValueRef.current;

    if (health !== previousValue) {
      sequenceRef.current += 1;
      const isGain = health > previousValue;
      setIndicator({ amount: Math.abs(health - previousValue), key: sequenceRef.current, type: isGain ? 'gain' : 'loss' });
    }

    previousValueRef.current = health;
  }, [health]);
  useEffect(() => {
    if (!deltaIndicator) {
      return;
    }

    setIndicator(deltaIndicator);
  }, [deltaIndicator]);

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
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">HEALTH</div>
        
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
          <motion.span className='text-red-500 font-extrabold text-base text-right'>
            {`${displayedValue} / ${maxHealth}`}
          </motion.span>
        </div>
      </div>
      <div className={'rounded-full overflow-hidden relative h-[10px] bg-red-500/15'}>
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 to-red-700`}
          initial={{ width: `${progressPercent}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
