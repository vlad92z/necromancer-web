/** DeckDraftingModal - post-victory single-rune reward overlay for Solo mode. */

import type { DeckDraftOffer, DeckDraftState } from '../../../types/game';
import { useGameplayActions, useUIActions } from '../../../hooks/useGameActions';
import { useClickSound } from '../../../hooks/useClickSound';
import { getRuneEffectDescription } from '../../../utils/runeEffects';
import { CardView } from './Player/CardView';
import arcaneDustIcon from '../../../assets/stats/arcane_dust.png';

interface DeckDraftingModalProps {
  draftState: DeckDraftState;
}

export function DeckDraftingModal({ draftState }: DeckDraftingModalProps) {
  const { selectDeckDraftOffer, returnToMapAfterReward } = useGameplayActions();
  const { openRuneZoneOverlay } = useUIActions();
  const playClickSound = useClickSound();
  const selectedOffer = draftState.selectedOffer;

  const handleSelectOffer = (offer: DeckDraftOffer) => {
    playClickSound();
    selectDeckDraftOffer(offer.id);
  };

  return (
    <div className="pixel-modal-backdrop absolute inset-0 z-90 flex items-center justify-center px-4">
      <div className="pixel-modal w-full max-w-5xl p-2 font-pixel">
        <div className="pixel-modal__inner p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="pixel-section-title text-2xl">Loot</h2>
            <div className="pixel-game-stat px-4 py-3 text-left">
              <div className="flex items-center gap-2">
                <img src={arcaneDustIcon} alt="Arcane Dust" className="h-6 w-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]" />
                <div className="text-lg text-[#f2c14e]">+{draftState.arcaneDustReward.toLocaleString()}</div>
              </div>
              <div className="sr-only">Arcane Dust Received</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-6">
            {draftState.offers.map((offer) => {
              const { rune } = offer;
              return (
                <CardView
                  key={offer.id}
                  title={rune.name}
                  imageSrc={rune.cardImageSrc}
                  manaCost={rune.manaCost ?? 2}
                  description={getRuneEffectDescription(rune)}
                  runeTypes={rune.runeTypes}
                  isSelected={selectedOffer?.id === offer.id}
                  onClick={() => handleSelectOffer(offer)}
                />
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2 px-4 py-3 text-sm text-[#fff8d8] sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => { playClickSound(); openRuneZoneOverlay('deck'); }} className="pixel-game-button w-full px-4 py-3 text-xs tracking-[0.18em] sm:w-auto">
                View Deck
              </button>
            <div className="flex w-full justify-end gap-2 sm:w-auto">
              <button type="button" onClick={() => { playClickSound(); returnToMapAfterReward(); }} className="pixel-game-button w-full bg-[#e15f4f] px-4 py-3 text-xs tracking-[0.18em] text-[#fff8d8] sm:w-auto">
                Continue
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
