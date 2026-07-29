/**
 * SoloGameOverModal - displays the end-of-run summary for Solo mode
 */

import { useGameplayActions } from '../../../hooks/useGameActions';
import { useGameplaySummaryState } from '../../../hooks/useGameState';
import { useClickSound } from '../../../hooks/useClickSound';

export function SoloGameOverModal() {
  const { returnToStartScreen: returnToStart } = useGameplayActions();
  const { enemyMaxHealth, gameIndex: game } = useGameplaySummaryState();
  const playClickSound = useClickSound();
  const subline = 'Your health reached zero.';

  return (
    <div className="pixel-modal absolute left-1/2 top-1/2 z-100 min-w-[420px] -translate-x-1/2 -translate-y-1/2 p-2 text-center font-pixel">
      <div className="pixel-modal__inner px-7 py-8">
      <div
        className="pixel-game-stat mb-4 bg-[#e15f4f] px-3.5 py-2 text-xs uppercase tracking-[0.12em] text-[#fff8d8]"
      >
        Defeat
      </div>
      <div className="mb-5 text-xs text-[#b5d3bd]">{subline}</div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Games Cleared" value={game - 1} accent="#60a5fa" />
        <StatCard label="Enemy HP Tier" value={enemyMaxHealth} accent="#facc15" />
      </div>

      <button
        type="button"
        onClick={() => {
          playClickSound();
          returnToStart();
        }}
        className="pixel-game-button w-full px-4 py-4 text-xs tracking-[0.08em]"
      >
        Back to Menu
      </button>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  accent: string;
}

function StatCard({ label, value, accent }: StatCardProps) {
  const accentClass =
    accent === '#34d399'
      ? 'text-emerald-400'
      : accent === '#60a5fa'
      ? 'text-sky-400'
      : accent === '#facc15'
      ? 'text-amber-300'
      : 'text-indigo-200';

  return (
    <div className="pixel-game-stat px-3 py-3 text-center">
      <div className="mb-1.5 text-[9px] uppercase tracking-[0.08em] text-[#b5d3bd]">
        {label}
      </div>
      <div className={`text-xl font-extrabold ${accentClass}`}>{value}</div>
    </div>
  );
}
