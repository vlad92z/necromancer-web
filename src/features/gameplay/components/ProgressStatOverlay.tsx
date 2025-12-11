/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';

type DeltaIndicator = { amount: number; key: number; type: 'gain' | 'loss' };

interface ProgressStatOverlayProps {
  label: string;
  current: number;
  max: number;
  showFraction?: boolean;
  containerBorderColor: string;
  progressBackground: string;
  barClassName: string;
  valueColor: string;
  deltaGainClassName?: string;
  deltaLossClassName?: string;
}


export function ProgressStatOverlay({
  label,
  current,
  max,
  showFraction = false,
  containerBorderColor,
  progressBackground,
  barClassName,
  valueColor = 'text-slate-100',
  deltaGainClassName = 'text-sky-200 text-sm font-bold',
  deltaLossClassName = "text-rose-300 text-sm font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.55)]",
}: ProgressStatOverlayProps) {
  const safeMax = Math.max(1, max);
  const normalizedCurrent = current;
  const progress = Math.min(1, normalizedCurrent / safeMax);
  const progressPercent = Math.round(progress * 100);
  const previousValueRef = useRef(normalizedCurrent);
  const sequenceRef = useRef(0);
  const [indicator, setIndicator] = useState<DeltaIndicator | null>(null);
  const animatedValue = useMotionValue(normalizedCurrent);
  const [displayedValue, setDisplayedValue] = useState(normalizedCurrent);
  const valueClassName = `${valueColor} font-extrabold text-base text-right`
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

    if (normalizedCurrent !== previousValue) {
      sequenceRef.current += 1;
      const isGain = normalizedCurrent > previousValue;
      setIndicator({ amount: Math.abs(normalizedCurrent - previousValue), key: sequenceRef.current, type: isGain ? 'gain' : 'loss' });
    }

    previousValueRef.current = normalizedCurrent;
  }, [normalizedCurrent]);

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

  const valueClass = valueClassName;
  const progressClass = barClassName;
  const fractionMax = max;

  return (
    <div className={`w-full flex flex-col gap-2 py-3 px-3.5 rounded-[16px] border ${containerBorderColor}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">{label}</div>
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
          <motion.span className={valueClass}>
            {showFraction ? `${displayedValue} / ${fractionMax}` : displayedValue}
          </motion.span>
        </div>
      </div>
      <div className={`rounded-full overflow-hidden relative h-[10px] ${progressBackground}`}>
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
