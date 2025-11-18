/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player, RuneType } from '../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { FloorLine } from './FloorLine';
import { calculateProjectedPower, calculateEffectiveFloorPenalty } from '../../../utils/scoring';

interface PlayerBoardProps {
  player: Player;
  opponent: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  gameMode: 'classic' | 'standard';
}

export function PlayerBoard({ player, opponent, isActive, onPlaceRunes, onPlaceRunesInFloor, selectedRuneType, canPlace, onCancelSelection, gameMode}: PlayerBoardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };

  // Find completed pattern lines
  const completedPatternLines = player.patternLines
    .map((line, index) => ({ line, row: index }))
    .filter(({ line }) => line.count === line.tier && line.runeType !== null)
    .map(({ line, row }) => ({ row, runeType: line.runeType! }));
  
  // Wind Effect: Calculate effective floor penalty count (only in standard mode)
  const floorPenaltyCount = calculateEffectiveFloorPenalty(player.floorLine.runes, gameMode);
  const windRuneCount = player.floorLine.runes.filter(rune => rune.runeType === 'Wind').length;
  const hasWindMitigation = gameMode === 'standard' && windRuneCount > 0;
  
  // Count opponent's Poison runes (affects this player's Focus, only in standard mode)
  const opponentPoisonCount = gameMode === 'standard' 
    ? opponent.wall.flat().filter(cell => cell.runeType === 'Poison').length 
    : 0;
  
  const { essence, focus, totalPower } = calculateProjectedPower(
    player.wall,
    completedPatternLines,
    floorPenaltyCount,
    opponentPoisonCount,
    gameMode
  );
  const hasPenalty = floorPenaltyCount > 0;
  const hasPoisonEffect = opponentPoisonCount > 0;
  
  // Count Fire runes: current wall + completed pattern lines (only in standard mode)
  const fireRunesOnWall = gameMode === 'standard' 
    ? player.wall.flat().filter(cell => cell.runeType === 'Fire').length 
    : 0;
  const fireRunesInCompletedLines = gameMode === 'standard'
    ? completedPatternLines.filter(line => line.runeType === 'Fire').length
    : 0;
  const fireRuneCount = fireRunesOnWall + fireRunesInCompletedLines;

  return (
    <>
    <div
      onClick={handleBoardClick}
      style={{
        padding: '16px',
        borderRadius: '8px',
        border: isActive ? '2px solid rgba(59, 130, 246, 0.5)' : '2px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', justifyContent: 'space-between', width: '100%' }}>
        {/* Pattern Lines */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <PatternLines 
            patternLines={player.patternLines}
            wall={player.wall}
            onPlaceRunes={onPlaceRunes}
            selectedRuneType={selectedRuneType}
            canPlace={canPlace}
          />
        </div>
        
        {/* Wall */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoringWall wall={player.wall} patternLines={player.patternLines} />
        </div>
        
        {/* RuneScore - Right side */}
        <div style={{ 
          flex: '0 0 240px',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: 'rgba(191, 219, 254, 0.3)',
          border: '2px solid rgba(59, 130, 246, 0.5)',
          borderRadius: '8px',
        }}>
          <div style={{
            fontSize: '16px',
            color: '#0c4a6e',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%'
          }}>
            {essence > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Essence:</span>
                  <motion.span
                    key={essence}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {essence}
                    {fireRuneCount > 0 && (
                      <span style={{ color: '#FF4500', fontSize: '12px' }} title={`+${fireRuneCount} from Fire runes`}>
                        🔥
                      </span>
                    )}
                  </motion.span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Focus:</span>
                  <motion.span
                    key={focus}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ 
                      color: hasPenalty || hasPoisonEffect ? '#dc2626' : '#0c4a6e',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {focus}
                    {hasPoisonEffect && (
                      <span style={{ color: '#32CD32', fontSize: '12px' }} title={`-${opponentPoisonCount} from opponent Poison runes`}>
                        ☠️
                      </span>
                    )}
                    {hasWindMitigation && (
                      <span style={{ color: '#87CEEB', fontSize: '12px' }} title={`${windRuneCount} Wind rune${windRuneCount > 1 ? 's' : ''} mitigating floor penalties`}>
                        💨
                      </span>
                    )}
                  </motion.span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <span>Spellpower:</span>
                  <motion.span
                    key={totalPower}
                    initial={{ scale: 1.5, color: '#dc2626' }}
                    animate={{ scale: 1, color: '#7c3aed' }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                    style={{ color: '#7c3aed', fontSize: '20px' }}
                  >
                    {totalPower}
                  </motion.span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Essence:</span>
                  <span style={{ color: '#eab308' }}>0</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Focus:</span>
                  <span>0</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <span>Spellpower:</span>
                  <span style={{ fontSize: '20px' }}>0</span>
                </div>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExplanation(true);
              }}
              style={{
                marginTop: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid #0c4a6e',
                backgroundColor: '#ffffff',
                color: '#0c4a6e',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                alignSelf: 'center'
              }}
            >
              ?
            </button>
          </div>
        </div>
      </div>
      
      {/* Floor Line */}
      <FloorLine 
        floorLine={player.floorLine}
        onPlaceRunesInFloor={onPlaceRunesInFloor}
        canPlace={canPlace}
      />
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
                The size of the largest connected rune segment on your Spell Wall. Overload reduces your Focus. Opponent Poison runes ☠️ also reduce your Focus. Wind runes 💨 in your floor line cancel out other penalties.
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
