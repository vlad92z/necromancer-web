/**
 * Integration tests for gameplay store persistence ownership.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftSource, Rune, Runeforge, ScoringSequenceState } from '../../types/game';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
};

vi.mock('../../utils/mixpanel', () => ({
  trackDefeatEvent: vi.fn(),
  trackNewGameEvent: vi.fn(),
}));

describe('gameplayStore persistence', () => {
  beforeEach(() => {
    storage.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    vi.resetModules();
    vi.stubGlobal('window', { localStorage: localStorageMock });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists solo state from the gameplay store when a run starts', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'necromancer-solo-state',
      expect.any(String)
    );

    const [, payload] = localStorageMock.setItem.mock.calls[0] ?? [];
    const parsedPayload = JSON.parse(payload as string);
    expect(parsedPayload.version).toBe(2);
    expect(parsedPayload.state).not.toHaveProperty('game');
    expect(parsedPayload.state).not.toHaveProperty('strain');
    expect(parsedPayload.state).not.toHaveProperty('soloDeckTemplate');
    expect(parsedPayload.state).not.toHaveProperty('soloBaseTargetScore');
    expect(parsedPayload.state).not.toHaveProperty('totalRunesPerPlayer');
    expect(parsedPayload.state).not.toHaveProperty('tooltipCards');
    expect(parsedPayload.state).not.toHaveProperty('tooltipOverrideActive');
    expect(parsedPayload.state.enemy).toMatchObject({
      id: 'goblin',
      health: parsedPayload.state.targetScore,
      intent: { type: 'Attack', amount: 5 },
    });
    expect(parsedPayload.state.combatPhase).toBe('player-turn');
  });

  it('continues persisting gameplay updates during an active run', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    localStorageMock.setItem.mockClear();

    store.setState((state) => ({
      ...state,
      runePowerTotal: state.runePowerTotal + 7,
    }));

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    const [key, payload] = localStorageMock.setItem.mock.calls[0] ?? [];
    expect(key).toBe('necromancer-solo-state');
    expect(JSON.parse(payload as string).state).toMatchObject({ runePowerTotal: 7, gameStarted: true });
  });

  it('syncs gameplay actions into split concern stores', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { getGameplayState } = await import('./gameplayState');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();

    const composedState = getGameplayState();
    expect(composedState.gameStarted).toBe(true);
    expect(composedState.player).toEqual(store.getState().player);
    expect(composedState.runeforges).toEqual(store.getState().runeforges);
    expect(composedState.turnPhase).toBe(store.getState().turnPhase);
    expect(composedState.enemy).toEqual(store.getState().enemy);
    expect(composedState.combatPhase).toBe(store.getState().combatPhase);
  });

  it('clears persisted solo state when the run ends in defeat', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    localStorageMock.removeItem.mockClear();

    store.setState((state) => ({
      ...state,
      isDefeat: true,
    }));

    expect(localStorageMock.removeItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });

  it('does not add legacy alias keys when starting the next solo game', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      gameStarted: true,
      gameIndex: 2,
      targetScore: 35,
      fullDeck: state.player.deck,
      baseTargetScore: 10,
      deckDraftReadyForNextGame: true,
      turnPhase: 'deck-draft',
      player: {
        ...state.player,
        health: 42,
        maxHealth: 77,
      },
    }));

    store.getState().startNextSoloGame();

    const nextState = store.getState() as unknown as Record<string, unknown>;
    expect(nextState.gameIndex).toBe(3);
    expect(nextState.overloadDamage).toEqual(expect.any(Number));
    expect(nextState.fullDeck).toEqual(expect.any(Array));
    expect(nextState.baseTargetScore).toBe(10);
    expect(nextState).not.toHaveProperty('game');
    expect(nextState).not.toHaveProperty('strain');
    expect(nextState).not.toHaveProperty('soloDeckTemplate');
    expect(nextState).not.toHaveProperty('soloBaseTargetScore');
    expect(nextState).not.toHaveProperty('totalRunesPerPlayer');
  });

  it('does not add totalRunesPerPlayer during deck-draft mutations', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      turnPhase: 'deck-draft',
      deckDraftState: {
        runeforges: [],
        picksRemaining: 1,
        totalPicks: 1,
        selectionLimit: 1,
        selectionsThisOffer: 0,
      },
    }));

    const runeId = store.getState().fullDeck[0]?.id;
    expect(runeId).toBeDefined();
    store.getState().disenchantRuneFromDeck(runeId as string);

    const nextState = store.getState() as unknown as Record<string, unknown>;
    expect(nextState).not.toHaveProperty('totalRunesPerPlayer');
  });

  it('migrates legacy first rune pattern-line fields during hydration', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();
    const legacyRune = createTestRune('legacy-primary', 'Fire');

    store.getState().startSoloRun();
    const legacyState = {
      ...store.getState(),
      player: {
        ...store.getState().player,
        patternLines: store.getState().player.patternLines.map((line, index) => (
          index === 1
            ? {
              ...line,
              primaryRuneId: null,
              primaryRuneEffects: null,
              firstRuneId: legacyRune.id,
              firstRuneEffects: legacyRune.effects,
              runeType: legacyRune.runeType,
              count: 1,
              runes: [legacyRune],
            }
            : line
        )),
      },
    };

    store.getState().hydrateGameState(legacyState);

    const migratedLine = store.getState().player.patternLines[1];
    expect(migratedLine.primaryRuneId).toBe('legacy-primary');
    expect(migratedLine.primaryRuneEffects).toEqual(legacyRune.effects);
    expect(migratedLine).not.toHaveProperty('firstRuneId');
    expect(migratedLine).not.toHaveProperty('firstRuneEffects');
  });

  it('invokes the registered solo navigation callback when returning to the start screen', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { setNavigationCallback } = await import('../../systems/gameplayOrchestrator');
    const store = createGameplayStoreInstance();
    const navigate = vi.fn();

    setNavigationCallback(navigate);
    store.getState().returnToStartScreen();
    setNavigationCallback(null);

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('advances and clears scoring sequence display totals with timers', async () => {
    vi.useFakeTimers();
    const { create } = await import('zustand');
    const { clearScoringSequenceTimer, runScoringSequence } = await import('../../systems/scoringSequenceRunner');
    const sequence: ScoringSequenceState = {
      steps: [
        {
          row: 0,
          col: 0,
          runeType: 'Fire',
          damageDelta: 2,
          healingDelta: 1,
          armorDelta: 3,
          arcaneDustDelta: 4,
          delayMs: 10,
        },
        {
          row: 0,
          col: 1,
          runeType: 'Frost',
          damageDelta: 5,
          healingDelta: 2,
          armorDelta: 1,
          arcaneDustDelta: 6,
          delayMs: 10,
        },
      ],
      activeIndex: -1,
      sequenceId: 123,
      startHealth: 10,
      startArmor: 0,
      startRunePowerTotal: 20,
      startArcaneDust: 30,
      maxHealth: 12,
      displayHealth: 10,
      displayArmor: 0,
      displayRunePowerTotal: 20,
      displayArcaneDust: 30,
      targetHealth: 12,
      targetArmor: 4,
      targetRunePowerTotal: 27,
      targetArcaneDust: 40,
    };
    const store = create<{ scoringSequence: ScoringSequenceState | null }>(() => ({
      scoringSequence: sequence,
    }));

    runScoringSequence(sequence, store.setState);

    expect(store.getState().scoringSequence).toMatchObject({
      activeIndex: 0,
      displayHealth: 11,
      displayArmor: 3,
      displayRunePowerTotal: 22,
      displayArcaneDust: 34,
    });

    await vi.advanceTimersByTimeAsync(20);

    expect(store.getState().scoringSequence).toMatchObject({
      activeIndex: 1,
      displayHealth: 12,
      displayArmor: 4,
      displayRunePowerTotal: 27,
      displayArcaneDust: 40,
    });

    await vi.advanceTimersByTimeAsync(10);

    expect(store.getState().scoringSequence).toBeNull();
    clearScoringSequenceTimer();
  });

  it('resolves completed pattern lines immediately and returns input to select', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const rune = createTestRune('resolver-fire', 'Fire');
    const remainingRune = createTestRune('resolver-life', 'Life');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 999,
      patternLineLock: false,
      runeforges: [
        createTestRuneforge(rune),
        createTestRuneforge(remainingRune, 'resolver-forge-remaining'),
      ],
    }));
    useSelectionStore.getState().setSelection([rune], createTestDraftSource(rune), Date.now());

    store.getState().placeRunes(0);

    expect(store.getState().player.wall[0][0].runeType).toBe('Fire');
    expect(store.getState().turnPhase).toBe('select');
    expect(store.getState().scoringSequence).not.toBeNull();
  });

  it('keeps durable scoring final while scoring sequence display advances one rune at a time', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const rune = createTestRune('resolver-fire', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => {
      const wall = state.player.wall.map((row) => row.map((cell) => ({ ...cell })));
      wall[0][1] = {
        runeType: 'Life',
        effects: [{ type: 'Healing', amount: 1, rarity: 'common' }],
      };

      return {
        ...state,
        targetScore: 999,
        runeforges: [createTestRuneforge(rune)],
        player: {
          ...state.player,
          health: 99,
          wall,
        },
      };
    });
    useSelectionStore.getState().setSelection([rune], createTestDraftSource(rune), Date.now());

    store.getState().placeRunes(0);

    expect(store.getState().runePowerTotal).toBe(1);
    expect(store.getState().player.health).toBe(100);
    expect(store.getState().scoringSequence).toMatchObject({
      activeIndex: 0,
      displayRunePowerTotal: 1,
      displayHealth: 99,
      targetRunePowerTotal: 1,
      targetHealth: 100,
    });

    await vi.advanceTimersByTimeAsync(398);

    expect(store.getState().scoringSequence).toMatchObject({
      activeIndex: 1,
      displayRunePowerTotal: 1,
      displayHealth: 100,
    });
  });

  it('accepts another cast during active scoring and queues the next scoring display', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const firstRune = createTestRune('resolver-fire-1', 'Fire');
    const secondRune = createTestRune('resolver-life-1', 'Life');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 999,
      patternLineLock: false,
      runeforges: [
        createTestRuneforge(firstRune, 'resolver-forge-1'),
        createTestRuneforge(secondRune, 'resolver-forge-2'),
      ],
    }));
    useSelectionStore.getState().setSelection(
      [firstRune],
      createTestDraftSource(firstRune, 'resolver-forge-1'),
      Date.now()
    );

    store.getState().placeRunes(0);

    const firstSequenceId = store.getState().scoringSequence?.sequenceId;
    expect(firstSequenceId).toBeDefined();
    expect(store.getState().turnPhase).toBe('select');
    expect(store.getState().runePowerTotal).toBe(1);

    useSelectionStore.getState().setSelection(
      [secondRune],
      createTestDraftSource(secondRune, 'resolver-forge-2'),
      Date.now()
    );

    store.getState().placeRunes(0);

    expect(store.getState().turnPhase).toBe('resolving-end-round');
    expect(store.getState().runePowerTotal).toBe(3);
    expect(store.getState().player.wall[0][1].runeType).toBe('Life');
    expect(store.getState().scoringSequence?.sequenceId).toBe(firstSequenceId);

    await vi.advanceTimersByTimeAsync(840);

    expect(store.getState().scoringSequence?.sequenceId).not.toBe(firstSequenceId);
    expect(store.getState().scoringSequence).toMatchObject({
      activeIndex: 0,
      displayRunePowerTotal: 2,
    });

    await vi.advanceTimersByTimeAsync(1194);

    expect(store.getState().round).toBe(1);

    await vi.advanceTimersByTimeAsync(999);

    expect(store.getState().round).toBe(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(store.getState().round).toBe(2);
    expect(store.getState().turnPhase).toBe('select');
  });

  it('schedules end round through the round resolver when forges are exhausted without completed lines', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const rune = createTestRune('resolver-fire', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      runeforges: [createTestRuneforge(rune)],
    }));
    useSelectionStore.getState().setSelection([rune], createTestDraftSource(rune), Date.now());

    store.getState().placeRunesInFloor();

    expect(store.getState().turnPhase).toBe('resolving-end-round');
    expect(store.getState().round).toBe(1);

    await vi.advanceTimersByTimeAsync(999);

    expect(store.getState().round).toBe(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(store.getState().round).toBe(2);
    expect(store.getState().turnPhase).toBe('select');
  });

  it('defeats the player when floor overload drops health below zero', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const rune = createTestRune('lethal-floor-rune', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      overloadDamage: 2,
      runeforges: [createTestRuneforge(rune)],
      player: {
        ...state.player,
        health: 1,
      },
    }));
    useSelectionStore.getState().setSelection([rune], createTestDraftSource(rune), Date.now());

    store.getState().placeRunesInFloor();

    expect(store.getState().isDefeat).toBe(true);
    expect(store.getState().player.health).toBe(0);
  });

  it('defeats the player when pattern overflow drops health below zero', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const placedRune = createTestRune('lethal-placed-rune', 'Fire');
    const overflowRune = createTestRune('lethal-overflow-rune', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      overloadDamage: 2,
      targetScore: 999,
      runeforges: [createTestRuneforgeWithRunes([placedRune, overflowRune])],
      player: {
        ...state.player,
        health: 1,
      },
    }));
    useSelectionStore.getState().setSelection(
      [placedRune, overflowRune],
      createTestDraftSourceWithRunes([placedRune, overflowRune]),
      Date.now()
    );

    store.getState().placeRunes(0);

    expect(store.getState().isDefeat).toBe(true);
    expect(store.getState().player.health).toBe(0);
  });

  it('clears pending round resolver timers when resetting the game', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const rune = createTestRune('resolver-fire', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 999,
      runeforges: [createTestRuneforge(rune)],
    }));
    useSelectionStore.getState().setSelection([rune], createTestDraftSource(rune), Date.now());

    store.getState().placeRunes(0);
    expect(store.getState().scoringSequence).not.toBeNull();

    store.getState().resetGame();
    await vi.advanceTimersByTimeAsync(750);

    expect(store.getState().turnPhase).toBe('select');
    expect(store.getState().player.wall[0][0].runeType).toBeNull();
  });

  it('enters deck draft from scoring resolution without leaving resolver timers active', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const rune = createTestRune('resolver-fire', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 1,
      runeforges: [createTestRuneforge(rune)],
    }));
    useSelectionStore.getState().setSelection([rune], createTestDraftSource(rune), Date.now());

    store.getState().placeRunes(0);

    expect(store.getState().turnPhase).toBe('deck-draft');
    expect(store.getState().scoringSequence).toBeNull();

    await vi.advanceTimersByTimeAsync(5000);

    expect(store.getState().turnPhase).toBe('deck-draft');
  });

  it('awards deck-draft Arcane Dust once and clears selection on deck-draft entry', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const rune = createTestRune('deck-draft-reward', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 1,
      runeforges: [createTestRuneforge(rune)],
    }));
    useSelectionStore.getState().setSelection([rune], createTestDraftSource(rune), Date.now());

    store.getState().placeRunes(0);

    expect(store.getState().turnPhase).toBe('deck-draft');
    expect(storage.get('necromancer-arcane-dust')).toBe('50');
    expect(useSelectionStore.getState().selectedRunes).toEqual([]);
    expect(useSelectionStore.getState().draftSource).toBeNull();
  });

  it('moves to resolving end round when no completed lines remain and runeforges are exhausted', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      runeforges: [],
      turnPhase: 'select',
      shouldTriggerEndRound: false,
    }));

    store.getState().moveRunesToWall();

    expect(store.getState().turnPhase).toBe('resolving-end-round');
    expect(store.getState().shouldTriggerEndRound).toBe(true);
  });

  it('deals the initial active deck into a combat hand and leaves no hidden runeforges', async () => {
    const { initializeSoloGame } = await import('../../utils/gameInitialization');

    const state = initializeSoloGame(999, Array.from({ length: 24 }, (_, index) =>
      createTestRune(`initial-${index}`, 'Fire')
    ));

    expect(state.runeforges).toEqual([]);
    expect(state.hand).toHaveLength(6);
    expect(state.player.deck).toHaveLength(18);
  });

  it('selects a hand rune and completes a row one wall slot', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();
    const fireRune = createTestRune('hand-fire', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      hand: [fireRune],
      selectedHandRuneId: null,
    }));

    store.getState().selectHandRune(fireRune.id);
    expect(store.getState().selectedHandRuneId).toBe(fireRune.id);

    store.getState().castRuneToWall(0, 0);

    expect(store.getState().hand).toEqual([]);
    expect(store.getState().selectedHandRuneId).toBeNull();
    expect(store.getState().player.wall[0][0]).toEqual({
      runeType: 'Fire',
      effects: fireRune.effects,
    });
    expect(store.getState().wallCharges[0][0]).toMatchObject({
      currentCount: 1,
      completedRuneId: fireRune.id,
    });
  });

  it('charges a higher-row wall slot before final completion', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();
    const fireRune = createTestRune('hand-fire-charge', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      hand: [fireRune],
      selectedHandRuneId: fireRune.id,
    }));

    store.getState().castRuneToWall(1, 1);

    expect(store.getState().hand).toEqual([]);
    expect(store.getState().selectedHandRuneId).toBeNull();
    expect(store.getState().player.wall[1][1].runeType).toBeNull();
    expect(store.getState().wallCharges[1][1]).toMatchObject({
      currentCount: 1,
      requiredCount: 2,
      completedRuneId: null,
    });
    expect(store.getState().wallCharges[1][1].spentRunes.map((rune) => rune.id)).toEqual([
      fireRune.id,
    ]);
  });

  it('rejects wrong-type and filled wall slots without clearing hand selection', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();
    const lifeRune = createTestRune('hand-life', 'Life');
    const fireRune = createTestRune('hand-fire-selected', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      hand: [lifeRune],
      selectedHandRuneId: lifeRune.id,
    }));

    store.getState().castRuneToWall(0, 0);

    expect(store.getState().hand).toEqual([lifeRune]);
    expect(store.getState().selectedHandRuneId).toBe(lifeRune.id);
    expect(store.getState().player.wall[0][0].runeType).toBeNull();

    store.setState((state) => ({
      ...state,
      hand: [fireRune],
      selectedHandRuneId: fireRune.id,
      player: {
        ...state.player,
        wall: state.player.wall.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            rowIndex === 0 && colIndex === 0
              ? { runeType: 'Fire', effects: fireRune.effects }
              : cell
          )
        ),
      },
    }));

    store.getState().castRuneToWall(0, 0);

    expect(store.getState().hand).toEqual([fireRune]);
    expect(store.getState().selectedHandRuneId).toBe(fireRune.id);
    expect(store.getState().wallCharges[0][0].completedRuneId).toBeNull();
  });

  it('partially refills runeforges from the remaining deck without defeating the player', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();
    const remainingRunes = [
      createTestRune('partial-1', 'Fire'),
      createTestRune('partial-2', 'Life'),
      createTestRune('partial-3', 'Void'),
    ];

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      turnPhase: 'resolving-end-round',
      shouldTriggerEndRound: true,
      player: {
        ...state.player,
        deck: remainingRunes,
      },
      runeforges: [],
    }));

    store.getState().endRound();

    const nextState = store.getState();
    expect(nextState.isDefeat).toBe(false);
    expect(nextState.turnPhase).toBe('select');
    expect(nextState.player.deck).toEqual([]);
    expect(nextState.runeforges.flatMap((runeforge) => runeforge.runes.map((rune) => rune.id))).toEqual([
      'partial-1',
      'partial-2',
      'partial-3',
    ]);
    expect(nextState.runeforges.some((runeforge) => runeforge.runes.length === 0)).toBe(true);
  });

  it('defeats the player when an exhausted round refills from an empty deck', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      turnPhase: 'resolving-end-round',
      shouldTriggerEndRound: true,
      player: {
        ...state.player,
        deck: [],
      },
      runeforges: [],
    }));

    store.getState().endRound();

    expect(store.getState().isDefeat).toBe(true);
  });

  it('recycles non-primary cast runes to the back of the deck while removing the cast rune', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const primaryRune = createTestRune('cast-primary', 'Fire');
    const recycledRune = createTestRune('cast-recycled', 'Fire');
    const tailRune = createTestRune('deck-tail', 'Life');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 999,
      patternLineLock: false,
      runeforges: [createTestRuneforgeWithRunes([primaryRune, recycledRune])],
      player: {
        ...state.player,
        deck: [tailRune],
      },
    }));
    useSelectionStore.getState().setSelection(
      [primaryRune, recycledRune],
      createTestDraftSourceWithRunes([primaryRune, recycledRune]),
      Date.now()
    );

    store.getState().placeRunes(1);

    expect(store.getState().player.wall[1].some((cell) => cell.runeType === 'Fire')).toBe(true);
    expect(store.getState().player.deck.map((rune) => rune.id)).toEqual(['deck-tail', 'cast-recycled']);
    expect(store.getState().player.deck.some((rune) => rune.id === 'cast-primary')).toBe(false);
  });

  it('preserves primary rune metadata while a pattern line waits to complete', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const primaryRune = createTestRune('waiting-primary', 'Fire');
    const secondaryRune = createTestRune('waiting-secondary', 'Fire');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 999,
      patternLineLock: false,
      runeforges: [createTestRuneforgeWithRunes([primaryRune, secondaryRune])],
    }));
    useSelectionStore.getState().setSelection(
      [primaryRune, secondaryRune],
      createTestDraftSourceWithRunes([primaryRune, secondaryRune]),
      Date.now()
    );

    store.getState().placeRunes(2);

    const waitingLine = store.getState().player.patternLines[2];
    expect(waitingLine.count).toBe(2);
    expect(waitingLine.primaryRuneId).toBe('waiting-primary');
    expect(waitingLine.primaryRuneEffects).toEqual(primaryRune.effects);
  });

  it('does not recycle overflow runes when a pattern line cast resolves', async () => {
    vi.useFakeTimers();
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { useSelectionStore } = await import('./selectionStore');
    const store = createGameplayStoreInstance();
    const primaryRune = createTestRune('overflow-primary', 'Fire');
    const overflowRune = createTestRune('overflow-rune', 'Fire');
    const tailRune = createTestRune('overflow-tail', 'Life');

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      targetScore: 999,
      patternLineLock: false,
      runeforges: [createTestRuneforgeWithRunes([primaryRune, overflowRune])],
      player: {
        ...state.player,
        deck: [tailRune],
      },
    }));
    useSelectionStore.getState().setSelection(
      [primaryRune, overflowRune],
      createTestDraftSourceWithRunes([primaryRune, overflowRune]),
      Date.now()
    );

    store.getState().placeRunes(0);

    expect(store.getState().player.deck.map((rune) => rune.id)).toEqual(['overflow-tail']);
    expect(store.getState().overloadRunes.map((rune) => rune.id)).toContain('overflow-rune');
  });
});

function createTestRune(id: string, runeType: Rune['runeType']): Rune {
  return {
    id,
    runeType,
    effects: [{ type: 'Damage', amount: 1, rarity: 'common' }],
  };
}

function createTestRuneforge(rune: Rune, id: string = 'resolver-forge'): Runeforge {
  return createTestRuneforgeWithRunes([rune], id);
}

function createTestRuneforgeWithRunes(runes: Rune[], id: string = 'resolver-forge'): Runeforge {
  return {
    id,
    ownerId: 'player-1',
    runes,
    disabled: false,
  };
}

function createTestDraftSource(rune: Rune, runeforgeId: string = 'resolver-forge'): DraftSource {
  return createTestDraftSourceWithRunes([rune], runeforgeId);
}

function createTestDraftSourceWithRunes(runes: Rune[], runeforgeId: string = 'resolver-forge'): DraftSource {
  return {
    runeforgeId,
    originalRunes: runes,
    affectedRuneforges: [{ runeforgeId, originalRunes: runes }],
    selectionMode: 'single',
  };
}
