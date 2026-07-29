/** Settings modal with keyboard navigation and focus restoration. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react';
import { ClickSoundButton } from './ClickSoundButton';
import { useUIActions } from '../hooks/useGameActions';
import { useClickSound } from '../hooks/useClickSound';
import { useMenuSettingsState } from '../hooks/useGameState';

type SettingsControl = 'close' | 'volume' | 'music' | 'quit';

interface SettingsOverlayProps {
  onQuitRun?: () => void;
}

export function SettingsOverlay({ onQuitRun }: SettingsOverlayProps): ReactElement {
  const { soundVolume, isMusicMuted } = useMenuSettingsState();
  const { closeSettingsOverlay, setSoundVolume, toggleMusicMuted } = useUIActions();
  const [activeControl, setActiveControl] = useState<SettingsControl>('close');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const volumeInputRef = useRef<HTMLInputElement | null>(null);
  const musicButtonRef = useRef<HTMLButtonElement | null>(null);
  const quitButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const playClickSound = useClickSound();

  const focusControl = useCallback((control: SettingsControl) => {
    const controls: Record<SettingsControl, HTMLElement | null> = {
      close: closeButtonRef.current,
      volume: volumeInputRef.current,
      music: musicButtonRef.current,
      quit: quitButtonRef.current,
    };

    setActiveControl(control);
    controls[control]?.focus();
  }, []);

  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      const previousElement = previouslyFocusedElementRef.current;
      if (previousElement?.isConnected) {
        window.requestAnimationFrame(() => previousElement.focus());
      }
    };
  }, []);

  const onVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseFloat(event.currentTarget.value);
      if (Number.isFinite(nextValue)) {
        setSoundVolume(nextValue / 100);
      }
    },
    [setSoundVolume],
  );

  const handleClose = useCallback(() => {
    playClickSound();
    closeSettingsOverlay();
  }, [closeSettingsOverlay, playClickSound]);

  const handleToggleMusic = useCallback(() => {
    playClickSound();
    toggleMusicMuted();
  }, [playClickSound, toggleMusicMuted]);

  const handleQuit = useCallback(() => {
    onQuitRun?.();
    closeSettingsOverlay();
  }, [closeSettingsOverlay, onQuitRun]);

  const adjustVolumeByStep = useCallback(
    (step: number) => {
      const currentValue = Math.round(soundVolume * 100);
      const nextValue = Math.min(100, Math.max(0, currentValue + step));
      if (nextValue !== currentValue) {
        setSoundVolume(nextValue / 100);
      }
    },
    [setSoundVolume, soundVolume],
  );

  const moveSelection = (direction: 'up' | 'down') => {
    const order: SettingsControl[] = onQuitRun
      ? ['close', 'volume', 'music', 'quit']
      : ['close', 'volume', 'music'];
    const currentIndex = order.indexOf(activeControl);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const offset = direction === 'down' ? 1 : -1;
    const nextIndex = (safeIndex + offset + order.length) % order.length;

    focusControl(order[nextIndex]);
  };

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusableElements || focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    trapFocus(event);

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveSelection('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveSelection('down');
        break;
      case 'ArrowLeft':
        if (activeControl === 'volume') {
          event.preventDefault();
          adjustVolumeByStep(-5);
        }
        break;
      case 'ArrowRight':
        if (activeControl === 'volume') {
          event.preventDefault();
          adjustVolumeByStep(5);
        }
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        if (activeControl === 'close') {
          handleClose();
        } else if (activeControl === 'music') {
          handleToggleMusic();
        } else if (activeControl === 'quit' && onQuitRun) {
          playClickSound();
          handleQuit();
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-xs" onClick={handleClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative w-[min(600px,94vw)] space-y-6 rounded-2xl border border-slate-700/40 bg-[linear-gradient(145deg,rgba(17,24,39,0.95),rgba(30,41,59,0.85))] px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          onFocus={() => setActiveControl('close')}
          data-active={activeControl === 'close' ? 'true' : undefined}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600/70 bg-slate-900/80 text-slate-100 transition hover:border-slate-300 hover:bg-slate-800 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 data-[active=true]:border-sky-400 data-[active=true]:bg-slate-800 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.6)]"
          aria-label="Close settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="space-y-1">
          <h2 id="settings-title" className="text-3xl font-bold uppercase tracking-tight text-slate-50">Settings</h2>
        </div>

        <section className="space-y-3">
          <div className="text-sm font-semibold uppercase tracking-wider text-slate-200">Audio</div>
          <div className="space-y-4 rounded-xl border border-slate-600/40 bg-slate-900/50 p-5">
            <div
              className="space-y-2 rounded-lg border border-transparent p-2 transition data-[active=true]:border-sky-400 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
              data-active={activeControl === 'volume' ? 'true' : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">Volume</span>
                <span className="text-sm font-bold text-slate-200">{Math.round(soundVolume * 100)}%</span>
              </div>
              <input
                ref={volumeInputRef}
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(soundVolume * 100)}
                onChange={onVolumeChange}
                onFocus={() => setActiveControl('volume')}
                aria-label="Sound volume"
                className="w-full cursor-pointer accent-purple-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">Music</span>
              <button
                ref={musicButtonRef}
                type="button"
                onClick={handleToggleMusic}
                onFocus={() => setActiveControl('music')}
                aria-pressed={isMusicMuted}
                data-active={activeControl === 'music' ? 'true' : undefined}
                className={`inline-flex items-center gap-2 rounded-full border border-slate-400/40 px-4 py-2 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-100 shadow-xs transition hover:shadow-md focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 data-[active=true]:border-sky-400 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)] ${isMusicMuted
                  ? 'bg-linear-to-r from-rose-400/30 to-rose-900/60'
                  : 'bg-linear-to-r from-sky-500/30 to-purple-700/50'
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.35)] ${isMusicMuted ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  aria-hidden="true"
                />
                {isMusicMuted ? 'Off' : 'On'}
              </button>
            </div>
          </div>
        </section>

        {onQuitRun && (
          <section className="space-y-3">
            <ClickSoundButton
              ref={quitButtonRef}
              title="Quit Run"
              action={handleQuit}
              isActive={activeControl === 'quit'}
              onFocus={() => setActiveControl('quit')}
              className="w-full rounded-xl border border-rose-500/50 bg-rose-900/30 px-6 py-3 text-center text-base font-bold uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-400 hover:bg-rose-900/50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 data-[active=true]:border-sky-400 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
            />
          </section>
        )}
      </div>
    </div>
  );
}
