import { useState, useEffect } from 'react'
import { GameBoard } from './features/gameplay/components/GameBoard'
import { GameModeSelection } from './features/gameplay/components/GameModeSelection'
import { useGameStore } from './state/gameStore'
import type { GameMode } from './types/game'

function App() {
  const [showModeSelection, setShowModeSelection] = useState(true)
  const gameState = useGameStore()
  const resetGame = useGameStore((state) => state.resetGame)
  const triggerAITurn = useGameStore((state) => state.triggerAITurn)

  const handleModeSelection = (mode: GameMode) => {
    resetGame(mode)
    setShowModeSelection(false)
  }

  // Trigger AI turn when it's AI's turn
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.type === 'ai' && gameState.turnPhase === 'draft' && !showModeSelection) {
      triggerAITurn()
    }
  }, [gameState.currentPlayerIndex, gameState.turnPhase, gameState.players, triggerAITurn, showModeSelection])

  // Show mode selection on game over
  useEffect(() => {
    if (gameState.turnPhase === 'game-over') {
      // Wait a bit before showing mode selection again
      const timeout = setTimeout(() => {
        setShowModeSelection(true)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [gameState.turnPhase])

  if (showModeSelection) {
    return <GameModeSelection onSelectMode={handleModeSelection} />
  }

  return <GameBoard gameState={gameState} />
}

export default App
