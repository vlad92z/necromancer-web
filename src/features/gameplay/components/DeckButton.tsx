import deckSvg from '../../../assets/stats/deck.svg';
import { useSoloGameStore } from "../../../state/stores/soloGameStore";

interface DeckButtonProps {
    isActive: boolean;
    showDeckView: () => void;
}

export function DeckButton({ isActive, showDeckView }: DeckButtonProps) {
    const runesInDeck = useSoloGameStore((state) => state.deck.remainingRunes.length);
    const statBaseClass = 'flex min-w-[110px] items-center rounded-[16px] px-3.5 py-3 text-slate-100 border cursor-pointer';
    const deckActiveClass = 'data-[active=true]:shadow-[0_0_28px_rgba(125,211,252,0.95),_0_0_56px_rgba(125,211,252,0.55)] data-[active=true]:bg-slate-900/70';
    const className = `${statBaseClass} border-sky-500/40 bg-sky-600/10 hover:bg-sky-600/20 data-[active=true]:border-sky-300 ${deckActiveClass}`;

    return (
        <button
            type="button"
            onClick={showDeckView}
            data-active={isActive ? 'true' : undefined}
            className={className}
        >
            <img
                src={deckSvg}
                aria-hidden={true}
                className="inline-flex w-[35px] h-[35px]"
            />
            <div className="flex flex-col leading-[1.2] ml-2">
                <span className="text-[1.15rem] font-semibold">{runesInDeck}</span>
            </div>
        </button>
    );
}