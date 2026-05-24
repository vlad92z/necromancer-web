/**
 * PlayerPanel - displays the player's combat avatar, health, armor, and artefacts.
 */

import wizardImage from '../../../assets/enemies/wizard.png';
import { ArtefactsRow } from '../../../components/ArtefactsRow';
import { useGameplayHealthState, useSelectedArtefactIds } from '../../../hooks/useGameState';

export function PlayerPanel() {
  const { health, maxHealth, armor } = useGameplayHealthState();
  const selectedArtefactIds = useSelectedArtefactIds();

  const healthRatio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
  const healthPercent = Math.round(healthRatio * 100);

  return (
    <section className="h-full rounded-lg border border-sky-300/25 bg-[rgba(8,16,32,0.84)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-sky-200/80">Player</div>
          <h2 className="mt-1 text-2xl font-black text-sky-50">Wizard</h2>
        </div>
        <div className="rounded-md border border-sky-300/30 bg-sky-950/45 px-3 py-2 text-right">
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-sky-100/75">Armor</div>
          <div className="text-lg font-black text-sky-50">{armor}</div>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <img
          src={wizardImage}
          alt="Player wizard"
          className="h-[220px] max-w-full object-contain drop-shadow-[0_20px_32px_rgba(0,0,0,0.55)]"
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-sky-50">
          <span>HP</span>
          <span>{health} / {maxHealth}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-sky-950/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-200"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-sky-300/15 bg-sky-950/25 px-4 py-3">
        <div className="mb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-sky-100/70">Artefacts</div>
        {selectedArtefactIds.length > 0 ? (
          <ArtefactsRow selectedArtefactIds={selectedArtefactIds} compact />
        ) : (
          <div className="text-sm font-semibold text-sky-100/70">No active artefacts</div>
        )}
      </div>
    </section>
  );
}