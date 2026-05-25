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
  const { deck } = useGameplayDeckState();
  const { hand, discardPile } = useCombatZoneState();
  const { closeRuneZoneOverlay: onClose } = useUIActions();
  const playClickSound = useClickSound();
  const arcaneDust = useArcaneDust();
  const zoneCopy = ZONE_COPY[zone];
  const zoneRunes = zone === 'draw'
    ? deck
    : zone === 'discard'
      ? discardPile
      : [...deck, ...discardPile, ...hand];

  const runesByType = zoneRunes.reduce((acc, rune) => {
    if (!acc[rune.runeType]) {
      acc[rune.runeType] = [];
    }
    acc[rune.runeType].push(rune);
    return acc;
  }, {} as Record<RuneType, Rune[]>);

  const sortedRunes = RUNE_TYPES.flatMap((runeType) => {
    const runes = zoneRunes.filter((rune) => rune.runeType === runeType);
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
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(4,2,12,0.78)] px-6 py-6 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="flex aspect-[3/2] w-[min(1100px,92vw)] max-h-[88vh] flex-col overflow-hidden rounded-[28px] border border-[#9575ff]/35 bg-[radial-gradient(circle_at_20%_20%,rgba(92,40,160,0.22),transparent_40%),linear-gradient(145deg,rgba(20,12,38,0.96),rgba(8,4,18,0.94))] p-7 text-[#e8e5ff] shadow-[0_40px_140px_rgba(0,0,0,0.7)]"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex justify-between w-full">
              <div>                
              <h2 className="text-2xl font-extrabold text-[#f5f3ff]">{`${zoneCopy.title} (${totalRuneCount})`}</h2>
              </div>
              <button
                onClick={handleCloseButton}
                type="button"
                className="rounded-xl border border-white/20 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-900 shadow-[0_10px_25px_rgba(99,102,241,0.45)] transition hover:from-purple-400 hover:via-indigo-400 hover:to-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap justify-between w-full items-center gap-3" >
              <RuneTypeTotals runeTypes={RUNE_TYPES} counts={runeTypeCounts}/>
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-100/5 px-3 py-2 text-[13px] font-extrabold uppercase tracking-[0.18em] text-amber-100 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
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
                className="rounded-2xl border border-[#9575ff]/30 bg-[linear-gradient(135deg,rgba(67,31,120,0.35),rgba(21,10,46,0.92))] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
              >
                <div className="grid grid-cols-[repeat(auto-fill,_minmax(9rem,_1fr))] gap-4">
                  {sortedRunes.map((rune, index) => {
                    const card = runeCards[index];

                    if (!card) {
                      return null;
                    }

                    return (
                      <div key={rune.id} className="flex min-h-[13.5rem] items-center justify-center">
                        <CardView
                          title={card.title}
                          imageSrc={card.imageSrc}
                          description={card.description}
                          runeType={card.runeType}
                          runeRarity={card.runeRarity}
                          variant={card.variant}
                          size="hand"
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {sortedRunes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-400/50 bg-white/5 px-12 py-12 text-center text-slate-200">
                <p className="text-lg font-extrabold">{zoneCopy.emptyText}</p>
              </div>
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
