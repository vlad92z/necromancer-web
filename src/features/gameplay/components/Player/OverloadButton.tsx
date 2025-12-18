import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameplayStore } from "../../../../state/stores";
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { buildTextTooltipCard, buildOverloadPlacementTooltipCards } from '../../../../utils/tooltipCards';
import overloadSvg from '../../../../assets/stats/overload.svg';

interface OverloadButtonProps {
    isActive: boolean;
    showOverloadView: () => void;
}

export function OverloadButton({ isActive, showOverloadView }: OverloadButtonProps) {
    const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
    const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
    const canOverload = useGameplayStore((state) => state.selectedRunes.length > 0);
    const overloadDamage = useGameplayStore((state) => state.strain);//todo rename strain
    const openOverloadModal = useGameplayStore((state) => state.);//todo rename strain
    const overloadRuneCount = useGameplayStore((state) => state.overloadRunes.length);
    const overloadRunes = useGameplayStore((state) => state.placeRunesInFloor);//todo rename
    const overloadTooltip = `Overload deals ${overloadDamage} damage per rune. ${overloadRuneCount} runes are currently overloaded.`;
    const SELECTABLE_GLOW_REST = '0 0 20px rgba(248, 113, 113, 0.75), 0 0 40px rgba(239, 68, 68, 0.45)';
    const SELECTABLE_GLOW_PEAK = '0 0 32px rgba(239, 68, 68, 0.95), 0 0 60px rgba(185, 28, 28, 0.55)';
    const SELECTABLE_GLOW_RANGE: [string, string] = [SELECTABLE_GLOW_REST, SELECTABLE_GLOW_PEAK];

    const statBaseClass = 'flex min-w-[110px] items-center rounded-[16px] px-3.5 py-3 text-slate-100 border cursor-pointer';
    const overloadActiveClass = 'data-[active=true]:shadow-[0_0_28px_rgba(255,211,252,0.95),_0_0_56px_rgba(125,11,52,0.55)] data-[active=true]:bg-slate-900/70';
    const overloadClassName = `${statBaseClass} border-red-500/40 bg-red-600/10 hover:bg-red-600/20 data-[active=true]:border-red-300 ${overloadActiveClass}`;
const PULSE_TRANSITION: Transition = {
  duration: 1.2,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};

    const handleOverloadClick = useCallback(() => {
        if (canOverload) {
            overloadRunes();
            return;
        }
        showOverloadView();
    }, [canOverload, showOverloadView, overloadRunes]);

    const overloadGlowStyle = useMemo(() => (
        canOverload ? { boxShadow: SELECTABLE_GLOW_REST } : undefined
    ), [canOverload]);

      const overloadGlowProps = useMemo(() => (
        canOverload
          ? {
            animate: { boxShadow: SELECTABLE_GLOW_RANGE },
            transition: PULSE_TRANSITION,
          }
          : undefined
      ), [canOverload]);

    const overload = <button
        type="button"
        onMouseEnter={() => setTooltipCards(buildTextTooltipCard('overload-tooltip', 'Overload', overloadTooltip, overloadSvg))}
        onMouseLeave={() => resetTooltipCards()}
        onFocus={() => setTooltipCards(buildTextTooltipCard('overload-tooltip', 'Overload', overloadTooltip, overloadSvg))}
        onBlur={() => resetTooltipCards()}
        onClick={handleOverloadClick}
        data-active={isActive ? 'true' : undefined}
        className={overloadClassName}
    >
        <img
            src={overloadSvg}
            aria-hidden={true}
            className="inline-flex w-[35px] h-[35px]"
        />
        <div className="flex flex-col leading-[1.2] ml-2">
            <span className="text-[1.15rem] font-semibold">{overloadDamage}</span>
        </div>
    </button>
    return (
        <div
          data-player-id={"playerId"}//TODO
          data-strain-counter="true"
        >
          {canOverload ? (
            <motion.div
              className="inline-flex rounded-[16px]"
              style={overloadGlowStyle}
              {...overloadGlowProps}
            >
              {overload}
            </motion.div>
          ) : (
            overload
          )}
        </div>
    );
}