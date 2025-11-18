/**
 * GameBoard component - main game board displaying runeforges, center, player and opponent views
 */

import { useState } from 'react';
import type { GameState, RuneType } from '../../../types/game';
import { RuneforgesAndCenter } from './RuneforgesAndCenter';
import { PlayerView } from './PlayerView';
import { OpponentView } from './OpponentView';
import { GameOverModal } from './GameOverModal';
import { SelectedRunesOverlay } from './SelectedRunesOverlay';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { RuneforgeOverlay } from './RuneforgeOverlay';
import { GameLogOverlay } from './GameLogOverlay';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameStore } from '../../../state/gameStore';

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { players, runeforges, centerPool, currentPlayerIndex, selectedRunes, turnPhase, voidEffectPending, frostEffectPending, frozenRuneforges, gameMode } = gameState;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor, cancelSelection } = useGameActions();
  const returnToStartScreen = useGameStore((state) => state.returnToStartScreen);
  const destroyRuneforge = useGameStore((state) => state.destroyRuneforge);
  const freezeRuneforge = useGameStore((state) => state.freezeRuneforge);
  
  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [showDeckOverlay, setShowDeckOverlay] = useState(false);
  const [showLogOverlay, setShowLogOverlay] = useState(false);
  const [showRuneforgeOverlay, setShowRuneforgeOverlay] = useState(false);
  const [selectedRuneforgeId, setSelectedRuneforgeId] = useState<string | null>(null);
  const [runeforgeOverlaySource, setRuneforgeOverlaySource] = useState<'runeforge' | 'center'>('runeforge');
  
  const isDraftPhase = turnPhase === 'draft';
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  const currentPlayer = players[currentPlayerIndex];
  const isAITurn = currentPlayer.type === 'ai';

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
  
  const handleRuneforgeClick = (runeforgeId: string) => {
    // Handle Void effect - clicking runeforge destroys it
    if (voidEffectPending) {
      const runeforge = runeforges.find(f => f.id === runeforgeId);
      // Only allow clicking non-empty runeforges during Void effect
      if (runeforge && runeforge.runes.length > 0) {
        destroyRuneforge(runeforgeId);
      }
      return;
    }
    
    // Handle Frost effect - clicking runeforge freezes it
    if (frostEffectPending) {
      const runeforge = runeforges.find(f => f.id === runeforgeId);
      // Only allow clicking non-empty runeforges during Frost effect
      if (runeforge && runeforge.runes.length > 0) {
        freezeRuneforge(runeforgeId);
      }
      return;
    }
    
    // Normal draft behavior
    const runeforge = runeforges.find(f => f.id === runeforgeId);
    if (!runeforge || runeforge.runes.length === 0) return;
    
    // Check if all runes are the same type
    const uniqueTypes = new Set(runeforge.runes.map(r => r.runeType));
    if (uniqueTypes.size === 1) {
      // Auto-select if only one type
      const runeType = runeforge.runes[0].runeType;
      draftRune(runeforgeId, runeType);
    } else {
      // Show overlay for multiple types
      setSelectedRuneforgeId(runeforgeId);
      setRuneforgeOverlaySource('runeforge');
      setShowRuneforgeOverlay(true);
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
      setSelectedRuneforgeId(null);
      setRuneforgeOverlaySource('center');
      setShowRuneforgeOverlay(true);
    }
  };
  
  const handleRuneforgeOverlaySelect = (runeType: RuneType) => {
    if (runeforgeOverlaySource === 'runeforge' && selectedRuneforgeId) {
      draftRune(selectedRuneforgeId, runeType);
    } else if (runeforgeOverlaySource === 'center') {
      draftFromCenter(runeType);
    }
    setShowRuneforgeOverlay(false);
  };
  
  const handleRuneforgeOverlayClose = () => {
    setShowRuneforgeOverlay(false);
    setSelectedRuneforgeId(null);
  };
  
  const handleBackgroundClick = () => {
    // Background click handler - no longer needed since PlayerBoard handles it
    // Keeping for potential future use with empty space clicks
  };
  
  return (
    <div 
      style={{
        height: '100vh',
        backgroundColor: '#f0f9ff',
        color: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onClick={handleBackgroundClick}
    >

      {/* Three Equal Sections Container */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Opponent View - Top 33% */}
        <div style={{ 
          height: '33.33%', 
          padding: '16px',
          borderBottom: '2px solid #cbd5e1',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '1200px' }}>
            <OpponentView
              opponent={players[1]}
              player={players[0]}
              isActive={currentPlayerIndex === 1}
              gameMode={gameMode}
            />
          </div>
        </div>

        {/* Drafting Table (Runeforges and Center) - Middle 33% */}
        <div style={{ 
          height: '33.33%', 
          padding: '16px',
          borderBottom: '2px solid #cbd5e1',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ width: '100%', maxWidth: '1200px' }}>
            {/* Void Effect Message */}
            {voidEffectPending && !isAITurn && (
              <div style={{
                textAlign: 'center',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#7c3aed',
                color: 'white',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(124, 58, 237, 0.3)',
                animation: 'pulse 2s infinite'
              }}>
                💀 Void Effect: Click a runeforge to destroy it! 💀
              </div>
            )}
            
            {/* Frost Effect Message */}
            {frostEffectPending && !isAITurn && (
              <div style={{
                textAlign: 'center',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#06b6d4',
                color: 'white',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(6, 182, 212, 0.3)',
                animation: 'pulse 2s infinite'
              }}>
                ❄️ Frost Effect: Click a runeforge to freeze it! ❄️
              </div>
            )}
            
            <RuneforgesAndCenter
              runeforges={runeforges}
              centerPool={centerPool}
              onRuneforgeClick={handleRuneforgeClick}
              onCenterClick={handleCenterClick}
              isDraftPhase={isDraftPhase}
              hasSelectedRunes={hasSelectedRunes}
              isAITurn={isAITurn}
              voidEffectPending={voidEffectPending}
              frostEffectPending={frostEffectPending}
              frozenRuneforges={frozenRuneforges}
            />
            
            {/* Selected Runes Display - Overlay */}
            {hasSelectedRunes && (
              <SelectedRunesOverlay
                selectedRunes={selectedRunes}
                onCancel={cancelSelection}
              />
            )}
            
            {/* Game Over Modal - Centered over drafting area */}
            {isGameOver && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 100,
                width: 'auto'
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

        {/* Player View - Bottom 33% */}
        <div style={{ 
          height: '33.33%', 
          padding: '16px',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '1200px' }}>
            <PlayerView
              player={players[0]}
              opponent={players[1]}
              isActive={currentPlayerIndex === 0}
              onPlaceRunes={currentPlayerIndex === 0 ? placeRunes : undefined}
              onPlaceRunesInFloor={currentPlayerIndex === 0 ? placeRunesInFloor : undefined}
              selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
              canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
              onCancelSelection={cancelSelection}
              gameMode={gameMode}
              onShowDeck={() => setShowDeckOverlay(true)}
              onShowLog={() => setShowLogOverlay(true)}
              onShowRules={() => setShowRulesOverlay(true)}
            />
          </div>
        </div>
      </div>
      
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
      
      {/* Runeforge Overlay */}
      {showRuneforgeOverlay && (
        <RuneforgeOverlay
          runes={
            runeforgeOverlaySource === 'runeforge' && selectedRuneforgeId
              ? runeforges.find(f => f.id === selectedRuneforgeId)?.runes || []
              : centerPool
          }
          onSelectRune={handleRuneforgeOverlaySelect}
          onClose={handleRuneforgeOverlayClose}
          gameMode={gameMode}
        />
      )}
    </div>
  );
}
