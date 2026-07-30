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
    runeTypes: [offer.runeType],
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
    <div className="pixel-modal-backdrop absolute inset-0 z-90 flex items-center justify-center px-4">
      <div className="pixel-modal w-full max-w-5xl p-2 font-pixel">
        <div className="pixel-modal__inner p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#f2c14e]">victory</div>
            <h2 className="pixel-section-title text-2xl">
              {hasSelectedPack ? 'Pack opened' : 'Choose a rune pack'}
            </h2>
          </div>
          <div className="pixel-game-stat px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <img src={arcaneDustIcon} alt="Arcane Dust" className="h-6 w-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]" />
              <div className="text-lg text-[#f2c14e]">+{arcaneDustReward.toLocaleString()}</div>
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
                className="pixel-game-button min-h-[188px] p-4 text-center disabled:cursor-default"
              >
                <div className="flex flex-col items-center gap-3">
                  {faceRune && (
                    <RuneCell rune={faceRune} variant="draft" size="large" showEffect showTooltip={false} />
                  )}
                  <div className="text-xs text-[#171518]">{getPackText(offer.runeType)}</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {selectedOffer && (
          <div className="pixel-game-panel-inset mt-6 px-4 py-4">
            <div className="mb-3 text-xs uppercase tracking-[0.18em] text-[#f2c14e]">
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

        <div className="pixel-game-panel-inset mt-5 flex flex-col gap-2 px-4 py-3 text-sm text-[#fff8d8] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#b5d3bd]">Deck Size</div>
            <motion.div
              animate={{ scale: hasSelectedPack ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="text-sm text-[#fff8d8]"
            >
              {displayedDeckCount} runes
            </motion.div>
          </div>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleStartNextGame}
              className="pixel-game-button w-full bg-[#e15f4f] px-4 py-3 text-xs tracking-[0.18em] text-[#fff8d8] sm:w-auto"
            >
              Next Game
            </button>
            <button
              type="button"
              onClick={handleOpenDeckOverlay}
              className="pixel-game-button w-full px-4 py-3 text-xs tracking-[0.18em] sm:w-auto"
            >
              View Deck
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
