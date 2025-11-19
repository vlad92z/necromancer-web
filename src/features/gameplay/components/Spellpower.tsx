/**
 * Spellpower component - displays essence, focus, and spellpower stats
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

type StatIconType = 'health' | 'healing' | 'essence' | 'focus' | 'spellpower';

interface SpellpowerProps {
  playerName: string;
  isActive: boolean;
  nameColor: string;
  health: number;
  healing: number;
  essence: number;
  focus: number;
  totalPower: number;
  fireRuneCount: number;
  hasPenalty: boolean;
  hasWindMitigation: boolean;
  windRuneCount: number;
  onShowDeck: () => void;
  onShowLog: () => void;
  onShowRules: () => void;
}

function StatIcon({ type, color }: { type: StatIconType; color: string }) {
  const size = 26;
  const strokeProps = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  if (type === 'health') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 21s-7-4.35-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.65-7 9-7 9Z"
          fill={color}
          opacity={0.9}
        />
      </svg>
    );
  }

  if (type === 'healing') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 5v14" {...strokeProps} />
        <path d="M5 12h14" {...strokeProps} />
      </svg>
    );
  }

  if (type === 'essence') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M13 2 3 14h6l-1 8 10-12h-6l1-8Z" fill={color} opacity={0.85} />
      </svg>
    );
  }

  if (type === 'focus') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" {...strokeProps} />
        <circle cx="12" cy="12" r="2.5" fill={color} opacity={0.9} />
        <path d="M12 5v2.5" {...strokeProps} />
        <path d="M12 18.5V21" {...strokeProps} />
        <path d="M5 12h2.5" {...strokeProps} />
        <path d="M16.5 12H19" {...strokeProps} />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3v4" {...strokeProps} />
      <path d="M12 17v4" {...strokeProps} />
      <path d="M4 12h4" {...strokeProps} />
      <path d="M16 12h4" {...strokeProps} />
      <path d="m7 7 2.5 2.5" {...strokeProps} />
      <path d="m14.5 14.5 2.5 2.5" {...strokeProps} />
      <path d="m7 17 2.5-2.5" {...strokeProps} />
      <path d="m14.5 9.5 2.5-2.5" {...strokeProps} />
      <circle cx="12" cy="12" r="2" fill={color} opacity={0.95} />
    </svg>
  );
}

export function Spellpower({
  playerName,
  isActive,
  nameColor,
  health,
  healing,
  essence,
  focus,
  totalPower,
  fireRuneCount,
  hasPenalty,
  hasWindMitigation,
  windRuneCount,
  onShowDeck,
  onShowLog,
  onShowRules,
}: SpellpowerProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const healingDisplay = `+${healing}`;

  const statCards = [
    {
      key: 'health',
      label: 'Health',
      value: health,
      displayValue: health,
      icon: 'health' as StatIconType,
      accent: '#fb7185',
      background: 'rgba(251, 113, 133, 0.12)',
      border: 'rgba(251, 113, 133, 0.45)',
      subtitle: 'Remaining HP',
      motionKey: health,
    },
    {
      key: 'healing',
      label: 'Healing',
      value: healing,
      displayValue: healingDisplay,
      icon: 'healing' as StatIconType,
      accent: '#4ade80',
      background: 'rgba(74, 222, 128, 0.12)',
      border: 'rgba(74, 222, 128, 0.45)',
      subtitle: 'Life runes ready',
      motionKey: healing,
    },
    {
      key: 'essence',
      label: 'Essence',
      value: essence,
      displayValue: essence,
      icon: 'essence' as StatIconType,
      accent: '#38bdf8',
      background: 'rgba(56, 189, 248, 0.14)',
      border: 'rgba(56, 189, 248, 0.45)',
      subtitle: fireRuneCount > 0 ? `+${fireRuneCount} Fire bonus` : 'Active runes',
      badge: fireRuneCount > 0 ? { text: `🔥 ${fireRuneCount}`, color: '#f97316' } : null,
      motionKey: essence,
    },
    {
      key: 'focus',
      label: 'Focus',
      value: focus,
      displayValue: focus,
      icon: 'focus' as StatIconType,
      accent: hasPenalty ? '#fb7185' : '#facc15',
      background: hasPenalty ? 'rgba(251, 113, 133, 0.12)' : 'rgba(250, 204, 21, 0.14)',
      border: hasPenalty ? 'rgba(251, 113, 133, 0.5)' : 'rgba(250, 204, 21, 0.5)',
      subtitle: hasPenalty ? 'Floor penalty active' : 'Largest link',
      badge: hasWindMitigation ? { text: `💨 ${windRuneCount}`, color: '#38bdf8' } : null,
      motionKey: focus,
    },
    {
      key: 'spellpower',
      label: 'Spellpower',
      value: totalPower,
      displayValue: totalPower,
      icon: 'spellpower' as StatIconType,
      accent: '#c084fc',
      background: 'rgba(192, 132, 252, 0.18)',
      border: 'rgba(192, 132, 252, 0.55)',
      subtitle: 'Essence × Focus',
      span: 2,
      showHelp: true,
      motionKey: totalPower,
    },
  ];

  const quickActions = [
    { label: 'Deck', icon: '🎴', color: 'rgba(192, 132, 252, 0.28)', handler: onShowDeck },
    { label: 'Log', icon: '📜', color: 'rgba(59, 130, 246, 0.28)', handler: onShowLog },
    { label: 'Rules', icon: '❓', color: 'rgba(250, 204, 21, 0.28)', handler: onShowRules },
  ];

  return (
    <>
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '24px',
        border: isActive ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(11, 5, 26, 0.95)',
        padding: 'min(1.2vmin, 18px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'min(1.2vmin, 14px)',
        boxShadow: '0 18px 50px rgba(6, 0, 25, 0.55)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: `2px solid ${nameColor}`,
              color: '#f5f3ff',
              fontWeight: 700,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'uppercase',
              background: 'rgba(255, 255, 255, 0.08)'
            }}>
              {playerName.slice(0, 1)}
            </div>
            <div>
              <div style={{ fontSize: '16px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f5f3ff', fontWeight: 600 }}>
                {playerName}
              </div>
              <div style={{
                marginTop: '4px',
                fontSize: '12px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isActive ? '#a855f7' : '#7e6ca8'
              }}>
                {isActive ? 'Your Turn' : 'Stand By'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={(e) => {
                  e.stopPropagation();
                  action.handler();
                }}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '999px',
                  background: action.color,
                  color: '#f5f3ff',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {`${action.icon} ${action.label}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'min(1vmin, 12px)'
        }}>
          {statCards.map((card) => (
            <motion.div
              key={card.key}
              style={{
                position: 'relative',
                borderRadius: '18px',
                border: `1px solid ${card.border}`,
                background: card.background,
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                gridColumn: card.span ? `span ${card.span}` : undefined,
                boxShadow: `0 12px 30px ${card.accent}22`
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'rgba(12, 6, 30, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <StatIcon type={card.icon} color={card.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c1b7e6' }}>
                  {card.label}
                </div>
                <motion.div
                  key={`${card.key}-${card.motionKey}`}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 260 }}
                  style={{
                    fontSize: card.key === 'spellpower' ? '32px' : '24px',
                    fontWeight: 700,
                    color: '#f5f3ff',
                    marginTop: '4px'
                  }}
                >
                  {card.displayValue}
                </motion.div>
                <div style={{ fontSize: '12px', color: '#9d95c7', marginTop: '4px' }}>
                  {card.subtitle}
                </div>
                {card.badge && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#0b061c',
                    backgroundColor: card.badge.color,
                    borderRadius: '999px',
                    padding: '2px 8px',
                    display: 'inline-block'
                  }}>
                    {card.badge.text}
                  </div>
                )}
              </div>
              {card.showHelp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExplanation(true);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: `1px solid ${card.accent}`,
                    background: 'rgba(12, 6, 30, 0.9)',
                    color: '#f5f3ff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ?
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Explanation Popup */}
      {showExplanation && (
        <div
          onClick={() => setShowExplanation(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3, 0, 12, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(8, 3, 22, 0.95)',
              borderRadius: '24px',
              padding: '32px',
              width: 'min(520px, 90vw)',
              color: '#f5f3ff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '26px',
              color: '#c084fc',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              Spellpower
            </h2>
            
            <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#d3cffa' }}>
              <div style={{ marginBottom: '18px' }}>
                <strong style={{ color: '#38bdf8' }}>Essence</strong>
                <p style={{ margin: '6px 0 0 0' }}>
                  Count every rune on your Spell Wall, then add +1 Essence for each blazing Fire rune. More Essence means more raw energy.
                </p>
              </div>
              
              <div style={{ marginBottom: '18px' }}>
                <strong style={{ color: '#facc15' }}>Focus</strong>
                <p style={{ margin: '6px 0 0 0' }}>
                  Find the largest connected cluster of runes. That chain is your Focus. Floor penalties shrink it, but Wind runes staged in pattern lines shield you.
                </p>
              </div>
              
              <div style={{ marginBottom: '18px' }}>
                <strong style={{ color: '#c084fc' }}>Spellpower = Essence × Focus</strong>
                <p style={{ margin: '6px 0 0 0' }}>
                  Your final damage for the round. Push Essence high, keep Focus intact, and unleash devastating bursts.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowExplanation(false)}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                backgroundColor: '#a855f7',
                color: '#f5f3ff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
