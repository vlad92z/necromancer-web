/**
 * SettingsOverlay - Game settings overlay
 * Follows the same UI theme as SoloStartScreen
 */
import { useCallback, useEffect, useState, type ChangeEvent, type ReactElement } from 'react';
import { ClickSoundButton } from './ClickSoundButton';

interface SettingsOverlayProps {
  onClose: () => void;
  soundVolume: number;
  isMusicMuted: boolean;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleMusic: () => void;
  onQuitRun?: () => void;
  showQuitRun?: boolean;
  playClickSound?: () => void;
}

export function SettingsOverlay({
  onClose,
  soundVolume,
  isMusicMuted,
  onVolumeChange,
  onToggleMusic,
  onQuitRun,
  showQuitRun = false,
  playClickSound,
}: SettingsOverlayProps): ReactElement | null {
  const [activeControl, setActiveControl] = useState<'close' | 'volume' | 'music' | 'quit'>('close');

  const handleClose = useCallback(
    (shouldPlayClick = true) => {
      if (playClickSound && shouldPlayClick) {
        playClickSound();
      }
      onClose();
    },
    [onClose, playClickSound],
  );

  const handleToggleMusic = useCallback(
    (shouldPlayClick = true) => {
      if (playClickSound && shouldPlayClick) {
        playClickSound();
      }
      onToggleMusic();
    },
    [onToggleMusic, playClickSound],
  );

  const adjustVolumeByStep = useCallback(
    (step: number) => {
      const currentValue = Math.round(soundVolume * 100);
      const nextValue = Math.min(100, Math.max(0, currentValue + step));
      if (nextValue === currentValue) {
        return;
      }

      const syntheticEvent = {
        currentTarget: { value: String(nextValue) },
        target: { value: String(nextValue) },
      } as unknown as ChangeEvent<HTMLInputElement>;

      onVolumeChange(syntheticEvent);
    },
    [onVolumeChange, soundVolume],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const order: Array<'close' | 'volume' | 'music' | 'quit'> =
      showQuitRun && onQuitRun ? ['close', 'volume', 'music', 'quit'] : ['close', 'volume', 'music'];

    const moveSelection = (direction: 'up' | 'down') => {
      setActiveControl((current) => {
        const currentIndex = order.indexOf(current);
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        const offset = direction === 'down' ? 1 : -1;
        const nextIndex = (safeIndex + offset + order.length) % order.length;
        return order[nextIndex];
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          moveSelection('up');
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          moveSelection('down');
          break;
        }
        case 'ArrowLeft': {
          if (activeControl === 'volume') {
            event.preventDefault();
            adjustVolumeByStep(-5);
          }
          break;
        }
        case 'ArrowRight': {
          if (activeControl === 'volume') {
            event.preventDefault();
            adjustVolumeByStep(5);
          }
          break;
        }
        case 'Enter':
        case ' ': // Space
        case 'Spacebar': {
          event.preventDefault();
          if (activeControl === 'close') {
            handleClose();
          } else if (activeControl === 'music') {
            handleToggleMusic();
          } else if (activeControl === 'quit' && showQuitRun && onQuitRun) {
            if (playClickSound) {
              playClickSound();
            }
            onQuitRun();
            handleClose(false);
          }
          break;
        }
        case 'Escape': {
          console.log('Settings Escape pressed');
          event.preventDefault();
          handleClose();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeControl, adjustVolumeByStep, handleClose, handleToggleMusic, onQuitRun, playClickSound, showQuitRun]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={() => handleClose()}
    >
      <div
        className="w-[min(600px,_94vw)] space-y-6 rounded-2xl border border-slate-700/40 bg-[linear-gradient(145deg,_rgba(17,24,39,0.95),_rgba(30,41,59,0.85))] px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top Right */}
        <button
          type="button"
          onClick={() => handleClose()}
          data-active={activeControl === 'close' ? 'true' : undefined}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600/70 bg-slate-900/80 text-slate-100 transition hover:border-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 data-[active=true]:border-sky-400 data-[active=true]:bg-slate-800 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.6)]"
          aria-label="Close settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="space-y-1">
          <h2 className="text-3xl font-bold uppercase tracking-tight text-slate-50">Settings</h2>
        </div>

        {/* Volume Control */}
        <section className="space-y-3">
          <div className="text-sm font-semibold uppercase tracking-wider text-slate-200">Audio</div>
          <div className="space-y-4 rounded-xl border border-slate-600/40 bg-slate-900/50 p-5">
            {/* Volume Slider */}
            <div
              className="space-y-2 rounded-lg border border-transparent p-2 transition data-[active=true]:border-sky-400 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
              data-active={activeControl === 'volume' ? 'true' : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">Volume</span>
                <span className="text-sm font-bold text-slate-200">{Math.round(soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(soundVolume * 100)}
                onChange={onVolumeChange}
                aria-label="Sound volume"
                className="w-full cursor-pointer accent-purple-600"
              />
            </div>

            {/* Music Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">Music</span>
              <button
                type="button"
                onClick={() => handleToggleMusic()}
                aria-pressed={isMusicMuted}
                data-active={activeControl === 'music' ? 'true' : undefined}
                className={`inline-flex items-center gap-2 rounded-full border border-slate-400/40 px-4 py-2 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-100 shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 data-[active=true]:border-sky-400 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)] ${
                  isMusicMuted
                    ? 'bg-gradient-to-r from-rose-400/30 to-rose-900/60'
                    : 'bg-gradient-to-r from-sky-500/30 to-purple-700/50'
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.35)] ${
                    isMusicMuted ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                  aria-hidden={true}
                />
                {isMusicMuted ? 'Off' : 'On'}
              </button>
            </div>
          </div>
        </section>

        {/* Quit Run Button (only shown when in-game) */}
        {showQuitRun && onQuitRun && (
          <section className="space-y-3">
            <ClickSoundButton
              title="Quit Run"
              action={() => {
                onQuitRun();
                handleClose(false);
              }}
              isActive={activeControl === 'quit'}
              className="w-full rounded-xl border border-rose-500/50 bg-rose-900/30 px-6 py-3 text-center text-base font-bold uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-400 hover:bg-rose-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 data-[active=true]:border-sky-400 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
            />
          </section>
        )}
      </div>
    </div>
  );
}
