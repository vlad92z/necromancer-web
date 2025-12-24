/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { forwardRef, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { DraftSource, GameState, RuneType, Rune, Runeforge as RuneforgeType } from '../../../types/game';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { OverloadOverlay } from './OverloadOverlay';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { useSelectionStore } from '../../../state/stores/selectionStore';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useUIStore } from '../../../state/stores/uiStore';
import { useRunePlacementAnimations } from '../../../hooks/useRunePlacementAnimations';
import { useArtefactStore } from '../../../state/stores/artefactStore';
import { useArcaneDustSound } from '../../../hooks/useArcaneDustSound';
import { SoloGameView } from './SoloGameBoard';
import { getWallColumnForRune } from '../../../utils/scoring';
import type { ActiveElement } from './keyboardNavigation';

const BOARD_BASE_WIDTH = 1500;
const BOARD_BASE_HEIGHT = 1000;
const BOARD_PADDING = 80;
const MIN_BOARD_SCALE = 0.3;
const MIN_AVAILABLE_SIZE = 300;

const computeBoardScale = (width: number, height: number): number => {
  const availableWidth = Math.max(width - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const availableHeight = Math.max(height - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const rawScale = Math.min(availableWidth / BOARD_BASE_WIDTH, availableHeight / BOARD_BASE_HEIGHT);
  const clamped = Math.min(rawScale, 1);
  return Math.max(clamped, MIN_BOARD_SCALE);
};

interface RuneforgeSlotLayout {
  runeforgeId: string;
  disabled: boolean;
  slots: Array<Rune | null>;
}

export interface GameContainerProps {
  gameState: GameState;
}

export interface GameData {
  isDefeat: GameState['isDefeat'];
  runeScore: { currentScore: number; targetScore: number };
  playerStats: {
    isActive: boolean;
    overloadMultiplier: number;
    game: number;
    deckCount: number;
    overloadedRuneCount: number;
  };
  targetScore: number;
  runePowerTotal: number;
  arcaneDust: number;
  arcaneDustReward: number;
  totalDeckSize: number;
  deckDraftState: GameState['deckDraftState'];
  onSelectDeckDraftRuneforge: (runeforgeId: string) => void;
  startNextSoloGame: () => void;
}

export interface GameContainerSharedProps {
  // Core context
  player: GameState['player'];
  displayedHealth: number;
  displayedArmor: number;
  game: number;
  strain: number;
  isSelectionPhase: boolean;
  isGameOver: boolean;
  runesPerRuneforge: number;
  runeforgeDraftStage: GameState['runeforgeDraftStage'];

  // Selection state
  selectedRuneType: RuneType | null;
  selectedRunes: Rune[];
  hasSelectedRunes: boolean;
  draftSource: DraftSource | null;

  // Board data
  runeforges: GameState['runeforges'];

  // Locks and visibility
  lockedPatternLines: number[];
  hiddenCenterRuneIds: Set<string>;

  // Actions
  onPlaceRunes: (patternLineIndex: number) => void;
  returnToStartScreen: () => void;
}

export interface GameContainerHandle {
  handleKeyDown: (event: KeyboardEvent) => boolean;
}

export const GameContainer = forwardRef<GameContainerHandle, GameContainerProps>(function GameContainer({ gameState }) {
  const {
    player,
    runeforges,
    runesPerRuneforge,
    turnPhase,
    lockedPatternLines,
    shouldTriggerEndRound,
    soloDeckTemplate,
  } = gameState;
  const selectedRunes = useSelectionStore((state) => state.selectedRunes);
  const draftSource = useSelectionStore((state) => state.draftSource);
  const activeElement = useSelectionStore((state) => state.activeElement);
  const setActiveElement = useSelectionStore((state) => state.setActiveElement);
  const scoringSequence = useGameplayStore((state) => state.scoringSequence);
  const arcaneDustTotal = useArtefactStore((state) => state.arcaneDust);
  const displayedArcaneDust = scoringSequence ? scoringSequence.displayArcaneDust : arcaneDustTotal;
  const moveRunesToWall = useGameplayStore((state) => state.moveRunesToWall);
  const disenchantRuneFromDeck = useGameplayStore((state) => state.disenchantRuneFromDeck);
  const returnToStartScreen = useGameplayStore((state) => state.returnToStartScreen);
  const endRound = useGameplayStore((state) => state.endRound);
  const overloadSoundPending = useGameplayStore((state) => state.overloadSoundPending);
  const acknowledgeOverloadSound = useGameplayStore((state) => state.acknowledgeOverloadSound);
  const channelSoundPending = useGameplayStore((state) => state.channelSoundPending);
  const acknowledgeChannelSound = useGameplayStore((state) => state.acknowledgeChannelSound);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const soundVolume = useUIStore((state) => state.soundVolume);
  const setSoundVolume = useUIStore((state) => state.setSoundVolume);
  const isMusicMuted = useUIStore((state) => state.isMusicMuted);
  const setMusicMuted = useUIStore((state) => state.setMusicMuted);
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay);
  const setPlayerHiddenPatternSlots = useUIStore((state) => state.setPlayerHiddenPatternSlots);
  const playArcaneDust = useArcaneDustSound();
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = hasSelectedRunes ? selectedRunes[0].runeType : null;

  const runeforgeSlotAssignmentsRef = useRef<Record<string, Record<string, number>>>({});

  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const showDeckOverlay = useUIStore((state) => state.showDeckOverlay);
  const showOverloadOverlay = useUIStore((state) => state.showOverloadOverlay);
  const fullDeck = useMemo(() => soloDeckTemplate, [soloDeckTemplate]); //TODO: this is bad
  const {
    animatingRunes: placementAnimatingRunes,
    activeAnimatingRunes,
    hiddenPatternSlots,
    handlePlacementAnimationComplete,
  } = useRunePlacementAnimations({
    player,
    selectedRunes,
    draftSource,
  });

  useRunePlacementSounds(
    activeAnimatingRunes,
    soundVolume,
    overloadSoundPending,
    acknowledgeOverloadSound,
    channelSoundPending,
    acknowledgeChannelSound
  );

  const prevArcaneDustRef = useRef<number>(displayedArcaneDust);
  useEffect(() => {
    if (displayedArcaneDust > prevArcaneDustRef.current) {
      playArcaneDust();
    }
    prevArcaneDustRef.current = displayedArcaneDust;
  }, [displayedArcaneDust, playArcaneDust]);

  useEffect(() => {
    setPlayerHiddenPatternSlots(hiddenPatternSlots);
  }, [hiddenPatternSlots, setPlayerHiddenPatternSlots]);

  const isPatternLineValidTarget = useCallback(
    (lineIndex: number): boolean => {
      if (!hasSelectedRunes || selectedRuneType === null) {
        return false;
      }

      const line = player.patternLines[lineIndex];
      if (!line || lockedPatternLines.includes(lineIndex)) {
        return false;
      }

      const matchesType = line.runeType === null || line.runeType === selectedRuneType;
      const notFull = line.count < line.tier;
      const wallSize = player.wall.length;
      const col = getWallColumnForRune(lineIndex, selectedRuneType, wallSize);
      const notOnWall = player.wall[lineIndex][col].runeType === null;

      return matchesType && notFull && notOnWall;
    },
    [hasSelectedRunes, player.patternLines, lockedPatternLines, player.wall, selectedRuneType],
  );

  const buildPlacementTargets = useCallback((): ActiveElement[] => {
    if (!hasSelectedRunes) {
      return [];
    }

    const targets: ActiveElement[] = [{ type: 'overload' }];

    player.patternLines.forEach((_, lineIndex) => {
      if (isPatternLineValidTarget(lineIndex)) {
        targets.push({ type: 'pattern-line', lineIndex });
      }
    });

    return targets;
  }, [hasSelectedRunes, isPatternLineValidTarget, player.patternLines]);

  const pickDefaultPlacementTarget = useCallback((): ActiveElement | null => {
    const targets = buildPlacementTargets();
    if (targets.length === 0) {
      return null;
    }

    const firstPlaceableLine = targets.find((target) => target.type === 'pattern-line');
    return firstPlaceableLine ?? targets[0];
  }, [buildPlacementTargets]);

  const handleToggleMusic = useCallback(() => {
    setMusicMuted(!isMusicMuted);
  }, [isMusicMuted, setMusicMuted]);

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseFloat(event.currentTarget.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      setSoundVolume(nextValue / 100);
    },
    [setSoundVolume],
  );

  useEffect(() => {
    if (shouldTriggerEndRound) {
      const timer = setTimeout(() => {
        endRound();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [shouldTriggerEndRound, endRound]);

  useEffect(() => {
    if (turnPhase !== 'cast') return;

    const timer = setTimeout(() => {
      moveRunesToWall();
    }, 750);

    return () => clearTimeout(timer);
  }, [turnPhase, moveRunesToWall]);

  const computeRuneforgeSlots = useCallback(
    (runeforge: RuneforgeType): Array<Rune | null> => {
      const totalSlots = Math.max(runesPerRuneforge, runeforge.runes.length, 1);
      const existingAssignments = runeforgeSlotAssignmentsRef.current[runeforge.id] ?? {};
      const nextAssignments: Record<string, number> = {};
      const usedSlots = new Set<number>();

      runeforge.runes.forEach((rune) => {
        const existingSlot = existingAssignments[rune.id];
        if (typeof existingSlot === 'number' && existingSlot >= 0 && existingSlot < totalSlots) {
          nextAssignments[rune.id] = existingSlot;
          usedSlots.add(existingSlot);
        }
      });

      let cursor = 0;
      runeforge.runes.forEach((rune) => {
        if (typeof nextAssignments[rune.id] === 'number') {
          return;
        }
        while (usedSlots.has(cursor)) {
          cursor += 1;
        }
        const assignedSlot = Math.min(cursor, totalSlots - 1);
        nextAssignments[rune.id] = assignedSlot;
        usedSlots.add(assignedSlot);
      });

      runeforgeSlotAssignmentsRef.current[runeforge.id] = nextAssignments;

      const runeBySlot = new Map<number, Rune>();
      runeforge.runes.forEach((rune) => {
        const slotIndex = nextAssignments[rune.id];
        if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < totalSlots) {
          runeBySlot.set(slotIndex, rune);
        }
      });

      return Array.from({ length: totalSlots }, (_, index) => runeBySlot.get(index) ?? null);
    },
    [runesPerRuneforge],
  );

  useEffect(() => {
    const activeRuneforgeIds = new Set(runeforges.map((forge) => forge.id));
    const assignments = runeforgeSlotAssignmentsRef.current;
    Object.keys(assignments).forEach((runeforgeId) => {
      if (!activeRuneforgeIds.has(runeforgeId)) {
        delete assignments[runeforgeId];
      }
    });
  }, [runeforges]);

  const runeforgeSlotLayouts = useMemo<RuneforgeSlotLayout[]>(
    () => runeforges.map((runeforge) => ({
      runeforgeId: runeforge.id,
      disabled: runeforge.disabled ?? false,
      slots: computeRuneforgeSlots(runeforge),
    })),
    [computeRuneforgeSlots, runeforges],
  );

  const pickFirstAvailableRune = useCallback((): ActiveElement | null => {
    for (let rowIndex = 0; rowIndex < runeforgeSlotLayouts.length; rowIndex += 1) {
      const layout = runeforgeSlotLayouts[rowIndex];
      if (layout.disabled) {
        continue;
      }
      const firstRuneIndex = layout.slots.findIndex((slot) => slot !== null);
      if (firstRuneIndex !== -1) {
        return { type: 'runeforge-rune', runeforgeIndex: rowIndex, runeIndex: firstRuneIndex };
      }
    }
    return null;
  }, [runeforgeSlotLayouts]);

  useEffect(() => {
    if (!activeElement) {
      return undefined;
    }

    const handleMouseMove = () => {
      setActiveElement(null);
      resetTooltipCards();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeElement, resetTooltipCards]);

  useEffect(() => {
    if (activeElement?.type !== 'runeforge-rune') {
      return;
    }

    const layout = runeforgeSlotLayouts[activeElement.runeforgeIndex];
    if (!layout || layout.disabled) {
      const fallback = pickFirstAvailableRune();
      setActiveElement(fallback);
      return;
    }

    const runeAtSlot = layout.slots[activeElement.runeIndex];
    if (!runeAtSlot) {
      const fallback = pickFirstAvailableRune();
      setActiveElement(fallback);
    }
  }, [activeElement, pickFirstAvailableRune, runeforgeSlotLayouts]);

  const allowKeyboardNavigation = useMemo(
    () => (
      !showSettingsOverlay
      && !showOverloadOverlay
      && !showRulesOverlay
      && !isGameOver
    ),
    [isGameOver, showOverloadOverlay, showRulesOverlay, showSettingsOverlay],
  );

  useEffect(() => {
    if (!allowKeyboardNavigation && activeElement !== null) {
      setActiveElement(null);
    }
  }, [activeElement, allowKeyboardNavigation]);

  useEffect(() => {
    if (!allowKeyboardNavigation || !hasSelectedRunes) {
      return;
    }

    const defaultPlacementTarget = pickDefaultPlacementTarget();
    if (!defaultPlacementTarget) {
      return;
    }

    setActiveElement((current) => {
      if (current?.type === 'pattern-line' && isPatternLineValidTarget(current.lineIndex)) {
        return current;
      }

      if (current?.type === 'overload') {
        return current;
      }

      return defaultPlacementTarget;
    });
  }, [allowKeyboardNavigation, hasSelectedRunes, isPatternLineValidTarget, pickDefaultPlacementTarget]);

  const [boardScale, setBoardScale] = useState(() => {
    if (typeof window === 'undefined') {
      return 1;
    }
    return computeBoardScale(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      setBoardScale(computeBoardScale(window.innerWidth, window.innerHeight));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scaledBoardWidth = BOARD_BASE_WIDTH * boardScale;
  const scaledBoardHeight = BOARD_BASE_HEIGHT * boardScale;

  return (
    <div
      className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#2b184f_0%,_#0c041c_65%,_#05010d_100%)] text-[#f5f3ff] flex items-center justify-center box-border relative"
    >
      <div className="relative" style={{ width: `${scaledBoardWidth}px`, height: `${scaledBoardHeight}px` }}>
        <div
          className="absolute top-0 left-0 origin-top-left bg-[rgba(9,3,24,0.85)] rounded-[36px] border border-white/12 shadow-[0_40px_120px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden backdrop-blur-[14px]"
          style={{
            width: `${BOARD_BASE_WIDTH}px`,
            height: `${BOARD_BASE_HEIGHT}px`,
            transform: `scale(${boardScale})`,
            transformOrigin: 'top left',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <SoloGameView/>
        </div>
      </div>

      {showRulesOverlay && <RulesOverlay onClose={() => setShowRulesOverlay(false)} />}

      {showDeckOverlay && (
        <DeckOverlay
          deck={player.deck}
          fullDeck={fullDeck}
          playerName={player.name}
          onDisenchantRune={disenchantRuneFromDeck}
        />
      )}

      {showOverloadOverlay && (
        <OverloadOverlay />
      )}
      {showSettingsOverlay && (
        <SettingsOverlay
          soundVolume={soundVolume}
          isMusicMuted={isMusicMuted}
          onVolumeChange={handleVolumeChange}
          onToggleMusic={handleToggleMusic}
          onQuitRun={returnToStartScreen}
          showQuitRun={true}
        />
      )
      }
      <RuneAnimation animatingRunes={placementAnimatingRunes} onAnimationComplete={handlePlacementAnimationComplete} />
    </div>
  );
});
