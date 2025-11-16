import { useState, useEffect } from 'react'
import { GameBoard } from './features/gameplay/components/GameBoard'
import { GameModeSelection } from './features/gameplay/components/GameModeSelection'
import { useGameStore } from './state/gameStore'
import type { GameMode, Player } from './types/game'

function App() {
  const [showModeSelection, setShowModeSelection] = useState(true)
  const [previousGameResult, setPreviousGameResult] = useState<{ winner: Player | null; players: [Player, Player] } | undefined>()
  const gameState = useGameStore()
  const resetGame = useGameStore((state) => state.resetGame)
  const triggerAITurn = useGameStore((state) => state.triggerAITurn)

  const handleModeSelection = (mode: GameMode) => {
    resetGame(mode)
    setShowModeSelection(false)
    setPreviousGameResult(undefined) // Clear previous result when starting new game
  }

  // Trigger AI turn when it's AI's turn
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.type === 'ai' && gameState.turnPhase === 'draft' && !showModeSelection) {
      triggerAITurn()
    }
  }, [gameState.currentPlayerIndex, gameState.turnPhase, gameState.players, triggerAITurn, showModeSelection])

  // Handle navigation from game over screen
  const handleNextGame = () => {
    setShowModeSelection(true)
  }

  if (showModeSelection) {
    console.log('Showing mode selection with previousGameResult:', previousGameResult)
    return <GameModeSelection onSelectMode={handleModeSelection} previousGameResult={previousGameResult} />
  }

  return <GameBoard gameState={gameState} onNextGame={handleNextGame} />
}

export default App
