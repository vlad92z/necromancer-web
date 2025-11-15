/**
 * Factory component - displays a factory with runes
 */

import type { Factory as FactoryType } from '../../../types/game';
import { RuneToken } from '../../../components/RuneToken';

interface FactoryProps {
  factory: FactoryType;
}

export function Factory({ factory }: FactoryProps) {
  return (
    <div className="
      bg-gray-700 
      rounded-xl 
      p-4 
      min-w-[120px] 
      min-h-[120px] 
      flex 
      items-center 
      justify-center
    ">
      {factory.runes.length === 0 ? (
        <div className="text-gray-500 text-sm">
          Empty
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {factory.runes.map((rune) => (
            <RuneToken 
              key={rune.id} 
              rune={rune} 
              size="small" 
            />
          ))}
        </div>
      )}
    </div>
  );
}
