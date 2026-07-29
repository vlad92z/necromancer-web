import { useUIActions } from '../hooks/useGameActions';
import { useClickSound } from '../hooks/useClickSound';
import { useActiveElement, useCombatZoneState, useGameplayDeckState, useUIOverlayState } from '../hooks/useGameState';
import type { RuneZoneOverlay } from '../state/stores/uiStore';
import deckSvg from '../assets/stats/deck.svg';
import drawSvg from '../assets/stats/draw.svg';
import discardSvg from '../assets/stats/discard.svg';

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
    const { openRuneZoneOverlay } = useUIActions();
    const playClickSound = useClickSound();
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
    const statBaseClass = 'pixel-game-button flex min-w-[110px] items-center px-3.5 py-3';
    const zoneClassName: Record<RuneZoneOverlay, string> = {
        draw: statBaseClass,
        discard: statBaseClass,
        deck: statBaseClass,
    };
    const handleClick = () => {
        playClickSound();
        openRuneZoneOverlay(zone);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={`${copy.title}: ${zoneTooltip}`}
            data-active={isActive ? 'true' : undefined}
            data-deck-counter="true"
            className={zoneClassName[zone]}
        >
            <img
                src={zone === 'draw' ? drawSvg : zone === 'discard' ? discardSvg : deckSvg}
                aria-hidden={true}
                className="inline-flex h-[35px] w-[35px] [image-rendering:pixelated]"
            />
            <div className="flex flex-col leading-[1.2] ml-2">
                <span className="text-[1rem]">{zoneCount}</span>
            </div>
        </button>
    );
}
