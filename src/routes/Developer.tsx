/**
 * Developer - Developer-only UI for previewing view-level animations
 * Provides isolated demo of Spellpower component with configurable inputs
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spellpower } from '../features/gameplay/components/Spellpower';
import { useGameplayStore } from '../state/stores/gameplayStore';
import type { Player, RoundScore } from '../types/game';

// Base animation duration from Spellpower component timing constants
// HEAL_ANIMATION_DURATION_MS (500) + HEAL_TO_DAMAGE_DELAY_MS (250) + 
// DAMAGE_ANIMATION_DURATION_MS (500) + PLAYER_SEQUENCE_PADDING_MS (500) +
// BASE_SEQUENCE_DELAY_MS (1200) = 2950ms total for full sequence
const BASE_ANIMATION_DURATION_MS = 2950;
const ANIMATION_BUFFER_MS = 500;

export function Developer() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(300);
  const [healing, setHealing] = useState(20);
  const [opponentDamage, setOpponentDamage] = useState(0);
  const [focus, setFocus] = useState(5);
  const [essence, setEssence] = useState(10);
  // Spellpower is always Essence × Focus (match real game logic)
  const computedSpellpower = essence * focus;
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Store snapshot for restoration
  const [originalState, setOriginalState] = useState<{
    players: [Player, Player];
    roundHistory: RoundScore[];
  } | null>(null);

  const handleStart = async () => {
    setIsAnimating(true);
    setStatusMessage('Animation starting...');

    const store = useGameplayStore.getState();
    
    // Snapshot current store state
    const snapshot = {
      players: store.players,
      roundHistory: store.roundHistory,
    };
    // Keep a local copy for deterministic restore after async waits
    setOriginalState(snapshot);

    // Create synthetic round data
    const demoRound: RoundScore = {
      round: store.roundHistory.length + 1,
      playerName: store.players[0].name,
      playerEssence: essence,
      playerFocus: focus,
      playerTotal: computedSpellpower,
      opponentName: store.players[1]?.name ?? 'Opponent',
      opponentEssence: 0,
      opponentFocus: 0,
      opponentTotal: opponentDamage,
    };

    // Calculate start and target healths
    const startHealth = health;
    const playerMaxHealth = store.players[0]?.maxHealth ?? Infinity;
    const rawTarget = startHealth + healing - opponentDamage;
    const targetHealth = Math.max(0, Math.min(playerMaxHealth, Math.round(rawTarget)));

    // Also compute opponent health change (player's outgoing damage reduces opponent)
    const opponentStart = store.players[1]?.health ?? 0;
    const opponentMax = store.players[1]?.maxHealth ?? Infinity;
    const opponentTarget = Math.max(0, Math.min(opponentMax, Math.round(opponentStart - computedSpellpower)));

    // 1) Set players to the START health so UI reflects pre-round state
    const updatedPlayersStart: [Player, Player] = [
      {
        ...store.players[0],
        health: startHealth,
      },
      {
        ...store.players[1],
        health: opponentStart,
      },
    ];

    useGameplayStore.setState({ players: updatedPlayersStart });

    // 2) Append the demo round so components can read incoming/outgoing totals
    useGameplayStore.setState({ roundHistory: [...store.roundHistory, demoRound] });

    // 3) On next frame, set final healths to trigger the heal -> damage animation
    setTimeout(() => {
      const updatedPlayersFinal: [Player, Player] = [
        {
          ...store.players[0],
          health: targetHealth,
        },
        {
          ...store.players[1],
          health: opponentTarget,
        },
      ];
      useGameplayStore.setState({ players: updatedPlayersFinal });
    }, 0);

    // Wait for animation to complete (scaled by animation speed)
    const animationDuration = BASE_ANIMATION_DURATION_MS * animationSpeed + ANIMATION_BUFFER_MS;
    
    await new Promise((resolve) => setTimeout(resolve, animationDuration));

    // NOTE: do NOT automatically restore the original store here.
    // We intentionally leave the demo state in the store after the
    // animation completes so the Developer view reflects the final
    // round-end state. Manual `Reset` or `Back` will restore the
    // previously saved snapshot if the user requests it.

    setIsAnimating(false);
    setStatusMessage('Animation complete');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleReset = () => {
    // Apply current text-field values to the store immediately (no animations)
    const store = useGameplayStore.getState();

    const startHealth = health;
    const playerMaxHealth = store.players[0]?.maxHealth ?? Infinity;
    const rawTarget = startHealth + healing - opponentDamage;
    const targetHealth = Math.max(0, Math.min(playerMaxHealth, Math.round(rawTarget)));

    const opponentStart = store.players[1]?.health ?? 0;
    const opponentMax = store.players[1]?.maxHealth ?? Infinity;
    const opponentTarget = Math.max(0, Math.min(opponentMax, Math.round(opponentStart - computedSpellpower)));

    const updatedPlayersFinal: [Player, Player] = [
      {
        ...store.players[0],
        health: targetHealth,
      },
      {
        ...store.players[1],
        health: opponentTarget,
      },
    ];

    // Restore roundHistory to the original snapshot if available to avoid
    // triggering the round-end animations; otherwise leave it as-is.
    const desiredRoundHistory = originalState ? originalState.roundHistory : store.roundHistory;

    useGameplayStore.setState({ players: updatedPlayersFinal, roundHistory: desiredRoundHistory });

    setStatusMessage('State applied (no animation)');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleBack = () => {
    // Restore state before leaving
    if (originalState) {
      useGameplayStore.setState({
        players: originalState.players,
        roundHistory: originalState.roundHistory,
      });
    }
    navigate('/');
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '20px',
    gap: '20px',
  };

  const leftPanelStyle: React.CSSProperties = {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const rightPanelStyle: React.CSSProperties = {
    width: '360px',
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '4px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#aaaaaa',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px',
    fontSize: '16px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #444444',
    borderRadius: '4px',
    marginBottom: '16px',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '16px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#333333',
    color: '#666666',
    cursor: 'not-allowed',
    opacity: 0.5,
  };

  const backButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#666666',
  };

  const statusStyle: React.CSSProperties = {
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a',
    textAlign: 'center',
    fontSize: '14px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const spellpowerContainerStyle: React.CSSProperties = {
    maxWidth: '400px',
    width: '100%',
  };

  // Get current player data from store for Spellpower component
  const players = useGameplayStore((state) => state.players);
  const currentPlayer = players[0];

  return (
    <div style={containerStyle}>
      <div style={leftPanelStyle}>
        <div style={spellpowerContainerStyle}>
          <Spellpower
            playerId={currentPlayer.id}
            playerName={currentPlayer.name}
            isActive={true}
            nameColor="#a855f7"
            health={currentPlayer.health}
            healing={healing}
            essence={essence}
            focus={focus}
            totalPower={computedSpellpower}
            fireRuneCount={0}
            hasPenalty={false}
            hasWindMitigation={false}
            windRuneCount={0}
            onShowDeck={() => {}}
            onShowLog={() => {}}
            onShowRules={() => {}}
            animationScale={animationSpeed}
          />
        </div>
      </div>

      <div style={rightPanelStyle}>
        <div>
          <h2 style={titleStyle}>Developer Controls</h2>
          <p style={{ fontSize: '14px', color: '#888'}}>
            Configure and preview Spellpower animations
          </p>
        </div>

        <div>
          <label htmlFor="health-input" style={labelStyle}>
            Health
          </label>
          <input
            id="health-input"
            type="number"
            min="1"
            max="300"
            value={health}
            onChange={(e) => setHealth(Number(e.target.value))}
            style={inputStyle}
            disabled={isAnimating}
          />
        </div>

        <div>
          <label htmlFor="healing-input" style={labelStyle}>
            Healing
          </label>
          <input
            id="healing-input"
            type="number"
            min="0"
            max="50"
            value={healing}
            onChange={(e) => setHealing(Number(e.target.value))}
            style={inputStyle}
            disabled={isAnimating}
          />
        </div>

        <div>
          <label htmlFor="opponent-damage-input" style={labelStyle}>
            Opponent damage
          </label>
          <input
            id="opponent-damage-input"
            type="number"
            min="0"
            max="9999"
            value={opponentDamage}
            onChange={(e) => setOpponentDamage(Number(e.target.value))}
            style={inputStyle}
            disabled={isAnimating}
          />
        </div>

        <div>
          <label htmlFor="essence-input" style={labelStyle}>
            Essence
          </label>
          <input
            id="essence-input"
            type="number"
            min="0"
            max="50"
            value={essence}
            onChange={(e) => setEssence(Number(e.target.value))}
            style={inputStyle}
            disabled={isAnimating}
          />
        </div>

        <div>
          <label htmlFor="focus-input" style={labelStyle}>
            Focus
          </label>
          <input
            id="focus-input"
            type="number"
            min="0"
            max="50"
            value={focus}
            onChange={(e) => setFocus(Number(e.target.value))}
            style={inputStyle}
            disabled={isAnimating}
          />
        </div>

        <div>
          <label htmlFor="animation-speed" style={labelStyle}>
            Animation speed (1.0x = normal)
          </label>
          <input
            id="animation-speed"
            type="range"
            min="0.25"
            max="2.0"
            step="0.05"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            style={sliderStyle}
            disabled={isAnimating}
          />
          <div style={{ fontSize: '12px', color: '#888', marginTop: '-8px', marginBottom: '16px' }}>
            {animationSpeed.toFixed(2)}x (0.25x - 2.0x)
          </div>
        </div>

        <div style={statusStyle} aria-live="polite">
          {statusMessage || '\u00A0'}
        </div>

        <button
          style={isAnimating ? disabledButtonStyle : buttonStyle}
          onClick={handleStart}
          disabled={isAnimating}
          onMouseEnter={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.backgroundColor = '#5ab0ff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.backgroundColor = '#4a9eff';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isAnimating ? 'Animating...' : 'Start Animation'}
        </button>

        <button
          style={isAnimating ? disabledButtonStyle : buttonStyle}
          onClick={handleReset}
          disabled={isAnimating}
          onMouseEnter={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.backgroundColor = '#5ab0ff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.backgroundColor = '#4a9eff';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          Reset
        </button>

        <button
          style={backButtonStyle}
          onClick={handleBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#777777';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#666666';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
