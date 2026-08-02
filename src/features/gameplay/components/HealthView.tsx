/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { useGameplayHealthState } from '../../../hooks/useGameState';
import { useHealthChangeSound } from '../../../hooks/useHealthChangeSound';

type DeltaIndicator = { amount: number; key: number; type: 'gain' | 'loss' };


export function HealthView() {
  const { health, maxHealth, mana, maxMana } = useGameplayHealthState();

  const clampedHealth = Math.max(0, Math.min(health, maxHealth));
  useHealthChangeSound(clampedHealth);


  const progress = Math.min(1, health / maxHealth);
  const progressPercent = Math.round(progress * 100);
  const previousHealthRef = useRef(health);
  const sequenceRef = useRef(0);
  const [healthIndicator, setHealthIndicator] = useState<DeltaIndicator | null>(null);
  const animatedHealth = useMotionValue(health);
  const [displayedHealth, setDisplayedHealth] = useState(health);
  useMotionValueEvent(animatedHealth, 'change', (value) => {
    setDisplayedHealth(Math.round(value));
  });

  const healthGainClassName = 'text-emerald-300 text-sm font-bold';
  const healthLossClassName = "text-rose-300 text-sm font-bold";
  useEffect(() => {
    const controls = animate(animatedHealth, health, {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => controls.stop();
  }, [animatedHealth, health]);

  useEffect(() => {
    const previousValue = previousHealthRef.current;

    if (health !== previousValue) {
      sequenceRef.current += 1;
      const isGain = health > previousValue;
      setHealthIndicator({ amount: Math.abs(health - previousValue), key: sequenceRef.current, type: isGain ? 'gain' : 'loss' });
    }

    previousHealthRef.current = health;
  }, [health]);

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
    <div className={`w-full flex flex-col gap-2 py-3 px-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">HEALTH</div>

        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          <AnimatePresence>
            {healthIndicator && (
              <motion.span
                key={healthIndicator.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={healthIndicator.type === 'gain' ? healthGainClassName : healthLossClassName}
              >
                {healthIndicator.type === 'loss' ? '-' : '+'}
                {healthIndicator.amount}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span className='text-red-500 font-extrabold text-base text-right'>
            {`${displayedHealth} / ${maxHealth}`}
          </motion.span>
        </div>
      </div>
      <div className={'rounded-full overflow-hidden relative h-[10px] bg-red-500/15'}>
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full bg-linear-to-r from-red-500 to-red-700`}
          initial={{ width: `${progressPercent}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <div className="flex items-center gap-1" aria-label={`${mana} of ${maxMana} mana`}>
        {Array.from({ length: maxMana }, (_, index) => (
          <span
            key={index}
            className={`h-3 w-3 rounded-full border-2 border-[#141313] ${index < mana ? 'bg-[#75c9f0]' : 'bg-transparent'}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
