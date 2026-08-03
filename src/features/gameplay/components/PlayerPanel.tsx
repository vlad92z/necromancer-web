/**
 * PlayerPanel - displays the player's combat avatar, health, mana, and artefacts.
 */

import combatWizard1 from '../../../assets/enemies/combat_wizard_1.png';
import combatWizard2 from '../../../assets/enemies/combat_wizard_2.png';
import combatWizard3 from '../../../assets/enemies/combat_wizard_3.png';
import combatWizard4 from '../../../assets/enemies/combat_wizard_4.png';
import combatWizard5 from '../../../assets/enemies/combat_wizard_5.png';
import combatWizard6 from '../../../assets/enemies/combat_wizard_6.png';
import { ArtefactsRow } from '../../../components/ArtefactsRow';
import { useActiveArtefactIds, useGameplayHealthState } from '../../../hooks/useGameState';
import { useEffect, useState } from 'react';
import type { ArtefactId } from '../../../types/artefacts';
import type { Rune } from '../../../types/game';
import { ANIMATION } from '../../../styles/tokens';
import { ArtefactCardPreview } from './ArtefactCardPreview';
import { WallRuneCardPreview } from './WallRuneCardPreview';

interface PlayerPanelProps {
  hoveredRune: Rune | null;
}

const COMBAT_WIZARD_FRAMES = [
  combatWizard1,
  combatWizard2,
  combatWizard3,
  combatWizard4,
  combatWizard5,
  combatWizard6,
  combatWizard5,
  combatWizard4,
  combatWizard3,
  combatWizard2,
  combatWizard1,
] as const;

export function PlayerPanel({ hoveredRune }: PlayerPanelProps) {
  const { health, maxHealth, mana, maxMana } = useGameplayHealthState();
  const activeArtefactIds = useActiveArtefactIds();
  const [hoveredArtefactId, setHoveredArtefactId] = useState<ArtefactId | null>(null);
  const [combatWizardFrameIndex, setCombatWizardFrameIndex] = useState(0);

  const healthRatio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
  const healthPercent = Math.round(healthRatio * 100);
  const displayedMaxMana = Math.max(maxMana, mana);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCombatWizardFrameIndex((currentFrame) => (currentFrame + 1) % COMBAT_WIZARD_FRAMES.length);
    }, ANIMATION.COMBAT_WIZARD_FRAME_DURATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section>
      <div className="flex justify-center">
          <h2 className="pixel-section-title mt-1 text-center text-xl">Player</h2>
      </div>

      <div className="mt-5 flex justify-center">
        <img
          src={COMBAT_WIZARD_FRAMES[combatWizardFrameIndex]}
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
        <div className="mt-2 flex items-center gap-1" aria-label={`${mana} of ${displayedMaxMana} mana`}>
          {Array.from({ length: displayedMaxMana }, (_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-full border-2 border-[#141313] ${index < mana ? 'bg-[#75c9f0]' : 'bg-transparent'}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {hoveredArtefactId ? <ArtefactCardPreview artefactId={hoveredArtefactId} /> : <WallRuneCardPreview rune={hoveredRune} />}
      
        {activeArtefactIds.length > 0 ? (
          <div className="pixel-game-panel-inset mt-4 px-3 py-2">
            <ArtefactsRow
              selectedArtefactIds={activeArtefactIds}
              compact
              onArtefactHover={setHoveredArtefactId}
              onArtefactLeave={() => setHoveredArtefactId(null)}
            />
          </div>
        ) : null }
      
    </section>
  );
}
