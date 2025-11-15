import { GameBoard } from './features/gameplay/components/GameBoard'
import { useGameStore } from './state/gameStore'

function App() {
  const gameState = useGameStore()

  return <GameBoard gameState={gameState} />
}

export default App
