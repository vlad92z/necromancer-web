/**
 * DeckOverlay component - displays player's remaining deck runes in a grid
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Rune, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { RuneTypeTotals } from './Center/RuneTypeTotals';

interface DeckOverlayProps {
  deck: Rune[];
  playerName: string;
  onClose: () => void;
}

export function DeckOverlay({ deck, playerName, onClose }: DeckOverlayProps) {
  // Group runes by type for organized display
  const runesByType = deck.reduce((acc, rune) => {
    if (!acc[rune.runeType]) {
      acc[rune.runeType] = [];
    }
    acc[rune.runeType].push(rune);
    return acc;
  }, {} as Record<RuneType, Rune[]>);

  const runeTypes: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
  const runeTypeCounts = runeTypes.reduce(
    (acc, runeType) => ({
      ...acc,
      [runeType]: runesByType[runeType]?.length ?? 0,
    }),
    {} as Record<RuneType, number>,
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(4, 2, 12, 0.78)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(6px)',
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(1100px, 92vw)',
            aspectRatio: '3 / 2',
            maxHeight: '88vh',
            background: 'radial-gradient(circle at 20% 20%, rgba(92, 40, 160, 0.22), transparent 40%), linear-gradient(145deg, rgba(20, 12, 38, 0.96), rgba(8, 4, 18, 0.94))',
            borderRadius: '28px',
            padding: '28px',
            boxShadow: '0 40px 140px rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(149, 117, 255, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            color: '#e8e5ff',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(212, 197, 255, 0.7)',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                Deck Overview
              </div>
              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#f5f3ff',
                  margin: 0,
                }}
              >
                {playerName}&apos;s Deck ({deck.length})
              </h2>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <RuneTypeTotals runeTypes={runeTypes} counts={runeTypeCounts} style={{ marginTop: 0 }} />
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #22d3ee 100%)',
                  color: '#0b0816',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Close
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Runes grid grouped by type */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {runeTypes.map((runeType, typeIndex) => {
                const runes = runesByType[runeType] || [];

                if (runes.length === 0) return null;

                return (
                  <motion.div
                    key={runeType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: typeIndex * 0.05 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(67, 31, 120, 0.5), rgba(21, 10, 46, 0.9))',
                      borderRadius: '14px',
                      padding: '12px',
                      border: '1px solid rgba(149, 117, 255, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 18px 50px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        padding: '0 2px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: '#ede9fe',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {runeType}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'rgba(221, 214, 254, 0.82)',
                        }}
                      >
                        ({runes.length})
                      </div>
                    </div>

                    {/* Runes grid (on the right) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
                        gap: '8px',
                        padding: '10px',
                        backgroundColor: 'rgba(7, 3, 18, 0.75)',
                        borderRadius: '10px',
                        flex: 1,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {runes.map((rune, index) => (
                        <motion.div
                          key={rune.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: typeIndex * 0.05 + index * 0.02,
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <RuneCell
                            rune={rune}
                            variant="runeforge"
                            size={'large'}
                            showEffect
                            showTooltip
                            tooltipPlacement="bottom"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty state */}
            {deck.length === 0 && (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: 'rgba(226, 232, 240, 0.75)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(148, 163, 184, 0.4)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  🎴
                </div>
                <p
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                  }}
                >
                  No runes remaining
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
