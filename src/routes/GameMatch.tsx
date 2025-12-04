import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// import { DuelGameBoard } from '../features/gameplay/components/DuelGameBoard'
import { StartGameScreen } from '../features/gameplay/components/StartGameScreen'
import { useGameplayStore, setNavigationCallback } from '../state/stores/gameplayStore'
import { executeAITurn, needsAIPlacement } from '../systems/aiController'
import type { QuickPlayOpponent } from '../types/game'
import { getControllerForIndex } from '../utils/playerControllers'

export function GameMatch() {
  const navigate = useNavigate()
  const startGame = useGameplayStore((state) => state.startGame)
  const gameStarted = useGameplayStore((s) => s.gameStarted)
  const currentPlayerIndex = useGameplayStore((s) => s.currentPlayerIndex)
  const turnPhase = useGameplayStore((s) => s.turnPhase)
  const selectedRunesLength = useGameplayStore((s) => s.selectedRunes.length)
  const voidEffectPending = useGameplayStore((s) => s.voidEffectPending)
  const frostEffectPending = useGameplayStore((s) => s.frostEffectPending)
  const players = useGameplayStore((s) => s.players)
  const playerControllers = useGameplayStore((s) => s.playerControllers)
  const wholeGameState = useGameplayStore()

  // Set up navigation callback for returnToStartScreen
  useEffect(() => {
    setNavigationCallback(() => navigate('/'))
    
    return () => {
      // Cleanup: remove navigation callback only (don't reset game state)
      // Game state should persist across navigations for spectator mode
      setNavigationCallback(null)
    }
  }, [navigate])

  // Trigger AI turn when it's AI's turn (draft phase)
  useEffect(() => {
    if (!gameStarted) return;

    const controller = getControllerForIndex(useGameplayStore.getState(), currentPlayerIndex)
    if (
      controller.type === 'computer' &&
      turnPhase === 'draft' &&
      selectedRunesLength === 0 &&
      !voidEffectPending &&
      !frostEffectPending
    ) {
      const delayTimer = setTimeout(() => {
        executeAITurn()
      }, 2000) // 2 second delay before AI starts

      return () => clearTimeout(delayTimer)
    }
  }, [gameStarted, currentPlayerIndex, turnPhase, players, selectedRunesLength, voidEffectPending, frostEffectPending, playerControllers])
  
  // Handle AI placement after drafting
  useEffect(() => {
    if (!gameStarted) return;

    if (needsAIPlacement()) {
      const delayTimer = setTimeout(() => {
        executeAITurn()
      }, 2000) // 2 second delay before AI places runes

      return () => clearTimeout(delayTimer)
    }
  }, [gameStarted, currentPlayerIndex, players, selectedRunesLength, turnPhase, playerControllers])
  
  // Handle Void effect for AI (when AI's turn and voidEffectPending)
  useEffect(() => {
    if (!gameStarted) return;

    const controller = getControllerForIndex(useGameplayStore.getState(), currentPlayerIndex)
    if (controller.type === 'computer' && voidEffectPending && turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
      }, 1500) // 1.5 second delay for Void effect

      return () => clearTimeout(delayTimer)
    }
  }, [gameStarted, voidEffectPending, currentPlayerIndex, players, turnPhase, playerControllers])
  
  // Handle Frost effect for AI (when AI's turn and frostEffectPending)
  useEffect(() => {
    if (!gameStarted) return;

    const controller = getControllerForIndex(useGameplayStore.getState(), currentPlayerIndex)
    if (controller.type === 'computer' && frostEffectPending && turnPhase === 'draft') {
      const delayTimer = setTimeout(() => {
      }, 1500) // 1.5 second delay for Frost effect

      return () => clearTimeout(delayTimer)
    }
  }, [gameStarted, frostEffectPending, currentPlayerIndex, players, turnPhase, playerControllers])

  const handleStartGame = (topController: QuickPlayOpponent, runeTypeCount: import('../types/game').RuneTypeCount) => {
    startGame(topController, runeTypeCount)
  }

  // Show start screen if game hasn't started
  if (!wholeGameState.gameStarted) {
    return <StartGameScreen onStartGame={handleStartGame} />
  }
  return <StartGameScreen onStartGame={handleStartGame} />
  // return <DuelGameBoard gameState={wholeGameState} />
}
