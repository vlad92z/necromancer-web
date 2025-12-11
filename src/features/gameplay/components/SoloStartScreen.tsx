/**
 * SoloStartScreen - entry screen for Solo mode setup
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RunConfig } from '../../../types/game';
import { DEFAULT_SOLO_CONFIG } from '../../../utils/gameInitialization';
import { gradientButtonClasses } from '../../../styles/gradientButtonClasses';
import { ArtefactsView } from '../../../components/ArtefactsView';
import { ArtefactsRow } from '../../../components/ArtefactsRow';
import { useArtefactStore } from '../../../state/stores/artefactStore';
import arcaneDustIcon from '../../../assets/stats/arcane_dust.png';
import { useClickSound } from '../../../hooks/useClickSound';

interface SoloStartScreenProps {
  onStartSolo: (config: RunConfig) => void;
  onContinueSolo?: () => void;
  canContinue?: boolean;
  longestRun?: number;
  arcaneDust?: number;
}

export function SoloStartScreen({ onStartSolo, onContinueSolo, canContinue = false, longestRun = 0, arcaneDust = 0 }: SoloStartScreenProps) {
  const navigate = useNavigate();
  const playClick = useClickSound();
  const [showArtefactsModal, setShowArtefactsModal] = useState(false);
  const formattedDust = arcaneDust.toLocaleString();
  const selectedArtefactIds = useArtefactStore((state) => state.selectedArtefactIds);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1024] px-6 py-6 text-slate-100">
        <div
          className="w-[min(1100px,_94vw)] min-h-[calc(min(1100px,_94vw)_*_2/3)] space-y-4 rounded-2xl border border-slate-700/40 bg-[linear-gradient(145deg,_rgba(17,24,39,0.95),_rgba(30,41,59,0.85))] px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        >
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              playClick();
              navigate('/');
            }}
            className="rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-50">Solo Run</h1>
          <p className="text-base text-slate-300">
            Draft runes to cast increeasingly powerful spells while surviving overload damage
          </p>
          <div className="flex flex-wrap gap-3">
            {longestRun > 2 && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-slate-900/70 px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-sky-100 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                <span className="text-[11px] text-sky-300">Longest Run</span>
                <span className="text-lg font-extrabold text-slate-50">{longestRun - 1}</span>
              </div>
            )}

            {arcaneDust > 0 && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-100/5 px-3 py-2 text-[13px] font-extrabold uppercase tracking-[0.18em] text-amber-100 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                <img src={arcaneDustIcon} alt="Arcane Dust" className="h-8 w-8" />
                <span className="text-lg text-amber-200">{formattedDust}</span>
              </div>
            )}
          </div>
        </div>

        {/* Artefacts Section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-200">Artefacts</div>
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowArtefactsModal(true);
              }}
              className="rounded-xl border border-purple-500/30 bg-purple-900/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-300 transition hover:border-purple-400 hover:bg-purple-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              Manage
            </button>
          </div>
          {selectedArtefactIds.length > 0 && (
            <div className="rounded-xl border border-slate-600/40 bg-slate-900/50 p-4">
              <ArtefactsRow selectedArtefactIds={selectedArtefactIds} />
            </div>
          )}
        </section>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          {canContinue && onContinueSolo && (
            <button
              type="button"
              onClick={() => {
                playClick();
                onContinueSolo();
              }}
              className="w-full rounded-xl border border-slate-500/70 bg-slate-900/70 px-6 py-4 text-center text-base font-bold uppercase tracking-[0.2em] text-slate-100 transition hover:border-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Continue Run
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              playClick();
              onStartSolo(DEFAULT_SOLO_CONFIG);
            }}
            className={`${gradientButtonClasses} w-full px-6 py-4 text-center text-lg font-extrabold uppercase tracking-[0.3em] focus-visible:outline-sky-300`}
          >
            New Game
          </button>
        </div>
      </div>

      {/* Artefacts Modal */}
      <ArtefactsView isOpen={showArtefactsModal} onClose={() => setShowArtefactsModal(false)} />
    </div>
  );
}
