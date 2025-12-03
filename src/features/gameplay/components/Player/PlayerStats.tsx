/**
 * PlayerStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { StatBadge } from '../../../../components/StatBadge';
import healthSvg from '../../../../assets/stats/health.svg';


interface StatProps {
  playerName: string;
  isActive: boolean;
  nameColor: string;
  health: number;
  round: number;
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

export function PlayerStats({
  playerName,
  isActive,
  nameColor,
  health
}: StatProps) {
  const previousHealthRef = useRef(health);

  useEffect(() => {
    previousHealthRef.current = health;
  }, [health]);

  const healthTooltip = 'Health - drop to zero and your duel ends.';

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.9em',
          minWidth: '8em',
          width: '100%',
          height: '100%',
          padding: '1.25em 1em',
          borderRadius: '28px',
          border: isActive ? '1px solid rgba(168, 85, 247, 0.65)' : '1px solid rgba(255, 255, 255, 0.08)',
          background: isActive
            ? 'linear-gradient(180deg, rgba(76, 29, 149, 0.55) 0%, rgba(17, 24, 39, 0.85) 100%)'
            : 'rgba(5, 8, 20, 0.85)',
          boxShadow: isActive
            ? '0 25px 55px rgba(147, 51, 234, 0.35)'
            : '0 18px 35px rgba(2, 0, 12, 0.7)',
          position: 'relative',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1.25em 1em',
          position: 'relative',
        }}>
          <div
            style={{
              width: '5em',
              height: '5em',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${nameColor}`,
              background: `radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(15,23,42,0.9) 60%)`,
              color: '#f5f3ff',
              fontWeight: 700,
              fontSize: '18px',
              textTransform: 'uppercase',
              boxShadow: isActive ? '0 0 25px rgba(129, 140, 248, 0.45)' : 'none',
            }}
          >
            {playerName.slice(0, 1)}
          </div>

          <div style={{ color: '#f5f3ff', fontWeight: 600, fontSize: '1.2rem' }}>{playerName}</div>
        </div>

        <div style={{ display: 'flex', gap: '0.25em', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          <StatBadge
            label="Health"
            value={<AnimatedHealthValue target={health} />}
            color="#fb7185"
            borderColor="rgba(248, 113, 113, 0.4)"
            tooltip={healthTooltip}
            image={healthSvg}
          />
        </div>
      </div>
    </>
  );
}
