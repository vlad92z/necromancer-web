import { useEffect } from 'react';
import { usePlayerSpeech } from '../../../hooks/useGameState';
import { useUIStore } from '../../../state/stores/uiStore';
import { ANIMATION, Z_INDEX } from '../../../styles/tokens';

export function PlayerSpeechBubble() {
  const playerSpeech = usePlayerSpeech();

  useEffect(() => {
    if (!playerSpeech) return undefined;

    const speechId = playerSpeech.id;
    const timeoutId = window.setTimeout(() => {
      useUIStore.getState().clearPlayerSpeech(speechId);
    }, ANIMATION.PLAYER_SPEECH_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [playerSpeech]);

  if (!playerSpeech) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute -top-16 left-2/3 w-max max-w-[270px] -translate-x-1/2 rounded-lg border-3 border-[#141313] bg-[#fff8d8] px-3 py-2 text-center font-pixel text-xs leading-relaxed text-[#141313] shadow-[4px_4px_0_#141313]"
      role="status"
      style={{ zIndex: Z_INDEX.notification }}
    >
      {playerSpeech.message}
      <span
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border-b-3 border-r-3 border-[#141313] bg-[#fff8d8]"
      />
    </div>
  );
}
