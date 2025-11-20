import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty } from '../types/game';

interface SpectatorModePanelProps {
  onStart: (topDifficulty: Difficulty, bottomDifficulty: Difficulty) => void;
  onClose: () => void;
}

export function SpectatorModePanel({ onStart, onClose }: SpectatorModePanelProps) {
  const [topDifficulty, setTopDifficulty] = useState<Difficulty>('normal');
  const [bottomDifficulty, setBottomDifficulty] = useState<Difficulty>('normal');

  const panelStyle: React.CSSProperties = {
    marginTop: '16px',
    padding: '24px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ffffff',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    border: '1px solid #4a4a4a',
    borderRadius: '4px',
    marginBottom: '16px',
    cursor: 'pointer',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  };

  const startButtonStyle: React.CSSProperties = {
    flex: 1,
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

  const cancelButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const handleStart = () => {
    onStart(topDifficulty, bottomDifficulty);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        style={panelStyle}
      >
        <div>
          <label htmlFor="top-ai-select" style={labelStyle}>
            Top AI Difficulty
          </label>
          <select
            id="top-ai-select"
            value={topDifficulty}
            onChange={(e) => setTopDifficulty(e.target.value as Difficulty)}
            style={selectStyle}
            aria-label="Top AI difficulty"
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label htmlFor="bottom-ai-select" style={labelStyle}>
            Bottom AI Difficulty
          </label>
          <select
            id="bottom-ai-select"
            value={bottomDifficulty}
            onChange={(e) => setBottomDifficulty(e.target.value as Difficulty)}
            style={selectStyle}
            aria-label="Bottom AI difficulty"
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div style={buttonContainerStyle}>
          <button
            onClick={handleStart}
            style={startButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5ab0ff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4a9eff';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Start spectator match"
          >
            Start Match
          </button>
          <button
            onClick={onClose}
            style={cancelButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#777777';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#666666';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
