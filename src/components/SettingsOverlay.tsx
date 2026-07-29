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
  const [activeControl, setActiveControl] = useState<SettingsControl | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const volumeInputRef = useRef<HTMLInputElement | null>(null);
  const musicButtonRef = useRef<HTMLButtonElement | null>(null);
  const quitButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const openedWithKeyboardRef = useRef(false);
  const isInitialFocusRef = useRef(true);
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
    openedWithKeyboardRef.current = previouslyFocusedElementRef.current?.matches(':focus-visible') ?? false;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      if (openedWithKeyboardRef.current) {
        setActiveControl('close');
      }
      isInitialFocusRef.current = false;
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
    const currentIndex = activeControl === null ? -1 : order.indexOf(activeControl);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const offset = direction === 'down' ? 1 : -1;
    const nextIndex = (safeIndex + offset + order.length) % order.length;

    focusControl(order[nextIndex]);
    playClickSound();
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
        if (activeControl === null) {
          focusControl('close');
          playClickSound();
        } else if (activeControl === 'close') {
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
    <div className="pixel-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-6" onClick={handleClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="pixel-modal relative w-[min(600px,94vw)] p-2"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={() => setActiveControl(null)}
        onKeyDown={handleKeyDown}
      >
        <div className="pixel-modal__inner space-y-6 px-6 py-8 md:px-8 md:py-10">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            onFocus={(event) => {
              if (!isInitialFocusRef.current && event.currentTarget.matches(':focus-visible')) {
                setActiveControl('close');
              }
            }}
            data-active={activeControl === 'close' ? 'true' : undefined}
            className="pixel-icon-button absolute right-8 top-8"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>

          <div className="border-b-4 border-[#141313] pb-5 pr-14">
            <h2 id="settings-title" className="font-pixel text-3xl uppercase tracking-[0.15em] text-[#fff8d8] [text-shadow:3px_3px_0_#141313]">Settings</h2>
          </div>

          <section className="space-y-3">
            <div className="font-pixel text-xs uppercase tracking-[0.2em] text-[#f2c14e]">Audio</div>
            <div
              className="pixel-control space-y-3 p-4"
              data-active={activeControl === 'volume' ? 'true' : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="font-pixel text-xs uppercase tracking-[0.16em] text-[#fff8d8]">Volume</span>
                <span className="font-pixel text-xs text-[#f2c14e]">{Math.round(soundVolume * 100)}%</span>
              </div>
              <input
                ref={volumeInputRef}
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(soundVolume * 100)}
                onChange={onVolumeChange}
                onFocus={(event) => {
                  if (event.currentTarget.matches(':focus-visible')) {
                    setActiveControl('volume');
                  }
                }}
                aria-label="Sound volume"
                className="pixel-range"
              />
            </div>

            <div className="pixel-control flex items-center justify-between gap-4 p-4">
              <span className="font-pixel text-xs uppercase tracking-[0.16em] text-[#fff8d8]">Music</span>
              <button
                ref={musicButtonRef}
                type="button"
                onClick={handleToggleMusic}
                onFocus={(event) => {
                  if (event.currentTarget.matches(':focus-visible')) {
                    setActiveControl('music');
                  }
                }}
                aria-pressed={isMusicMuted}
                data-active={activeControl === 'music' ? 'true' : undefined}
                className={`pixel-toggle ${isMusicMuted
                  ? 'pixel-toggle--off'
                  : 'pixel-toggle--on'
                }`}
              >
                <span
                  className={`h-3 w-3 border-2 border-[#141313] ${isMusicMuted ? 'bg-[#fff8d8]' : 'bg-[#e15f4f]'}`}
                  aria-hidden="true"
                />
                <span className="pixel-toggle__label">{isMusicMuted ? 'Off' : 'On'}</span>
              </button>
            </div>
          </section>

          {onQuitRun && (
            <section className="border-t-4 border-[#141313] pt-5">
              <ClickSoundButton
                ref={quitButtonRef}
                title="Quit Run"
                action={handleQuit}
                isActive={activeControl === 'quit'}
                onFocus={(event) => {
                  if (event.currentTarget.matches(':focus-visible')) {
                    setActiveControl('quit');
                  }
                }}
                className="pixel-button pixel-button--primary pixel-button--compact"
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
