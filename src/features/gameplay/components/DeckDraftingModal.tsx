/**
 * DeckDraftingModal - post-victory rune pack overlay for Solo mode.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import type { DeckDraftOffer, DeckDraftState, Rune, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { useGameplayActions, useUIActions } from '../../../hooks/useGameActions';
import { useClickSound } from '../../../hooks/useClickSound';
import { useGameplayDeckState } from '../../../hooks/useGameState';
import arcaneDustIcon from '../../../assets/stats/arcane_dust.png';

interface DeckDraftingModalProps {
  draftState: DeckDraftState;
}

function createPackFaceRune(offer: DeckDraftOffer): Rune {
  return {
    id: `${offer.id}-face`,
    runeType: offer.runeType,
    rarity: offer.displayRarity,
    castEffectRefs: [],
    passiveEffectRefs: [],
  };
}

function getPackText(runeType: RuneType): string {
  return `Contains 3 ${runeType} runes`;
}

export function DeckDraftingModal({
  draftState,
}: DeckDraftingModalProps) {
  const arcaneDustReward = 50; // placeholder
  const { fullDeck } = useGameplayDeckState();
  const totalDeckSize = fullDeck.length;
  const { selectDeckDraftOffer, startNextSoloGame } = useGameplayActions();
  const { openRuneZoneOverlay } = useUIActions();
  const playClickSound = useClickSound();
  const selectedOffer = draftState.selectedOffer;
  const hasSelectedPack = selectedOffer !== null;
  const deckCountValue = useMotionValue(totalDeckSize);
  const [displayedDeckCount, setDisplayedDeckCount] = useState(totalDeckSize);
  const deckCountAnimation = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    const unsubscribe = deckCountValue.on('change', (latest) => {
      setDisplayedDeckCount(Math.round(latest));
    });
    return () => {
      unsubscribe();
    };
  }, [deckCountValue]);

  useEffect(() => {
    deckCountAnimation.current?.stop();
    deckCountAnimation.current = animate(deckCountValue, totalDeckSize, {
      duration: 0.45,
      ease: 'easeOut',
    });
  }, [deckCountValue, totalDeckSize]);

  useEffect(() => {
    return () => {
      deckCountAnimation.current?.stop();
    };
  }, []);

  const packFaceRunes = useMemo(() => (
    new Map(draftState.offers.map((offer) => [offer.id, createPackFaceRune(offer)]))
  ), [draftState.offers]);

  const handleSelectPack = (offer: DeckDraftOffer) => {
    if (hasSelectedPack) {
      return;
    }
    playClickSound();
    selectDeckDraftOffer(offer.id);
  };

  const handleOpenDeckOverlay = () => {
    playClickSound();
    openRuneZoneOverlay('deck');
  };

  const handleStartNextGame = () => {
    playClickSound();
    startNextSoloGame();
  };

  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-[rgba(4,2,12,0.75)] backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl rounded-3xl border border-white/12 bg-[rgba(10,10,24,0.9)] p-6 shadow-[0_34px_80px_rgba(0,0,0,0.7)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300/80">victory</div>
            <h2 className="text-2xl font-bold text-white">
              {hasSelectedPack ? 'Pack opened' : 'Choose a rune pack'}
            </h2>
          </div>
          <div className="rounded-2xl border border-sky-400/40 bg-sky-900/30 px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <img src={arcaneDustIcon} alt="Arcane Dust" className="h-6 w-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]" />
              <div className="text-lg font-extrabold text-white">+{arcaneDustReward.toLocaleString()}</div>
            </div>
            <div className="sr-only">Arcane Dust Received</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {draftState.offers.map((offer) => {
            const isSelected = selectedOffer?.id === offer.id;
            const faceRune = packFaceRunes.get(offer.id);
            return (
              <motion.button
                type="button"
                key={offer.id}
                onClick={() => handleSelectPack(offer)}
                disabled={hasSelectedPack}
                whileHover={hasSelectedPack ? undefined : { scale: 1.03 }}
                whileFocus={hasSelectedPack ? undefined : { scale: 1.03 }}
                animate={{
                  opacity: hasSelectedPack && !isSelected ? 0.42 : 1,
                  boxShadow: isSelected
                    ? '0 0 48px rgba(235, 140, 255, 0.64), 0 0 120px rgba(235, 140, 255, 0.30)'
                    : '0 8px 24px rgba(0, 0, 0, 0.45)',
                }}
                className="min-h-[188px] rounded-2xl border border-white/12 bg-[#1c1034] p-4 text-center transition hover:border-fuchsia-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200 disabled:cursor-default"
              >
                <div className="flex flex-col items-center gap-3">
                  {faceRune && (
                    <RuneCell rune={faceRune} variant="draft" size="large" showEffect showTooltip={false} />
                  )}
                  <div className="text-sm font-bold text-white">{getPackText(offer.runeType)}</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {selectedOffer && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
              Added to deck
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {selectedOffer.runes.map((rune) => (
                <RuneCell
                  key={rune.id}
                  rune={rune}
                  variant="draft"
                  size="large"
                  showEffect
                  showTooltip
                  tooltipPlacement="top"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">Deck Size</div>
            <motion.div
              animate={{ scale: hasSelectedPack ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="text-base font-bold text-white"
            >
              {displayedDeckCount} runes
            </motion.div>
          </div>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleStartNextGame}
              className="w-full rounded-xl border border-emerald-300/60 bg-gradient-to-r from-emerald-500/85 to-cyan-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_12px_28px_rgba(16,185,129,0.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 sm:w-auto"
            >
              Next Game
            </button>
            <button
              type="button"
              onClick={handleOpenDeckOverlay}
              className="w-full rounded-xl border border-sky-400/40 bg-sky-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50 transition hover:border-sky-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 sm:w-auto"
            >
              View Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
