/**
 * GameBoard component - main game board displaying factories, center, and player boards
 */

import type { GameState } from '../../../types/game';
import { Factory } from './Factory';
import { PlayerBoard } from './PlayerBoard';
import { RuneToken } from '../../../components/RuneToken';
import { useGameActions } from '../../../hooks/useGameActions';

interface GameBoardProps {
  gameState: GameState;
  onNextGame?: () => void;
}

export function GameBoard({ gameState, onNextGame }: GameBoardProps) {
  const { players, factories, centerPool, currentPlayerIndex, selectedRunes, turnPhase } = gameState;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor, cancelSelection } = useGameActions();
  
  const isMobile = window.innerWidth < 768;
  console.log(`Rendering game in ${isMobile ? 'MOBILE' : 'DESKTOP'} mode (screen width: ${window.innerWidth}px)`);
  
  const isDraftPhase = turnPhase === 'draft';
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  const currentPlayer = players[currentPlayerIndex];
  const isAITurn = currentPlayer.type === 'ai';
  
  // Determine winner
  const winner = isGameOver
    ? players[0].score > players[1].score
      ? players[0]
      : players[1].score > players[0].score
        ? players[1]
        : null
    : null;
  
  const handleBackgroundClick = () => {
    // Background click handler - no longer needed since PlayerBoard handles it
    // Keeping for potential future use with empty space clicks
  };
  
  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#030712',
        color: 'white',
        padding: window.innerWidth < 768 ? '8px' : '24px'
      }}
      onClick={handleBackgroundClick}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Game Header */}
        <div style={{ marginBottom: window.innerWidth < 768 ? '12px' : '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: window.innerWidth < 768 ? '30px' : '30px', fontWeight: 'bold', marginBottom: '4px' }}>Masive Spell: Arcane Arena</h1>
          <div style={{ color: '#9ca3af', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>
            Round {gameState.round} | {players[currentPlayerIndex].name}'s Turn
          </div>
        </div>
        
        {/* Player 2 */} 
        <div style={{ marginBottom: window.innerWidth < 768 ? '16px' : '32px' }}>
          <PlayerBoard
            player={players[1]}
            isActive={currentPlayerIndex === 1}
            onPlaceRunes={currentPlayerIndex === 1 ? placeRunes : undefined}
            onPlaceRunesInFloor={currentPlayerIndex === 1 ? placeRunesInFloor : undefined}
            selectedRuneType={currentPlayerIndex === 1 ? selectedRuneType : null}
            canPlace={currentPlayerIndex === 1 && hasSelectedRunes}
            onCancelSelection={cancelSelection}
          />
        </div>
        
        {/* Factories and Center */}
        <div style={{ marginBottom: window.innerWidth < 768 ? '16px' : '32px' }}>
          <h2 style={{ fontSize: window.innerWidth < 768 ? '16px' : '20px', fontWeight: 'bold', marginBottom: window.innerWidth < 768 ? '8px' : '16px', textAlign: 'center' }}>Factories</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: window.innerWidth < 768 ? '12px' : '24px', marginBottom: window.innerWidth < 768 ? '12px' : '24px', maxWidth: '72rem', margin: window.innerWidth < 768 ? '0 auto 12px' : '0 auto 24px' }}>
            {factories.map((factory) => (
              <Factory 
                key={factory.id} 
                factory={factory}
                onDraftRune={draftRune}
                disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
              />
            ))}
          </div>
          
          {/* Center Pool */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: window.innerWidth < 768 ? '8px' : '12px',
              padding: window.innerWidth < 768 ? '12px' : '16px',
              minWidth: window.innerWidth < 768 ? '160px' : '200px',
              minHeight: window.innerWidth < 768 ? '100px' : '120px',
              width: window.innerWidth < 768 ? '100%' : 'auto'
            }}>
              <h3 style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px', textAlign: 'center' }}>
                Center Pool
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {centerPool.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Empty</div>
                ) : (
                  centerPool.map((rune) => (
                    <button
                      key={rune.id}
                      onClick={() => draftFromCenter(rune.runeType)}
                      disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
                      style={{
                        outline: 'none',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '8px',
                        cursor: (!isDraftPhase || hasSelectedRunes || isAITurn) ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        padding: 0
                      }}
                      onMouseEnter={(e) => !(!isDraftPhase || hasSelectedRunes || isAITurn) && (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      aria-label={`Select ${rune.runeType} runes from center`}
                    >
                      <RuneToken rune={rune} size="small" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Selected Runes Display */}
        {hasSelectedRunes && (
          <div style={{ marginBottom: window.innerWidth < 768 ? '16px' : '32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: 'rgba(30, 58, 138, 0.3)',
              border: '2px solid #3b82f6',
              borderRadius: window.innerWidth < 768 ? '8px' : '12px',
              padding: window.innerWidth < 768 ? '12px' : '16px',
              maxWidth: '36rem',
              width: window.innerWidth < 768 ? '100%' : 'auto'
            }}>
              <h3 style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px', fontWeight: '600', color: '#93c5fd', marginBottom: '8px', textAlign: 'center' }}>
                Selected Runes ({selectedRunes.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {selectedRunes.map((rune) => (
                  <RuneToken key={rune.id} rune={rune} size="small" />
                ))}
              </div>
              <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px', color: '#d1d5db' }}>
                Click a pattern line to place these runes
              </div>
            </div>
          </div>
        )}
        
        {/* Player 1 */}
        <div>
          <PlayerBoard
            player={players[0]}
            isActive={currentPlayerIndex === 0}
            onPlaceRunes={currentPlayerIndex === 0 ? placeRunes : undefined}
            onPlaceRunesInFloor={currentPlayerIndex === 0 ? placeRunesInFloor : undefined}
            selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
            canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
            onCancelSelection={cancelSelection}
          />
        </div>
      </div>
      
      {/* Game Over Modal */}
      {isGameOver && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#111827', border: '4px solid #eab308', borderRadius: '16px', padding: '32px', maxWidth: '28rem', width: '100%', margin: '0 16px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#eab308', marginBottom: '24px' }}>
              {winner ? 'Victory!' : 'Draw!'}
            </h2>
            
            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {winner ? `${winner.name} Wins!` : "It's a Tie!"}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{players[0].name}</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{players[0].score}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{players[1].name}</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171' }}>{players[1].score}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onNextGame}
              style={{
                backgroundColor: '#eab308',
                color: '#111827',
                fontWeight: 'bold',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '18px',
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ca8a04'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eab308'}
            >
              Next Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
