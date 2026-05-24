/**
 * GameMetadataView - primary header row for counters, actions, and progress.
 */

import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import { useUIActions } from '../../../../hooks/useGameActions';
import { useActiveElement, useArcaneDust, useCombatZoneState, useGameIndex } from '../../../../hooks/useGameState';
import { DeckButton } from '../../../../components/DeckButton';

export function GameMetadataView() {
  const gameNumber = useGameIndex();
  const arcaneDust = useArcaneDust();
  const { hand, discardPile } = useCombatZoneState();
  const { toggleSettingsOverlay: openSettings } = useUIActions();
  const activeElement = useActiveElement();
  const isSettingsActive = activeElement?.type === 'settings';
  const settingsHover = 'hover:border-slate-300 hover:text-white hover:bg-slate-800';
  const settingsFocus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300';
  const settingsActive = 'data-[active=true]:shadow-[0_0_28px_rgba(125,211,252,0.95),_0_0_56px_rgba(125,211,252,0.55)] data-[active=true]:bg-slate-800/80';
  const actionButtonBase = `pt-0 pr-2 pb-2 pl-4 items-center justify-center text-slate-200 rounded-2xl border border-slate-600/70 bg-slate-900 text-5xl tracking-[0.18em] text-slate-100 ${settingsHover} ${settingsFocus} ${settingsActive}`;

  return (
    <div className="flex flex-row w-full border-b border-slate-600/70 pb-2 bg-slate-900/80 px-5 pt-3">
      {/* Left side: Game Title, Arcane Dust Counter, Settings Button */}
      <div className="w-full flex flex-row flex-[29] items-center">
        <ClickSoundButton
          title="⚙"
          action={openSettings}
          isActive={isSettingsActive}
          className={actionButtonBase}
        />

        <div className="flex flex-row gap-2 px-3 flex-1 justify-center items-center">
          <span className="text-lg font-semibold uppercase tracking-[0.28em] text-sky-200">Game</span>
          <span className="text-xl font-extrabold text-slate-200 leading-tight">{gameNumber}</span>
        </div>

        <div className="px-4 py-3 flex items-center gap-3 pr-20">
          <img
            src={arcaneDustIcon}
            alt="Arcane Dust"
            className="h-10 w-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
          />
          <span className="text-xl font-extrabold text-amber-200">{arcaneDust.toLocaleString()}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-row flex-[44] items-center justify-end gap-3">
        <DeckButton/>
        <div className="flex min-w-[150px] items-center justify-center gap-3 rounded-[16px] border border-violet-400/30 bg-violet-500/10 px-3.5 py-3 text-slate-100">
          <div className="flex flex-col items-center leading-[1.2]" aria-label="Hand count">
            <span className="text-[1.15rem] font-semibold">{hand.length}</span>
          </div>
          <div className="h-8 w-px bg-white/15" />
          <div className="flex flex-col items-center leading-[1.2]">
            <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-violet-100/70">Discard</span>
            <span className="text-[1.15rem] font-semibold">{discardPile.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
