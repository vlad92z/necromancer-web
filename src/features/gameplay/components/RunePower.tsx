/**
 * RunePower component - displays player name and health
 */

import { motion } from 'framer-motion';
import type { Player } from '../../../types/game';

interface RunePowerProps {
  player: Player;
  opponent: Player;
  damageTaken: number;
  nameColor: string;
  gameMode: 'classic' | 'standard';
}

export function RunePower({ player, damageTaken, nameColor}: RunePowerProps) {
  const currentHealth = 300 - damageTaken;
  
  return (
    <div style={{
      marginBottom: '8px'
    }}>
      {/* Player Info Box */}
      <div style={{
        backgroundColor: 'rgba(191, 219, 254, 0.3)',
        border: '2px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '8px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#0c4a6e',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ color: nameColor }}>
            {player.name}
          </span>
          <motion.span 
            key={currentHealth}
            initial={{ scale: 1.5, color: '#dc2626' }}
            animate={{ scale: 1, color: '#ea580c' }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
            style={{ 
              color: '#ea580c',
              display: 'inline-block'
            }}
          >
            ❤️ {currentHealth}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
