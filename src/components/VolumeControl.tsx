/**
 * VolumeControl - music and sound volume overlay control
 */
import React from 'react';
import type { ChangeEvent } from 'react';

interface VolumeControlProps {
  soundVolume: number; // 0..1
  isMusicMuted: boolean;
  onToggleMusic: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function VolumeControl({ soundVolume, isMusicMuted, onToggleMusic, onVolumeChange }: VolumeControlProps): JSX.Element {
  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '999px',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        background: 'rgba(12, 10, 24, 0.75)',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#c7d2fe', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Volume</span>
          <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 700 }}>{Math.round(soundVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(soundVolume * 100)}
          onChange={onVolumeChange}
          aria-label="Sound volume"
          style={{
            width: '100%',
            accentColor: '#7c3aed',
            cursor: 'pointer',
          }}
        />
      </div>
      <button
        type="button"
        onClick={onToggleMusic}
        aria-pressed={isMusicMuted}
        style={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          borderRadius: '999px',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          background: isMusicMuted ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(127, 29, 29, 0.35))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(124, 58, 237, 0.35))',
          color: '#e2e8f0',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
          transition: 'transform 120ms ease, box-shadow 120ms ease',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'translateY(-1px)';
          event.currentTarget.style.boxShadow = '0 18px 42px rgba(0, 0, 0, 0.6)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'translateY(0)';
          event.currentTarget.style.boxShadow = '0 14px 36px rgba(0, 0, 0, 0.45)';
        }}
      >
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isMusicMuted ? '#f87171' : '#34d399',
            boxShadow: '0 0 12px rgba(255, 255, 255, 0.35)',
          }}
          aria-hidden={true}
        />
        {isMusicMuted ? 'Music Muted' : 'Music On'}
      </button>
    </div>
  );
}
