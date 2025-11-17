/**
 * RunePower component - displays player stats and projected power calculation
 */

import { useState } from 'react';
import type { Player } from '../../../types/game';
import { calculateProjectedPower } from '../../../utils/scoring';

interface RunePowerProps {
  player: Player;
  damageTaken: number;
  nameColor: string;
}

export function RunePower({ player, damageTaken, nameColor }: RunePowerProps) {
  const isMobile = window.innerWidth < 768;
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Find completed pattern lines
  const completedPatternLines = player.patternLines
    .map((line, index) => ({ line, row: index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null)
    .map(({ line, row }) => ({ row, runeType: line.runeType! }));
  
  const floorPenaltyCount = player.floorLine.runes.length;
  
  const { essence, focus, totalPower } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount
  );
  const hasPenalty = floorPenaltyCount > 0;
  
  // Count Fire runes: current wall + completed pattern lines
  const fireRunesOnWall = player.wall.flat().filter(cell => cell.runeType === 'Fire').length;
  const fireRunesInCompletedLines = completedPatternLines.filter(line => line.runeType === 'Fire').length;
  const fireRuneCount = fireRunesOnWall + fireRunesInCompletedLines;
  
  return (
    <>
      <div style={{
        display: 'flex',
        gap: isMobile ? '6px' : '12px',
        marginBottom: isMobile ? '4px' : '8px'
      }}>
      {/* Player Info Box */}
      <div style={{
        flex: '0 0 33%',
        backgroundColor: 'rgba(191, 219, 254, 0.3)',
        border: '2px solid rgba(59, 130, 246, 0.5)',
        borderRadius: isMobile ? '6px' : '8px',
        padding: isMobile ? '6px 8px' : '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}>
        <div style={{
          fontSize: isMobile ? '12px' : '18px',
          color: '#0c4a6e',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '4px' : '8px'
        }}>
          <span style={{ color: nameColor }}>
            {player.name}
          </span>
          <span style={{ color: '#ea580c' }}>❤️ {300 - damageTaken}</span>
        </div>
      </div>

      {/* Power Stats Box */}
      <div style={{
        flex: '0 0 66%',
        backgroundColor: 'rgba(191, 219, 254, 0.3)',
        border: '2px solid rgba(59, 130, 246, 0.5)',
        borderRadius: isMobile ? '6px' : '8px',
        padding: isMobile ? '6px 8px' : '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: isMobile ? '12px' : '18px',
          color: '#0c4a6e',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '4px' : '8px',
          flex: 1,
          justifyContent: 'flex-end'
        }}>
          {essence > 0 ? (
            <>
              <span>
                Essence: <span style={{ color: '#eab308' }}>{essence}</span>
                {fireRuneCount > 0 && (
                  <span style={{ color: '#FF4500', fontSize: isMobile ? '10px' : '14px', marginLeft: '2px' }} title={`+${fireRuneCount} from Fire runes`}>
                    🔥
                  </span>
                )}
              </span>
              <span>|</span>
              <span style={{ color: hasPenalty ? '#dc2626' : '#0c4a6e' }}>Focus: {focus}</span>
              <span>|</span>
              <span>Spellpower: {totalPower}</span>
            </>
          ) : (
            <>
              <span>Essence: <span style={{ color: '#eab308' }}>0</span></span>
              <span>|</span>
              <span>Focus: 0</span>
              <span>|</span>
              <span>Spellpower: 0</span>
            </>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowExplanation(true);
          }}
          style={{
            marginLeft: isMobile ? '4px' : '8px',
            width: isMobile ? '20px' : '24px',
            height: isMobile ? '20px' : '24px',
            borderRadius: '50%',
            border: '2px solid #0c4a6e',
            backgroundColor: '#ffffff',
            color: '#0c4a6e',
            fontSize: isMobile ? '10px' : '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0
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
            padding: isMobile ? '20px' : '32px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: isMobile ? '18px' : '24px',
            color: '#0c4a6e',
            fontWeight: 'bold'
          }}>
            Spellpower
          </h2>
          
          <div style={{ fontSize: isMobile ? '14px' : '16px', lineHeight: '1.6', color: '#1e293b' }}>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#eab308' }}>Essence:</strong>
              <p style={{ margin: '4px 0 0 0' }}>
                The number of active runes on your Spell Wall. Each Fire rune 🔥 adds +1 bonus Essence.
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#0c4a6e' }}>Focus:</strong>
              <p style={{ margin: '4px 0 0 0' }}>
                The size of the largest connected rune segment on your Spell Wall. Overload reduces your Focus.
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
              padding: isMobile ? '8px 16px' : '10px 24px',
              backgroundColor: '#0c4a6e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '14px' : '16px',
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
