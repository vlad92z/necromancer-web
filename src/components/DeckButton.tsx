import { useGameplayActions, useUIActions } from '../hooks/useGameActions';
import { useActiveElement, useGameplayDeckState } from '../hooks/useGameState';
import deckSvg from '../assets/stats/deck.svg';
import { buildTextTooltipCard } from '../utils/tooltipCards';

export function DeckButton() {
    const { resetTooltipCards: resetTooltips, setTooltipCards: setTooltip } = useGameplayActions();
    const { deck } = useGameplayDeckState();
    const { toggleDeckOverlay: openDeck } = useUIActions();
    const activeElement = useActiveElement();
    const deckRemaining = deck.length;
    const isActive = activeElement?.type === 'deck';
    const deckTooltip = `You have ${deckRemaining} runes remaining.`;
    const statBaseClass = 'flex min-w-[110px] items-center rounded-[16px] px-3.5 py-3 text-slate-100 border cursor-pointer';
    const deckActiveClass = 'data-[active=true]:shadow-[0_0_28px_rgba(125,211,252,0.95),_0_0_56px_rgba(125,211,252,0.55)] data-[active=true]:bg-slate-900/70';
    const deckClassName = `${statBaseClass} border-sky-500/40 bg-sky-600/10 hover:bg-sky-600/20 data-[active=true]:border-sky-300 ${deckActiveClass}`;
    return (
        <button
            type="button"
            onMouseEnter={() => setTooltip}
            onMouseLeave={resetTooltips}
            onFocus={() => setTooltip(buildTextTooltipCard('deck-tooltip', 'Deck', deckTooltip, deckSvg))}
            onBlur={resetTooltips}
            onClick={openDeck}
            data-active={isActive ? 'true' : undefined}
            className={deckClassName}
        >
            <img
                src={deckSvg}
                aria-hidden={true}
                className="inline-flex w-[35px] h-[35px]"
            />
            <div className="flex flex-col leading-[1.2] ml-2">
                <span className="text-[1.15rem] font-semibold">{deckRemaining}</span>
            </div>
        </button>
    );
}
