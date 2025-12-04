/**
 * SoloRuneScoreOverlay - displays the solo target and current rune score
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';

interface SoloRuneScoreOverlayProps {
  currentScore: number;
  targetScore: number;
}

export function SoloRuneScoreOverlay({ currentScore, targetScore }: SoloRuneScoreOverlayProps) {
  const safeTarget = Math.max(1, targetScore);
  const clampedScore = Math.max(0, currentScore);
  const progress = Math.min(1, clampedScore / safeTarget);
  const progressPercent = Math.round(progress * 100);
  const reachedTarget = clampedScore >= safeTarget;
  const previousScoreRef = useRef(clampedScore);
  const scoreSequenceRef = useRef(0);
  const [gainIndicator, setGainIndicator] = useState<{ amount: number; key: number } | null>(null);
  const animatedScore = useMotionValue(clampedScore);
  const [displayedScore, setDisplayedScore] = useState(clampedScore);

  useMotionValueEvent(animatedScore, 'change', (value) => {
    setDisplayedScore(Math.round(value));
  });

  useEffect(() => {
    const controls = animate(animatedScore, clampedScore, {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    });

    return () => controls.stop();
  }, [animatedScore, clampedScore]);

  useEffect(() => {
    const previousScore = previousScoreRef.current;

    if (clampedScore > previousScore) {
      scoreSequenceRef.current += 1;
      setGainIndicator({ amount: clampedScore - previousScore, key: scoreSequenceRef.current });
    }

    previousScoreRef.current = clampedScore;
  }, [clampedScore]);

  useEffect(() => {
    if (!gainIndicator) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setGainIndicator(null);
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [gainIndicator]);

  return (
    <div className="flex flex-col gap-3 py-[14px] px-[18px] rounded-[16px] border border-slate-400/35 bg-[linear-gradient(145deg,rgba(16,11,32,0.92)_0%,rgba(6,10,24,0.88)_100%)] shadow-[0_14px_36px_rgba(0,0,0,0.38)] backdrop-blur-[10px] max-w-[640px] w-full">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-1.5">
          <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">Rune Score</div>
          <div className="flex items-center gap-2 min-w-[140px] justify-end">
            <AnimatePresence>
              {gainIndicator && (
                <motion.span
                  key={gainIndicator.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="text-sky-200 text-sm font-bold drop-shadow-[0_0_8px_rgba(125,211,252,0.55)]"
                >
                  +{gainIndicator.amount}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span
              className={`${reachedTarget ? 'text-emerald-400' : 'text-yellow-400'} font-extrabold text-base text-right`}
            >
              {displayedScore} / {targetScore}
            </motion.span>
          </div>
        </div>
        <div className="h-[8px] rounded-full bg-[rgba(148,163,184,0.18)] overflow-hidden relative">
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${
              reachedTarget
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_8px_18px_rgba(52,211,153,0.35)]'
                : 'bg-gradient-to-r from-purple-500 to-sky-400 shadow-[0_8px_18px_rgba(129,140,248,0.35)]'
            }`}
            initial={{ width: `${progressPercent}%` }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </div>
    </div>
  );
}
