import { Rune } from '../App';
import { RuneToken } from './RuneToken';

interface PatternLinesProps {
  patternLines: Rune[][];
  onLineClick?: (lineIndex: number) => void;
}

export function PatternLines({ patternLines, onLineClick }: PatternLinesProps) {
  return (
    <div className="flex flex-col">
      <div className="text-purple-300 text-center" style={{ marginBottom: '0.25em' }}>Pattern Lines</div>
      <div className="flex flex-col" style={{ gap: '0.5em' }}>
        {patternLines.map((line, lineIndex) => {
          const capacity = lineIndex + 1;
          return (
            <button
              key={lineIndex}
              onClick={() => onLineClick?.(lineIndex)}
              className="flex justify-end hover:bg-purple-900/20 rounded transition-colors"
              style={{ gap: '0.5em', padding: '0 0.5em', height: '2.5em' }}
              disabled={!onLineClick}
            >
              {Array.from({ length: capacity }, (_, cellIndex) => (
                <div 
                  key={cellIndex}
                  className="rounded border-2 border-purple-500/30 bg-slate-900/50 flex items-center justify-center"
                  style={{ width: '2.5em', height: '2.5em' }}
                >
                  {line[cellIndex] && <RuneToken type={line[cellIndex].type} size="xs" />}
                </div>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}