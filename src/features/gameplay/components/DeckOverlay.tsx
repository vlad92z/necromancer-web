/**
 * DeckOverlay component - displays player's remaining deck runes in a grid
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Rune, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface DeckOverlayProps {
  deck: Rune[];
  playerName: string;
  onClose: () => void;
}

export function DeckOverlay({ deck, playerName, onClose }: DeckOverlayProps) {
  const isMobile = window.innerWidth < 768;

  // Group runes by type for organized display
  const runesByType = deck.reduce((acc, rune) => {
    if (!acc[rune.runeType]) {
      acc[rune.runeType] = [];
    }
    acc[rune.runeType].push(rune);
    return acc;
  }, {} as Record<RuneType, Rune[]>);

  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Poison', 'Void', 'Wind'];

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
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: isMobile ? '16px' : '24px',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '20px' : '32px',
            maxWidth: isMobile ? '100%' : '700px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            width: '100%',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '12px' : '16px',
          }}>
            <div>
              <h2 style={{
                fontSize: isMobile ? '18px' : '24px',
                fontWeight: 'bold',
                color: '#0c4a6e',
                margin: 0,
              }}>
                {playerName}'s Deck ({deck.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '6px' : '8px',
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              ✕
            </button>
          </div>

          {/* Runes grid grouped by type */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '10px' : '12px',
          }}>
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
                    backgroundColor: '#f8fafc',
                    borderRadius: isMobile ? '6px' : '8px',
                    padding: isMobile ? '8px' : '10px',
                    border: '2px solid #cbd5e1',
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    alignItems: 'start',
                  }}
                >
                  {/* Type header (on the left) */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    minWidth: isMobile ? '60px' : '80px',
                  }}>
                    <RuneCell
                      rune={runes[0]}
                      variant="factory"
                      size={isMobile ? 'small' : 'medium'}
                      showEffect={false}
                    />
                    <div style={{
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      textAlign: 'center',
                    }}>
                      {runeType}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '11px' : '12px',
                      color: '#64748b',
                      textAlign: 'center',
                    }}>
                      ({runes.length})
                    </div>
                  </div>

                  {/* Runes grid (on the right) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile 
                      ? 'repeat(auto-fill, minmax(40px, 1fr))' 
                      : 'repeat(auto-fill, minmax(60px, 1fr))',
                    gap: isMobile ? '4px' : '6px',
                    padding: isMobile ? '6px' : '8px',
                    backgroundColor: 'white',
                    borderRadius: isMobile ? '4px' : '6px',
                    flex: 1,
                  }}>
                    {runes.map((rune, index) => (
                      <motion.div
                        key={rune.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          delay: typeIndex * 0.05 + index * 0.02,
                          type: 'spring',
                          stiffness: 300,
                          damping: 20
                        }}
                      >
                        <RuneCell
                          rune={rune}
                          variant="factory"
                          size={isMobile ? 'small' : 'large'}
                          showEffect={true}
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
            <div style={{
              padding: isMobile ? '32px' : '48px',
              textAlign: 'center',
              color: '#94a3b8',
            }}>
              <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '16px' }}>
                🎴
              </div>
              <p style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 'bold',
              }}>
                No runes remaining
              </p>
            </div>
          )}

          {/* Footer info */}
          <div style={{
            marginTop: isMobile ? '12px' : '16px',
            padding: isMobile ? '8px' : '12px',
            backgroundColor: '#eff6ff',
            borderRadius: isMobile ? '6px' : '8px',
            border: '2px solid #bfdbfe',
          }}>
            <p style={{
              fontSize: isMobile ? '11px' : '13px',
              color: '#1e40af',
              margin: 0,
              lineHeight: 1.4,
            }}>
              💡 Runes are drawn from your deck to fill the factories each round. 
              The game ends when you don't have enough runes left to fill all factories.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
