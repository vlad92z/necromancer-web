import { useEffect } from 'react'
import { GameBoard } from './features/gameplay/components/GameBoard'
import { StartGameScreen } from './features/gameplay/components/StartGameScreen'
import { useGameStore } from './state/gameStore'
import { chooseFactoryToDestroy } from './utils/aiPlayer'

function App() {
  const gameState = useGameStore()
  const startGame = useGameStore((state) => state.startGame)
  const triggerAITurn = useGameStore((state) => state.triggerAITurn)
  const destroyFactory = useGameStore((state) => state.destroyFactory)
  const skipVoidEffect = useGameStore((state) => state.skipVoidEffect)

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
  }, [gameState.gameStarted, gameState.currentPlayerIndex, gameState.turnPhase, gameState.players, triggerAITurn])
  
  // Handle Void effect for AI (when AI's turn and voidEffectPending)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    // AI chooses factory when it's their turn AND Void effect is pending
    if (currentPlayer.type === 'ai' && gameState.voidEffectPending && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        const factoryToDestroy = chooseFactoryToDestroy(gameState)
        if (factoryToDestroy) {
          destroyFactory(factoryToDestroy)
        } else {
          skipVoidEffect()
        }
      }, 1500) // 1.5 second delay for Void effect
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.voidEffectPending, gameState.currentPlayerIndex, gameState.players, gameState.turnPhase, destroyFactory, skipVoidEffect, gameState])

  // Show start screen if game hasn't started
  if (!gameState.gameStarted) {
    return <StartGameScreen onStartGame={startGame} />
  }

  return <GameBoard gameState={gameState} />
}

export default App
