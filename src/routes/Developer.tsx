/**
 * Developer - Developer-only UI for previewing view-level animations
 * Provides isolated demo of Spellpower component with configurable inputs
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerStats } from '../features/gameplay/components/PlayerStats';
import { useGameplayStore } from '../state/stores/gameplayStore';
import type { Player, RoundScore } from '../types/game';

// Base animation duration from Spellpower component timing constants
// HEAL_ANIMATION_DURATION_MS (500) + HEAL_TO_DAMAGE_DELAY_MS (250) + 
// DAMAGE_ANIMATION_DURATION_MS (500) + PLAYER_SEQUENCE_PADDING_MS (500) +
// BASE_SEQUENCE_DELAY_MS (1200) = 2950ms total for full sequence
const BASE_ANIMATION_DURATION_MS = 2950;
const ANIMATION_BUFFER_MS = 500;

const LIFE_RUNE_POSITIONS: Array<[number, number]> = [
  [0, 2],
  [1, 1],
  [1, 3],
  [2, 2],
  [3, 2],
];

const clampHealthValue = (value: number, maxHealth?: number) => {
  const upperBound = typeof maxHealth === 'number' ? maxHealth : Infinity;
  return Math.max(0, Math.min(upperBound, Math.round(value)));
};

const buildLifeWall = (baseWall: import('../types/game').Player['wall'], count: number): import('../types/game').Player['wall'] => {
  const safeCount = Math.max(0, Math.min(5, Math.round(count)));
  const wallTemplate: import('../types/game').ScoringWall =
    baseWall.length === 5 && baseWall.every((row) => row.length === 5)
      ? baseWall.map((row) => row.map(() => ({ runeType: null })))
      : Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ runeType: null })));

  LIFE_RUNE_POSITIONS.slice(0, safeCount).forEach(([row, col]) => {
    if (wallTemplate[row]?.[col]) {
      wallTemplate[row][col] = { runeType: 'Life' };
    }
  });

  return wallTemplate;
};

export function Developer() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(300);
  const [lifeRuneCount, setLifeRuneCount] = useState(2);
  const [incomingDamage, setIncomingDamage] = useState(0);
  const [focus] = useState(5);
  const [essence] = useState(10);
  // Spellpower is always Essence × Focus (match real game logic)
  const computedSpellpower = essence * focus;
  const healingAmount = lifeRuneCount * 10;
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  // Apply initial developer-controlled values into the store.
  const applyHealthToStore = useCallback((nextHealth: number) => {
    const store = useGameplayStore.getState();
    const playerMaxHealth = store.players[0]?.maxHealth ?? Infinity;
    const targetHealth = clampHealthValue(nextHealth, playerMaxHealth);

    const updatedPlayers: [Player, Player] = [
      {
        ...store.players[0],
        health: targetHealth,
      },
      store.players[1],
    ];

    useGameplayStore.setState({ players: updatedPlayers });
  }, []);

  const applyLifeRunesToStore = useCallback((nextCount: number) => {
    const store = useGameplayStore.getState();
    const updatedPlayers: [Player, Player] = [
      {
        ...store.players[0],
        wall: buildLifeWall(store.players[0].wall, nextCount),
      },
      store.players[1],
    ];

    useGameplayStore.setState({ players: updatedPlayers });
  }, []);

  useEffect(() => {
    applyHealthToStore(health);
    applyLifeRunesToStore(lifeRuneCount);
  }, [applyHealthToStore, applyLifeRunesToStore, health, lifeRuneCount]);

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
      opponentEssence: incomingDamage,
      opponentFocus: 1,
      opponentTotal: incomingDamage,
    };

    // Calculate start and target healths
    const startHealth = clampHealthValue(health, store.players[0]?.maxHealth);
    const playerMaxHealth = store.players[0]?.maxHealth ?? Infinity;
    const healedHealth = Math.min(playerMaxHealth, startHealth + healingAmount);
    const targetHealth = Math.max(0, Math.round(healedHealth - incomingDamage));

    // Also compute opponent health change (player's outgoing damage reduces opponent)
    const opponentStart = store.players[1]?.health ?? 0;
    const opponentMax = store.players[1]?.maxHealth ?? Infinity;
    const opponentTarget = Math.max(0, Math.min(opponentMax, Math.round(opponentStart - computedSpellpower)));

    // 1) Set players to the START health so UI reflects pre-round state
    const updatedPlayersStart: [Player, Player] = [
      {
        ...store.players[0],
        health: startHealth,
        wall: buildLifeWall(store.players[0].wall, lifeRuneCount),
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
          wall: buildLifeWall(store.players[0].wall, lifeRuneCount),
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

    const startHealth = clampHealthValue(health, store.players[0]?.maxHealth);
    const playerMaxHealth = store.players[0]?.maxHealth ?? Infinity;
    const healedHealth = Math.min(playerMaxHealth, startHealth + healingAmount);
    const targetHealth = Math.max(0, Math.round(healedHealth - incomingDamage));

    const opponentStart = store.players[1]?.health ?? 0;
    const opponentMax = store.players[1]?.maxHealth ?? Infinity;
    const opponentTarget = Math.max(0, Math.min(opponentMax, Math.round(opponentStart - computedSpellpower)));

    const updatedPlayersFinal: [Player, Player] = [
      {
        ...store.players[0],
        health: targetHealth,
        wall: buildLifeWall(store.players[0].wall, lifeRuneCount),
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
          <PlayerStats
            playerName={currentPlayer.name}
            isActive={true}
            nameColor="#a855f7"
            health={currentPlayer.health}
            healing={healingAmount}
            essence={essence}
            focus={focus}
            totalPower={computedSpellpower}
            fireRuneCount={0}
            hasPenalty={false}
            hasWindMitigation={false}
            windRuneCount={0}
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
            onChange={(e) => {
              const v = Number(e.target.value);
              const clamped = clampHealthValue(v, useGameplayStore.getState().players[0]?.maxHealth);
              setHealth(clamped);
              applyHealthToStore(clamped);
            }}
            style={inputStyle}
            disabled={isAnimating}
          />
        </div>

        <div>
          <label htmlFor="life-runes-input" style={labelStyle}>
            Life runes (1-5)
          </label>
          <input
            id="life-runes-input"
            type="range"
            min="1"
            max="5"
            step="1"
            value={lifeRuneCount}
            onChange={(e) => {
              const v = Number(e.target.value);
              setLifeRuneCount(v);
              applyLifeRunesToStore(v);
            }}
            style={sliderStyle}
            disabled={isAnimating}
          />
          <div style={{ fontSize: '12px', color: '#888', marginTop: '-8px', marginBottom: '16px' }}>
            {lifeRuneCount} Life rune{lifeRuneCount === 1 ? '' : 's'} ({healingAmount} healing before damage)
          </div>
        </div>

        <div>
          <label htmlFor="incoming-damage-input" style={labelStyle}>
            Incoming damage (applied after healing)
          </label>
          <input
            id="incoming-damage-input"
            type="number"
            min="0"
            max="9999"
            value={incomingDamage}
            onChange={(e) => {
              const v = Number(e.target.value);
              setIncomingDamage(Math.max(0, v));
            }}
            style={inputStyle}
            disabled={isAnimating}
          />
        </div>

        <div>
          <label style={labelStyle}>Spellpower (static)</label>
          <div
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#1a1a1a',
              marginBottom: '16px',
              color: '#e0e0e0',
              fontSize: '14px',
            }}
          >
            Essence {essence} × Focus {focus} = <span style={{ fontWeight: 700 }}>{computedSpellpower}</span>
          </div>
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
