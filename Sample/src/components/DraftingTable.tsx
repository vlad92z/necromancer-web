import { Rune, RuneType } from '../App';
import { RuneToken } from './RuneToken';

interface DraftingTableProps {
  circles: Rune[][];
  centerPool: Rune[];
  onCircleClick: (circleIndex: number, runeType: RuneType) => void;
  onCenterPoolClick: (runeType: RuneType) => void;
}

export function DraftingTable({ circles, centerPool, onCircleClick, onCenterPoolClick }: DraftingTableProps) {
  function getRuneTypesInCircle(circle: Rune[]): RuneType[] {
    const types = new Set<RuneType>();
    circle.forEach(rune => types.add(rune.type));
    return Array.from(types);
  }

  function getRuneTypesInCenter(): RuneType[] {
    const types = new Set<RuneType>();
    centerPool.forEach(rune => types.add(rune.type));
    return Array.from(types);
  }

  function countRunesOfType(runes: Rune[], type: RuneType): number {
    return runes.filter(rune => rune.type === type).length;
  }

  const topCircles = circles.slice(0, 3);
  const bottomCircles = circles.slice(3, 6);

  return (
    <div className="h-full w-full flex flex-col items-center justify-between px-[2em]" style={{ paddingTop: '2em', paddingBottom: '2em' }}>
      {/* Top 3 Factories */}
      <div className="flex justify-center w-full" style={{ gap: '2em' }}>
        {topCircles.map((circle, index) => (
          <div 
            key={index}
            className="relative"
          >
            {/* Factory background */}
            <div className="rounded-2xl border-4 border-purple-400/50 bg-purple-950/30 shadow-xl flex items-center justify-center" style={{ padding: '0.75em 1em', gap: '0.5em' }}>
              {circle.length === 0 ? (
                <div className="text-purple-400/30" style={{ padding: '0 2em' }}>Empty</div>
              ) : (
                <div className="flex" style={{ gap: '0.5em' }}>
                  {circle.map((rune) => (
                    <button
                      key={rune.id}
                      onClick={() => onCircleClick(index, rune.type)}
                      className="hover:scale-110 transition-transform"
                    >
                      <RuneToken type={rune.type} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Center Pool - Free Floating Runes */}
      <div className="flex flex-wrap justify-center" style={{ gap: '0.75em', maxWidth: '20em' }}>
        {centerPool.map((rune) => (
          <button
            key={rune.id}
            onClick={() => onCenterPoolClick(rune.type)}
            className="hover:scale-110 transition-transform"
          >
            <RuneToken type={rune.type} size="sm" />
          </button>
        ))}
      </div>

      {/* Bottom 3 Factories */}
      <div className="flex justify-center w-full" style={{ gap: '2em' }}>
        {bottomCircles.map((circle, index) => {
          const actualIndex = index + 3;
          return (
            <div 
              key={actualIndex}
              className="relative"
            >
              {/* Factory background */}
              <div className="rounded-2xl border-4 border-purple-400/50 bg-purple-950/30 shadow-xl flex items-center justify-center" style={{ padding: '0.75em 1em', gap: '0.5em' }}>
                {circle.length === 0 ? (
                  <div className="text-purple-400/30" style={{ padding: '0 2em' }}>Empty</div>
                ) : (
                  <div className="flex" style={{ gap: '0.5em' }}>
                    {circle.map((rune) => (
                      <button
                        key={rune.id}
                        onClick={() => onCircleClick(actualIndex, rune.type)}
                        className="hover:scale-110 transition-transform"
                      >
                        <RuneToken type={rune.type} size="sm" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}