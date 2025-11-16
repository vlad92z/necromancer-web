import { useEffect } from 'react'
import { GameBoard } from './features/gameplay/components/GameBoard'
import { useGameStore } from './state/gameStore'

function App() {
  const gameState = useGameStore()
  const resetGame = useGameStore((state) => state.resetGame)
  const triggerAITurn = useGameStore((state) => state.triggerAITurn)

  // Trigger AI turn when it's AI's turn
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.type === 'ai' && gameState.turnPhase === 'draft') {
      triggerAITurn()
    }
  }, [gameState.currentPlayerIndex, gameState.turnPhase, gameState.players, triggerAITurn])

  // Handle game reset
  const handleNextGame = () => {
    resetGame()
  }

  return <GameBoard gameState={gameState} onNextGame={handleNextGame} />
}

export default App
