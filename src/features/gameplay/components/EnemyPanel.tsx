/**
 * EnemyPanel - displays the active enemy.
 */

import { useCombatEnemyState, useEnemySpellBoardState } from '../../../hooks/useGameState';
import type { Rune } from '../../../types/game';
import { WallRuneCardPreview } from './WallRuneCardPreview';

interface EnemyPanelProps {
  hoveredRune: Rune | null;
}

export function EnemyPanel({ hoveredRune }: EnemyPanelProps) {
  const { enemy } = useCombatEnemyState();
  const { wall } = useEnemySpellBoardState();

  if (!enemy) {
    return (
      <section className="pixel-game-panel h-full p-5 text-[#b5d3bd]">
        <div className="text-xs uppercase tracking-[0.22em]">Enemy</div>
        <div className="mt-4 text-lg font-semibold">No enemy</div>
      </section>
    );
  }

  const healthRatio = enemy.maxHealth > 0 ? Math.max(0, Math.min(1, enemy.health / enemy.maxHealth)) : 0;
  const healthPercent = Math.round(healthRatio * 100);
  const totalShield = wall.flat().reduce((total, cell) => total + (cell.shield ?? 0), 0);

  return (
    <section>
      <div className="flex justify-center">
        <h2 className="pixel-section-title mt-1 text-center text-xl">{enemy.name}</h2>
      </div>

      <div className="mt-5 flex justify-center">
        <img
          src={enemy.imageSrc}
          alt={enemy.name}
          className={enemy.isBoss
            ? 'h-[280px] w-[280px] max-w-none object-contain [image-rendering:pixelated] drop-shadow-[8px_8px_0_#141313]'
            : 'h-55 max-w-full object-contain [image-rendering:pixelated] drop-shadow-[6px_6px_0_#141313]'}
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs uppercase text-[#fff8d8]">
          {totalShield > 0 ? (
            <span className="text-[#75c9f0]" aria-label={`Shield: ${totalShield}`}>{totalShield}</span>
          ) : <span />}
          <span>{enemy.health} / {enemy.maxHealth}</span>
        </div>
        <div className="pixel-health-track">
          <div
            className="pixel-health-fill"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      <WallRuneCardPreview rune={hoveredRune} />
    </section>
  );
}
