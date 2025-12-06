import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StartGameScreen } from '../features/gameplay/components/StartGameScreen'
import { useGameplayStore, setNavigationCallback } from '../state/stores/gameplayStore'

export function GameMatch() {
  const navigate = useNavigate()
  const startGame = useGameplayStore((state) => state.startSoloRun) //todo or start solorun?
  const gameStarted = useGameplayStore((s) => s.gameStarted)
  const turnPhase = useGameplayStore((s) => s.turnPhase)
  const player = useGameplayStore((s) => s.player)
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
  
  useEffect(() => {
    if (!gameStarted) return;
  }, [gameStarted, player, turnPhase])
  
  useEffect(() => {
    if (!gameStarted) return;
  }, [gameStarted, player, turnPhase])
  const handleStartGame = (runeTypeCount: import('../types/game').RuneTypeCount) => {
    startGame(runeTypeCount)
  }

  // Show start screen if game hasn't started
  if (!wholeGameState.gameStarted) {
    return <StartGameScreen onStartGame={handleStartGame} />
  }
  return <StartGameScreen onStartGame={handleStartGame} />
  // return <DuelGameBoard gameState={wholeGameState} />
}
