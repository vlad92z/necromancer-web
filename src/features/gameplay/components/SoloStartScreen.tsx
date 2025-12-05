/**
 * SoloStartScreen - entry screen for Solo mode setup
 */

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RuneTypeCount, SoloRunConfig } from '../../../types/game';
import { DEFAULT_SOLO_CONFIG, normalizeSoloConfig } from '../../../utils/gameInitialization';
import { gradientButtonClasses } from '../../../styles/gradientButtonClasses';
import { FieldConfig } from '../../../components/FieldConfig';
import { SliderConfig } from '../../../components/SliderConfig';

interface SoloStartScreenProps {
  onStartSolo: (runeTypeCount: RuneTypeCount, config: SoloRunConfig) => void;
  onContinueSolo?: () => void;
  canContinue?: boolean;
  bestRound?: number;
  arcaneDust?: number;
}

const inputClasses =
  'w-full rounded-lg border border-slate-600/70 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400';

export function SoloStartScreen({ onStartSolo, onContinueSolo, canContinue = false, bestRound = 0, arcaneDust = 0 }: SoloStartScreenProps) {
  const navigate = useNavigate();
  const [runeTypeCount, setRuneTypeCount] = useState<RuneTypeCount>(6);
  const [soloConfig, setSoloConfig] = useState<SoloRunConfig>({ ...DEFAULT_SOLO_CONFIG });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const formattedDust = arcaneDust.toLocaleString();

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

  const patternToggleClasses = soloConfig.patternLinesLockOnComplete
    ? 'border-transparent bg-gradient-to-br from-sky-500 to-purple-700 text-slate-200 shadow-[0_12px_30px_rgba(59,130,246,0.35)]'
    : 'border-slate-600/60 bg-slate-900/30 text-slate-200 hover:border-slate-400/70';

  const boardButtonClass = (count: number) => {
    const isActive = runeTypeCount === count;
    const base =
      'flex-1 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300';
    const active =
      'border-transparent bg-gradient-to-br from-sky-500 to-purple-600 text-slate-950 shadow-[0_12px_30px_rgba(59,130,246,0.35)]';
    const inactive = 'border-slate-600/40 bg-transparent text-slate-200 hover:border-slate-400/60 hover:bg-slate-900/50';
    return `${base} ${isActive ? active : inactive}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1024] px-6 py-6 text-slate-100">
        <div
          className="w-[min(1100px,_94vw)] min-h-[calc(min(1100px,_94vw)_*_2/3)] space-y-4 rounded-2xl border border-slate-700/40 bg-[linear-gradient(145deg,_rgba(17,24,39,0.95),_rgba(30,41,59,0.85))] px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        >
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            ← Back
          </button>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Solo Mode</div>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-50">Solo Run</h1>
          <p className="text-base text-slate-300">
            Draft from your own Runeforges, withstand overload, and chase the highest Rune Power.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-slate-900/70 px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-sky-100 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
              <span className="text-[11px] text-sky-300">Best Round</span>
              <span className="text-lg font-extrabold text-slate-50">{bestRound > 0 ? bestRound : '--'}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-100/5 px-3 py-2 text-[13px] font-extrabold uppercase tracking-[0.18em] text-amber-100 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
              <span className="text-[11px] font-semibold text-amber-200/90">Arcane Dust</span>
              <span className="text-lg text-amber-200">{formattedDust}</span>
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-200">Run Setup</div>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="rounded-xl border border-slate-600/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sky-300 transition hover:border-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              {showAdvanced ? 'Hide Advanced' : 'Advanced Options'}
            </button>
          </div>

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
                  label="Fatigue Multiplier"
                  description="Round-by-round growth applied to fatigue."
                  min={1}
                  max={2}
                  step={0.1}
                  value={soloConfig.strainMultiplier}
                  onChange={(value) => updateConfigValue('strainMultiplier', value)}
                  valueLabel={`${soloConfig.strainMultiplier.toFixed(1)}x fatigue growth`}
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
                  valueLabel={`${soloConfig.deckRunesPerType} of each rune (${soloConfig.deckRunesPerType * runeTypeCount} total)`}
                />
              </div>
            </div>
          )}
        </section>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          {canContinue && onContinueSolo && (
            <button
              type="button"
              onClick={onContinueSolo}
              className="w-full rounded-xl border border-slate-500/70 bg-slate-900/70 px-6 py-4 text-center text-base font-bold uppercase tracking-[0.2em] text-slate-100 transition hover:border-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Continue Run
            </button>
          )}
          <button
            type="button"
            onClick={() => onStartSolo(runeTypeCount, normalizedConfig)}
            className={`${gradientButtonClasses} w-full px-6 py-4 text-center text-lg font-extrabold uppercase tracking-[0.3em] focus-visible:outline-sky-300`}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
