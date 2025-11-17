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
  const isMobile = window.innerWidth < 768;

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
            maxWidth: isMobile ? '100%' : '600px',
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
            marginBottom: isMobile ? '16px' : '20px',
          }}>
            <div>
              <h2 style={{
                fontSize: isMobile ? '18px' : '24px',
                fontWeight: 'bold',
                color: '#0c4a6e',
                margin: 0,
              }}>
                Game Log
              </h2>
              <p style={{
                fontSize: isMobile ? '12px' : '14px',
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

          {/* Round History */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '16px' : '20px',
          }}>
            {roundHistory.length === 0 ? (
              <div style={{
                padding: isMobile ? '32px' : '48px',
                textAlign: 'center',
                color: '#94a3b8',
              }}>
                <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '16px' }}>
                  📜
                </div>
                <p style={{
                  fontSize: isMobile ? '16px' : '18px',
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
                    borderRadius: isMobile ? '8px' : '12px',
                    padding: isMobile ? '12px' : '16px',
                    border: '2px solid #cbd5e1',
                  }}
                >
                  {/* Round Number */}
                  <div style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#0c4a6e',
                    marginBottom: isMobile ? '8px' : '12px',
                  }}>
                    Round {round.round}
                  </div>

                  {/* Player Score */}
                  <div style={{
                    fontSize: isMobile ? '12px' : '14px',
                    color: '#1e293b',
                    marginBottom: isMobile ? '6px' : '8px',
                    fontFamily: 'monospace',
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>
                      {round.playerName}:
                    </span>{' '}
                    {round.playerSegments.map((seg, i) => (
                      <span key={i}>
                        {i > 0 && ' + '}
                        {seg.essence}×{seg.focus}
                      </span>
                    ))}
                    {round.playerSegments.length > 0 && ' = '}
                    <span style={{ fontWeight: 'bold' }}>{round.playerTotal}</span>
                  </div>

                  {/* Opponent Score */}
                  <div style={{
                    fontSize: isMobile ? '12px' : '14px',
                    color: '#1e293b',
                    fontFamily: 'monospace',
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                      {round.opponentName}:
                    </span>{' '}
                    {round.opponentSegments.map((seg, i) => (
                      <span key={i}>
                        {i > 0 && ' + '}
                        {seg.essence}×{seg.focus}
                      </span>
                    ))}
                    {round.opponentSegments.length > 0 && ' = '}
                    <span style={{ fontWeight: 'bold' }}>{round.opponentTotal}</span>
                  </div>

                  {/* Separator (not on last item) */}
                  {index < roundHistory.length - 1 && (
                    <div style={{
                      marginTop: isMobile ? '8px' : '12px',
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
