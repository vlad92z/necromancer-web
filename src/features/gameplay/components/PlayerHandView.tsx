import { useSoloGameStore } from "../../../state/stores/soloGameStore";
import { getCardOverlap, getCardRotation } from "../../../utils/cardHelpers";
import { CardView } from "./Player/CardView";

export function PlayerHandView() {
    const playerHand = useSoloGameStore((state) => state.playerHand);
    const cardOffset = getCardOverlap(playerHand.length);
    return (
        <div className="w-full h-full flex items-center justify-center px-2 overflow-visible">
            {playerHand.map((rune, index) => {
                const rotation = getCardRotation(playerHand.length, index);

                return (
                    <div
                        key={rune.id}
                        style={{ //This makes sure the cards overlap and are rotated
                            marginLeft: index === 0 ? 0 : cardOffset,
                            zIndex: playerHand.length - index,
                            transform: `rotate(${rotation}deg)`,
                        }}
                    >
                        <CardView
                            rune = {rune}
                        />
                    </div>
                );
            })}

        </div>
    );
}