import { useState } from 'react';
import { PlayerBoard } from './components/PlayerBoard';
import { DraftingTable } from './components/DraftingTable';

export type RuneType = 'fire' | 'water' | 'earth' | 'air' | 'arcane';

export interface Rune {
  id: string;
  type: RuneType;
}

export default function App() {
  const [gameState, setGameState] = useState(() => initializeGame());

  function initializeGame() {
    // Initialize 6 circles with 4 random runes each
    const circles = Array.from({ length: 6 }, (_, circleIndex) => 
      Array.from({ length: 4 }, (_, runeIndex) => ({
        id: `circle-${circleIndex}-rune-${runeIndex}`,
        type: getRandomRuneType()
      }))
    );

    return {
      circles,
      centerPool: [
        { type: 'fire' as RuneType, id: 'center-1' },
        { type: 'water' as RuneType, id: 'center-2' },
        { type: 'earth' as RuneType, id: 'center-3' },
        { type: 'air' as RuneType, id: 'center-4' },
        { type: 'arcane' as RuneType, id: 'center-5' },
        { type: 'fire' as RuneType, id: 'center-6' },
        { type: 'water' as RuneType, id: 'center-7' },
      ] as Rune[],
      opponent: {
        overload: [] as Rune[],
        patternLines: [[], [], [], [], []] as Rune[][],
        spellWall: Array(5).fill(null).map(() => Array(5).fill(null)) as (RuneType | null)[][],
        health: 20,
        healing: 0,
        essence: 1,
        focus: 1
      },
      player: {
        overload: [] as Rune[],
        patternLines: [[], [], [], [], []] as Rune[][],
        spellWall: Array(5).fill(null).map(() => Array(5).fill(null)) as (RuneType | null)[][],
        health: 20,
        healing: 0,
        essence: 1,
        focus: 1
      },
      selectedCircle: null as number | null,
      selectedRuneType: null as RuneType | null
    };
  }

  function getRandomRuneType(): RuneType {
    const types: RuneType[] = ['fire', 'water', 'earth', 'air', 'arcane'];
    return types[Math.floor(Math.random() * types.length)];
  }

  function handleCircleClick(circleIndex: number, runeType: RuneType) {
    // Get all runes of this type from the circle
    const circle = gameState.circles[circleIndex];
    const selectedRunes = circle.filter(rune => rune.type === runeType);
    const remainingRunes = circle.filter(rune => rune.type !== runeType);

    // Add remaining runes to center pool
    const newCenterPool = [...gameState.centerPool, ...remainingRunes];
    
    // Remove the circle's runes
    const newCircles = [...gameState.circles];
    newCircles[circleIndex] = [];

    // For now, just add to player's overload (simplified game logic)
    const newPlayerOverload = [...gameState.player.overload, ...selectedRunes];

    setGameState({
      ...gameState,
      circles: newCircles,
      centerPool: newCenterPool,
      player: {
        ...gameState.player,
        overload: newPlayerOverload
      }
    });
  }

  function handleCenterPoolClick(runeType: RuneType) {
    const selectedRunes = gameState.centerPool.filter(rune => rune.type === runeType);
    const remainingRunes = gameState.centerPool.filter(rune => rune.type !== runeType);

    const newPlayerOverload = [...gameState.player.overload, ...selectedRunes];

    setGameState({
      ...gameState,
      centerPool: remainingRunes,
      player: {
        ...gameState.player,
        overload: newPlayerOverload
      }
    });
  }

  function handlePatternLineClick(lineIndex: number) {
    // Move runes from overload to pattern line
    if (gameState.player.overload.length > 0) {
      const maxCapacity = lineIndex + 1;
      const currentLine = gameState.player.patternLines[lineIndex];
      
      if (currentLine.length < maxCapacity) {
        const runeToMove = gameState.player.overload[0];
        const newOverload = gameState.player.overload.slice(1);
        const newPatternLines = [...gameState.player.patternLines];
        newPatternLines[lineIndex] = [...currentLine, runeToMove];

        setGameState({
          ...gameState,
          player: {
            ...gameState.player,
            overload: newOverload,
            patternLines: newPatternLines
          }
        });
      }
    }
  }

  function resetGame() {
    setGameState(initializeGame());
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative">
      {/* Square Game Container */}
      <div className="game-container aspect-square max-h-screen max-w-screen-height w-screen h-screen" style={{
        fontSize: 'min(1.5vw, 1.5vh)',
        maxWidth: '100vh',
        maxHeight: '100vw'
      }}>
        <div className="h-full w-full flex flex-col">
          {/* Opponent Board */}
          <div className="flex-1 border-b-2 border-purple-500/30">
            <PlayerBoard 
              board={gameState.opponent}
              isOpponent={true}
              playerName="Opponent"
            />
          </div>

          {/* Drafting Table */}
          <div className="flex-1 border-b-2 border-purple-500/30">
            <DraftingTable 
              circles={gameState.circles}
              centerPool={gameState.centerPool}
              onCircleClick={handleCircleClick}
              onCenterPoolClick={handleCenterPoolClick}
            />
          </div>

          {/* Player Board */}
          <div className="flex-1">
            <PlayerBoard 
              board={gameState.player}
              isOpponent={false}
              playerName="You"
              onPatternLineClick={handlePatternLineClick}
            />
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <button
        onClick={resetGame}
        className="absolute top-4 right-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors"
      >
        New Game
      </button>
    </div>
  );
}