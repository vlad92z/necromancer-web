/**
 * SoloStartScreen - entry screen for Solo mode setup
 */

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SoloRunConfig } from '../../../types/game';
import { DEFAULT_SOLO_CONFIG, RUNE_TYPES, normalizeSoloConfig } from '../../../utils/gameInitialization';
import { gradientButtonClasses } from '../../../styles/gradientButtonClasses';
import { FieldConfig } from '../../../components/FieldConfig';
import { SliderConfig } from '../../../components/SliderConfig';
import { ArtefactsView } from '../../../components/ArtefactsView';
import { ArtefactsRow } from '../../../components/ArtefactsRow';
import { useArtefactStore } from '../../../state/stores/artefactStore';
import arcaneDustIcon from '../../../assets/stats/arcane_dust.png';
import { useClickSound } from '../../../hooks/useClickSound';

interface SoloStartScreenProps {
  onStartSolo: (config: SoloRunConfig) => void;
  onContinueSolo?: () => void;
  canContinue?: boolean;
  longestRun?: number;
  arcaneDust?: number;
}

const inputClasses =
  'w-full rounded-lg border border-slate-600/70 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400';

export function SoloStartScreen({ onStartSolo, onContinueSolo, canContinue = false, longestRun = 0, arcaneDust = 0 }: SoloStartScreenProps) {
  const navigate = useNavigate();
  const playClick = useClickSound();
  const [soloConfig, setSoloConfig] = useState<SoloRunConfig>({ ...DEFAULT_SOLO_CONFIG });
  const [showAdvanced] = useState(false);
  const [showArtefactsModal, setShowArtefactsModal] = useState(false);
  const formattedDust = arcaneDust.toLocaleString();
  const selectedArtefactIds = useArtefactStore((state) => state.selectedArtefactIds);

  const updateConfigValue = <K extends keyof SoloRunConfig>(key: K, value: SoloRunConfig[K]) => {
    setSoloConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberInput =
    <K extends keyof SoloRunConfig>(key: K, clamp?: (value: number) => number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = Number(event.target.value);
      const parsedValue = Number.isNaN(rawValue) ? 0 : rawValue;
      const nextValue = clamp ? clamp(parsedValue) : parsedValue;
      updateConfigValue(key, nextValue as SoloRunConfig[typeof key]);
    };

  const normalizedConfig = normalizeSoloConfig(soloConfig);

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

        <section className="space-y-2">
          {/* <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-200">Run Setup</div>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="rounded-xl border border-slate-600/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sky-300 transition hover:border-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              {showAdvanced ? 'Hide' : 'Advanced'}
            </button>
          </div> */}

          {showAdvanced && (
            <div className="space-y-4 rounded-2xl border border-slate-600/40 bg-slate-900/50 p-4 backdrop-blur">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
                <FieldConfig label="Starting Health" description="Health pool when the run begins.">
                  <input
                    type="number"
                    min={1}
                    value={soloConfig.startingHealth}
                    onChange={handleNumberInput('startingHealth', (value) => Math.max(1, value))}
                    className={inputClasses}
                  />
                </FieldConfig>
                <FieldConfig label="Starting Fatigue" description="Base overload (strain) applied during scoring.">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={soloConfig.startingStrain}
                    onChange={handleNumberInput('startingStrain', (value) => Math.max(0, value))}
                    className={inputClasses}
                  />
                </FieldConfig>
                <SliderConfig
                  label="Strain Multiplier"
                  description="round-by-round growth applied to strain."
                  min={1}
                  max={2}
                  step={0.1}
                  value={soloConfig.strainMultiplier}
                  onChange={(value) => updateConfigValue('strainMultiplier', value)}
                  valueLabel={`${soloConfig.strainMultiplier.toFixed(1)}x strain growth`}
                />
                <FieldConfig label="Rune Target Score" description="Minimum Rune Power needed before the run ends.">
                  <input
                    type="number"
                    min={1}
                    step={10}
                    value={soloConfig.targetRuneScore}
                    onChange={handleNumberInput('targetRuneScore', (value) => Math.max(1, value))}
                    className={inputClasses}
                  />
                </FieldConfig>
                <SliderConfig
                  label="Deck Size"
                  description="How many of each rune type appear in your deck."
                  min={8}
                  max={30}
                  step={1}
                  value={soloConfig.deckRunesPerType}
                  onChange={(value) => updateConfigValue('deckRunesPerType', value)}
                  valueLabel={`${soloConfig.deckRunesPerType} of each rune (${soloConfig.deckRunesPerType * RUNE_TYPES.length} total)`}
                />
              </div>
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
              onStartSolo(normalizedConfig);
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
