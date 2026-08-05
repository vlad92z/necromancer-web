import { describe, expect, it } from 'vitest';
import type { EnemyRune, Rune } from '../types/game';
import { CARD_DEFINITIONS } from './cardCatalog';
import { castRuneOverWallSlot, castRuneToWallSlot, resolveCompletedRuneCastEffects, resolveConsumedRuneCastEffects, resolveEnemyTurn } from './combatResolution';
import { resolveTimedRuneRemovalEffects } from './effectResolver';
import { createMonsterEnemy } from './monsterFactory';
import { createRuneFromCardName } from './runeEffects';
import { createPlayer } from './soloRunFactory';
import { createEmptySpellWall } from './spellWall';
import { isRuneRemovalEffectRef } from './runeRemoval';

function place(player: ReturnType<typeof createPlayer>, rune: Rune, row: number, col: number) {
  const result = castRuneToWallSlot({
    player,
    hand: [rune],
    discardPile: [],
    selectedHandRuneId: rune.id,
    row,
    col,
  });
  if (result.status !== 'completed' || !result.completedRune || !result.completedPosition) throw new Error('Expected a completed rune');
  return result;
}

describe('retuned cards', () => {
  it('defines every requested canonical effect', () => {
    expect(CARD_DEFINITIONS.Barricade.castEffectRefs).toEqual([{ effectId: 'cast.shieldAdjacent', params: { amount: 1 } }]);
    expect(CARD_DEFINITIONS.Firebolt.castEffectRefs).toEqual([{ effectId: 'cast.damageBoard', params: { amount: 1 } }]);
    expect(CARD_DEFINITIONS.VoidTendrils.castEffectRefs[0]).toMatchObject({ effectId: 'rune.consume', payload: { effectId: 'cast.damage', params: { amount: 12 } } });
    expect(CARD_DEFINITIONS.ThrowRock.castEffectRefs).toEqual([{ effectId: 'cast.synergy', params: { amount: 1, synergyType: 'Life' } }]);
    expect(CARD_DEFINITIONS.Hide.castEffectRefs[0]).toMatchObject({ effectId: 'rune.consume', runeType: 'Life', payload: { effectId: 'cast.shield', params: { amount: 3 } } });
    expect(CARD_DEFINITIONS.Scorch.castEffectRefs).toEqual([{ effectId: 'cast.damageAdjacent', params: { amount: 2, runeType: 'Fire' } }]);
    expect(CARD_DEFINITIONS.Heal.castEffectRefs[0]).toMatchObject({ effectId: 'rune.consume', runeType: 'Life', payload: { effectId: 'cast.healing', params: { amount: 5 } } });
    expect(CARD_DEFINITIONS.FrostShield.passiveEffectRefs).toContainEqual({ effectId: 'passive.explosive', params: { amount: 3, removalKind: 'destroy' } });
    expect(CARD_DEFINITIONS.AmplifyMagic.passiveEffectRefs).toContainEqual({
      effectId: 'rune.destroy', trigger: 'endTurn', selection: 'random', targetOwner: 'self', count: 1,
    });
    expect(CARD_DEFINITIONS.LightningBolt.passiveEffectRefs).toEqual([{ effectId: 'passive.explosive', params: { amount: 12, removalKind: 'consume' } }]);
  });

  it('counts only adjacent runes and filters Scorch to Fire neighbors', () => {
    const base = createPlayer('player', 'Player', 20, [], 20);
    const fireNeighbor = place(base, createRuneFromCardName({ id: 'fire-neighbor', cardName: 'Firebolt' }), 0, 0);
    const lifeNeighbor = place(fireNeighbor.player, createRuneFromCardName({ id: 'life-neighbor', cardName: 'Barricade' }), 0, 1);
    const scorchPlacement = place(lifeNeighbor.player, createRuneFromCardName({ id: 'scorch', cardName: 'Scorch' }), 1, 1);
    const result = resolveCompletedRuneCastEffects({
      player: scorchPlacement.player,
      enemy: createMonsterEnemy('goblin'),
      rune: scorchPlacement.completedRune!,
      sourcePosition: scorchPlacement.completedPosition!,
    });

    expect(result.enemy?.health).toBe(createMonsterEnemy('goblin').health - 2);
  });

  it('makes Firebolt deal one damage for every rune in the completed wall', () => {
    const base = createPlayer('player', 'Player', 20, [], 20);
    const first = place(base, createRuneFromCardName({ id: 'barricade', cardName: 'Barricade' }), 0, 0);
    const second = place(first.player, createRuneFromCardName({ id: 'frost-shield', cardName: 'FrostShield' }), 0, 1);
    const firebolt = place(second.player, createRuneFromCardName({ id: 'firebolt', cardName: 'Firebolt' }), 1, 1);
    const enemy = createMonsterEnemy('goblin');
    const result = resolveCompletedRuneCastEffects({
      player: firebolt.player,
      enemy,
      rune: firebolt.completedRune!,
      sourcePosition: firebolt.completedPosition!,
    });

    expect(result.enemy?.health).toBe(enemy.health - 3);
  });

  it('consumes a Lightning Bolt for 12 damage, but does not trigger it when destroyed', () => {
    const player = place(createPlayer('player', 'Player', 20, [], 20), createRuneFromCardName({ id: 'lightning', cardName: 'LightningBolt' }), 0, 0).player;
    const consumer = createRuneFromCardName({ id: 'consumer', cardName: 'VoidTendrils' });
    const placement = castRuneOverWallSlot({
      player, enemyBoard: createEmptySpellWall(), hand: [consumer], discardPile: [],
      selectedHandRuneId: consumer.id, targetSide: 'player', row: 0, col: 0,
    });
    const consumeEffect = consumer.castEffectRefs.find((effectRef) => (
      isRuneRemovalEffectRef(effectRef) && effectRef.effectId === 'rune.consume'
    ));
    if (!placement.completedRune || !placement.completedPosition || !placement.removedRune || !consumeEffect || consumeEffect.effectId !== 'rune.consume') {
      throw new Error('Expected a completed Consume cast');
    }
    const consumed = resolveConsumedRuneCastEffects({
      player: placement.player,
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: placement.enemyBoard,
      rune: placement.completedRune,
      removedRune: placement.removedRune,
      consumeEffect,
      sourcePosition: placement.completedPosition,
      targetSide: 'player',
    });
    expect(consumed.enemy?.health).toBe(0);
  });

  it('Amplify Magic boosts player damage and destroys one other rune at end turn', () => {
    const amplify = createRuneFromCardName({ id: 'amplify', cardName: 'AmplifyMagic' });
    const firebolt = createRuneFromCardName({ id: 'firebolt', cardName: 'Firebolt' });
    const first = place(createPlayer('player', 'Player', 20, [], 20), amplify, 0, 0);
    const second = place(first.player, firebolt, 0, 1);
    const cast = resolveCompletedRuneCastEffects({
      player: second.player,
      enemy: createMonsterEnemy('goblin'),
      rune: second.completedRune!,
      sourcePosition: second.completedPosition!,
    });
    const timed = resolveTimedRuneRemovalEffects({
      trigger: 'endTurn', player: cast.player, enemy: cast.enemy, opposingWall: cast.enemyBoard, random: () => 0,
    });

    expect(cast.enemy?.health).toBe(createMonsterEnemy('goblin').health - 3);
    expect(timed.player.wall[0][0]?.id).toBe(first.completedRune!.id);
    expect(timed.player.wall[0][1]?.id).toBeNull();
  });

  it('deals Frost Shield destruction damage when its shield reaches zero', () => {
    const frost = createRuneFromCardName({ id: 'frost', cardName: 'FrostShield' });
    const placed = place(createPlayer('player', 'Player', 20, [], 20), frost, 0, 0);
    const resolved = resolveCompletedRuneCastEffects({
      player: placed.player, enemy: createMonsterEnemy('goblin'), rune: placed.completedRune!, sourcePosition: placed.completedPosition!,
    });
    const attack: EnemyRune = { ...createRuneFromCardName({ id: 'attack', cardName: 'HurlRock' }), damage: 3, castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 3 } }] };
    const result = resolveEnemyTurn({ player: resolved.player, enemy: createMonsterEnemy('goblin'), enemyQueuedRunes: [attack], random: () => 0 });

    expect(result.player.wall[0][0]?.id).toBeNull();
    expect(result.enemy?.health).toBe(createMonsterEnemy('goblin').health - 3);
  });
});
