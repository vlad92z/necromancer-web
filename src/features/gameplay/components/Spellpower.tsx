/**
 * Spellpower component - displays essence, focus, and spellpower stats
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SpellpowerProps {
  essence: number;
  focus: number;
  totalPower: number;
  fireRuneCount: number;
  hasPenalty: boolean;
  hasLifeHealing: boolean;
  lifeRuneCount: number;
  healingAmount: number;
  hasWindMitigation: boolean;
  windRuneCount: number;
  onShowDeck: () => void;
  onShowLog: () => void;
  onShowRules: () => void;
}

export function Spellpower({
  essence,
  focus,
  totalPower,
  fireRuneCount,
  hasPenalty,
  hasLifeHealing,
  lifeRuneCount,
  healingAmount,
  hasWindMitigation,
  windRuneCount,
  onShowDeck,
  onShowLog,
  onShowRules,
}: SpellpowerProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <>
      {/* RuneScore Stats */}
      <div style={{
        backgroundColor: 'rgba(191, 219, 254, 0.3)',
        border: '2px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Top Right Buttons */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '6px'
        }}>
          {/* Deck Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowDeck();
            }}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {'🎴 Deck'}
          </button>
          
          {/* Log Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowLog();
            }}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {'📜 Log'}
          </button>
          
          {/* Rules Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowRules();
            }}
            style={{
              backgroundColor: '#0369a1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {'❓ Rules'}
          </button>
        </div>
        {/* Formula Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Essence */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <motion.div
              key={essence}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#eab308',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {essence}
              {fireRuneCount > 0 && (
                <span style={{ color: '#FF4500', fontSize: '14px' }} title={`+${fireRuneCount} from Fire runes`}>
                  🔥
                </span>
              )}
            </motion.div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Essence
            </div>
          </div>

          {/* Multiplication Sign */}
          <div style={{
            fontSize: '24px',
            color: '#64748b',
            fontWeight: 'bold',
            marginTop: '-16px'
          }}>
            ×
          </div>

          {/* Focus */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}>
            <motion.div
              key={focus}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: hasPenalty ? '#dc2626' : '#04d1ffff',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {focus}
              {hasWindMitigation && (
                <span style={{ color: '#87CEEB', fontSize: '14px' }} title={`${windRuneCount} Wind rune${windRuneCount > 1 ? 's' : ''} mitigating floor penalties`}>
                  💨
                </span>
              )}
            </motion.div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Focus
            </div>
          </div>

          {/* Equals Sign */}
          <div style={{
            fontSize: '24px',
            color: '#64748b',
            fontWeight: 'bold',
            marginTop: '-16px'
          }}>
            =
          </div>

          {/* Spellpower */}
          <motion.div
            key={totalPower}
            initial={{ scale: 1.5, color: '#dc2626' }}
            animate={{ scale: 1, color: '#000000ff' }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#000000ff',
              marginTop: '-16px'
            }}
          >
            {totalPower}
          </motion.div>

          {/* Help Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowExplanation(true);
            }}
            style={{
              marginTop: '-16px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '2px solid #0c4a6e',
              backgroundColor: '#ffffff',
              color: '#0c4a6e',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            ?
          </button>
        </div>
      </div>

      {/* Explanation Popup */}
      {showExplanation && (
        <div
          onClick={() => setShowExplanation(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '24px',
              color: '#0c4a6e',
              fontWeight: 'bold'
            }}>
              Spellpower
            </h2>
            
            <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#1e293b' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#eab308' }}>Essence:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  The number of active runes on your Spell Wall. Each Fire rune 🔥 adds +1 bonus Essence.
                </p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#0c4a6e' }}>Focus:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  The size of the largest connected rune segment on your Spell Wall. Overload reduces your Focus. Wind runes 💨 in your floor line cancel out other penalties.
                </p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#0c4a6e' }}>Spellpower (Essence × Focus):</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Your total damage potential for the round.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowExplanation(false)}
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                backgroundColor: '#0c4a6e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
