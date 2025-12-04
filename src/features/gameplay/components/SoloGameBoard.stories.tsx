/**
 * SoloGameBoard stories - previews the core solo play states
 */

import type { Meta, StoryObj } from '@storybook/react';

import { createDeckDraftState } from '../../../utils/deckDrafting';
import { getRuneTypesForCount, initializeSoloGame } from '../../../utils/gameInitialization';
import type { Rune, RuneType, RuneTypeCount, SoloOutcome } from '../../../types/game';
import type { GameBoardSharedProps, SoloVariantData } from './GameBoardFrame';
import { SoloBoardContent } from './SoloGameBoard';

type Story = StoryObj<typeof SoloBoardContent>;

const meta: Meta<typeof SoloBoardContent> = {
  title: 'Solo Game/Board',
  component: SoloBoardContent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="min-h-screen bg-[#0b1024] p-6">
      <div className="mx-auto w-full max-w-[1500px]">
        <SoloBoardContent {...args} />
      </div>
    </div>
  ),
};

export default meta;

const createRune = (id: string, runeType: RuneType): Rune => ({
  id,
  runeType,
  effects: [],
});

const createSoloBoardFixtures = (
  options?: Partial<{ runeTypeCount: RuneTypeCount; phase: 'draft' | 'deck-draft' | 'game-over'; outcome: SoloOutcome }>
): { shared: GameBoardSharedProps; variantData: SoloVariantData } => {
  const runeTypeCount = options?.runeTypeCount ?? 4;
  const phase = options?.phase ?? 'draft';
  const outcome = options?.outcome ?? 'victory';
  const gameState = initializeSoloGame(runeTypeCount, { targetRuneScore: 200, startingHealth: 20 });
  const runeTypes = getRuneTypesForCount(gameState.runeTypeCount);
  const primary = runeTypes[0];
  const secondary = runeTypes[1] ?? primary;
  const tertiary = runeTypes[2] ?? primary;
  const player = gameState.players[0];

  player.patternLines[0] = {
    ...player.patternLines[0],
    runeType: primary,
    count: Math.min(2, player.patternLines[0].tier),
    firstRuneId: 'story-pl-0',
    firstRuneEffects: [],
  };
  player.patternLines[1] = {
    ...player.patternLines[1],
    runeType: secondary,
    count: Math.min(3, player.patternLines[1].tier),
    firstRuneId: 'story-pl-1',
    firstRuneEffects: [],
  };
  player.patternLines[2] = {
    ...player.patternLines[2],
    runeType: tertiary,
    count: 1,
    firstRuneId: 'story-pl-2',
    firstRuneEffects: [],
  };

  const wallSize = player.wall.length;
  if (wallSize > 0) {
    player.wall[0][0] = { runeType: primary, effects: [] };
  }
  if (wallSize > 1) {
    player.wall[1][wallSize > 2 ? 2 : 1] = { runeType: secondary, effects: [] };
  }
  if (wallSize > 2) {
    player.wall[2][1] = { runeType: tertiary, effects: [] };
  }

  player.floorLine.runes = [createRune('floor-1', tertiary), createRune('floor-2', primary)];
  gameState.centerPool = [createRune('center-1', secondary), createRune('center-2', tertiary)];

  const firstRuneforge = gameState.runeforges[0];
  const selectedRunes = firstRuneforge ? firstRuneforge.runes.slice(0, 2) : [];
  gameState.selectedRunes = selectedRunes;
  gameState.draftSource = firstRuneforge
    ? {
        type: 'runeforge',
        runeforgeId: firstRuneforge.id,
        movedToCenter: [],
        originalRunes: firstRuneforge.runes,
      }
    : null;

  gameState.round = phase === 'game-over' ? 6 : 3;
  gameState.runePowerTotal = phase === 'game-over' ? 230 : 140;
  gameState.soloTargetScore = 200;
  gameState.lockedPatternLines[player.id] = [2];
  gameState.turnPhase = phase === 'deck-draft' ? 'deck-draft' : phase === 'game-over' ? 'game-over' : 'draft';
  gameState.deckDraftState = phase === 'deck-draft' ? createDeckDraftState(gameState.runeTypeCount, player.id) : null;
  gameState.soloOutcome = phase === 'game-over' ? outcome : null;
  gameState.strain = 3;

  const opponent = gameState.players[1];

  const shared: GameBoardSharedProps = {
    players: gameState.players,
    currentPlayerIndex: 0,
    currentPlayerId: player.id,
    round: gameState.round,
    isDraftPhase: gameState.turnPhase === 'draft',
    isGameOver: gameState.turnPhase === 'game-over',
    selectedRuneType: selectedRunes[0]?.runeType ?? null,
    selectedRunes,
    hasSelectedRunes: selectedRunes.length > 0,
    draftSource: gameState.draftSource,
    runeforges: gameState.runeforges,
    centerPool: gameState.centerPool,
    runeTypeCount: gameState.runeTypeCount,
    playerLockedLines: gameState.lockedPatternLines[player.id] ?? [],
    opponentLockedLines: gameState.lockedPatternLines[opponent.id] ?? [],
    playerHiddenPatternSlots: new Set<string>(),
    opponentHiddenPatternSlots: new Set<string>(),
    playerHiddenFloorSlots: new Set<number>(),
    animatingRuneIds: [],
    hiddenCenterRuneIds: new Set<string>(),
    onRuneClick: () => {},
    onCenterRuneClick: () => {},
    onCancelSelection: () => {},
    onPlaceRunes: () => {},
    onPlaceRunesInFloor: () => {},
    returnToStartScreen: () => {},
  };

  const variantData: SoloVariantData = {
    soloOutcome: gameState.soloOutcome,
    soloRuneScore: { currentScore: gameState.runePowerTotal, targetScore: gameState.soloTargetScore },
    soloStats: {
      isActive: true,
      overloadMultiplier: gameState.strain,
      round: gameState.round,
      deckCount: player.deck.length,
    },
    soloTargetScore: gameState.soloTargetScore,
    runePowerTotal: gameState.runePowerTotal,
    deckDraftState: gameState.deckDraftState,
    isDeckDrafting: gameState.turnPhase === 'deck-draft',
    onSelectDeckDraftRuneforge: () => {},
    onOpenDeckOverlay: () => {},
  };

  return { shared, variantData };
};

export const DraftPhase: Story = {
  args: createSoloBoardFixtures({ phase: 'draft' }),
};

export const DeckDrafting: Story = {
  args: createSoloBoardFixtures({ phase: 'deck-draft' }),
};

export const GameOverVictory: Story = {
  args: createSoloBoardFixtures({ phase: 'game-over', outcome: 'victory' }),
};

export const GameOverDefeat: Story = {
  args: createSoloBoardFixtures({ phase: 'game-over', outcome: 'defeat' }),
};
