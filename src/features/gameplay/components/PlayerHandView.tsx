import { useEffect, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { useSoloGameStore } from "../../../state/stores/soloGameStore";
import { useSelectionStore } from "../../../state/stores/selectionStore";
import type { Rune, RuneType } from "../../../types/game";
import { getCardOverlap, getCardRotation } from "../../../utils/cardHelpers";
import { CardView } from "./Player/CardView";

/**
 * PlayerHandView - renders the player's hand with hover grouping effects.
 */
export function PlayerHandView() {
    const playerHand = useSoloGameStore((state) => state.playerHand);
    const selectedCards = useSelectionStore((state) => state.selectedCards);
    const setSelectedCards = useSelectionStore((state) => state.setSelectedCards);
    const clearSelection = useSelectionStore((state) => state.clearSelection);
    const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
    const [hoveredRuneId, setHoveredRuneId] = useState<string | null>(null);
    const hasSelection = selectedCards.length > 0;
    const activeRuneType = hasSelection ? selectedCards[0].runeType : hoveredRuneType;
    const activeRuneId = hasSelection ? selectedCards[0].id : hoveredRuneId;

    const cardOffset = getCardOverlap(playerHand.length);
    const hoverEase: [number, number, number, number] = [0.4, 0, 0.2, 1];

    /**
     * handleCardEnter - updates hover state for the hovered rune and its type group.
     */
    const handleCardEnter = (runeType: RuneType, runeId: string) => {
        if (hasSelection) {
            return;
        }
        setHoveredRuneType(runeType);
        setHoveredRuneId(runeId);
    };

    /**
     * handleCardLeave - clears hover state when exiting any card.
     */
    const handleCardLeave = () => {
        if (hasSelection) {
            return;
        }
        setHoveredRuneType(null);
        setHoveredRuneId(null);
    };

    /**
     * handleCardClick - stores a selection group with the clicked card first.
     */
    const handleCardClick = (event: MouseEvent<HTMLDivElement>, rune: Rune) => {
        event.stopPropagation();
        const matchingRunes = playerHand.filter((card) => card.runeType === rune.runeType);
        const orderedSelection = [
            rune,
            ...matchingRunes.filter((card) => card.id !== rune.id),
        ];
        setSelectedCards(orderedSelection);
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-2 overflow-visible">
            {playerHand.map((rune, index) => {
                const rotation = getCardRotation(playerHand.length, index);
                const isHoveredGroup = activeRuneType === rune.runeType;
                const isPrimaryHover = activeRuneId === rune.id;
                const baseZIndex = playerHand.length - index;
                const zIndex = isPrimaryHover
                    ? 1000 + baseZIndex
                    : isHoveredGroup
                        ? 100 + baseZIndex
                        : baseZIndex;
                const animateState = isHoveredGroup
                    ? { rotate: 0, scale: 1.15, y: [0, -6, 0] }
                    : { rotate: rotation, scale: 1, y: 0 };
                const transition = isHoveredGroup
                    ? {
                        rotate: { duration: 0.15, ease: hoverEase },
                        scale: { duration: 0.15, ease: hoverEase },
                        y: { duration: 3.5, repeat: Infinity, ease: hoverEase },
                    }
                    : {
                        rotate: { duration: 0.15, ease: hoverEase },
                        scale: { duration: 0.15, ease: hoverEase },
                        y: { duration: 0.2, ease: hoverEase },
                    };

                return (
                    <motion.div
                        key={rune.id}
                        className="transition-transform duration-150 ease-out"
                        onMouseEnter={() => handleCardEnter(rune.runeType, rune.id)}
                        onMouseLeave={handleCardLeave}
                        onClick={(event) => handleCardClick(event, rune)}
                        animate={animateState}
                        transition={transition}
                        style={{
                            // Keeps cards overlapped while adjusting hover priority and tilt.
                            marginLeft: index === 0 ? 0 : cardOffset,
                            zIndex,
                        }}
                    >
                        <CardView rune={rune} isPrimaryHover={isPrimaryHover} />
                    </motion.div>
                );
            })}

        </div>
    );
}
