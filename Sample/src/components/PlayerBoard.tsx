import { RuneOverload } from './RuneOverload';
import { PatternLines } from './PatternLines';
import { SpellWall } from './SpellWall';
import { PlayerStats } from './PlayerStats';
import { Rune, RuneType } from '../App';

interface PlayerBoardProps {
  board: {
    overload: Rune[];
    patternLines: Rune[][];
    spellWall: (RuneType | null)[][];
    health: number;
    healing: number;
    essence: number;
    focus: number;
  };
  isOpponent: boolean;
  playerName: string;
  onPatternLineClick?: (lineIndex: number) => void;
}

export function PlayerBoard({ board, isOpponent, playerName, onPatternLineClick }: PlayerBoardProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-[2em]" style={{ gap: '2em' }}>
      {/* Rune Overload - 5x2 grid */}
      <RuneOverload runes={board.overload} />

      {/* Pattern Lines */}
      <PatternLines 
        patternLines={board.patternLines} 
        onLineClick={onPatternLineClick}
      />

      {/* Spell Wall - 5x5 grid */}
      <SpellWall spellWall={board.spellWall} />

      {/* Player Stats */}
      <PlayerStats 
        playerName={playerName}
        health={board.health}
        healing={board.healing}
        essence={board.essence}
        focus={board.focus}
        isOpponent={isOpponent}
      />
    </div>
  );
}