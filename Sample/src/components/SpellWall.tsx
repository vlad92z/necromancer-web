import { RuneType } from '../App';
import { RuneToken } from './RuneToken';

interface SpellWallProps {
  spellWall: (RuneType | null)[][];
}

export function SpellWall({ spellWall }: SpellWallProps) {
  return (
    <div className="flex flex-col" style={{ gap: '0.5em' }}>
      <div className="text-purple-300 text-center">Spell Wall</div>
      <div className="grid grid-cols-5 grid-rows-5" style={{ gap: '0.5em' }}>
        {spellWall.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`}
              className="rounded border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/30 to-slate-900/50 flex items-center justify-center shadow-inner"
              style={{ width: '2.5em', height: '2.5em' }}
            >
              {cell && <RuneToken type={cell} size="xs" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}