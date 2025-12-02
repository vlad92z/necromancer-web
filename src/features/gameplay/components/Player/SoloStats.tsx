/**
 * SoloStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { StatBadge } from '../../../../components/StatBadge';
import healthSvg from '../../../../assets/stats/health.svg';
import deckSvg from '../../../../assets/stats/deck.svg';
import fatigueSvg from '../../../../assets/stats/fatigue.svg';

export interface SoloStatsProps {
  isActive: boolean;
  health: number;
  healing: number;
  essence: number;
  focus: number;
  totalPower: number;
  essenceRuneCount: number;
  hasOverload: boolean;
  hasWindMitigation: boolean;
  windRuneCount: number;
  overloadPenalty: number;
  overloadMultiplier: number;
  overloadDamagePreview: number;
  round: number;
  frostRuneCount: number;
  deckCount?: number;
}

interface AnimatedHealthValueProps {
  target: number;
}

function AnimatedHealthValue({ target }: AnimatedHealthValueProps) {
  const [displayValue, setDisplayValue] = useState(target);
  const previousValue = useRef(target);

  useEffect(() => {
    const fromValue = previousValue.current;
    if (fromValue === target) {
      return;
    }

    previousValue.current = target;
    const duration = Math.min(0.85, Math.max(0.3, Math.abs(target - fromValue) * 0.05));

    const controls = animate(fromValue, target, {
      duration,
      ease: 'easeOut',
      onUpdate(latest) {
        setDisplayValue(Math.round(latest));
      },
      onComplete() {
        setDisplayValue(target);
      },
    });

    return () => controls.stop();
  }, [target]);

  return <>{displayValue}</>;
}

export function SoloStats({
  health,
  overloadMultiplier,
  deckCount,
}: SoloStatsProps) {


  const healthTooltip = 'Health - drop to zero and your game ends.';

  return (
    <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.9em',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
        }}
      >
        <StatBadge
              label="Health"
              value={<AnimatedHealthValue target={health} />}
              color="#fb7185"
              borderColor="rgba(248, 113, 113, 0.4)"
              tooltip={healthTooltip}
              image={healthSvg}
            />
            <StatBadge
              label="Strain"
              value={overloadMultiplier ?? 0}
              color="#fa6060ff"
              borderColor="rgba(154, 147, 23, 0.35)"
              tooltip={`Overloading runes immediately deals ${overloadMultiplier} damage`}
              image={fatigueSvg}
            />
            <StatBadge
              label="Deck"
              value={deckCount ?? 0}
              color="#60a5fa"
              borderColor="rgba(96, 165, 250, 0.35)"
              tooltip={`Runes left in deck: ${deckCount ?? 0}`}
              image={deckSvg}
            />
      </div>
  );
}
