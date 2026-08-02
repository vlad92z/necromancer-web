import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
};

describe('soloPersistence', () => {
  beforeEach(() => {
    storage.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    vi.stubGlobal('window', { localStorage: localStorageMock });
  });

  it('saves and loads versioned solo state payloads', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState, saveSoloState, SOLO_STATE_VERSION } = await import('./soloPersistence');
    const state = { ...initializeSoloGame(), gameStarted: true };

    saveSoloState(state);

    const rawPayload = storage.get('necromancer-solo-state');
    expect(rawPayload).toBeDefined();
    expect(JSON.parse(rawPayload as string)).toMatchObject({
      version: SOLO_STATE_VERSION,
      state: {
        gameStarted: true,
        soloPhase: 'map',
        soloMap: {
          playerPosition: { tileKey: '0,0', locationId: 'start' },
        },
      },
    });
    expect(loadSoloState()).toMatchObject({
      gameStarted: true,
    });
  });

  it('invalidates current-version saves with a legacy 6 by 6 spell wall', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { createEmptySpellWall } = await import('./spellWall');
    const { loadSoloState, SOLO_STATE_VERSION } = await import('./soloPersistence');
    const state = initializeSoloGame();
    state.player.wall = createEmptySpellWall(6);

    storage.set('necromancer-solo-state', JSON.stringify({ version: SOLO_STATE_VERSION, state }));

    expect(loadSoloState()).toBeNull();
  });

  it('invalidates current-version saves whose wall cells predate token shields', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState, SOLO_STATE_VERSION } = await import('./soloPersistence');
    const state = initializeSoloGame();
    const legacyCell = { ...state.player.wall[0]![0] } as Record<string, unknown>;
    delete legacyCell.shield;
    state.player.wall[0]![0] = legacyCell as unknown as typeof state.player.wall[number][number];

    storage.set('necromancer-solo-state', JSON.stringify({ version: SOLO_STATE_VERSION, state }));

    expect(loadSoloState()).toBeNull();
  });

  it('persists a serializable pending rune target and continuation', async () => {
    const { createEffectRef } = await import('./effectCatalog');
    const { initializeSoloGame } = await import('./gameInitialization');
    const { createRuneFromCardName } = await import('./runeEffects');
    const { createRuneRemovalEffectRef } = await import('./runeRemoval');
    const { loadSoloState, saveSoloState } = await import('./soloPersistence');
    const state = { ...initializeSoloGame(), gameStarted: true };
    const castRune = createRuneFromCardName({ id: 'pending-cast', cardName: 'Firebolt' });
    const effectRef = createRuneRemovalEffectRef({
      kind: 'consume',
      trigger: 'onCast',
      selection: 'manual',
      payload: createEffectRef('cast.damage', { amount: 5 }),
    });
    state.pendingCombatResolution = {
      target: {
        sourceOwner: 'player',
        sourceRuneId: castRune.id,
        sourcePosition: { row: 0, col: 0 },
        effectRef,
      },
      continuation: {
        kind: 'cast',
        castRune,
        sourcePosition: { row: 0, col: 0 },
        remainingEffectRefs: [],
      },
    };

    saveSoloState(state);

    expect(loadSoloState()?.pendingCombatResolution).toEqual(state.pendingCombatResolution);
  });

  it('restores generated tiles, cleared encounters, and player position', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { completeActiveMapEncounter, travelOnSoloMap } = await import('./soloMap');
    const { getRegionDefinition } = await import('./regionCatalog');
    const { loadSoloState, saveSoloState } = await import('./soloPersistence');
    const state = { ...initializeSoloGame(), gameStarted: true };
    state.soloMap.availableEventTokenIds = getRegionDefinition('greenwood').eventTokens
      .filter((token) => token.kind === 'combat').map((token) => token.id);
    const arrival = travelOnSoloMap(state.soloMap, {
      kind: 'road',
      tileKey: '0,0',
      roadId: 'right-75',
    });
    state.soloMap = completeActiveMapEncounter(arrival.map);

    saveSoloState(state);

    expect(loadSoloState()?.soloMap).toMatchObject({
      playerPosition: { tileKey: '1,0', locationId: 'A' },
      activeEncounter: null,
      tiles: {
        '1,0': {
          events: {
            A: { cleared: true },
          },
        },
      },
    });
  });

  it('restores an unresolved Sacrificial Altar on the map', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState, saveSoloState } = await import('./soloPersistence');
    const state = { ...initializeSoloGame(), gameStarted: true };
    state.soloMap.tiles['1,0'] = {
      key: '1,0',
      x: 1,
      y: 0,
      kind: 'forest',
      events: {
        A: {
          id: '1,0:A',
          locationId: 'A',
          tokenId: 'greenwood-sacrificial-altar-1',
          kind: 'sacrificial-altar',
          cleared: false,
        },
      },
    };
    state.soloMap.playerPosition = { tileKey: '1,0', locationId: 'A' };

    saveSoloState(state);

    expect(loadSoloState()?.soloMap.tiles['1,0'].events.A).toMatchObject({
      kind: 'sacrificial-altar',
      cleared: false,
    });
  });

  it('restores a discovered Greenwood boss event', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState, saveSoloState } = await import('./soloPersistence');
    const state = { ...initializeSoloGame(), gameStarted: true };
    state.soloMap.tiles['1,0'] = {
      key: '1,0',
      x: 1,
      y: 0,
      kind: 'forest',
      events: {
        B: {
          id: '1,0:B',
          locationId: 'B',
          tokenId: null,
          kind: 'boss',
          monsterId: 'golem-lord',
          cleared: false,
        },
      },
    };

    saveSoloState(state);

    expect(loadSoloState()?.soloMap.tiles['1,0'].events.B).toMatchObject({
      kind: 'boss',
      monsterId: 'golem-lord',
      cleared: false,
    });
  });

  it.each(['encounter', 'reward'] as const)('restores an active map encounter during the %s phase', async (soloPhase) => {
    const { createDeckDraftState } = await import('./deckDrafting');
    const { initializeSoloGame } = await import('./gameInitialization');
    const { travelOnSoloMap } = await import('./soloMap');
    const { getRegionDefinition } = await import('./regionCatalog');
    const { loadSoloState, saveSoloState } = await import('./soloPersistence');
    const state = { ...initializeSoloGame(), gameStarted: true, soloPhase };
    state.soloMap.availableEventTokenIds = getRegionDefinition('greenwood').eventTokens
      .filter((token) => token.kind === 'combat').map((token) => token.id);
    const arrival = travelOnSoloMap(state.soloMap, {
      kind: 'road',
      tileKey: '0,0',
      roadId: 'right-75',
    });
    state.soloMap = arrival.map;
    if (soloPhase === 'reward') {
      state.combatPhase = 'victory';
      state.deckDraftState = createDeckDraftState(state.player.id, state.enemy);
    }

    saveSoloState(state);

    expect(loadSoloState()).toMatchObject({
      soloPhase,
      soloMap: {
        activeEncounter: {
          tileKey: '1,0',
          locationId: 'A',
        },
        tiles: {
          '1,0': {
            events: {
              A: { cleared: false },
            },
          },
        },
      },
    });
  });

  it('invalidates old raw GameState payloads', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { hasSavedSoloState, loadSoloState } = await import('./soloPersistence');
    storage.set('necromancer-solo-state', JSON.stringify(initializeSoloGame()));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
    expect(hasSavedSoloState()).toBe(false);
  });

  it('invalidates schema 28 payloads', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState } = await import('./soloPersistence');
    storage.set('necromancer-solo-state', JSON.stringify({ version: 28, state: initializeSoloGame() }));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });

  it('invalidates schema 19 combat-only saves', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState } = await import('./soloPersistence');
    const legacyState = { ...initializeSoloGame() } as Record<string, unknown>;
    delete legacyState.soloMap;
    delete legacyState.soloPhase;
    storage.set('necromancer-solo-state', JSON.stringify({ version: 19, state: legacyState }));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });

  it('invalidates old versioned payloads with legacy rune effect fields', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState } = await import('./soloPersistence');
    const legacyState = initializeSoloGame();
    const legacyRune = {
      ...legacyState.player.deck[0],
      effects: {
        cast: [{ type: 'Damage', amount: 1, rarity: 'common' }],
        passive: [],
      },
    };
    legacyState.player.deck = [legacyRune as typeof legacyState.player.deck[number], ...legacyState.player.deck.slice(1)];

    storage.set('necromancer-solo-state', JSON.stringify({ version: 2, state: legacyState }));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });
});
