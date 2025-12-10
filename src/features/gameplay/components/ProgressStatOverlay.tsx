/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';

export type ProgressDeltaMode = 'none' | 'gain-only' | 'signed';

type DeltaIndicator = { amount: number; key: number; type: 'gain' | 'loss' };

interface ProgressStatOverlayProps {
  label: string;
  current: number;
  max: number;
  displayMax?: number;
  clampToMax?: boolean;
  showFraction?: boolean;
  deltaMode?: ProgressDeltaMode;
  containerClassName: string;
  trackClassName: string;
  barClassName: string;
  reachedBarClassName?: string;
  valueClassName?: string;
  valueReachedClassName?: string;
  deltaGainClassName?: string;
  deltaLossClassName?: string;
}

export function ProgressStatOverlay({
  label,
  current,
  max,
  displayMax,
  clampToMax = false,
  showFraction = false,
  deltaMode = 'none',
  containerClassName,
  trackClassName,
  barClassName,
  reachedBarClassName,
  valueClassName = 'text-slate-100 font-extrabold text-base text-right',
  valueReachedClassName,
  deltaGainClassName = 'text-sky-200 text-sm font-bold',
  deltaLossClassName,
}: ProgressStatOverlayProps) {
  const safeMax = Math.max(1, max);
  const normalizedCurrent = clampToMax ? Math.min(Math.max(0, current), safeMax) : Math.max(0, current);
  const progress = Math.min(1, normalizedCurrent / safeMax);
  const progressPercent = Math.round(progress * 100);
  const reachedTarget = normalizedCurrent >= safeMax;
  const previousValueRef = useRef(normalizedCurrent);
  const sequenceRef = useRef(0);
  const [indicator, setIndicator] = useState<DeltaIndicator | null>(null);
  const animatedValue = useMotionValue(normalizedCurrent);
  const [displayedValue, setDisplayedValue] = useState(normalizedCurrent);

  useMotionValueEvent(animatedValue, 'change', (value) => {
    setDisplayedValue(Math.round(value));
  });

  useEffect(() => {
    const controls = animate(animatedValue, normalizedCurrent, {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => controls.stop();
  }, [animatedValue, normalizedCurrent]);

  useEffect(() => {
    const previousValue = previousValueRef.current;

    if (deltaMode === 'none') {
      previousValueRef.current = normalizedCurrent;
      return;
    }

    if (deltaMode === 'gain-only' && normalizedCurrent > previousValue) {
      sequenceRef.current += 1;
      setIndicator({ amount: normalizedCurrent - previousValue, key: sequenceRef.current, type: 'gain' });
    }

    if (deltaMode === 'signed' && normalizedCurrent !== previousValue) {
      sequenceRef.current += 1;
      const isGain = normalizedCurrent > previousValue;
      setIndicator({ amount: Math.abs(normalizedCurrent - previousValue), key: sequenceRef.current, type: isGain ? 'gain' : 'loss' });
    }

    previousValueRef.current = normalizedCurrent;
  }, [deltaMode, normalizedCurrent]);

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

  const valueClass = reachedTarget && valueReachedClassName ? valueReachedClassName : valueClassName;
  const progressClass = reachedTarget && reachedBarClassName ? reachedBarClassName : barClassName;
  const fractionMax = displayMax ?? max;

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">{label}</div>
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          <AnimatePresence>
            {indicator && deltaMode !== 'none' && (
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
          <motion.span className={valueClass}>
            {showFraction ? `${displayedValue} / ${fractionMax}` : displayedValue}
          </motion.span>
        </div>
      </div>
      <div className={`rounded-full overflow-hidden relative ${trackClassName}`}>
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full ${progressClass}`}
          initial={{ width: `${progressPercent}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
