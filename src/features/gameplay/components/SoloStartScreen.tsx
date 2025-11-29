/**
 * SoloStartScreen - entry screen for Solo mode setup
 */

import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RuneTypeCount, SoloRunConfig } from '../../../types/game';
import { DEFAULT_SOLO_CONFIG, normalizeSoloConfig } from '../../../utils/gameInitialization';

interface SoloStartScreenProps {
  onStartSolo: (runeTypeCount: RuneTypeCount, config: SoloRunConfig) => void;
}

export function SoloStartScreen({ onStartSolo }: SoloStartScreenProps) {
  const navigate = useNavigate();
  const [runeTypeCount, setRuneTypeCount] = useState<RuneTypeCount>(6);
  const [soloConfig, setSoloConfig] = useState<SoloRunConfig>({ ...DEFAULT_SOLO_CONFIG });

  const updateConfigValue = <K extends keyof SoloRunConfig>(key: K, value: number) => {
    setSoloConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberInput = (key: keyof SoloRunConfig, clamp?: (value: number) => number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = Number(event.target.value);
    const parsedValue = Number.isNaN(rawValue) ? 0 : rawValue;
    const nextValue = clamp ? clamp(parsedValue) : parsedValue;
    updateConfigValue(key, nextValue);
  };

  const normalizedConfig = normalizeSoloConfig(soloConfig);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b1024',
        color: '#f8fafc',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.85))',
          borderRadius: '16px',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55)',
          padding: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              color: '#93c5fd',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
          >
            ← Back
          </button>
          <div style={{ color: '#cbd5e1', fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Solo Mode
          </div>
        </div>

        <h1 style={{ fontSize: '42px', margin: 0, marginBottom: '6px' }}>Solo Run</h1>
        <p style={{ color: '#cbd5e1', margin: 0, marginBottom: '22px', fontSize: '16px' }}>
          Draft from your own Runeforges, withstand overload, and chase the highest Rune Power.
        </p>

        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#0b1433',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#dbeafe', marginBottom: '10px' }}>Run Setup</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
            }}
          >
            <ConfigField label="Starting Health" description="Health pool when the run begins.">
              <input
                type="number"
                min={1}
                value={soloConfig.startingHealth}
                onChange={handleNumberInput('startingHealth', (value) => Math.max(1, value))}
                style={inputStyle}
              />
            </ConfigField>
            <ConfigField label="Starting Fatigue" description="Base overload (strain) applied during scoring.">
              <input
                type="number"
                min={0}
                step={1}
                value={soloConfig.startingStrain}
                onChange={handleNumberInput('startingStrain', (value) => Math.max(0, value))}
                style={inputStyle}
              />
            </ConfigField>
            <ConfigField label="Fatigue Multiplier" description="Round-by-round growth applied to fatigue.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="range"
                  min={1}
                  max={2}
                  step={0.1}
                  value={soloConfig.strainMultiplier}
                  onChange={(event) => updateConfigValue('strainMultiplier', Number(event.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ color: '#cbd5e1', fontSize: '13px' }}>{soloConfig.strainMultiplier.toFixed(1)}x fatigue growth</div>
              </div>
            </ConfigField>
            <ConfigField label="Healing per Rune" description="Healing per Life, Wind, or Frost rune that lands on your wall.">
              <input
                type="number"
                min={0}
                step={1}
                value={soloConfig.lifeRuneHealing}
                onChange={handleNumberInput('lifeRuneHealing', (value) => Math.max(0, value))}
                style={inputStyle}
              />
            </ConfigField>
            <ConfigField label="Rune Target Score" description="Minimum Rune Power needed before the run ends.">
              <input
                type="number"
                min={1}
                step={10}
                value={soloConfig.targetRuneScore}
                onChange={handleNumberInput('targetRuneScore', (value) => Math.max(1, value))}
                style={inputStyle}
              />
            </ConfigField>
            <ConfigField label="Runeforges" description="How many personal factories deal into your pool.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={soloConfig.factoriesPerPlayer}
                  onChange={(event) => updateConfigValue('factoriesPerPlayer', Number(event.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ color: '#cbd5e1', fontSize: '13px' }}>{soloConfig.factoriesPerPlayer} runeforges</div>
              </div>
            </ConfigField>
            <ConfigField label="Deck Size" description="How many of each rune type appear in your deck.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="range"
                  min={8}
                  max={30}
                  step={1}
                  value={soloConfig.deckRunesPerType}
                  onChange={(event) => updateConfigValue('deckRunesPerType', Number(event.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  {soloConfig.deckRunesPerType} of each rune ({soloConfig.deckRunesPerType * runeTypeCount} total)
                </div>
              </div>
            </ConfigField>
          </div>
        </div>

        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#0b1433',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#dbeafe', marginBottom: '10px' }}>Board Size</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[4, 6].map((count) => (
              <button
                key={count}
                onClick={() => setRuneTypeCount(count as RuneTypeCount)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: runeTypeCount === count ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)',
                  background: runeTypeCount === count ? 'linear-gradient(135deg, #38bdf8, #818cf8)' : 'transparent',
                  color: runeTypeCount === count ? '#0b1024' : '#e2e8f0',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={(event) => {
                  if (runeTypeCount !== count) {
                    event.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                  }
                }}
                onMouseLeave={(event) => {
                  if (runeTypeCount !== count) {
                    event.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {count}x{count}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '8px', color: '#93c5fd', fontSize: '13px' }}>
            {runeTypeCount === 3 && '3 rune types, 3x3 Spell Wall, light overload pressure.'}
            {runeTypeCount === 4 && '4 rune types, 4x4 Spell Wall, balanced Solo pace.'}
            {runeTypeCount === 5 && '5 rune types, 5x5 Spell Wall, extended run with heavy pressure.'}
            {runeTypeCount === 6 && '6 rune types, 6x6 Spell Wall, Lightning joins for maximal Essence scaling.'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStartSolo(runeTypeCount, normalizedConfig)}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
            color: '#0b1024',
            fontWeight: 800,
            fontSize: '18px',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 18px 40px rgba(59, 130, 246, 0.35)',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Begin Solo Run
        </button>
      </div>
    </div>
  );
}

interface RuleCardProps {
  title: string;
  description: string;
}

interface ConfigFieldProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function RuleCard({ title, description }: RuleCardProps) {
  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div style={{ fontWeight: 700, color: '#e0f2fe', marginBottom: '8px' }}>{title}</div>
      <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>{description}</div>
    </div>
  );
}

function ConfigField({ label, description, children }: ConfigFieldProps) {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ fontWeight: 700, color: '#e0f2fe', fontSize: '15px' }}>{label}</div>
      <div style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.4 }}>{description}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.4)',
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  fontSize: '14px',
  outline: 'none',
};
