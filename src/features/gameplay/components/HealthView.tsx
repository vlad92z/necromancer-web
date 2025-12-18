/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { useArmorChangeSound } from '../../../hooks/useArmorChangeSound';
import { useGameplayStore } from '../../../state/stores';
import { useHealthChangeSound } from '../../../hooks/useHealthChangeSound';

type DeltaIndicator = { amount: number; key: number; type: 'gain' | 'loss' };
type ForcedArmorIndicator = { amount: number; key: number };

export function HealthView() {
  const health = useGameplayStore((state) => state.player.health);
  const maxHealth = useGameplayStore((state) => state.player.maxHealth);
  const armor = useGameplayStore((state) => state.player.armor);
  const scoringSequence = useGameplayStore((state) => state.scoringSequence);
  useArmorChangeSound(armor);
  const progress = Math.min(1, health / maxHealth);
  const progressPercent = Math.round(progress * 100);
  const previousHealthRef = useRef(health);
  const previousArmorRef = useRef(armor);
  const lastHealingStepRef = useRef<string | null>(null);
  const lastArmorStepRef = useRef<string | null>(null);
  const sequenceRef = useRef(0);
  const [healthIndicator, setHealthIndicator] = useState<DeltaIndicator | null>(null);
  const [armorIndicator, setArmorIndicator] = useState<DeltaIndicator | null>(null);
  const [forcedArmorIndicator, setForcedArmorIndicator] = useState<ForcedArmorIndicator | null>(null);
  const [forcedHealSignal, setForcedHealSignal] = useState<number | null>(null);
  const animatedHealth = useMotionValue(health);
  const animatedArmor = useMotionValue(armor);
  const [displayedHealth, setDisplayedHealth] = useState(health);
  const [displayedArmor, setDisplayedArmor] = useState(armor);
  const clampedHealth = Math.max(0, Math.min(health, maxHealth));

  const renderIndicator = (indicator: DeltaIndicator | null, gainClassName: string, lossClassName: string) => {
    if (!indicator) {
      return null;
    }

    return (
      <AnimatePresence>
        <motion.span
          key={indicator.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={indicator.type === 'gain' ? gainClassName : lossClassName}
        >
          {indicator.type === 'loss' ? '-' : '+'}
          {indicator.amount}
        </motion.span>
      </AnimatePresence>
    );
  };
  useHealthChangeSound(clampedHealth, forcedHealSignal);
  useMotionValueEvent(animatedHealth, 'change', (value) => {
    setDisplayedHealth(Math.round(value));
  });
  useMotionValueEvent(animatedArmor, 'change', (value) => {
    setDisplayedArmor(Math.round(value));
  });

  const healthGainClassName = 'text-emerald-300 text-sm font-bold';
  const healthLossClassName = "text-rose-300 text-sm font-bold";
  const armorGainClassName = 'text-blue-300 text-sm font-bold';
  const armorLossClassName = "text-slate-200 text-sm font-bold";
  
  useEffect(() => {
    const healthControls = animate(animatedHealth, health, { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] });
    const armorControls = animate(animatedArmor, armor, { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] });

    return () => {
      healthControls.stop();
      armorControls.stop();
    };
  }, [animatedArmor, animatedHealth, armor, health]);

  useEffect(() => {
    const previousHealth = previousHealthRef.current;
    const previousArmor = previousArmorRef.current;

    if (health !== previousHealth) {
      sequenceRef.current += 1;
      const isGain = health > previousHealth;
      setHealthIndicator({ amount: Math.abs(health - previousHealth), key: sequenceRef.current, type: isGain ? 'gain' : 'loss' });
    }

    if (armor !== previousArmor) {
      sequenceRef.current += 1;
      const isGain = armor > previousArmor;
      setArmorIndicator({ amount: Math.abs(armor - previousArmor), key: sequenceRef.current, type: isGain ? 'gain' : 'loss' });
    }

    previousHealthRef.current = health;
    previousArmorRef.current = armor;
  }, [armor, health]);

  useEffect(() => {
    const previousHealth = previousHealthRef.current;

    if (!scoringSequence || scoringSequence.activeIndex < 0) {
      lastArmorStepRef.current = null;
      lastHealingStepRef.current = null;
      previousHealthRef.current = clampedHealth;
      return;
    }

    const step = scoringSequence.steps[scoringSequence.activeIndex];
    const stepKey = `${scoringSequence.sequenceId}:${scoringSequence.activeIndex}`;
    if (step && step.armorDelta > 0 && lastArmorStepRef.current !== stepKey) {
      lastArmorStepRef.current = stepKey;
      setForcedArmorIndicator({ amount: step.armorDelta, key: Date.now() });
    }

    if (!step || step.healingDelta <= 0 || lastHealingStepRef.current === stepKey) {
      previousHealthRef.current = clampedHealth;
      return;
    }

    lastHealingStepRef.current = stepKey;

    if (clampedHealth === previousHealth) {
      setForcedHealSignal(Date.now());
    }

    previousHealthRef.current = clampedHealth;
  }, [clampedHealth, scoringSequence]);

  useEffect(() => {
    const timers: number[] = [];
    const registerTimeout = (indicator: DeltaIndicator | ForcedArmorIndicator | null, clear: (value: null) => void) => {
      if (!indicator) {
        return;
      }
      const timeoutId = window.setTimeout(() => clear(null), 900);
      timers.push(timeoutId);
    };

    registerTimeout(healthIndicator, setHealthIndicator);
    registerTimeout(armorIndicator, setArmorIndicator);
    registerTimeout(forcedArmorIndicator, setForcedArmorIndicator);

    return () => {
      timers.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, [armorIndicator, forcedArmorIndicator, healthIndicator]);

  return (
    <div className={`w-full flex flex-col gap-2 py-3 px-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">HEALTH</div>

        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          {renderIndicator(armorIndicator, armorGainClassName, armorLossClassName)}
          <motion.span className='text-blue-400 font-extrabold text-base text-right'>
            {`🛡${displayedArmor}`}
          </motion.span>
        </div>

        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          {renderIndicator(healthIndicator, healthGainClassName, healthLossClassName)}
          <motion.span className='text-red-500 font-extrabold text-base text-right'>
            {`${displayedHealth} / ${maxHealth}`}
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
