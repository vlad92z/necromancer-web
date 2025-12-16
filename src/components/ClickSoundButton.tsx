/**
 * ClickSoundButton - plays the click sound before running its action.
 */
import type { ReactElement } from 'react';
import { useClickSound } from '../hooks/useClickSound';

interface ClickSoundButtonProps {
  title: string;
  className?: string;
  action: () => void;
  isActive?: boolean;
}

export function ClickSoundButton({ title, className, action, isActive = false }: ClickSoundButtonProps): ReactElement {
  const playClickSound = useClickSound();

  const handleClick = () => {
    playClickSound();
    action();
  };

  return (
    <button
      type="button"
      className={className}
      data-active={isActive ? 'true' : undefined}
      onClick={handleClick}
    >
      {title}
    </button>
  );
}
