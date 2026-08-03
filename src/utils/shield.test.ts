import { describe, expect, it } from 'vitest';
import { ARTEFACTS } from '../types/artefacts';
import type { EnemyRune, Rune } from '../types/game';
import { castRuneToWallSlot, resolveCompletedRuneCastEffects, resolveEnemyTurn } from './combatResolution';
import { createMonsterEnemy } from './monsterFactory';
import { createPlayer } from './soloRunFactory';
import { createEmptySpellWall } from './spellWall';
import { createEffectRef, getEffectDescription } from './effectCatalog';
import { createRuneFromCardName, getRuneEffectDescription } from './runeEffects';
import { applyDamageToShieldedWall } from './shield';

function placeRune(player: ReturnType<typeof createPlayer>, rune: Rune, row: number, col: number) {
  const placed = castRuneToWallSlot({
    player,
    hand: [rune],
    discardPile: [],
    selectedHandRuneId: rune.id,
    row,
    col,
  });
  if (placed.status !== 'completed' || !placed.completedRune || !placed.completedPosition) {
    throw new Error('Expected rune placement to complete');
  }
  const resolved = resolveCompletedRuneCastEffects({
    player: placed.player,
    enemy: createMonsterEnemy('goblin'),
    rune: placed.completedRune,
    sourcePosition: placed.completedPosition,
  });
  return { player: resolved.player, rune: placed.completedRune, position: placed.completedPosition };
}

describe('token shields', () => {
  it('uses canonical Shield wording for shield cards and Frost Potion', () => {
    expect(getRuneEffectDescription(createRuneFromCardName({ id: 'frost', cardName: 'FrostShield' }))).toBe('• Shield 3');
    expect(getRuneEffectDescription(createRuneFromCardName({ id: 'barricade', cardName: 'Barricade' }))).toBe('• Shield 5');
    expect(getRuneEffectDescription(createRuneFromCardName({ id: 'hide', cardName: 'Hide' }))).toContain('shield 2');
    expect(getEffectDescription(ARTEFACTS.potion.passiveEffectRefs[0]!)).toBe('Double all shield gained');
  });

  it('assigns Shield 3 to the Frost Shield token and adds repeated gains', () => {
    const frostShield = createRuneFromCardName({ id: 'frost-shield', cardName: 'FrostShield' });
    const first = placeRune(createPlayer('player', 'Player', 20, [], 20), frostShield, 0, 0);

    expect(first.player.wall[0]?.[0]?.shield).toBe(3);

    const repeated = resolveCompletedRuneCastEffects({
      player: first.player,
      enemy: createMonsterEnemy('goblin'),
      rune: first.rune,
      sourcePosition: first.position,
    });
    expect(repeated.player.wall[0]?.[0]?.shield).toBe(6);
  });

  it('consumes shields in row-major order and removes a token at zero', () => {
    const wall = createEmptySpellWall();
    const first = createRuneFromCardName({ id: 'first', cardName: 'FrostShield' });
    const second = createRuneFromCardName({ id: 'second', cardName: 'FrostShield' });
    const player = createPlayer('player', 'Player', 20, [], 20);
    const firstPlaced = placeRune(player, first, 0, 0).player;
    const secondPlaced = placeRune(firstPlaced, second, 0, 1).player;
    wall.splice(0, wall.length, ...secondPlaced.wall);

    const result = applyDamageToShieldedWall(wall, 5);

    expect(result.remainingDamage).toBe(0);
    expect(result.removedRuneIds).toHaveLength(1);
    expect(result.wall[0]?.[0]?.id).toBeNull();
    expect(result.wall[0]?.[1]?.shield).toBe(1);
  });

  it('protects the player per damage packet without removing the underlying card', () => {
    const frostShield = createRuneFromCardName({ id: 'deck-frost', cardName: 'FrostShield' });
    const first = placeRune(createPlayer('player', 'Player', 20, [frostShield], 20), frostShield, 0, 0).player;
    const secondRune = createRuneFromCardName({ id: 'second-frost', cardName: 'FrostShield' });
    const player = placeRune(first, secondRune, 0, 1).player;
    const attack: EnemyRune = {
      ...createRuneFromCardName({ id: 'attack', cardName: 'ThrowRock' }),
      damage: 5,
      castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })],
    };

    const result = resolveEnemyTurn({
      player,
      enemy: createMonsterEnemy('goblin'),
      enemyQueuedRunes: [attack],
      random: () => 0,
    });

    expect(result.player.health).toBe(20);
    expect(result.player.wall[0]?.[0]?.id).toBeNull();
    expect(result.player.wall[0]?.[1]?.shield).toBe(1);
    expect(result.player.deck).toBe(player.deck);
  });

  it('uses enemy-board shields before enemy health', () => {
    const enemyBoard = createEmptySpellWall();
    const first = createRuneFromCardName({ id: 'enemy-first', cardName: 'FrostShield' });
    const second = createRuneFromCardName({ id: 'enemy-second', cardName: 'FrostShield' });
    const asCell = (rune: Rune) => ({
      id: rune.id,
      name: rune.name,
      runeTypes: [...rune.runeTypes],
      rarity: rune.rarity,
      cardImageSrc: rune.cardImageSrc,
      tokenImageSrc: rune.tokenImageSrc,
      manaCost: rune.manaCost ?? 2,
      castEffectRefs: rune.castEffectRefs,
      passiveEffectRefs: rune.passiveEffectRefs,
      shield: 3,
    });
    enemyBoard[0]![0] = asCell(first);
    enemyBoard[0]![1] = asCell(second);
    const damageRune: Rune = {
      ...createRuneFromCardName({ id: 'damage', cardName: 'Firebolt' }),
      castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })],
    };
    const playerWall = createEmptySpellWall();
    playerWall[0]![0] = { ...asCell(damageRune), shield: null };
    const enemy = createMonsterEnemy('goblin');

    const result = resolveCompletedRuneCastEffects({
      player: { ...createPlayer('player', 'Player', 20, [], 20), wall: playerWall },
      enemy,
      enemyBoard,
      rune: damageRune,
      sourcePosition: { row: 0, col: 0 },
    });

    expect(result.enemy?.health).toBe(enemy.health);
    expect(result.enemyBoard[0]?.[0]?.id).toBeNull();
    expect(result.enemyBoard[0]?.[1]?.shield).toBe(1);
  });
});
