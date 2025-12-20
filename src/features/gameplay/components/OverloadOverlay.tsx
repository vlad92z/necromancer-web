/**
 * OverloadOverlay component - displays overloaded runes in a grid
 * Similar to DeckOverlay but shows runes that have been overloaded (placed on floor)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Rune, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { RuneTypeTotals } from './Center/RuneTypeTotals';
import { useSoloGameStore } from '../../../state/stores/soloGameStore';
import { useUIStore } from '../../../state/stores';

export function OverloadOverlay() {
  const overloadRunes = useSoloGameStore((state) => state.deck.overloadedRunes);
  const [hoveredRuneId, setHoveredRuneId] = useState<string | null>(null);
  // Group runes by type for ordering and totals
  const runesByType = overloadRunes.reduce((acc, rune) => {
    if (!acc[rune.runeType]) {
      acc[rune.runeType] = [];
    }
    acc[rune.runeType].push(rune);
    return acc;
  }, {} as Record<RuneType, Rune[]>);

  const runeTypes: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];

  const runeSize = overloadRunes.length > 140 ? 'small' : 'medium';

  const runeTypeCounts = runeTypes.reduce(
    (acc, runeType) => ({
      ...acc,
      [runeType]: runesByType[runeType]?.length ?? 0,
    }),
    {} as Record<RuneType, number>,
  );

  const totalRuneCount = overloadRunes.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={useUIStore.getState().closeOverloadOverlay}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(4,2,12,0.78)] px-6 py-6 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="flex aspect-[3/2] w-[min(1100px,92vw)] max-h-[88vh] flex-col overflow-hidden rounded-[28px] border border-[#ff5757]/35 bg-[radial-gradient(circle_at_20%_20%,rgba(160,40,40,0.22),transparent_40%),linear-gradient(145deg,rgba(38,12,20,0.96),rgba(18,4,8,0.94))] p-7 text-[#e8e5ff] shadow-[0_40px_140px_rgba(0,0,0,0.7)]"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex justify-between w-full">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Overload Overview</div>
                <h2 className="text-2xl font-extrabold text-[#f5f3ff]">Overloaded Runes ({totalRuneCount})</h2>
              </div>
              <button
                onClick={useUIStore.getState().closeOverloadOverlay}
                type="button"
                className="rounded-xl border border-white/20 bg-gradient-to-r from-red-500 via-pink-500 to-orange-400 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-900 shadow-[0_10px_25px_rgba(239,68,68,0.45)] transition hover:from-red-400 hover:via-pink-400 hover:to-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap justify-between w-full items-center gap-3">
              <RuneTypeTotals runeTypes={runeTypes} counts={runeTypeCounts}/>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1.5">
            {overloadRunes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="rounded-2xl border border-[#ff5757]/30 bg-[linear-gradient(135deg,rgba(120,31,31,0.35),rgba(46,10,21,0.92))] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
              >
                <div className="grid grid-cols-[repeat(auto-fill,_minmax(38px,_1fr))] gap-2.5">
                  {overloadRunes.map((rune, index) => {
                    const isHovered = hoveredRuneId === rune.id;

                    return (
                      <motion.div
                        key={`${rune.id}-${index}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: index * 0.015,
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <motion.div
                          className="relative flex h-full w-full items-center justify-center rounded-full"
                          style={{
                            cursor: 'default',
                            backgroundColor: 'rgba(30, 4, 9, 0.82)',
                            border: '1px solid transparent',
                            padding: '2px',
                            position: 'relative',
                            zIndex: isHovered ? 50 : 1,
                          }}
                          onMouseEnter={() => setHoveredRuneId(rune.id)}
                          onMouseLeave={() => setHoveredRuneId(null)}
                        >
                          <RuneCell
                            rune={rune}
                            variant="runeforge"
                            size={runeSize}
                            showEffect
                            showTooltip
                            runeOpacity={1}
                            tooltipPlacement="bottom"
                            clickable={false}
                          />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {overloadRunes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-400/50 bg-white/5 px-12 py-12 text-center text-slate-200">
                <div className="mb-3 text-5xl">⚡</div>
                <p className="text-lg font-extrabold">No overloaded runes yet</p>
                <p className="mt-2 text-sm text-slate-400">Runes placed on the floor will appear here</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
