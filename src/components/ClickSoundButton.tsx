/**
 * ClickSoundButton - plays the click sound before running its action.
 */
import { forwardRef, type FocusEventHandler, type PointerEventHandler, type ReactElement } from 'react';
import { useClickSound } from '../hooks/useClickSound';

interface ClickSoundButtonProps {
  title: string;
  className?: string;
  action: () => void;
  isActive?: boolean;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
}

export const ClickSoundButton = forwardRef<HTMLButtonElement, ClickSoundButtonProps>(function ClickSoundButton(
  { title, className, action, isActive = false, onFocus, onPointerDown },
  ref,
): ReactElement {
  const playClickSound = useClickSound();

  const handleClick = () => {
    playClickSound();
    action();
  };

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      data-active={isActive ? 'true' : undefined}
      onClick={handleClick}
      onFocus={onFocus}
      onPointerDown={onPointerDown}
    >
      {title}
    </button>
  );
});
