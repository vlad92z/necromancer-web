/**
 * EnemyPanel - displays the active enemy and queued intent.
 */

import { useCombatEnemyState } from '../../../hooks/useGameState';

export function EnemyPanel() {
  const { enemy } = useCombatEnemyState();

  if (!enemy) {
    return (
      <section className="h-full p-5 text-slate-300">
        <div className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">Enemy</div>
        <div className="mt-4 text-lg font-semibold">No enemy</div>
      </section>
    );
  }

  const healthRatio = enemy.maxHealth > 0 ? Math.max(0, Math.min(1, enemy.health / enemy.maxHealth)) : 0;
  const healthPercent = Math.round(healthRatio * 100);

  return (
    <section className="h-full p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mt-1 text-2xl font-black text-red-100">{enemy.name}</h2>
        </div>
        <div className="rounded-md border border-red-300/30 bg-red-950/50 px-3 py-2 text-right">
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-red-200/75">Intent</div>
          <div className="text-lg font-black text-red-100">Attack {enemy.intent.amount}</div>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <img
          src={enemy.imageSrc}
          alt={enemy.name}
          className="h-[220px] max-w-full object-contain drop-shadow-[0_20px_32px_rgba(0,0,0,0.55)]"
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-red-100">
          <span>HP</span>
          <span>{enemy.health} / {enemy.maxHealth}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-red-950/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-300"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
