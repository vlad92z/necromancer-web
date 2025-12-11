/**
 * DeckDraftingModal - post-victory drafting overlay for Solo mode
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, animate, useMotionValue } from 'framer-motion';
import { Runeforge } from './Center/Runeforge';
import type { DeckDraftState, Runeforge as RuneforgeType } from '../../../types/game';
import { useClickSound } from '../../../hooks/useClickSound';
import arcaneDustIcon from '../../../assets/stats/arcane_dust.png';

interface DeckDraftingModalProps {
  draftState: DeckDraftState;
  onSelectRuneforge: (runeforgeId: string) => void;
  onOpenDeckOverlay: () => void;
  currentDeckSize: number;
  arcaneDustReward: number;
  startNextSoloGame: () => void;
}

export function DeckDraftingModal({
  draftState,
  onSelectRuneforge,
  onOpenDeckOverlay,
  currentDeckSize,
  arcaneDustReward,
  startNextSoloGame,
}: DeckDraftingModalProps) {
  const playClickSound = useClickSound();
  const [displayedRuneforges, setDisplayedRuneforges] = useState<RuneforgeType[]>(draftState.runeforges);
  const [pendingRuneforges, setPendingRuneforges] = useState<RuneforgeType[] | null>(null);
  const [selectedRuneforgeId, setSelectedRuneforgeId] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'hidingOthers' | 'selectedExit'>('idle');
  const [showSelectedRuneforge, setShowSelectedRuneforge] = useState(true);
  const deckCountValue = useMotionValue(currentDeckSize);
  const [displayedDeckCount, setDisplayedDeckCount] = useState(currentDeckSize);
  const deckCountAnimation = useRef<ReturnType<typeof animate> | null>(null);
  const picksUsed = draftState.totalPicks - draftState.picksRemaining;
  const isAnimating = animationPhase !== 'idle';
  const draftComplete = draftState.picksRemaining === 0;
  const selectionLocked = isAnimating || draftComplete;

  useEffect(() => {
    const unsubscribe = deckCountValue.on('change', (latest) => {
      setDisplayedDeckCount(Math.round(latest));
    });
    return () => {
      unsubscribe();
    };
  }, [deckCountValue]);

  useEffect(() => {
    if (animationPhase === 'idle') {
      deckCountValue.set(currentDeckSize);
      setDisplayedDeckCount(currentDeckSize);
    } else if (currentDeckSize > displayedDeckCount) {
      deckCountValue.set(currentDeckSize);
    }
  }, [animationPhase, currentDeckSize, deckCountValue, displayedDeckCount]);

  useEffect(() => {
    if (animationPhase === 'idle') {
      setDisplayedRuneforges(draftState.runeforges);
      setPendingRuneforges(null);
      setSelectedRuneforgeId(null);
      setShowSelectedRuneforge(true);
      return;
    }

    const incomingKey = draftState.runeforges.map((forge) => forge.id).join('|');
    const currentKey = displayedRuneforges.map((forge) => forge.id).join('|');

    if (incomingKey !== currentKey) {
      setPendingRuneforges(draftState.runeforges);
    }
  }, [animationPhase, displayedRuneforges, draftState.runeforges]);

  useEffect(() => {
    if (animationPhase === 'hidingOthers' && selectedRuneforgeId) {
      const timeout = setTimeout(() => {
        setAnimationPhase('selectedExit');
      }, 240);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [animationPhase, selectedRuneforgeId]);

  useEffect(() => {
    if (animationPhase === 'selectedExit' && selectedRuneforgeId) {
      setShowSelectedRuneforge(false);
      onSelectRuneforge(selectedRuneforgeId);
    }
  }, [animationPhase, onSelectRuneforge, selectedRuneforgeId]);

  useEffect(() => {
    return () => {
      deckCountAnimation.current?.stop();
    };
  }, []);

  const visibleRuneforges = displayedRuneforges.filter((runeforge) => {
    if (animationPhase === 'selectedExit' && runeforge.id === selectedRuneforgeId) {
      return showSelectedRuneforge;
    }
    return true;
  });

  const getRuneforgeAnimationState = (runeforgeId: string) => {
    if (!selectedRuneforgeId) {
      return 'visible';
    }
    if (animationPhase === 'hidingOthers' && runeforgeId !== selectedRuneforgeId) {
      return 'dimmed';
    }
    if (animationPhase === 'selectedExit' && runeforgeId !== selectedRuneforgeId) {
      return 'dimmed';
    }
    return 'visible';
  };

  const handleRuneforgeExitComplete = () => {
    if (animationPhase === 'hidingOthers') {
      setAnimationPhase('selectedExit');
      return;
    }

    if (animationPhase === 'selectedExit') {
      if (pendingRuneforges) {
        setDisplayedRuneforges(pendingRuneforges);
        setPendingRuneforges(null);
      }
      setShowSelectedRuneforge(true);
      setSelectedRuneforgeId(null);
      setAnimationPhase('idle');
    }
  };

  const animateDeckCounter = (target: number) => {
    deckCountAnimation.current?.stop();
    deckCountAnimation.current = animate(deckCountValue, target, {
      duration: 0.6,
      ease: 'easeOut',
    });
  };

  const handleSelect = (runeforge: RuneforgeType) => {
    if (selectionLocked) {
      return;
    }
    playClickSound();
    setSelectedRuneforgeId(runeforge.id);
    setAnimationPhase('hidingOthers');
    animateDeckCounter(currentDeckSize + runeforge.runes.length);
  };

  const handleOpenDeckOverlay = () => {
    playClickSound();
    onOpenDeckOverlay();
  };

  const handleStartNextGame = () => {
    playClickSound();
    startNextSoloGame();
  };

  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-[rgba(4,2,12,0.75)] backdrop-blur-sm px-4">
    <div className="w-full max-w-5xl rounded-3xl border border-white/12 bg-[rgba(10,10,24,0.9)] p-6 md:p-8 shadow-[0_34px_80px_rgba(0,0,0,0.7)] backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300/80">victory</div>
          <h2 className="text-2xl font-bold text-white">{draftComplete ? 'Draft complete' : 'Choose your new runes'}</h2>
        </div>
        <div className="rounded-2xl border border-sky-400/40 bg-sky-900/30 px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <img src={arcaneDustIcon} alt="Arcane Dust" className="h-6 w-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]" />
            <div className="text-lg font-extrabold text-white">+{arcaneDustReward.toLocaleString()}</div>
          </div>
          <div className="sr-only">Arcane Dust Received</div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-purple-500 transition-all duration-300"
          style={{
            width: `${Math.min(100, (picksUsed / draftState.totalPicks) * 100)}%`,
          }}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <AnimatePresence mode="sync" onExitComplete={handleRuneforgeExitComplete}>
          {visibleRuneforges.map((runeforge) => {
            const isSelected = runeforge.id === selectedRuneforgeId;
            const animationState = getRuneforgeAnimationState(runeforge.id);
            return (
              <motion.div
                layout="position"
                key={runeforge.id}
                initial="initial"
                animate={animationState}
                exit="exit"
                custom={isSelected}
                className="flex flex-col items-center gap-3 px-3 py-4"
                style={{
                  pointerEvents: animationState === 'dimmed' ? 'none' : 'auto',
                }}
              >
                <Runeforge runeforge={runeforge}/>
                <button
                  type="button"
                  onClick={() => handleSelect(runeforge)}
                  disabled={selectionLocked}
                  className="w-full rounded-xl border border-sky-400/40 bg-gradient-to-r from-sky-500/80 to-indigo-500/80 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Draft
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">Deck Size</div>
          <motion.div
            animate={{ scale: isAnimating ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-base font-bold text-white"
          >
            {displayedDeckCount} runes
          </motion.div>
        </div>
        <div className="flex w-full justify-end sm:w-auto gap-2">
          <button
              type="button"
              onClick={handleStartNextGame}
              className="w-full sm:w-auto rounded-xl border border-emerald-300/60 bg-gradient-to-r from-emerald-500/85 to-cyan-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_12px_28px_rgba(16,185,129,0.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Next Game
            </button>
          <button
            type="button"
            onClick={handleOpenDeckOverlay}
            className="w-full sm:w-auto rounded-xl border border-sky-400/40 bg-sky-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50 transition hover:border-sky-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            View Deck
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
