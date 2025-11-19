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

const BOARD_BASE_SIZE = 1200;
const BOARD_PADDING = 80;
const MIN_BOARD_SCALE = 0.55;
const MIN_AVAILABLE_SIZE = 520;

const computeBoardScale = (width: number, height: number): number => {
  const shortestSide = Math.min(width, height);
  const available = Math.max(shortestSide - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const rawScale = available / BOARD_BASE_SIZE;
  const clamped = Math.min(rawScale, 1);
  return Math.max(clamped, MIN_BOARD_SCALE);
};

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { players, runeforges, centerPool, currentPlayerIndex, selectedRunes, turnPhase, voidEffectPending, frostEffectPending, frozenPatternLines, gameMode, shouldTriggerEndRound, scoringPhase } = gameState;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor, cancelSelection } = useGameActions();
  const returnToStartScreen = useGameplayStore((state) => state.returnToStartScreen);
  const destroyRune = useGameplayStore((state) => state.destroyRune);
  const freezePatternLine = useGameplayStore((state) => state.freezePatternLine);
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
  
  const opponent = players[1];
  const playerFrozenLines = frozenPatternLines[players[0].id] ?? [];
  const opponentFrozenLines = frozenPatternLines[opponent.id] ?? [];
  const canFreezeOpponentPatternLine = frostEffectPending && currentPlayerIndex === 0;

  const handleFreezePatternLine = (lineIndex: number) => {
    if (!canFreezeOpponentPatternLine) {
      return;
    }

    freezePatternLine(opponent.id, lineIndex);
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
  
  const [boardScale, setBoardScale] = useState(() => {
    if (typeof window === 'undefined') {
      return 1;
    }
    return computeBoardScale(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      setBoardScale(computeBoardScale(window.innerWidth, window.innerHeight));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const borderColor = 'rgba(255, 255, 255, 0.12)';
  const sectionPadding = 24;
  const scaledBoardSize = BOARD_BASE_SIZE * boardScale;
  
  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(circle at top, #2b184f 0%, #0c041c 65%, #05010d 100%)',
        color: '#f5f3ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box'
      }}
      onClick={handleBackgroundClick}
    >
      <div style={{ width: `${scaledBoardSize}px`, height: `${scaledBoardSize}px`, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${BOARD_BASE_SIZE}px`,
            height: `${BOARD_BASE_SIZE}px`,
            transform: `scale(${boardScale})`,
            transformOrigin: 'top left',
            background: 'rgba(9, 3, 24, 0.85)',
            borderRadius: '36px',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 40px 120px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(14px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Opponent View - Top */}
        <div style={{ 
          flex: 1, 
          padding: `${sectionPadding}px`,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <OpponentView
              opponent={players[1]}
              isActive={currentPlayerIndex === 1}
              gameMode={gameMode}
              frozenPatternLines={opponentFrozenLines}
              freezeSelectionEnabled={canFreezeOpponentPatternLine}
              onFreezePatternLine={canFreezeOpponentPatternLine ? handleFreezePatternLine : undefined}
            />
          </div>
        </div>

        {/* Drafting Table (Runeforges and Center) - Middle */}
        <div style={{ 
          flex: 1, 
          padding: `${sectionPadding}px`,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <RuneforgesAndCenter
              runeforges={runeforges}
              centerPool={centerPool}
              players={players}
              currentPlayerId={currentPlayer.id}
              onRuneClick={handleRuneClick}
              onCenterRuneClick={handleCenterRuneClick}
              onVoidRuneforgeRuneSelect={handleVoidRuneFromRuneforge}
              onVoidCenterRuneSelect={handleVoidRuneFromCenter}
              isDraftPhase={isDraftPhase}
              hasSelectedRunes={hasSelectedRunes}
              isAITurn={isAITurn}
              voidEffectPending={voidEffectPending}
              frostEffectPending={frostEffectPending}
            />
            
            {/* Selected Runes Display - Overlay */}
            {hasSelectedRunes && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SelectedRunesOverlay
                  selectedRunes={selectedRunes}
                  onCancel={cancelSelection}
                  isClassicMode={gameMode === 'classic'}
                />
              </div>
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

        {/* Player View - Bottom */}
        <div style={{ 
          flex: 1, 
          padding: `${sectionPadding}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayerView
              player={players[0]}
              isActive={currentPlayerIndex === 0}
              onPlaceRunes={currentPlayerIndex === 0 ? placeRunes : undefined}
              onPlaceRunesInFloor={currentPlayerIndex === 0 ? placeRunesInFloor : undefined}
              selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
              canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
              onCancelSelection={cancelSelection}
              gameMode={gameMode}
              frozenPatternLines={playerFrozenLines}
              onShowDeck={() => setShowDeckOverlay(true)}
              onShowLog={() => setShowLogOverlay(true)}
              onShowRules={() => setShowRulesOverlay(true)}
            />
          </div>
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
