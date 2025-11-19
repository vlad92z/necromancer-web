import { Rune } from '../App';
import { RuneToken } from './RuneToken';

interface RuneOverloadProps {
  runes: Rune[];
}

export function RuneOverload({ runes }: RuneOverloadProps) {
  return (
    <div className="flex flex-col" style={{ gap: '0.5em' }}>
      <div className="text-purple-300 text-center">Overload</div>
      <div className="grid grid-cols-2 grid-rows-5" style={{ gap: '0.5em' }}>
        {Array.from({ length: 10 }, (_, index) => (
          <div 
            key={index}
            className="rounded border-2 border-purple-500/30 bg-slate-900/50 flex items-center justify-center"
            style={{ width: '2.5em', height: '2.5em' }}
          >
            {runes[index] && <RuneToken type={runes[index].type} size="xs" />}
          </div>
        ))}
      </div>
    </div>
  );
}