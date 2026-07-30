/**
 * RuneZoneOverlay component - displays runes from a combat zone as cards.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Rune, RuneType } from '../../../types/game';
import type { RuneZoneOverlay as RuneZoneOverlayType } from '../../../state/stores/uiStore';
import { RuneTypeTotals } from './Center/RuneTypeTotals';
import { useUIActions } from '../../../hooks/useGameActions';
import { useClickSound } from '../../../hooks/useClickSound';
import { useArcaneDust, useCombatZoneState, useGameplayDeckState } from '../../../hooks/useGameState';
import { compareRunesByRarityThenId } from '../../../utils/runeRarity';
import { buildRuneTooltipCards } from '../../../utils/tooltipCards';
import { CardView } from './Player/CardView';
import arcaneDustIcon from '../../../assets/stats/arcane_dust.png';

interface RuneZoneOverlayProps {
  zone: RuneZoneOverlayType;
}

const RUNE_TYPES: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];

const ZONE_COPY: Record<RuneZoneOverlayType, { title: string; emptyText: string }> = {
  draw: {
    title: 'Draw',
    emptyText: 'No runes in draw deck',
  },
  discard: {
    title: 'Discard',
    emptyText: 'No discarded runes',
  },
  deck: {
    title: 'Deck',
    emptyText: 'No runes in deck',
  },
};

export function RuneZoneOverlay({ zone }: RuneZoneOverlayProps) {
  const { deck, fullDeck, isDrafting } = useGameplayDeckState();
  const { hand, discardPile } = useCombatZoneState();
  const { closeRuneZoneOverlay: onClose } = useUIActions();
  const playClickSound = useClickSound();
  const arcaneDust = useArcaneDust();
  const zoneCopy = ZONE_COPY[zone];
  const zoneRunes = zone === 'draw'
    ? deck
    : zone === 'discard'
      ? discardPile
      : isDrafting
        ? fullDeck
        : [...deck, ...discardPile, ...hand];

  const runesByType = zoneRunes.reduce((acc, rune) => {
    rune.runeTypes.forEach((runeType) => {
      acc[runeType] ??= [];
      acc[runeType].push(rune);
    });
    return acc;
  }, {} as Record<RuneType, Rune[]>);

  const sortedRunes = RUNE_TYPES.flatMap((runeType) => {
    const runes = zoneRunes.filter((rune) => rune.runeTypes[0] === runeType);
    return [...runes].sort(compareRunesByRarityThenId);
  });
  const runeCards = buildRuneTooltipCards(sortedRunes);
  const runeTypeCounts = RUNE_TYPES.reduce(
    (acc, runeType) => ({
      ...acc,
      [runeType]: runesByType[runeType]?.length ?? 0,
    }),
    {} as Record<RuneType, number>,
  );

  const totalRuneCount = zoneRunes.length;
  const handleCloseButton = () => {
    playClickSound();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="pixel-modal-backdrop fixed inset-0 z-1000 flex items-center justify-center px-6 py-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="pixel-modal flex aspect-3/2 w-[min(1100px,92vw)] max-h-[88vh] flex-col overflow-hidden p-2 font-pixel"
        >
          <div className="pixel-modal__inner flex min-h-0 flex-1 flex-col p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex justify-between w-full">
              <div>                
              <h2 className="pixel-section-title text-2xl">{`${zoneCopy.title} (${totalRuneCount})`}</h2>
              </div>
              <button
                onClick={handleCloseButton}
                type="button"
                className="pixel-game-button px-4 py-2 text-xs tracking-[0.12em]"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap justify-between w-full items-center gap-3" >
              <RuneTypeTotals runeTypes={RUNE_TYPES} counts={runeTypeCounts}/>
              <div className="pixel-game-stat inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#f2c14e]">
                <img src={arcaneDustIcon} alt="Arcane Dust" className="h-7 w-7" />
                <div className="flex items-baseline gap-2">
                  <span className="text-lg text-amber-200">{arcaneDust.toLocaleString()}</span>
                </div>
              
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1.5">
            {sortedRunes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
              >
                <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-1">
                  {sortedRunes.map((rune, index) => {
                    const card = runeCards[index];

                    if (!card) {
                      return null;
                    }

                    return (
                      <div key={rune.id} className="flex h-54 items-center justify-center">
                        <CardView
                          title={card.title}
                          imageSrc={card.imageSrc}
                          description={card.description}
                          runeTypes={card.runeTypes}
                          variant={card.variant}
                          size="compact"
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {sortedRunes.length === 0 && (
              <div className="pixel-game-panel-inset border-dashed px-12 py-12 text-center text-[#b5d3bd]">
                <p className="text-sm uppercase">{zoneCopy.emptyText}</p>
              </div>
            )}
          </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
