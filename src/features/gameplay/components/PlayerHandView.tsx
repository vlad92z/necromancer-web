import { useState } from "react";
import { useSoloGameStore } from "../../../state/stores/soloGameStore";
import type { RuneType } from "../../../types/game";
import { getCardOverlap, getCardRotation } from "../../../utils/cardHelpers";
import { CardView } from "./Player/CardView";

/**
 * PlayerHandView - renders the player's hand with hover grouping effects.
 */
export function PlayerHandView() {
    const playerHand = useSoloGameStore((state) => state.playerHand);
    const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
    const [hoveredRuneId, setHoveredRuneId] = useState<string | null>(null);

    const cardOffset = getCardOverlap(playerHand.length);

    /**
     * handleCardEnter - updates hover state for the hovered rune and its type group.
     */
    const handleCardEnter = (runeType: RuneType, runeId: string) => {
        setHoveredRuneType(runeType);
        setHoveredRuneId(runeId);
    };

    /**
     * handleCardLeave - clears hover state when exiting any card.
     */
    const handleCardLeave = () => {
        setHoveredRuneType(null);
        setHoveredRuneId(null);
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-2 overflow-visible">
            {playerHand.map((rune, index) => {
                const rotation = getCardRotation(playerHand.length, index);
                const isHoveredGroup = hoveredRuneType === rune.runeType;
                const isPrimaryHover = hoveredRuneId === rune.id;
                const baseZIndex = playerHand.length - index;

                return (
                    <div
                        key={rune.id}
                        className="transition-transform duration-150 ease-out"
                        onMouseEnter={() => handleCardEnter(rune.runeType, rune.id)}
                        onMouseLeave={handleCardLeave}
                        style={{
                            // Keeps cards overlapped while adjusting hover priority and tilt.
                            marginLeft: index === 0 ? 0 : cardOffset,
                            zIndex: isHoveredGroup ? 100 + baseZIndex : baseZIndex,
                            transform: isHoveredGroup ? 'rotate(0deg) scale(1.15)' : `rotate(${rotation}deg)`,
                        }}
                    >
                        <CardView rune={rune} isPrimaryHover={isPrimaryHover} />
                    </div>
                );
            })}

        </div>
    );
}
