import { User, Heart, Sparkles, Zap, Focus } from 'lucide-react';

interface PlayerStatsProps {
  playerName: string;
  health: number;
  healing: number;
  essence: number;
  focus: number;
  isOpponent: boolean;
}

export function PlayerStats({ playerName, health, healing, essence, focus, isOpponent }: PlayerStatsProps) {
  const spellpower = essence * focus;

  return (
    <div className="flex flex-col items-center" style={{ gap: '0.75em', minWidth: '8em' }}>
      {/* Player Avatar */}
      <div className={`rounded-full flex items-center justify-center border-2 ${
        isOpponent 
          ? 'bg-red-900/50 border-red-500' 
          : 'bg-blue-900/50 border-blue-500'
      }`} style={{ width: '4em', height: '4em' }}>
        <User className="text-white" style={{ width: '2em', height: '2em' }} />
      </div>

      {/* Player Name */}
      <div className="text-white">{playerName}</div>

      {/* Health and Healing - Horizontal */}
      <div className="flex" style={{ gap: '0.5em' }}>
        {/* Health */}
        <div className="flex items-center bg-slate-900/70 rounded-lg border border-red-500/50" style={{ gap: '0.5em', padding: '0.5em 0.75em' }}>
          <Heart className="text-red-400" fill="currentColor" style={{ width: '1.25em', height: '1.25em' }} />
          <span className="text-white">{health}</span>
        </div>

        {/* Healing */}
        <div className="flex items-center bg-slate-900/70 rounded-lg border border-green-500/50" style={{ gap: '0.5em', padding: '0.5em 0.75em' }}>
          <Heart className="text-green-400" style={{ width: '1.25em', height: '1.25em' }} />
          <span className="text-white">+{healing}</span>
        </div>
      </div>

      {/* Essence, Focus, and Spellpower - Horizontal */}
      <div className="flex" style={{ gap: '0.5em' }}>
        {/* Essence */}
        <div className="flex items-center bg-slate-900/70 rounded-lg border border-cyan-500/50" style={{ gap: '0.25em', padding: '0.5em' }}>
          <Zap className="text-cyan-400" fill="currentColor" style={{ width: '1em', height: '1em' }} />
          <span className="text-white">{essence}</span>
        </div>

        {/* Focus */}
        <div className="flex items-center bg-slate-900/70 rounded-lg border border-amber-500/50" style={{ gap: '0.25em', padding: '0.5em' }}>
          <Focus className="text-amber-400" style={{ width: '1em', height: '1em' }} />
          <span className="text-white">{focus}</span>
        </div>

        {/* Spellpower */}
        <div className="flex items-center bg-slate-900/70 rounded-lg border border-purple-500/50" style={{ gap: '0.25em', padding: '0.5em' }}>
          <Sparkles className="text-purple-400" fill="currentColor" style={{ width: '1em', height: '1em' }} />
          <span className="text-white">{spellpower}</span>
        </div>
      </div>
    </div>
  );
}