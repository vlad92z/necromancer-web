/**
 * GameLogOverlay component - displays history of previous rounds
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { RoundScore } from '../../../types/game';

interface GameLogOverlayProps {
  roundHistory: RoundScore[];
  onClose: () => void;
}

export function GameLogOverlay({ roundHistory, onClose }: GameLogOverlayProps) {
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
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '540px',
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
            marginBottom: '20px',
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#0c4a6e',
                margin: 0,
              }}>
                Game Log
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '4px 0 0 0',
              }}>
                Round-by-round scoring history
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              ✕
            </button>
          </div>

          {/* Round History */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {roundHistory.length === 0 ? (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                color: '#94a3b8',
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                  📜
                </div>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}>
                  No rounds completed yet
                </p>
              </div>
            ) : (
              roundHistory.map((round, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '2px solid #cbd5e1',
                  }}
                >
                  {/* Round Number */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#0c4a6e',
                    marginBottom: '12px',
                  }}>
                    Round {round.round}
                  </div>

                  {/* Player Score */}
                  <div style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    marginBottom: '8px',
                    fontFamily: 'monospace',
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>
                      {round.playerName}:
                    </span>{' '}
                    {round.playerEssence > 0 ? (
                      <>
                        {round.playerEssence}×{round.playerFocus} = {' '}
                        <span style={{ fontWeight: 'bold' }}>{round.playerTotal}</span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 'bold' }}>0</span>
                    )}
                  </div>

                  {/* Opponent Score */}
                  <div style={{
                    fontSize: '14px',
                    color: '#1e293b',
                    fontFamily: 'monospace',
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                      {round.opponentName}:
                    </span>{' '}
                    {round.opponentEssence > 0 ? (
                      <>
                        {round.opponentEssence}×{round.opponentFocus} = {' '}
                        <span style={{ fontWeight: 'bold' }}>{round.opponentTotal}</span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 'bold' }}>0</span>
                    )}
                  </div>

                  {/* Separator (not on last item) */}
                  {index < roundHistory.length - 1 && (
                    <div style={{
                      marginTop: '12px',
                      borderBottom: '1px dashed #cbd5e1',
                    }} />
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
