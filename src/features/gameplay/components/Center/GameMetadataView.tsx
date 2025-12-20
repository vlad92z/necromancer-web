/**
 * GameMetadataView - primary header row for counters, actions, and progress.
 */

import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import { RuneScoreView } from '../RuneScoreView';
import { HealthView } from '../HealthView';
import { OverloadButton } from '../Player/OverloadButton';
import { DeckButton } from '../DeckButton';
import { useArtefactStore } from '../../../../state/stores/artefactStore';
import { useSoloGameStore } from '../../../../state/stores/soloGameStore';

interface GameMetadataViewProps {
  onOpenOverload: () => void;
  onOpenDeck: () => void;
  onOpenSettings: () => void;
  activeElement?: string;
}

export function GameMetadataView({
  onOpenDeck,
  onOpenSettings,
  activeElement
}: GameMetadataViewProps) {
  const gameIndex = useSoloGameStore((state) => state.gameIndex);
  const arcaneDust = useArtefactStore((state) => state.arcaneDust);

  const settingsHover = 'hover:border-slate-300 hover:text-white hover:bg-slate-800';
  const settingsFocus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300';
  const settingsActive = 'data-[active=true]:shadow-[0_0_28px_rgba(125,211,252,0.95),_0_0_56px_rgba(125,211,252,0.55)] data-[active=true]:bg-slate-800/80';
  const actionButtonBase = `pt-0 pr-2 pb-2 pl-4 items-center justify-center text-slate-200 rounded-2xl border border-slate-600/70 bg-slate-900 text-5xl tracking-[0.18em] text-slate-100 ${settingsHover} ${settingsFocus} ${settingsActive}`;

  return (
    <div className="flex flex-row w-full border-b border-slate-600/70 pb-2 bg-slate-900/80 px-5 pt-3">
      {/* Left side: Game Title, Arcane Dust Counter, Settings Button */}
      <div className="w-full flex flex-row flex-[29] items-center gap-3">
        <ClickSoundButton
          title="⚙"
          action={onOpenSettings}
          isActive={activeElement === 'settings'}
          className={actionButtonBase}
        />
        <DeckButton
          isActive={activeElement === 'deck'}
          showDeckView={onOpenDeck}
        />
        <OverloadButton/>

        <HealthView />
        <RuneScoreView />
        <div className="flex flex-row gap-2 px-3 flex-1 justify-center items-center">
          <span className="text-lg font-semibold uppercase tracking-[0.28em] text-sky-200">Game</span>
          <span className="text-xl font-extrabold text-slate-200 leading-tight">{gameIndex + 1}</span>
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

    </div>
  );
}
