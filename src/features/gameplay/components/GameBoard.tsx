/**
 * GameBoard component - main game board displaying factories, center, player and opponent views
 */

import { useState, useEffect } from 'react';
import type { GameState, RuneType } from '../../../types/game';
import { FactoriesAndCenter } from './FactoriesAndCenter';
import { PlayerView } from './PlayerView';
import { OpponentView } from './OpponentView';
import { GameOverModal } from './GameOverModal';
import { SelectedRunesOverlay } from './SelectedRunesOverlay';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { FactoryOverlay } from './FactoryOverlay';
import { GameLogOverlay } from './GameLogOverlay';
import { VoidEffectOverlay } from './VoidEffectOverlay';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameStore } from '../../../state/gameStore';

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { players, factories, centerPool, currentPlayerIndex, selectedRunes, turnPhase, voidEffectPending } = gameState;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor, cancelSelection } = useGameActions();
  const returnToStartScreen = useGameStore((state) => state.returnToStartScreen);
  const destroyFactory = useGameStore((state) => state.destroyFactory);
  const skipVoidEffect = useGameStore((state) => state.skipVoidEffect);
  
  const [showOpponentOverlay, setShowOpponentOverlay] = useState(false);
  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [showDeckOverlay, setShowDeckOverlay] = useState(false);
  const [showLogOverlay, setShowLogOverlay] = useState(false);
  const [showFactoryOverlay, setShowFactoryOverlay] = useState(false);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string | null>(null);
  const [factoryOverlaySource, setFactoryOverlaySource] = useState<'factory' | 'center'>('factory');
  const isMobile = window.innerWidth < 768;
  console.log(`Rendering game in ${isMobile ? 'MOBILE' : 'DESKTOP'} mode (screen width: ${window.innerWidth}px)`);
  
  const isDraftPhase = turnPhase === 'draft';
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  const currentPlayer = players[currentPlayerIndex];
  const isAITurn = currentPlayer.type === 'ai';
  
  // Auto-show opponent overlay on mobile during AI turn (with delay)
  useEffect(() => {
    if (isMobile && isAITurn) {
      const delayTimer = setTimeout(() => {
        setShowOpponentOverlay(true);
      }, 2000); // 2 second delay before showing overlay
      
      return () => clearTimeout(delayTimer);
    } else if (isMobile && !isAITurn) {
      // Auto-hide when player's turn starts (with delay)
      const hideTimer = setTimeout(() => {
        setShowOpponentOverlay(false);
      }, 2000); // 2 second delay before hiding overlay
      
      return () => clearTimeout(hideTimer);
    }
  }, [isMobile, isAITurn]);
  
  // Determine winner (lowest damage taken wins)
  // players[0].score = damage dealt by player (taken by opponent)
  // players[1].score = damage dealt by opponent (taken by player)
  // So player wins if players[1].score < players[0].score (they took less damage)
  const winner = isGameOver
    ? players[1].score < players[0].score
      ? players[0]
      : players[0].score < players[1].score
        ? players[1]
        : null
    : null;
  
  const handleFactoryClick = (factoryId: string) => {
    const factory = factories.find(f => f.id === factoryId);
    if (!factory || factory.runes.length === 0) return;
    
    // Check if all runes are the same type
    const uniqueTypes = new Set(factory.runes.map(r => r.runeType));
    if (uniqueTypes.size === 1) {
      // Auto-select if only one type
      const runeType = factory.runes[0].runeType;
      draftRune(factoryId, runeType);
    } else {
      // Show overlay for multiple types
      setSelectedFactoryId(factoryId);
      setFactoryOverlaySource('factory');
      setShowFactoryOverlay(true);
    }
  };
  
  const handleCenterClick = () => {
    if (centerPool.length === 0) return;
    
    // Check if all runes are the same type
    const uniqueTypes = new Set(centerPool.map(r => r.runeType));
    if (uniqueTypes.size === 1) {
      // Auto-select if only one type
      const runeType = centerPool[0].runeType;
      draftFromCenter(runeType);
    } else {
      // Show overlay for multiple types
      setSelectedFactoryId(null);
      setFactoryOverlaySource('center');
      setShowFactoryOverlay(true);
    }
  };
  
  const handleFactoryOverlaySelect = (runeType: RuneType) => {
    if (factoryOverlaySource === 'factory' && selectedFactoryId) {
      draftRune(selectedFactoryId, runeType);
    } else if (factoryOverlaySource === 'center') {
      draftFromCenter(runeType);
    }
    setShowFactoryOverlay(false);
  };
  
  const handleFactoryOverlayClose = () => {
    setShowFactoryOverlay(false);
    setSelectedFactoryId(null);
  };
  
  const handleBackgroundClick = () => {
    // Background click handler - no longer needed since PlayerBoard handles it
    // Keeping for potential future use with empty space clicks
  };
  
  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f9ff',
        color: '#1e293b',
        padding: window.innerWidth < 768 ? '8px' : '24px'
      }}
      onClick={handleBackgroundClick}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Game Header */}
        <div style={{ marginBottom: window.innerWidth < 768 ? '6px' : '24px', textAlign: 'center', position: 'relative' }}>
          <h1 style={{ fontSize: window.innerWidth < 768 ? '15px' : '30px', fontWeight: 'bold', marginBottom: '4px', color: '#0c4a6e' }}>Massive Spell: Arcane Arena</h1>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b', fontSize: window.innerWidth < 768 ? '10px' : '14px' }}>
            <div>Round {gameState.round} | {players[currentPlayerIndex].name}'s Turn</div>
          </div>
          
          {/* Top Right Buttons */}
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            display: 'flex',
            gap: isMobile ? '4px' : '8px'
          }}>
            {/* Deck Button */}
            <button
              onClick={() => setShowDeckOverlay(true)}
              style={{
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '6px' : '8px',
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {isMobile ? '🎴' : '🎴 Deck'}
            </button>
            
            {/* Log Button */}
            <button
              onClick={() => setShowLogOverlay(true)}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '6px' : '8px',
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {isMobile ? '📜' : '📜 Log'}
            </button>
            
            {/* Rules Button */}
            <button
              onClick={() => setShowRulesOverlay(true)}
              style={{
                backgroundColor: '#0369a1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: isMobile ? '6px 10px' : '8px 14px',
                fontSize: isMobile ? '10px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
            >
              ❓ Rules
            </button>
            
            {/* View Opponent Button (Mobile Only) */}
            {isMobile && currentPlayerIndex === 0 && (
              <button
                onClick={() => setShowOpponentOverlay(true)}
                style={{
                  backgroundColor: '#7c2d12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a3412'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c2d12'}
              >
                👁️ Opponent
              </button>
            )}
          </div>
        </div>
        
        {/* Player Boards - Side by side on desktop, stacked on mobile */}
        {isMobile ? (
          <>
            {/* Player (Human) - Mobile */}
            <PlayerView
              player={players[0]}
              opponent={players[1]}
              isActive={currentPlayerIndex === 0}
              onPlaceRunes={currentPlayerIndex === 0 ? placeRunes : undefined}
              onPlaceRunesInFloor={currentPlayerIndex === 0 ? placeRunesInFloor : undefined}
              selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
              canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
              onCancelSelection={cancelSelection}
            />
          </>
        ) : (
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            {/* Player (Human) - Desktop Left */}
            <div style={{ flex: 1 }}>
              <PlayerView
                player={players[0]}
                opponent={players[1]}
                isActive={currentPlayerIndex === 0}
                onPlaceRunes={currentPlayerIndex === 0 ? placeRunes : undefined}
                onPlaceRunesInFloor={currentPlayerIndex === 0 ? placeRunesInFloor : undefined}
                selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
                canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
                onCancelSelection={cancelSelection}
              />
            </div>
            
            {/* Opponent (AI) - Desktop Right */}
            <div style={{ flex: 1 }}>
              <OpponentView
                opponent={players[1]}
                player={players[0]}
                isActive={currentPlayerIndex === 1}
              />
            </div>
          </div>
        )}
        
        {/* Factories and Center */}
        <div style={{ position: 'relative' }}>
          <FactoriesAndCenter
            factories={factories}
            centerPool={centerPool}
            onFactoryClick={handleFactoryClick}
            onCenterClick={handleCenterClick}
            isDraftPhase={isDraftPhase}
            hasSelectedRunes={hasSelectedRunes}
            isAITurn={isAITurn}
          />
          
          {/* Selected Runes Display - Overlay */}
          {hasSelectedRunes && (
            <SelectedRunesOverlay
              selectedRunes={selectedRunes}
              onCancel={cancelSelection}
            />
          )}
          
          {/* Game Over Modal - Centered over factories */}
          {isGameOver && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              width: isMobile ? '90%' : 'auto'
            }}>
              <GameOverModal
                players={players}
                winner={winner}
                onReturnToStart={returnToStartScreen}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Opponent Overlay (Mobile Only) */}
      {isMobile && showOpponentOverlay && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'flex-start',
            zIndex: 100,
            padding: '8px',
            overflowY: 'auto'
          }}
          onClick={() => setShowOpponentOverlay(false)}
        >
          <div style={{ width: '100%', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                onClick={() => setShowOpponentOverlay(false)}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                ✕ Close
              </button>
            </div>
            
            {/* Opponent Board */}
            <OpponentView
              opponent={players[1]}
              player={players[0]}
              isActive={currentPlayerIndex === 1}
            />
          </div>
        </div>
      )}
      
      {/* Rules Overlay */}
      {showRulesOverlay && (
        <RulesOverlay onClose={() => setShowRulesOverlay(false)} />
      )}
      
      {/* Deck Overlay */}
      {showDeckOverlay && (
        <DeckOverlay
          deck={players[0].deck}
          playerName={players[0].name}
          onClose={() => setShowDeckOverlay(false)}
        />
      )}
      
      {/* Log Overlay */}
      {showLogOverlay && (
        <GameLogOverlay
          roundHistory={gameState.roundHistory}
          onClose={() => setShowLogOverlay(false)}
        />
      )}
      
      {/* Factory Overlay */}
      {showFactoryOverlay && (
        <FactoryOverlay
          runes={
            factoryOverlaySource === 'factory' && selectedFactoryId
              ? factories.find(f => f.id === selectedFactoryId)?.runes || []
              : centerPool
          }
          sourceType={factoryOverlaySource}
          onSelectRune={handleFactoryOverlaySelect}
          onClose={handleFactoryOverlayClose}
        />
      )}
      
      {/* Void Effect Overlay - shows when Void effect is pending (current player chooses factory) */}
      {voidEffectPending && (
        <VoidEffectOverlay
          factories={factories}
          onSelectFactory={destroyFactory}
          onSkip={skipVoidEffect}
          isVisible={!isAITurn} // Only show UI for human player
        />
      )}
    </div>
  );
}
