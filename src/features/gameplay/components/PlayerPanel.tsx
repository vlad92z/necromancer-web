/**
 * PlayerPanel - displays the player's combat avatar, health, mana, and artefacts.
 */

import { motion } from 'framer-motion';
import wizardImage from '../../../assets/enemies/wizard.png';
import manaOrbImage from '../../../assets/enemies/orb_mana.png';
import { ArtefactsRow } from '../../../components/ArtefactsRow';
import { useActiveArtefactIds, useGameplayHealthState, useGameplayWallState, useSpellAnimationEvent } from '../../../hooks/useGameState';
import { useEffect, useState } from 'react';
import type { ArtefactId } from '../../../types/artefacts';
import type { Rune } from '../../../types/game';
import { ANIMATION } from '../../../styles/tokens';
import { ArtefactCardPreview } from './ArtefactCardPreview';
import { WallRuneCardPreview } from './WallRuneCardPreview';

interface PlayerPanelProps {
  hoveredRune: Rune | null;
}

export function PlayerPanel({ hoveredRune }: PlayerPanelProps) {
  const { health, maxHealth, mana, maxMana } = useGameplayHealthState();
  const { wall } = useGameplayWallState();
  const activeArtefactIds = useActiveArtefactIds();
  const spellAnimationEvent = useSpellAnimationEvent();
  const [hoveredArtefactId, setHoveredArtefactId] = useState<ArtefactId | null>(null);
  const [spellAnimationFrame, setSpellAnimationFrame] = useState<number | null>(null);

  useEffect(() => {
    if (!spellAnimationEvent) return;

    const { frames, frameDurationMs } = spellAnimationEvent.animation;
    let frameIndex = 0;
    setSpellAnimationFrame(frameIndex);
    const intervalId = window.setInterval(() => {
      frameIndex += 1;
      if (frameIndex >= frames.length) {
        window.clearInterval(intervalId);
        setSpellAnimationFrame(null);
        return;
      }
      setSpellAnimationFrame(frameIndex);
    }, frameDurationMs);

    return () => window.clearInterval(intervalId);
  }, [spellAnimationEvent]);

  const healthRatio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
  const healthPercent = Math.round(healthRatio * 100);
  const displayedMaxMana = Math.max(maxMana, mana);
  const totalShield = wall.flat().reduce((total, cell) => total + (cell.shield ?? 0), 0);

  return (
    <section>
      <div className="flex justify-center">
          <h2 className="pixel-section-title mt-1 text-center text-xl">Player</h2>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="relative h-55 w-55 max-w-full">
          <img
            src={wizardImage}
            alt="Player wizard"
            className="h-full w-full object-contain [image-rendering:pixelated] drop-shadow-[6px_6px_0_#141313]"
          />
          <motion.img
            src={spellAnimationFrame === null
              ? manaOrbImage
              : spellAnimationEvent?.animation.frames[spellAnimationFrame] ?? manaOrbImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute z-10 w-[24.2%] max-w-none [image-rendering:pixelated] drop-shadow-[2px_2px_0_#141313]"
            style={{ left: '68%', top: '38%' }}
            animate={{ y: [4, -4, -4, 4, 4] }}
            transition={{
              duration: ANIMATION.COMBAT_MANA_ORB_FLOAT_DURATION_MS / 750,
              ease: 'easeInOut',
              repeat: Infinity,
              times: [0, 0.42, 0.5, 0.92, 1],
            }}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs uppercase text-[#fff8d8]">
          <span className="text-[#75c9f0]" aria-label={`Shield: ${totalShield}`}>{totalShield}</span>
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
