/**
 * SoloHealthTracker - displays the player's health with a red progress indicator for solo runs
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { useHealthChangeSound } from '../../../hooks/useHealthChangeSound';

interface SoloHealthTrackerProps {
  health: number;
  maxHealth?: number;
}

export function SoloHealthTracker({ health, maxHealth }: SoloHealthTrackerProps) {
  const healthCap = Math.max(1, maxHealth ?? health);
  const clampedHealth = Math.max(0, Math.min(health, healthCap));
  const progressPercent = Math.round((clampedHealth / healthCap) * 100);
  const previousHealthRef = useRef(clampedHealth);
  const changeSequenceRef = useRef(0);
  const [healthIndicator, setHealthIndicator] = useState<{ amount: number; key: number; type: 'heal' | 'damage' } | null>(
    null
  );
  const animatedHealth = useMotionValue(clampedHealth);
  const [displayedHealth, setDisplayedHealth] = useState(clampedHealth);

  useHealthChangeSound(clampedHealth);

  useMotionValueEvent(animatedHealth, 'change', (value) => {
    setDisplayedHealth(Math.round(value));
  });

  useEffect(() => {
    const controls = animate(animatedHealth, clampedHealth, {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => controls.stop();
  }, [animatedHealth, clampedHealth]);

  useEffect(() => {
    const previousHealth = previousHealthRef.current;

    if (clampedHealth !== previousHealth) {
      changeSequenceRef.current += 1;
      const isHeal = clampedHealth > previousHealth;
      setHealthIndicator({
        amount: Math.abs(clampedHealth - previousHealth),
        key: changeSequenceRef.current,
        type: isHeal ? 'heal' : 'damage',
      });
    }

    previousHealthRef.current = clampedHealth;
  }, [clampedHealth]);

  useEffect(() => {
    if (!healthIndicator) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setHealthIndicator(null);
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [healthIndicator]);

  return (
    <div className="flex flex-col gap-2 py-3 px-3.5 rounded-[14px] border border-red-500/30 shadow-[0_12px_28px_rgba(0,0,0,0.42)]">
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">Health</div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {healthIndicator && (
              <motion.span
                key={healthIndicator.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`text-sm font-bold ${
                  healthIndicator.type === 'heal'
                    ? 'text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]'
                    : 'text-rose-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.55)]'
                }`}
              >
                {healthIndicator.type === 'heal' ? '+' : '-'}
                {healthIndicator.amount}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span className="text-red-500 font-extrabold text-lg min-w-[32px] text-right">
            {displayedHealth}
          </motion.span>
        </div>
      </div>
      <div className="h-[10px] rounded-full overflow-hidden relative shadow-inner bg-[rgba(248,113,113,0.16)]">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 to-red-700 shadow-[0_10px_24px_rgba(239,68,68,0.25)]"
          initial={{ width: `${progressPercent}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
