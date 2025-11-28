/**
 * SoloStartScreen - entry screen for Solo mode setup
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RuneTypeCount } from '../../../types/game';

interface SoloStartScreenProps {
  onStartSolo: (runeTypeCount: RuneTypeCount) => void;
}

export function SoloStartScreen({ onStartSolo }: SoloStartScreenProps) {
  const navigate = useNavigate();
  const [runeTypeCount, setRuneTypeCount] = useState<RuneTypeCount>(5);

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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '22px',
          }}
        >
          <RuleCard title="Health" description="Start at 100 HP with a max of 1000. Healing is capped at max health." />
          <RuleCard title="Overload" description="Overflow runes become overload. Stress grows each round (base ×2) and Frost runes shave 10% off current stress." />
          <RuleCard title="Rune Power" description="Each round, your spellpower (essence × focus) is added to total Rune Power." />
          <RuleCard title="Frost" description="Each Frost rune on your wall reduces stress by 10% before overload damage applies." />
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
            {[3, 4, 5].map((count) => (
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
            {runeTypeCount === 5 && '5 rune types, 5x5 Spell Wall, longest and riskiest run.'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStartSolo(runeTypeCount)}
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
