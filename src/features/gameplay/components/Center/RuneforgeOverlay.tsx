/**
 * RuneforgeOverlay component - displays a runeforge or center pool in an enlarged overlay for selection
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Rune, RuneType } from '../../../../types/game';
import { RuneCell } from '../../../../components/RuneCell';

interface RuneforgeOverlayProps {
  runes: Rune[];
  onSelectRune: (runeType: RuneType) => void;
  onClose: () => void;
}

export function RuneforgeOverlay({ runes, onSelectRune, onClose }: RuneforgeOverlayProps) {
  // Rune effect descriptions TODO: these are outdated
  const getRuneDescription = (runeType: RuneType): string => {
    const descriptions: Record<RuneType, string> = {
      Fire: 'Fire',
      Frost: 'Frost',
      Life: 'Life',
      Void: 'Void',
      Wind: 'Wind',
      Lightning: 'Lightning',
    };
    return descriptions[runeType];
  };

  // Group runes by type for organized display
  const runesByType = runes.reduce<Record<RuneType, Rune[]>>((acc, rune) => {
    if (!acc[rune.runeType]) {
      acc[rune.runeType] = [];
    }
    acc[rune.runeType].push(rune);
    return acc;
  }, { Fire: [], Frost: [], Life: [], Void: [], Wind: [], Lightning: [] });

  const runeTypes: RuneType[] = ['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning'];
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
            maxWidth: '460px', // slightly narrower
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
          </div>

          {/* Runes grouped by type */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
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
                    borderRadius: '12px',
                    padding: '16px',
                    border: '3px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '16px',
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

                  {/* Info and preview */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: '4px',
                    }}>
                      {runeType} ({typeRunes.length})
                    </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginBottom: '8px',
                      }}>
                        {getRuneDescription(runeType)}
                      </div>
                    
                    
                    {/* Preview of all runes of this type */}
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      {typeRunes.map((rune) => (
                        <div 
                          key={rune.id}
                          style={{ width: '60px', height: '60px' }}
                        >
                          <RuneCell
                            rune={rune}
                            variant="runeforge"
                            size="large"
                            showEffect
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Empty state */}
          {runes.length === 0 && (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              color: '#94a3b8',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                ∅
              </div>
              <p style={{
                fontSize: '18px',
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
