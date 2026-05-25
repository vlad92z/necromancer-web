import { useUIActions } from '../hooks/useGameActions';
import { useActiveElement, useCombatZoneState, useGameplayDeckState, useUIOverlayState } from '../hooks/useGameState';
import type { RuneZoneOverlay } from '../state/stores/uiStore';
import deckSvg from '../assets/stats/deck.svg';
import drawSvg from '../assets/stats/draw.svg';
import discardSvg from '../assets/stats/discard.svg';
import { buildTextTooltipCard } from '../utils/tooltipCards';

const ZONE_COPY: Record<RuneZoneOverlay, { label: string; title: string; tooltip: (count: number) => string }> = {
    draw: {
        label: 'Draw',
        title: 'Draw Deck',
        tooltip: (count) => `You have ${count} runes in your draw deck.`,
    },
    discard: {
        label: 'Discard',
        title: 'Discard',
        tooltip: (count) => `You have ${count} discarded runes.`,
    },
    deck: {
        label: 'Deck',
        title: 'Deck',
        tooltip: (count) => `You have ${count} runes across draw, discard, and hand.`,
    },
};

interface RuneZoneButtonProps {
    zone: RuneZoneOverlay;
}

export function RuneZoneButton({ zone }: RuneZoneButtonProps) {
    const { deck } = useGameplayDeckState();
    const { hand, discardPile } = useCombatZoneState();
    const { activeRuneZoneOverlay } = useUIOverlayState();
    const { resetTooltipCards: resetTooltips, setTooltipCards: setTooltip, openRuneZoneOverlay } = useUIActions();
    const activeElement = useActiveElement();
    const zoneCount = zone === 'draw'
        ? deck.length
        : zone === 'discard'
            ? discardPile.length
            : deck.length + discardPile.length + hand.length;
    const copy = ZONE_COPY[zone];
    const isActive = (activeElement?.type === 'rune-zone' && activeElement.zone === zone)
        || activeRuneZoneOverlay === zone;
    const zoneTooltip = copy.tooltip(zoneCount);
    const statBaseClass = 'flex min-w-[110px] items-center rounded-[16px] px-3.5 py-3 text-slate-100 border cursor-pointer';
    const deckActiveClass = 'data-[active=true]:shadow-[0_0_28px_rgba(125,211,252,0.95),_0_0_56px_rgba(125,211,252,0.55)] data-[active=true]:bg-slate-900/70';
    const deckClassName = `${statBaseClass} border-sky-500/40 bg-sky-600/10 hover:bg-sky-600/20 data-[active=true]:border-sky-300 ${deckActiveClass}`;
    return (
        <button
            type="button"
            onMouseEnter={() => setTooltip(buildTextTooltipCard(`${zone}-tooltip`, copy.title, zoneTooltip, zone === 'draw' ? drawSvg : zone === 'discard' ? discardSvg : deckSvg))}
            onMouseLeave={resetTooltips}
            onFocus={() => setTooltip(buildTextTooltipCard(`${zone}-tooltip`, copy.title, zoneTooltip, zone === 'draw' ? drawSvg : zone === 'discard' ? discardSvg : deckSvg))}
            onBlur={resetTooltips}
            onClick={() => openRuneZoneOverlay(zone)}
            data-active={isActive ? 'true' : undefined}
            data-deck-counter="true"
            className={deckClassName}
        >
            <img
                src={zone === 'draw' ? drawSvg : zone === 'discard' ? discardSvg : deckSvg}
                aria-hidden={true}
                className="inline-flex w-[35px] h-[35px]"
            />
            <div className="flex flex-col leading-[1.2] ml-2">
                <span className="text-[1.15rem] font-semibold">{zoneCount}</span>
            </div>
        </button>
    );
}
