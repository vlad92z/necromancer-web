/**
 * GameBoard component - main game board displaying runeforges, center, player and opponent views
 */

import { useState, useEffect } from 'react';
import type { GameState, RuneType } from '../../../types/game';
import { RuneforgesAndCenter } from './RuneforgesAndCenter';
import { PlayerView } from './PlayerView';
import { OpponentView } from './OpponentView';
import { GameOverModal } from './GameOverModal';
import { SelectedRunesOverlay } from './SelectedRunesOverlay';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { GameLogOverlay } from './GameLogOverlay';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameplayStore } from '../../../state/stores/gameplayStore';

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { players, runeforges, centerPool, currentPlayerIndex, selectedRunes, turnPhase, voidEffectPending, frostEffectPending, frozenRuneforges, gameMode, shouldTriggerEndRound, scoringPhase } = gameState;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor, cancelSelection } = useGameActions();
  const returnToStartScreen = useGameplayStore((state) => state.returnToStartScreen);
  const destroyRune = useGameplayStore((state) => state.destroyRune);
  const freezeRuneforge = useGameplayStore((state) => state.freezeRuneforge);
  const endRound = useGameplayStore((state) => state.endRound);
  const processScoringStep = useGameplayStore((state) => state.processScoringStep);
  
  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [showDeckOverlay, setShowDeckOverlay] = useState(false);
  const [showLogOverlay, setShowLogOverlay] = useState(false);
  
  const isDraftPhase = turnPhase === 'draft';
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  const currentPlayer = players[currentPlayerIndex];
  const isAITurn = currentPlayer.type === 'ai';

  // Determine winner by highest remaining health
  const winner = isGameOver
    ? players[0].health > players[1].health
      ? players[0]
      : players[1].health > players[0].health
        ? players[1]
        : null
    : null;
  
  const handleRuneClick = (runeforgeId: string, runeType: RuneType) => {
    // Direct rune click always drafts that rune type
    draftRune(runeforgeId, runeType);
  };
  
  const handleCenterRuneClick = (runeType: RuneType) => {
    // Direct center rune click drafts that rune type from center
    draftFromCenter(runeType);
  };
  
  const handleRuneforgeClick = (runeforgeId: string) => {
    // Handle Frost effect - clicking runeforge freezes it
    if (frostEffectPending) {
      const runeforge = runeforges.find(f => f.id === runeforgeId);
      // Only allow freezing opponent runeforges with runes
      if (runeforge && runeforge.runes.length > 0 && runeforge.ownerId !== currentPlayer.id) {
        freezeRuneforge(runeforgeId);
      }
      return;
    }
  };

  const handleVoidRuneFromRuneforge = (runeforgeId: string, runeId: string) => {
    if (!voidEffectPending) {
      return;
    }

    destroyRune({ source: 'runeforge', runeforgeId, runeId });
  };

  const handleVoidRuneFromCenter = (runeId: string) => {
    if (!voidEffectPending) {
      return;
    }

    destroyRune({ source: 'center', runeId });
  };
  
  const handleBackgroundClick = () => {
    // Background click handler - no longer needed since PlayerBoard handles it
    // Keeping for potential future use with empty space clicks
  };

  // Handle end-of-round trigger
  useEffect(() => {
    if (shouldTriggerEndRound) {
      const timer = setTimeout(() => {
        endRound();
      }, 1000); // 1 second delay for visual effect
      
      return () => clearTimeout(timer);
    }
  }, [shouldTriggerEndRound, endRound]);

  // Handle scoring animation sequence
  useEffect(() => {
    if (!scoringPhase) return;

    let timer: ReturnType<typeof setTimeout>;

    if (scoringPhase === 'moving-to-wall') {
      // Wait 1.5 seconds, then process scoring step
      timer = setTimeout(() => {
        processScoringStep();
      }, 1500);
    } else if (scoringPhase === 'calculating-score') {
      // Wait 2 seconds, then process next step
      timer = setTimeout(() => {
        processScoringStep();
      }, 2000);
    } else if (scoringPhase === 'clearing-floor') {
      // Wait 1.5 seconds, then complete
      timer = setTimeout(() => {
        processScoringStep();
      }, 1500);
    } else if (scoringPhase === 'complete') {
      // Wait briefly, then process final step (start next round or game over)
      timer = setTimeout(() => {
        processScoringStep();
      }, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [scoringPhase, processScoringStep]);
  
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
                💀 Void Effect: Click a rune to destroy it! 💀
              </div>
            )}
            
            <RuneforgesAndCenter
              runeforges={runeforges}
              centerPool={centerPool}
              players={players}
              currentPlayerId={currentPlayer.id}
              onRuneClick={handleRuneClick}
              onCenterRuneClick={handleCenterRuneClick}
              onRuneforgeClick={handleRuneforgeClick}
              onVoidRuneforgeRuneSelect={handleVoidRuneFromRuneforge}
              onVoidCenterRuneSelect={handleVoidRuneFromCenter}
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
                isClassicMode={gameMode === 'classic'}
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
    </div>
  );
}
