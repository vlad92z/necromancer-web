/**
 * Factory component - displays a factory with runes
 * Implements Azul-style drafting: click a rune type to select all of that type
 */

import type { Factory as FactoryType, RuneType } from '../../../types/game';
import { RuneToken } from '../../../components/RuneToken';

interface FactoryProps {
  factory: FactoryType;
  onDraftRune?: (factoryId: string, runeType: RuneType) => void;
  disabled?: boolean;
}

export function Factory({ factory, onDraftRune, disabled = false }: FactoryProps) {
  const handleRuneClick = (runeType: RuneType) => {
    if (!disabled && onDraftRune) {
      onDraftRune(factory.id, runeType);
    }
  };
  
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
      transition-all
      hover:bg-gray-600
    ">
      {factory.runes.length === 0 ? (
        <div className="text-gray-500 text-sm">
          Empty
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {factory.runes.map((rune) => (
            <button
              style={{ width: '60px', height: '60px' }}
              key={rune.id}
              onClick={() => handleRuneClick(rune.runeType)}
              disabled={disabled}
              className="
                focus:outline-none 
                focus:ring-2 
                focus:ring-blue-500 
                rounded-lg
                disabled:cursor-not-allowed
                hover:scale-110
                transition-transform
              "
              aria-label={`Select ${rune.runeType} rune from factory`}
            >
              <RuneToken 
                rune={rune} 
                size="small" 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
