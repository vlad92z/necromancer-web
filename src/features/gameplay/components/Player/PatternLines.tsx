/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import { useMemo } from 'react';
import { RUNE_SIZE_CONFIG } from '../../../../styles/tokens';
import { useSelectionStore } from '../../../../state/stores';
import { useSoloGameStore } from '../../../../state/stores/soloGameStore';
import { canPlaceSelectionOnPatternLine } from '../../../../state/stores/soloGameStoreHelpers';
import { runeAsset } from '../../../../components/runeAssets';
import { getRuneTitle } from '../../../../utils/runeHelpers';
import { useUIStore } from '../../../../state/stores/uiStore';
import type { AnimatingRune, Rune } from '../../../../types/game';

interface PatternLinesProps {
  activePatternLineIndex?: number | null;
  boardScale: number;
}

export function PatternLines({
  activePatternLineIndex,
  boardScale,
}: PatternLinesProps) {
  const patternLines = useSoloGameStore((state) => state.patternLines);
  const spellWall = useSoloGameStore((state) => state.spellWall);
  const selectedRunes = useSelectionStore((state) => state.selectedCards);
  const placeRunes = useSoloGameStore((state) => state.placeRunes);
  const animatingRunes = useUIStore((state) => state.animatingRunes);
  const setAnimatingRunes = useUIStore((state) => state.setAnimatingRunes);

  const animatingRuneIdSet = useMemo(() => new Set(animatingRunes.map((rune) => rune.id)), [animatingRunes]);

  /**
   * getRuneCardImageElement - returns the card image element for a rune id.
   */
  const getRuneCardImageElement = (runeId: string): HTMLElement | null => {
    if (typeof document === 'undefined') {
      return null;
    }
    return document.querySelector<HTMLElement>(`[data-rune-card-image="true"][data-rune-id="${runeId}"]`);
  };

  /**
   * getPatternSlotElement - returns the pattern line slot element for the line/slot coordinates.
   */
  const getPatternSlotElement = (patternLineIndex: number, slotIndex: number): HTMLElement | null => {
    if (typeof document === 'undefined') {
      return null;
    }
    return document.querySelector<HTMLElement>(
      `[data-pattern-line-index="${patternLineIndex}"][data-pattern-slot-index="${slotIndex}"]`,
    );
  };

  /**
   * buildPlacementAnimations - creates animation entries from card centers to target pattern slots.
   */
  const buildPlacementAnimations = (patternLineIndex: number, runes: Rune[]): AnimatingRune[] => {
    const patternLine = patternLines[patternLineIndex];
    if (!patternLine) {
      return [];
    }

    const overlaySize = RUNE_SIZE_CONFIG.large.dimension * boardScale;
    const availableSpace = Math.max(0, patternLine.capacity - patternLine.runes.length);
    const runesToPlace = Math.min(runes.length, availableSpace);
    const placedRunes = runes.slice(0, runesToPlace);
    const overflowRunes = runes.slice(runesToPlace);
    const overlayRunes: AnimatingRune[] = [];
    const baseSlotIndex = patternLine.runes.length;

    placedRunes.forEach((rune, offset) => {
      const startElement = getRuneCardImageElement(rune.id);
      const targetElement = getPatternSlotElement(patternLineIndex, baseSlotIndex + offset);
      if (!startElement || !targetElement) {
        return;
      }
      const startRect = startElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const startX = startRect.left + startRect.width / 2 - overlaySize / 2;
      const startY = startRect.top + startRect.height / 2 - overlaySize / 2;
      const endX = targetRect.left + targetRect.width / 2 - overlaySize / 2;
      const endY = targetRect.top + targetRect.height / 2 - overlaySize / 2;

      overlayRunes.push({
        id: rune.id,
        runeType: rune.runeType,
        rune,
        size: overlaySize,
        startX,
        startY,
        endX,
        endY,
      });
    });

    overflowRunes.forEach((rune) => {
      const startElement = getRuneCardImageElement(rune.id);
      if (!startElement) {
        return;
      }
      const startRect = startElement.getBoundingClientRect();
      const startX = startRect.left + startRect.width / 2 - overlaySize / 2;
      const startY = startRect.top + startRect.height / 2 - overlaySize / 2;

      overlayRunes.push({
        id: rune.id,
        runeType: rune.runeType,
        rune,
        size: overlaySize,
        startX,
        startY,
        endX: startX,
        endY: startY,
        shouldDisappear: true,
      });
    });

    return overlayRunes;
  };

  /**
   * handlePatternLineClick - animates selected runes and commits placement.
   */
  const handlePatternLineClick = (patternLineIndex: number, isPlacementTarget: boolean) => {
    if (!isPlacementTarget) {
      return;
    }

    const overlayRunes = buildPlacementAnimations(patternLineIndex, selectedRunes);
    if (overlayRunes.length > 0) {
      setAnimatingRunes(overlayRunes);
    }
    placeRunes(patternLineIndex);
  };

  return (
    <div className='flex flex-col gap-1'>
      {patternLines.map((line, index) => {
        const isKeyboardActive = activePatternLineIndex === index;
        const isLocked = line.isLocked;
        const isPlacementTarget = !isLocked && canPlaceSelectionOnPatternLine(index, selectedRunes, patternLines, spellWall);
        const imageDimension = RUNE_SIZE_CONFIG['large'].dimension;
        const opacity = isLocked ? "opacity-25" : "";
        return (
          <button
            key={index}
            onClick={() => {
              console.log('Pattern line clicked', { index, isPlacementTarget, line });
              handlePatternLineClick(index, isPlacementTarget);
            }}
            disabled={!isPlacementTarget}
            className={`inline-flex w-fit flex-row gap-1 self-start ${opacity} ${isPlacementTarget ? 'rounded-xl shadow-[0_0_16px_rgba(52,211,153,0.75)]' : ''}`}
            data-active={isKeyboardActive ? 'true' : undefined}
          >
            {Array(line.capacity)
              .fill(null)
              .map((_, slotIndex) => {
                const rune = line.runes[slotIndex];
                // console.log('Rendering pattern line slot', { lineIndex: index, slotIndex, rune });
                return (
                  <div
                    key={`${index}-${slotIndex}`}
                    className={`border rounded-xl border-slate-500/80 align-center p-1 ${slotIndex > 0 ? '' : 'bg-sky-900/50'}`}
                    style={{ width: imageDimension, height: imageDimension }}
                    data-pattern-line-index={index}
                    data-pattern-slot-index={slotIndex}
                  >
                      {rune && !animatingRuneIdSet.has(rune.id) && (
                        <img
                          src={runeAsset(rune.runeType, rune.rarity)}
                          alt={getRuneTitle(rune.runeType)}
                          style={{ width: imageDimension, height: imageDimension }}
                        />
                      )}
                  </div>
                );
              })}
          </button>
        );
      })}
    </div>
  );
}
