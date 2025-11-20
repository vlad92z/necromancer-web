import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameBoard } from '../features/gameplay/components/GameBoard'
import { StartGameScreen } from '../features/gameplay/components/StartGameScreen'
import { useGameplayStore, setNavigationCallback } from '../state/stores/gameplayStore'
import { executeAITurn, needsAIPlacement, executeAIVoidEffect, executeAIFrostEffect } from '../systems/aiController'

export function GameMatch() {
  const navigate = useNavigate()
  const gameState = useGameplayStore()
  const startGame = useGameplayStore((state) => state.startGame)

  // Set up navigation callback for returnToStartScreen
  useEffect(() => {
    setNavigationCallback(() => navigate('/'))
    
    return () => {
      // Cleanup: remove navigation callback when leaving route
      setNavigationCallback(null)
      // Note: We don't reset game state here to avoid issues with React StrictMode
      // and to preserve state when navigating between routes
    }
  }, [navigate])

  // Trigger AI turn when it's AI's turn (draft phase)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.type === 'ai' && 
        gameState.turnPhase === 'draft' &&
        gameState.selectedRunes.length === 0 &&
        !gameState.voidEffectPending &&
        !gameState.frostEffectPending) {
      const delayTimer = setTimeout(() => {
        executeAITurn()
      }, 2000) // 2 second delay before AI starts
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.currentPlayerIndex, gameState.turnPhase, gameState.players, gameState.selectedRunes.length, gameState.voidEffectPending, gameState.frostEffectPending])
  
  // Handle AI placement after drafting
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    if (needsAIPlacement()) {
      const delayTimer = setTimeout(() => {
        executeAITurn()
      }, 2000) // 2 second delay before AI places runes
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.currentPlayerIndex, gameState.players, gameState.selectedRunes.length, gameState.turnPhase])
  
  // Handle Void effect for AI (when AI's turn and voidEffectPending)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.type === 'ai' && gameState.voidEffectPending && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        executeAIVoidEffect()
      }, 1500) // 1.5 second delay for Void effect
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.voidEffectPending, gameState.currentPlayerIndex, gameState.players, gameState.turnPhase])
  
  // Handle Frost effect for AI (when AI's turn and frostEffectPending)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.type === 'ai' && gameState.frostEffectPending && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        executeAIFrostEffect()
      }, 1500) // 1.5 second delay for Frost effect
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.frostEffectPending, gameState.currentPlayerIndex, gameState.players, gameState.turnPhase])

  const handleStartGame = (gameMode: 'classic' | 'standard') => {
    startGame(gameMode)
  }

  // Show start screen if game hasn't started
  if (!gameState.gameStarted) {
    return <StartGameScreen onStartGame={handleStartGame} />
  }

  return <GameBoard gameState={gameState} />
}
