/**
 * OverloadButton - overload action button with tooltip and pulse state.
 */

import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import overloadSvg from '../assets/stats/overload.svg';
import { useGameplayStore, useSelectionStore, useUIStore } from '../state/stores';
import { buildOverloadPlacementTooltipCards, buildTextTooltipCard } from '../utils/tooltipCards';

const SELECTABLE_GLOW_REST = '0 0 20px rgba(248, 113, 113, 0.75), 0 0 40px rgba(239, 68, 68, 0.45)';
const SELECTABLE_GLOW_PEAK = '0 0 32px rgba(239, 68, 68, 0.95), 0 0 60px rgba(185, 28, 28, 0.55)';
const SELECTABLE_GLOW_RANGE: [string, string] = [SELECTABLE_GLOW_REST, SELECTABLE_GLOW_PEAK];
const PULSE_TRANSITION: Transition = {
  duration: 1.2,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};

export function OverloadButton() {
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const strainValue = useGameplayStore((state) => state.overloadDamage);
  const overloadedRuneCount = useGameplayStore((state) => state.overloadRunes.length);
  const placeRunesInFloor = useGameplayStore((state) => state.placeRunesInFloor);
  const openOverloadOverlay = useUIStore((state) => state.toggleOverloadOverlay);
  const selectedRunes = useSelectionStore((state) => state.selectedRunes);
  const activeElement = useSelectionStore((state) => state.activeElement);
  const isActive = activeElement?.type === 'overload';

  const canOverload = selectedRunes.length > 0;
  const overloadTooltip = `Overload deals ${strainValue} damage per rune. ${overloadedRuneCount} runes are currently overloaded.`;

  const handleOverloadTooltipToggle = (visible: boolean) => {
    if (!visible) {
      resetTooltipCards();
      return;
    }

    if (canOverload) {
      setTooltipCards(buildOverloadPlacementTooltipCards(selectedRunes, strainValue), true);
      return;
    }

    setTooltipCards(buildTextTooltipCard('overload-tooltip', 'Overload', overloadTooltip, overloadSvg));
  };

  const handleOverloadClick = () => {
    if (canOverload) {
      placeRunesInFloor();
      return;
    }
    openOverloadOverlay();
  };

  const overloadGlowProps = canOverload
    ? {
        animate: { boxShadow: SELECTABLE_GLOW_RANGE },
        transition: PULSE_TRANSITION,
      }
    : undefined;

  const overloadGlowStyle = canOverload ? { boxShadow: SELECTABLE_GLOW_REST } : undefined;

  const statBaseClass = 'flex min-w-[110px] items-center rounded-[16px] px-3.5 py-3 text-slate-100 border cursor-pointer';
  const overloadActiveClass =
    'data-[active=true]:shadow-[0_0_28px_rgba(255,211,252,0.95),_0_0_56px_rgba(125,11,52,0.55)] data-[active=true]:bg-slate-900/70';
  const overloadClassName = `${statBaseClass} border-red-500/40 bg-red-600/10 hover:bg-red-600/20 data-[active=true]:border-red-300 ${overloadActiveClass}`;

  const button = (
    <button
      type="button"
      onMouseEnter={() => handleOverloadTooltipToggle(true)}
      onMouseLeave={() => handleOverloadTooltipToggle(false)}
      onFocus={() => handleOverloadTooltipToggle(true)}
      onBlur={() => handleOverloadTooltipToggle(false)}
      onClick={handleOverloadClick}
      data-active={isActive ? 'true' : undefined}
      className={overloadClassName}
    >
      <img src={overloadSvg} aria-hidden={true} className="inline-flex w-[35px] h-[35px]" />
      <div className="flex flex-col leading-[1.2] ml-2">
        <span className="text-[1.15rem] font-semibold">{strainValue}</span>
      </div>
    </button>
  );

  if (!canOverload) {
    return button;
  }

  return (
    <motion.div className="inline-flex rounded-[16px]" style={overloadGlowStyle} {...overloadGlowProps}>
      {button}
    </motion.div>
  );
}
