/**
 * GameOverModal component - displays game over screen with winner and damage taken
 */

import type { Player } from '../../../types/game';
import { useClickSound } from '../../../hooks/useClickSound';

interface GameOverModalProps {
  players: [Player, Player];
  winner: Player | null;
  onReturnToStart?: () => void;
}

export function GameOverModal({ players, winner, onReturnToStart }: GameOverModalProps) {
  const playClickSound = useClickSound();
  const winnerId = winner?.id ?? null;
  const playerIsWinner = winnerId === players[0].id;
  const opponentIsWinner = winnerId === players[1].id;
  const headline = winner
    ? playerIsWinner
      ? 'Arcane Triumph'
      : 'GAME OVER'
    : 'Stalemate';
  const subline = winner
    ? `${winner.name} seizes control of the arena`
    : 'Both channels collapse simultaneously';
  const accentClasses = playerIsWinner
    ? 'border-emerald-300/70 from-emerald-400/25'
    : opponentIsWinner
    ? 'border-rose-300/70 from-rose-300/25'
    : 'border-amber-300/70 from-amber-300/25';

  const renderPlayerRow = (player: Player, isWinner: boolean) => (
    <div
      key={player.id}
      className={`flex items-center justify-between gap-3 rounded-[18px] border px-5 py-4 ${
        isWinner
          ? 'border-emerald-300/50 bg-gradient-to-r from-emerald-900/60 to-cyan-900/70 shadow-[0_12px_28px_rgba(16,185,129,0.25)]'
          : 'border-slate-400/25 bg-[rgba(9,12,33,0.85)]'
      }`}
    >
      <div className="text-left">
        <div className="text-base font-semibold text-slate-50">{player.name}</div>
        <div className="text-xs text-slate-200/80">{isWinner ? 'Dominates the arena' : ''}</div>
      </div>
      <div className="text-[1.35rem] font-bold text-rose-200">{player.health} HP</div>
    </div>
  );

  return (
    <div className="w-[min(520px,92vw)] rounded-[32px] border border-white/12 bg-[rgba(5,2,16,0.95)] px-7 py-8 text-center text-[#f5f5ff] shadow-[0_45px_120px_rgba(0,0,0,0.75)]">
      <div
        className={`mb-6 rounded-[18px] border ${accentClasses} bg-gradient-to-r to-purple-900/60 px-4 py-4 text-center text-[0.85rem] font-bold uppercase tracking-[0.2em]`}
      >
        {headline}
      </div>
      <div className="mb-8 text-[1.1rem] text-[#e9d5ff]">{subline}</div>

      <div className="mb-7 flex flex-col gap-3.5">
        {renderPlayerRow(players[0], playerIsWinner)}
        {renderPlayerRow(players[1], opponentIsWinner)}
      </div>

      <button
        type="button"
        onClick={() => {
          playClickSound();
          if (onReturnToStart) {
            onReturnToStart();
          }
        }}
        className="w-full rounded-full border border-white/20 bg-gradient-to-r from-slate-50/15 to-cyan-200/10 px-5 py-3 text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-slate-100 shadow-[0_18px_45px_rgba(8,17,35,0.6)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        Main Menu
      </button>
    </div>
  );
}
