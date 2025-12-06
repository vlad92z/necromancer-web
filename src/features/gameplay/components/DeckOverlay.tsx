/**
 * DeckOverlay component - displays player's remaining deck runes in a grid
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Rune, RuneEffectRarity, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { RuneTypeTotals } from './Center/RuneTypeTotals';
import { getRuneRarity } from '../../../utils/runeEffects';
import { useArcaneDustSound } from '../../../hooks/useArcaneDustSound';
import arcaneDustIcon from '../../../assets/stats/arcane_dust.png';

interface DeckOverlayProps {
  deck: Rune[];
  fullDeck?: Rune[];
  playerName: string;
  onClose: () => void;
  isDeckDrafting?: boolean;
  onDisenchantRune?: (runeId: string) => number | void;
}

export function DeckOverlay({ deck, fullDeck, playerName, onClose, isDeckDrafting = false, onDisenchantRune }: DeckOverlayProps) {
  const playArcaneDustSound = useArcaneDustSound();
  const completeDeck = fullDeck && fullDeck.length > 0 ? fullDeck : deck;
  const deckForTotals = isDeckDrafting ? completeDeck : deck;
  // Group runes by type for ordering and totals
  const runesByType = deckForTotals.reduce((acc, rune) => {
    if (!acc[rune.runeType]) {
      acc[rune.runeType] = [];
    }
    acc[rune.runeType].push(rune);
    return acc;
  }, {} as Record<RuneType, Rune[]>);

  const runeTypes: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
  const remainingRuneIds = new Set(deck.map((rune) => rune.id));
  const sortedRunes = runeTypes.flatMap((runeType) => {
    const runes = completeDeck.filter((rune) => rune.runeType === runeType);
    const ordered = [...runes].sort((a, b) => {
      const aHasEffects = a.effects.length > 0;
      const bHasEffects = b.effects.length > 0;
      if (aHasEffects !== bHasEffects) {
        return aHasEffects ? -1 : 1;
      }
      return a.id.localeCompare(b.id);
    });
    return ordered.map((rune) => ({
      rune,
      isDrafted: !remainingRuneIds.has(rune.id),
    }));
  });
  const runeSize = sortedRunes.length > 140 ? 'small' : 'medium';
  const runeTypeCounts = runeTypes.reduce(
    (acc, runeType) => ({
      ...acc,
      [runeType]: runesByType[runeType]?.length ?? 0,
    }),
    {} as Record<RuneType, number>,
  );

  const totalRuneCount = deckForTotals.length;
  const rarityDustReward: Record<RuneEffectRarity, number> = {
    uncommon: 1,
    rare: 5,
    epic: 25,
  };

  const shouldDimDrafted = !isDeckDrafting;

  const handleDisenchant = (rune: Rune) => {
    if (!isDeckDrafting || !onDisenchantRune) {
      return;
    }

    const rarity = getRuneRarity(rune.effects);
    const dustReward = rarity ? rarityDustReward[rarity] ?? 0 : 0;
    const awardedDust = onDisenchantRune(rune.id);

    if (typeof awardedDust === 'number' ? awardedDust > 0 : dustReward > 0) {
      playArcaneDustSound();
    }
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
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Deck Overview</div>
              <h2 className="text-2xl font-extrabold text-[#f5f3ff]">{playerName}&apos;s Deck ({totalRuneCount})</h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <RuneTypeTotals runeTypes={runeTypes} counts={runeTypeCounts} className="mt-0" />
              <button
                onClick={onClose}
                type="button"
                className="rounded-xl border border-white/20 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-900 shadow-[0_10px_25px_rgba(99,102,241,0.45)] transition hover:from-purple-400 hover:via-indigo-400 hover:to-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                Close
              </button>
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
                <div className="grid grid-cols-[repeat(auto-fill,_minmax(38px,_1fr))] gap-2.5">
                  {sortedRunes.map(({ rune, isDrafted }, index) => (
                    <motion.div
                      key={rune.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: index * 0.015,
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <div className="relative">
                        {isDeckDrafting && (
                          <button
                            type="button"
                            onClick={() => handleDisenchant(rune)}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center rounded-full border border-amber-200/70 bg-[rgba(24,16,6)] p-1 shadow-[0_10px_20px_rgba(0,0,0)] transition hover:brightness-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-amber-200"
                            title="Disenchant rune for Arcane Dust"
                          >
                            <img src={arcaneDustIcon} alt="Disenchant rune" className="h-4 w-4" />
                          </button>
                        )}
                        <RuneCell
                          rune={rune}
                          variant="runeforge"
                          size={runeSize}
                          showEffect
                          showTooltip
                          runeOpacity={shouldDimDrafted && isDrafted ? 0.25 : 1}
                          tooltipPlacement="bottom"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {sortedRunes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-400/50 bg-white/5 px-12 py-12 text-center text-slate-200">
                <div className="mb-3 text-5xl">🎴</div>
                <p className="text-lg font-extrabold">No runes remaining</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
