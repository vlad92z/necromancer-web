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
    <section className="h-full p-5">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="mt-1 text-2xl font-black text-sky-50">Wizard</h2>
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
          <span className="flex items-center gap-1.5">
            <span>HP</span>
            {armor > 0 && (
              <span className="flex items-center gap-1 text-sky-100">
                <span aria-hidden="true" className="text-sky-200">🛡</span>
                <span>{armor}</span>
              </span>
            )}
          </span>
          <span>{health} / {maxHealth}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-sky-950/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-200"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      
        {selectedArtefactIds.length > 0 ? (
          <div className="mt-4 rounded-lg border border-sky-300/15 bg-sky-950/25 px-3 py-2">
            <ArtefactsRow selectedArtefactIds={selectedArtefactIds} compact />
          </div>
        ) : null }
      
    </section>
  );
}
