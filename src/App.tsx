import { useEffect } from 'react'
import { GameBoard } from './features/gameplay/components/GameBoard'
import { StartGameScreen } from './features/gameplay/components/StartGameScreen'
import { useGameStore } from './state/gameStore'

function App() {
  const gameState = useGameStore()
  const startGame = useGameStore((state) => state.startGame)
  const triggerAITurn = useGameStore((state) => state.triggerAITurn)

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

  // Show start screen if game hasn't started
  if (!gameState.gameStarted) {
    return <StartGameScreen onStartGame={startGame} />
  }

  return <GameBoard gameState={gameState} />
}

export default App
