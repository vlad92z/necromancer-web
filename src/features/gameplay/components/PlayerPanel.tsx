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
    <section>
      <div className="flex items-center gap-3">
          <h2 className="pixel-section-title mt-1 text-xl">Player</h2>
      </div>

      <div className="mt-5 flex justify-center">
        <img
          src={wizardImage}
          alt="Player wizard"
          className="h-55 max-w-full object-contain [image-rendering:pixelated] drop-shadow-[6px_6px_0_#141313]"
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs uppercase text-[#fff8d8]">
          <span className="flex items-center gap-1.5">
            <span>HP</span>
            {armor > 0 && (
              <span className="flex items-center gap-1 text-[#5dc6b0]">
                <span aria-hidden="true">🛡</span>
                <span>{armor}</span>
              </span>
            )}
          </span>
          <span>{health} / {maxHealth}</span>
        </div>
        <div className="pixel-health-track">
          <div
            className="pixel-health-fill pixel-health-fill--player"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      
        {selectedArtefactIds.length > 0 ? (
          <div className="pixel-game-panel-inset mt-4 px-3 py-2">
            <ArtefactsRow selectedArtefactIds={selectedArtefactIds} compact />
          </div>
        ) : null }
      
    </section>
  );
}
