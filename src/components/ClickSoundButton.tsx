/**
 * ClickSoundButton - plays the click sound before running its action.
 */
import type { ReactElement } from 'react';
import { useClickSound } from '../hooks/useClickSound';

interface ClickSoundButtonProps {
  title: string;
  className?: string;
  action: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function ClickSoundButton({
  title,
  className,
  action,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
}: ClickSoundButtonProps): ReactElement {
  const playClickSound = useClickSound();

  const handleClick = () => {
    playClickSound();
    action();
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {title}
    </button>
  );
}
