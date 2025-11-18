import { useEffect } from 'react'
import { GameBoard } from './features/gameplay/components/GameBoard'
import { StartGameScreen } from './features/gameplay/components/StartGameScreen'
import { useGameplayStore } from './state/stores/gameplayStore'
import { triggerAITurn, handleAIVoidEffect, handleAIFrostEffect } from './systems/aiController'

function App() {
  const gameState = useGameplayStore()
  const startGame = useGameplayStore((state) => state.startGame)

  // Trigger AI turn when it's AI's turn (with delay)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.type === 'ai' && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        triggerAITurn()
      }, 2000) // 2 second delay before AI starts
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.currentPlayerIndex, gameState.turnPhase, gameState.players])
  
  // Handle Void effect for AI (when AI's turn and voidEffectPending)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    // AI chooses runeforge when it's their turn AND Void effect is pending
    if (currentPlayer.type === 'ai' && gameState.voidEffectPending && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        handleAIVoidEffect(gameState)
      }, 1500) // 1.5 second delay for Void effect
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.voidEffectPending, gameState.currentPlayerIndex, gameState.players, gameState.turnPhase, gameState])
  
  // Handle Frost effect for AI (when AI's turn and frostEffectPending)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    // AI chooses runeforge when it's their turn AND Frost effect is pending
    if (currentPlayer.type === 'ai' && gameState.frostEffectPending && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        handleAIFrostEffect(gameState)
      }, 1500) // 1.5 second delay for Frost effect
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.frostEffectPending, gameState.currentPlayerIndex, gameState.players, gameState.turnPhase, gameState])

  // Show start screen if game hasn't started
  if (!gameState.gameStarted) {
    return <StartGameScreen onStartGame={startGame} />
  }

  return <GameBoard gameState={gameState} />
}

export default App
