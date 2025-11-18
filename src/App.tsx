import { useEffect } from 'react'
import { GameBoard } from './features/gameplay/components/GameBoard'
import { StartGameScreen } from './features/gameplay/components/StartGameScreen'
import { useGameStore } from './state/gameStore'
import { chooseRuneforgeToDestroy, chooseRuneforgeToFreeze } from './utils/aiPlayer'

function App() {
  const gameState = useGameStore()
  const startGame = useGameStore((state) => state.startGame)
  const triggerAITurn = useGameStore((state) => state.triggerAITurn)
  const destroyRuneforge = useGameStore((state) => state.destroyRuneforge)
  const skipVoidEffect = useGameStore((state) => state.skipVoidEffect)
  const freezeRuneforge = useGameStore((state) => state.freezeRuneforge)

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
    // AI chooses runeforge when it's their turn AND Void effect is pending
    if (currentPlayer.type === 'ai' && gameState.voidEffectPending && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        const runeforgeToDestroy = chooseRuneforgeToDestroy(gameState)
        if (runeforgeToDestroy) {
          destroyRuneforge(runeforgeToDestroy)
        } else {
          skipVoidEffect()
        }
      }, 1500) // 1.5 second delay for Void effect
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.voidEffectPending, gameState.currentPlayerIndex, gameState.players, gameState.turnPhase, destroyRuneforge, skipVoidEffect, gameState])
  
  // Handle Frost effect for AI (when AI's turn and frostEffectPending)
  useEffect(() => {
    if (!gameState.gameStarted) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    // AI chooses runeforge when it's their turn AND Frost effect is pending
    if (currentPlayer.type === 'ai' && gameState.frostEffectPending && gameState.turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
        const runeforgeToFreeze = chooseRuneforgeToFreeze(gameState)
        if (runeforgeToFreeze) {
          freezeRuneforge(runeforgeToFreeze)
        }
      }, 1500) // 1.5 second delay for Frost effect
      
      return () => clearTimeout(delayTimer)
    }
  }, [gameState.gameStarted, gameState.frostEffectPending, gameState.currentPlayerIndex, gameState.players, gameState.turnPhase, freezeRuneforge, gameState])

  // Show start screen if game hasn't started
  if (!gameState.gameStarted) {
    return <StartGameScreen onStartGame={startGame} />
  }

  return <GameBoard gameState={gameState} />
}

export default App
