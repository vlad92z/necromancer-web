/**
 * PlayerPanel - displays the player's combat avatar, health, mana, and artefacts.
 */

import wizardImage from '../../../assets/enemies/wizard.png';
import { ArtefactsRow } from '../../../components/ArtefactsRow';
import { useGameplayHealthState, useSelectedArtefactIds } from '../../../hooks/useGameState';
import type { Rune } from '../../../types/game';
import { WallRuneCardPreview } from './WallRuneCardPreview';

interface PlayerPanelProps {
  hoveredRune: Rune | null;
}

export function PlayerPanel({ hoveredRune }: PlayerPanelProps) {
  const { health, maxHealth, mana, maxMana } = useGameplayHealthState();
  const selectedArtefactIds = useSelectedArtefactIds();

  const healthRatio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
  const healthPercent = Math.round(healthRatio * 100);

  return (
    <section>
      <div className="flex justify-center">
          <h2 className="pixel-section-title mt-1 text-center text-xl">Player</h2>
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
          <span />
          <span>{health} / {maxHealth}</span>
        </div>
        <div className="pixel-health-track">
          <div
            className="pixel-health-fill pixel-health-fill--player"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-1" aria-label={`${mana} of ${maxMana} mana`}>
          {Array.from({ length: maxMana }, (_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-full border-2 border-[#141313] ${index < mana ? 'bg-[#75c9f0]' : 'bg-transparent'}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <WallRuneCardPreview rune={hoveredRune} />
      
        {selectedArtefactIds.length > 0 ? (
          <div className="pixel-game-panel-inset mt-4 px-3 py-2">
            <ArtefactsRow selectedArtefactIds={selectedArtefactIds} compact />
          </div>
        ) : null }
      
    </section>
  );
}
