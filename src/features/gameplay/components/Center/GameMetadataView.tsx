/**
 * GameMetadataView - primary header row for counters, actions, and progress.
 */

import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import { useUIActions } from '../../../../hooks/useGameActions';
import { useActiveElement, useArcaneDust } from '../../../../hooks/useGameState';
import { RuneZoneButton } from '../../../../components/DeckButton';

export function GameMetadataView() {
  const arcaneDust = useArcaneDust();
  const { openSettingsOverlay } = useUIActions();
  const activeElement = useActiveElement();
  const isSettingsActive = activeElement?.type === 'settings';
  const actionButtonBase = 'pixel-game-button flex h-[62px] w-[62px] items-center justify-center px-0 pb-2 text-4xl';

  return (
    <div className="pixel-game-header flex w-full flex-row px-5 py-3">
      {/* Left side: Game Title and Arcane Dust Counter */}
      <div className="w-full flex flex-row flex-29 items-center">
        <div className="px-3 py-3 flex items-center gap-3">
          <img
            src={arcaneDustIcon}
            alt="Arcane Dust"
            className="h-10 w-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
          />
          <span className="font-pixel text-lg text-[#f2c14e]">{arcaneDust.toLocaleString()}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-row flex-44 items-center justify-end gap-3">
        <RuneZoneButton zone="draw" />
        <RuneZoneButton zone="discard" />
        <RuneZoneButton zone="deck" />
        <ClickSoundButton
          title="⚙"
          action={openSettingsOverlay}
          isActive={isSettingsActive}
          className={actionButtonBase}
        />
      </div>
    </div>
  );
}
