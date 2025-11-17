/**
 * FactoryOverlay component - displays a factory or center pool in an enlarged overlay for selection
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Rune, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface FactoryOverlayProps {
  runes: Rune[];
  sourceType: 'factory' | 'center';
  onSelectRune: (runeType: RuneType) => void;
  onClose: () => void;
}

export function FactoryOverlay({ runes, sourceType, onSelectRune, onClose }: FactoryOverlayProps) {
  const isMobile = window.innerWidth < 768;

  // Group runes by type for organized display
  const runesByType = runes.reduce((acc, rune) => {
    if (!acc[rune.runeType]) {
      acc[rune.runeType] = [];
    }
    acc[rune.runeType].push(rune);
    return acc;
  }, {} as Record<RuneType, Rune[]>);

  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Poison', 'Void', 'Wind'];
  const availableTypes = runeTypes.filter(type => runesByType[type]?.length > 0);

  const handleRuneTypeClick = (runeType: RuneType) => {
    onSelectRune(runeType);
    onClose();
  };

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
            maxWidth: isMobile ? '100%' : '500px',
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
                {sourceType === 'factory' ? 'Factory' : 'Center Pool'}
              </h2>
              <p style={{
                fontSize: isMobile ? '12px' : '14px',
                color: '#64748b',
                margin: '4px 0 0 0',
              }}>
                Select a rune type to draft
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

          {/* Runes grouped by type */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '12px' : '16px',
          }}>
            {availableTypes.map((runeType, typeIndex) => {
              const typeRunes = runesByType[runeType];
              
              return (
                <motion.button
                  key={runeType}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: typeIndex * 0.05 }}
                  onClick={() => handleRuneTypeClick(runeType)}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: isMobile ? '8px' : '12px',
                    padding: isMobile ? '12px' : '16px',
                    border: '3px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: isMobile ? '12px' : '16px',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.borderColor = '#0ea5e9';
                    e.currentTarget.style.backgroundColor = '#e0f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                >
                  {/* Sample rune (larger) */}
                  <div style={{ minWidth: isMobile ? '60px' : '80px' }}>
                    <RuneCell
                      rune={typeRunes[0]}
                      variant="factory"
                      size="large"
                      showEffect={false}
                    />
                  </div>

                  {/* Info and preview */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{
                      fontSize: isMobile ? '16px' : '20px',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: '4px',
                    }}>
                      {runeType}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '12px' : '14px',
                      color: '#64748b',
                      marginBottom: '8px',
                    }}>
                      {typeRunes.length} rune{typeRunes.length !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Preview of all runes of this type */}
                    <div style={{
                      display: 'flex',
                      gap: isMobile ? '4px' : '6px',
                      flexWrap: 'wrap',
                    }}>
                      {typeRunes.map((rune) => (
                        <div 
                          key={rune.id}
                          style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px' }}
                        >
                          <RuneCell
                            rune={rune}
                            variant="factory"
                            size="small"
                            showEffect={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div style={{
                    fontSize: isMobile ? '20px' : '24px',
                    color: '#64748b',
                  }}>
                    →
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Empty state */}
          {runes.length === 0 && (
            <div style={{
              padding: isMobile ? '32px' : '48px',
              textAlign: 'center',
              color: '#94a3b8',
            }}>
              <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '16px' }}>
                ∅
              </div>
              <p style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 'bold',
              }}>
                No runes available
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
