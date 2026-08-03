import { describe, expect, it } from 'vitest';
import type { Player, Rune, SoloMapState } from '../types/game';
import { createInitialSoloRunState } from './soloRunFactory';
import { resolveSacrificialAltar, SACRIFICIAL_ALTAR_HEALTH_COST } from './sacrificialAltar';

function createAltarState(health = 30): { soloMap: SoloMapState; player: Player; fullDeck: Rune[] } {
  const state = createInitialSoloRunState();
  const event = {
    id: 'altar-tile:A',
    locationId: 'A' as const,
    tokenId: 'greenwood-sacrificial-altar-1',
    kind: 'sacrificial-altar' as const,
    cleared: false,
  };
  return {
    soloMap: {
      ...state.soloMap,
      tiles: {
        ...state.soloMap.tiles,
        'altar-tile': {
          key: 'altar-tile',
          x: 1,
          y: 0,
          kind: 'forest' as const,
          events: { A: event },
        },
      },
      playerPosition: { tileKey: 'altar-tile', locationId: 'A' as const },
    },
    player: { ...state.player, health },
    fullDeck: state.fullDeck,
  };
}

describe('resolveSacrificialAltar', () => {
  it('pays 10 health, deletes exactly the selected card, and clears the altar', () => {
    const state = createAltarState();
    const selectedRune = state.fullDeck[2];
    const result = resolveSacrificialAltar(state, selectedRune.id);

    expect(result.status).toBe('sacrificed');
    expect(result.player.health).toBe(30 - SACRIFICIAL_ALTAR_HEALTH_COST);
    expect(result.fullDeck).toHaveLength(state.fullDeck.length - 1);
    expect(result.fullDeck.some((rune) => rune.id === selectedRune.id)).toBe(false);
    expect(result.soloMap.tiles['altar-tile'].events.A?.cleared).toBe(true);
  });

  it('skips without changing health or deck and clears the altar', () => {
    const state = createAltarState();
    const result = resolveSacrificialAltar(state, null);

    expect(result.status).toBe('skipped');
    expect(result.player).toBe(state.player);
    expect(result.fullDeck).toBe(state.fullDeck);
    expect(result.soloMap.tiles['altar-tile'].events.A?.cleared).toBe(true);
  });

  it('rejects an unknown card and a sacrifice that would reduce health to zero', () => {
    const state = createAltarState(SACRIFICIAL_ALTAR_HEALTH_COST);

    expect(resolveSacrificialAltar(state, 'missing').status).toBe('invalid');
    const result = resolveSacrificialAltar(state, state.fullDeck[0].id);
    expect(result.status).toBe('invalid');
    expect(result.player.health).toBe(SACRIFICIAL_ALTAR_HEALTH_COST);
    expect(result.soloMap.tiles['altar-tile'].events.A?.cleared).toBe(false);
  });

  it('rejects choices outside an active unvisited altar', () => {
    const state = createAltarState();
    state.soloMap.playerPosition = { tileKey: '0,0', locationId: 'start' };

    expect(resolveSacrificialAltar(state, state.fullDeck[0].id).status).toBe('invalid');
  });
});
