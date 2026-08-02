/**
 * Gameplay Store - current solo encounter action engine.
 */

import { create, type StoreApi } from 'zustand';
import type {
  EffectResolutionLog,
  GameState,
  MapTravelTarget,
  Player,
  Rune,
  RuneType,
  ScoringWall,
  SoloMapState,
  WallPosition,
} from '../../types/game';
import type { CompletedRuneCastEffectsResult } from '../../utils/combatResolution';
import {
  createRuneSoundSignals,
  createEncounterState,
  createInitialSoloRunState,
} from '../../utils/soloRunFactory';
import { rollEnemyArcaneDustReward } from '../../utils/monsterFactory';
import { createEmptySpellWall } from '../../utils/spellWall';
import {
  createDeckDraftState,
  mergeDeckWithOffer,
} from '../../utils/deckDrafting';
import {
  castRuneToWallSlot,
  collectVictoryDeck,
  drawRunes,
  drawRunesOfType,
  endPlayerTurn,
  EXTRA_DRAW_HAND_LIMIT,
  resolveCompletedRuneCastEffects,
  resolveEnemyTurn,
} from '../../utils/combatResolution';
import { resolveTimedRuneRemovalEffects } from '../../utils/effectResolver';
import {
  completeActiveMapEncounter,
  discoverSoloMapRoad,
  getCurrentMapLocationEvent,
  travelOnSoloMap,
} from '../../utils/soloMap';
import { getRegionEventToken } from '../../utils/regionCatalog';
import { resolveSacrificialAltar } from '../../utils/sacrificialAltar';
import {
  clearPersistedSoloRun,
  getSelectedArtefactIds,
  navigateToSoloRun,
} from '../../systems/gameplayOrchestrator';
import { trackGameplayDefeat, trackGameplayNewGame } from '../../systems/gameplayAnalytics';
import { attachGameplayPersistence } from './gameplayPersistence';
import { replaceGameplayState } from './gameplayState';
import { getRuneRemovalCandidates } from '../../utils/runeRemoval';

function totalWallShield(wall: ScoringWall): number {
  return wall.flat().reduce((total, cell) => total + (cell.shield ?? 0), 0);
}

function enterDeckDraftMode(state: GameState): GameState {
  if (state.enemy?.isBoss) {
    return {
      ...state,
      soloMap: completeActiveMapEncounter(state.soloMap),
      soloPhase: 'encounter',
      deckDraftState: null,
      combatPhase: 'victory',
      isDefeat: false,
      isVictory: true,
      longestRun: Math.max(state.longestRun, state.gameIndex),
      selectedHandRuneId: null,
    };
  }

  const nextLongestRun = Math.max(state.longestRun, state.gameIndex);
  const arcaneDustReward = rollEnemyArcaneDustReward(state.enemy);
  const deckDraftState = createDeckDraftState(
    state.player.id,
    state.enemy,
    Math.random,
    arcaneDustReward,
  );

  return {
    ...state,
    soloPhase: 'reward',
    deckDraftState,
    combatPhase: 'victory',
    isDefeat: false,
    isVictory: false,
    longestRun: nextLongestRun,
    arcaneDust: state.arcaneDust + arcaneDustReward,
    selectedHandRuneId: null,
  };
}

function normalizeHydratedGameState(currentState: GameState, nextState: GameState): GameState {
  return {
    ...currentState,
    ...nextState,
    soloPhase: nextState.soloPhase ?? 'map',
    soloMap: nextState.soloMap ?? currentState.soloMap,
    deckDraftState: nextState.deckDraftState ?? null,
    arcaneDust: typeof nextState.arcaneDust === 'number' ? nextState.arcaneDust : currentState.arcaneDust,
    enemy: nextState.enemy ?? null,
    combatPhase: nextState.combatPhase ?? 'player-turn',
    hand: nextState.hand ?? [],
    discardPile: nextState.discardPile ?? [],
    suppressedRunes: nextState.suppressedRunes ?? [],
    enemyBoard: nextState.enemyBoard ?? createEmptySpellWall(),
    enemyQueuedRunes: nextState.enemyQueuedRunes ?? [],
    enemyTurnNumber: typeof nextState.enemyTurnNumber === 'number' ? nextState.enemyTurnNumber : 0,
    pendingCombatResolution: nextState.pendingCombatResolution ?? null,
    isVictory: nextState.isVictory ?? false,
    selectedHandRuneId: nextState.selectedHandRuneId ?? null,
    runeSoundSignals: nextState.runeSoundSignals ?? currentState.runeSoundSignals,
    enemyAttackSoundSignal: typeof nextState.enemyAttackSoundSignal === 'number'
      ? nextState.enemyAttackSoundSignal
      : currentState.enemyAttackSoundSignal,
    shieldSoundSignal: typeof nextState.shieldSoundSignal === 'number'
      ? nextState.shieldSoundSignal
      : currentState.shieldSoundSignal,
  };
}

function initializeEncounterForMapLocation(
  state: GameState,
  soloMap: SoloMapState,
): GameState {
  const monsterId = soloMap.activeEncounter?.monsterId;
  if (!monsterId) {
    return state;
  }

  const encounterState = createEncounterState({ monsterId, player: state.player, fullDeck: state.fullDeck });
  const maxHealth = state.player.maxHealth ?? state.startingHealth;
  const health = Math.min(maxHealth, Math.max(0, state.player.health));
  const nextState: GameState = {
    ...encounterState,
    gameStarted: true,
    soloPhase: 'encounter',
    soloMap,
    startingHealth: state.startingHealth,
    player: {
      ...encounterState.player,
      health,
      maxHealth,
    },
    fullDeck: state.fullDeck,
    gameIndex: state.gameIndex,
    arcaneDust: state.arcaneDust,
    isDefeat: false,
    isVictory: false,
    longestRun: state.longestRun,
    deckDraftState: null,
    activeArtefacts: state.activeArtefacts,
    runeSoundSignals: state.runeSoundSignals,
    enemyAttackSoundSignal: state.enemyAttackSoundSignal,
    shieldSoundSignal: state.shieldSoundSignal,
  };

  trackGameplayNewGame({
    gameNumber: nextState.gameIndex,
    activeArtefacts: nextState.activeArtefacts,
    deck: nextState.player.deck,
    enemyMaxHealth: nextState.enemy?.maxHealth ?? 0,
    startingHealth: nextState.startingHealth,
  });

  return nextState;
}

function isWallFull(wall: ScoringWall): boolean {
  return wall.length > 0 && wall.every((row) => row.length > 0 && row.every((cell) => cell.id !== null));
}

function trackDefeat(state: GameState, player: Player): void {
  trackGameplayDefeat({
    gameNumber: state.gameIndex,
    deck: player.deck,
    activeArtefacts: state.activeArtefacts,
    cause: 'health-zero',
    health: player.health,
    enemyMaxHealth: state.enemy?.maxHealth ?? 0,
  });
}

function addCompletedWallRuneTypesById(runeTypesById: Map<string, RuneType[]>, wall: ScoringWall): Map<string, RuneType[]> {
  wall.forEach((row) => {
    row.forEach((cell) => {
      if (cell.id && cell.runeTypes.length > 0) {
        runeTypesById.set(cell.id, cell.runeTypes);
      }
    });
  });
  return runeTypesById;
}

function createEmptyRuneSoundEvents(): Record<RuneType, number> {
  return createRuneSoundSignals();
}

function addRuneSoundEvent(events: Record<RuneType, number>, runeType: RuneType): void {
  events[runeType] += 1;
}

function mergeRuneSoundEvents(
  left: Record<RuneType, number>,
  right: Record<RuneType, number>
): Record<RuneType, number> {
  const next = createEmptyRuneSoundEvents();
  Object.keys(next).forEach((runeType) => {
    const typedRuneType = runeType as RuneType;
    next[typedRuneType] = left[typedRuneType] + right[typedRuneType];
  });
  return next;
}

function applyRuneSoundEvents(
  signals: Record<RuneType, number>,
  events: Record<RuneType, number>
): Record<RuneType, number> {
  return mergeRuneSoundEvents(signals, events);
}

function countRuneSoundEvents({
  completedRune = null,
  logs,
  wall,
}: {
  completedRune?: Rune | null;
  logs: EffectResolutionLog[];
  wall: ScoringWall;
}): Record<RuneType, number> {
  const events = createEmptyRuneSoundEvents();
  const completedRuneTypesById = addCompletedWallRuneTypesById(new Map<string, RuneType[]>(), wall);
  const retriggeredRuneIdsByType = new Map<RuneType, Set<string>>();

  if (completedRune) {
    completedRune.runeTypes.forEach((runeType) => addRuneSoundEvent(events, runeType));
  }

  logs.forEach((log) => {
    if (log.sourceType !== 'rune') {
      return;
    }

    if (log.effectId.startsWith('passive.')) {
      const runeTypes = completedRuneTypesById.get(log.sourceId) ?? [];
      runeTypes.forEach((runeType) => addRuneSoundEvent(events, runeType));
      return;
    }

    const runeTypes = completedRuneTypesById.get(log.sourceId) ?? [];
    if (
      log.effectId.startsWith('cast.') &&
      log.sourceId !== completedRune?.id &&
      runeTypes.length > 0
    ) {
      runeTypes.forEach((runeType) => {
        const retriggeredRuneIds = retriggeredRuneIdsByType.get(runeType) ?? new Set<string>();
        retriggeredRuneIds.add(log.sourceId);
        retriggeredRuneIdsByType.set(runeType, retriggeredRuneIds);
      });
    }
  });

  retriggeredRuneIdsByType.forEach((runeIds, runeType) => {
    events[runeType] += runeIds.size;
  });

  return events;
}

function applyCompletedCastResolution({
  state,
  resolvedEffects,
  completedRune,
  sourcePosition,
  hand,
  discardPile,
  manaSpent,
}: {
  state: GameState;
  resolvedEffects: CompletedRuneCastEffectsResult;
  completedRune: Rune;
  sourcePosition: WallPosition;
  hand: Rune[];
  discardPile: Rune[];
  manaSpent: number;
}): GameState {
  const resolvedRuneSoundEvents = countRuneSoundEvents({
    completedRune,
    logs: resolvedEffects.logs,
    wall: resolvedEffects.player.wall,
  });
  const handWithReturnedRunes = [...hand, ...resolvedEffects.returnedRunes];
  const discardWithResolvedRunes = [
    ...discardPile,
    ...resolvedEffects.returnedOverflowRunes,
  ];

  if (
    !resolvedEffects.pendingRemoval
    && ((resolvedEffects.enemy?.health ?? 1) <= 0 || isWallFull(resolvedEffects.player.wall))
  ) {
    const victoryDeck = collectVictoryDeck({
      player: {
        ...resolvedEffects.player,
        mana: Math.max(0, resolvedEffects.player.mana - manaSpent),
      },
      hand: handWithReturnedRunes,
      discardPile: discardWithResolvedRunes,
      suppressedRunes: resolvedEffects.suppressedRunes,
    });

    return enterDeckDraftMode({
      ...state,
      player: { ...victoryDeck.player, wall: createEmptySpellWall() },
      enemy: resolvedEffects.enemy,
      enemyBoard: resolvedEffects.enemyBoard,
      arcaneDust: state.arcaneDust + resolvedEffects.arcaneDustDelta,
      hand: victoryDeck.hand,
      discardPile: victoryDeck.discardPile,
      suppressedRunes: [],
      selectedHandRuneId: null,
      pendingCombatResolution: null,
      runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, resolvedRuneSoundEvents),
    });
  }

  if (!resolvedEffects.pendingRemoval && resolvedEffects.player.health <= 0) {
    trackDefeat(state, resolvedEffects.player);
    return {
      ...state,
      player: {
        ...resolvedEffects.player,
        mana: Math.max(0, resolvedEffects.player.mana - manaSpent),
      },
      enemy: resolvedEffects.enemy,
      enemyBoard: resolvedEffects.enemyBoard,
      hand: [],
      discardPile: [...discardWithResolvedRunes, ...handWithReturnedRunes],
      suppressedRunes: resolvedEffects.suppressedRunes,
      selectedHandRuneId: null,
      pendingCombatResolution: null,
      isDefeat: true,
      combatPhase: 'defeat',
      longestRun: Math.max(state.longestRun, state.gameIndex),
      runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, resolvedRuneSoundEvents),
    };
  }

  const plainDrawResult = resolvedEffects.drawCount > 0
    ? drawRunes({
      player: resolvedEffects.player,
      hand: handWithReturnedRunes,
      discardPile: discardWithResolvedRunes,
      drawCount: resolvedEffects.drawCount,
      handLimit: EXTRA_DRAW_HAND_LIMIT,
    })
    : {
      player: resolvedEffects.player,
      hand: handWithReturnedRunes,
      discardPile: discardWithResolvedRunes,
    };
  const drawResult = resolvedEffects.drawTypeRequests.length > 0
    ? drawRunesOfType({
      player: plainDrawResult.player,
      hand: plainDrawResult.hand,
      discardPile: plainDrawResult.discardPile,
      drawTypeRequests: resolvedEffects.drawTypeRequests,
      handLimit: EXTRA_DRAW_HAND_LIMIT,
    })
    : plainDrawResult;
  const pendingCombatResolution = resolvedEffects.pendingRemoval
    ? {
      target: {
        sourceOwner: 'player' as const,
        sourceRuneId: completedRune.id,
        sourcePosition,
        effectRef: resolvedEffects.pendingRemoval.effectRef,
      },
      continuation: {
        kind: 'cast' as const,
        castRune: completedRune,
        sourcePosition,
        remainingEffectRefs: resolvedEffects.pendingRemoval.remainingEffectRefs,
      },
    }
    : null;

  return {
    ...state,
    player: {
      ...drawResult.player,
      mana: Math.max(0, drawResult.player.mana - manaSpent),
    },
    enemy: resolvedEffects.enemy,
    enemyBoard: resolvedEffects.enemyBoard,
    arcaneDust: state.arcaneDust + resolvedEffects.arcaneDustDelta,
    hand: drawResult.hand,
    discardPile: drawResult.discardPile,
    suppressedRunes: resolvedEffects.suppressedRunes,
    selectedHandRuneId: null,
    pendingCombatResolution,
    runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, resolvedRuneSoundEvents),
  };
}

function resolvePendingCastTarget(
  state: GameState,
  position: WallPosition | null,
  skip: boolean,
): GameState {
  const pending = state.pendingCombatResolution;
  if (!pending || pending.continuation.kind !== 'cast') return state;
  const { effectRef } = pending.target;
  const targetWall = effectRef.effectId === 'rune.consume' ? state.player.wall : state.enemyBoard;
  if (!skip) {
    if (!position) return state;
    const isValid = getRuneRemovalCandidates({
      wall: targetWall,
      runeType: effectRef.runeType,
      excludedRuneId: effectRef.effectId === 'rune.consume' ? pending.target.sourceRuneId : null,
    }).some((candidate) => candidate.row === position.row && candidate.col === position.col);
    if (!isValid) return state;
  }

  const resumedRune: Rune = {
    ...pending.continuation.castRune,
    castEffectRefs: [effectRef, ...pending.continuation.remainingEffectRefs],
  };
  const resolvedEffects = resolveCompletedRuneCastEffects({
    player: state.player,
    enemy: state.enemy,
    rune: resumedRune,
    activeArtefacts: state.activeArtefacts,
    sourcePosition: pending.continuation.sourcePosition,
    suppressedRunes: state.suppressedRunes,
    handSize: state.hand.length,
    enemyBoard: state.enemyBoard,
    ...(position ? { manualRemovalPosition: position } : {}),
    skipManualRemoval: skip,
  });

  return applyCompletedCastResolution({
    state: { ...state, pendingCombatResolution: null },
    resolvedEffects,
    completedRune: resumedRune,
    sourcePosition: pending.continuation.sourcePosition,
    hand: state.hand,
    discardPile: state.discardPile,
    manaSpent: 0,
  });
}

function pendingTimedState({
  state,
  trigger,
  result,
}: {
  state: GameState;
  trigger: 'startTurn' | 'endTurn';
  result: ReturnType<typeof resolveTimedRuneRemovalEffects>;
}): GameState {
  const pending = result.pendingRemoval;
  if (!pending) return state;
  const drawResult = result.drawCount > 0
    ? drawRunes({
      player: result.player,
      hand: state.hand,
      discardPile: state.discardPile,
      drawCount: result.drawCount,
      handLimit: EXTRA_DRAW_HAND_LIMIT,
    })
    : { player: result.player, hand: state.hand, discardPile: state.discardPile };
  return {
    ...state,
    player: drawResult.player,
    enemy: result.enemy,
    enemyBoard: result.opposingWall,
    hand: drawResult.hand,
    discardPile: drawResult.discardPile,
    suppressedRunes: [...state.suppressedRunes, ...result.removedRunes],
    selectedHandRuneId: null,
    pendingCombatResolution: {
      target: {
        sourceOwner: 'player',
        sourceRuneId: pending.sourceId,
        sourcePosition: pending.sourcePosition,
        effectRef: pending.effectRef,
      },
      continuation: {
        kind: trigger,
        processedRemovalKeys: result.processedKeys,
      },
    },
    runeSoundSignals: applyRuneSoundEvents(
      state.runeSoundSignals,
      countRuneSoundEvents({ logs: result.logs, wall: result.player.wall }),
    ),
  };
}

function finishPlayerStartTurn(
  state: GameState,
  processedRemovalKeys: string[] = [],
  manualRemovalPosition?: WallPosition,
  skipManualRemoval: boolean = false,
): GameState {
  const timed = resolveTimedRuneRemovalEffects({
    trigger: 'startTurn',
    player: state.player,
    enemy: state.enemy,
    opposingWall: state.enemyBoard,
    processedKeys: processedRemovalKeys,
    ...(manualRemovalPosition ? { manualRemovalPosition } : {}),
    skipManualRemoval,
  });
  if (timed.pendingRemoval) return pendingTimedState({ state, trigger: 'startTurn', result: timed });

  if ((timed.enemy?.health ?? 1) <= 0) {
    const victoryDeck = collectVictoryDeck({
      player: timed.player,
      hand: state.hand,
      discardPile: state.discardPile,
      suppressedRunes: [...state.suppressedRunes, ...timed.removedRunes],
    });
    return enterDeckDraftMode({
      ...state,
      player: { ...victoryDeck.player, wall: createEmptySpellWall() },
      enemy: timed.enemy,
      enemyBoard: timed.opposingWall,
      hand: victoryDeck.hand,
      discardPile: victoryDeck.discardPile,
      suppressedRunes: [],
      selectedHandRuneId: null,
      pendingCombatResolution: null,
      runeSoundSignals: applyRuneSoundEvents(
        state.runeSoundSignals,
        countRuneSoundEvents({ logs: timed.logs, wall: timed.player.wall }),
      ),
    });
  }

  if (timed.player.health <= 0) {
    trackDefeat(state, timed.player);
    return {
      ...state,
      player: timed.player,
      enemy: timed.enemy,
      enemyBoard: timed.opposingWall,
      hand: [],
      discardPile: [...state.discardPile, ...state.hand],
      suppressedRunes: [...state.suppressedRunes, ...timed.removedRunes],
      selectedHandRuneId: null,
      pendingCombatResolution: null,
      isDefeat: true,
      combatPhase: 'defeat',
      longestRun: Math.max(state.longestRun, state.gameIndex),
      runeSoundSignals: applyRuneSoundEvents(
        state.runeSoundSignals,
        countRuneSoundEvents({ logs: timed.logs, wall: timed.player.wall }),
      ),
    };
  }

  const runeSoundSignals = applyRuneSoundEvents(
    state.runeSoundSignals,
    countRuneSoundEvents({ logs: timed.logs, wall: timed.player.wall }),
  );
  const extraDrawCount = timed.drawCount;
  const startTurnDrawResult = extraDrawCount > 0
    ? drawRunes({
      player: timed.player,
      hand: state.hand,
      discardPile: state.discardPile,
      drawCount: extraDrawCount,
      handLimit: EXTRA_DRAW_HAND_LIMIT,
    })
    : { player: timed.player, hand: state.hand, discardPile: state.discardPile };

  return {
    ...state,
    player: { ...startTurnDrawResult.player, mana: startTurnDrawResult.player.maxMana },
    enemy: timed.enemy,
    enemyBoard: timed.opposingWall,
    hand: startTurnDrawResult.hand,
    discardPile: startTurnDrawResult.discardPile,
    suppressedRunes: [...state.suppressedRunes, ...timed.removedRunes],
    selectedHandRuneId: null,
    pendingCombatResolution: null,
    combatPhase: 'player-turn',
    runeSoundSignals,
  };
}

function runCombatTurn(
  state: GameState,
  processedRemovalKeys: string[] = [],
  manualRemovalPosition?: WallPosition,
  skipManualRemoval: boolean = false,
): GameState {
  const timedEnd = resolveTimedRuneRemovalEffects({
    trigger: 'endTurn',
    player: state.player,
    enemy: state.enemy,
    opposingWall: state.enemyBoard,
    processedKeys: processedRemovalKeys,
    ...(manualRemovalPosition ? { manualRemovalPosition } : {}),
    skipManualRemoval,
  });
  if (timedEnd.pendingRemoval) return pendingTimedState({ state, trigger: 'endTurn', result: timedEnd });

  const stateAfterTimed: GameState = {
    ...state,
    player: timedEnd.player,
    enemy: timedEnd.enemy,
    enemyBoard: timedEnd.opposingWall,
    suppressedRunes: [...state.suppressedRunes, ...timedEnd.removedRunes],
    pendingCombatResolution: null,
  };
  const endTurnEffects = { player: timedEnd.player, enemy: timedEnd.enemy };
  let runeSoundEvents = countRuneSoundEvents({ logs: timedEnd.logs, wall: timedEnd.player.wall });

  if ((endTurnEffects.enemy?.health ?? 1) <= 0) {
    const victoryDeck = collectVictoryDeck({
      player: endTurnEffects.player,
      hand: stateAfterTimed.hand,
      discardPile: stateAfterTimed.discardPile,
      suppressedRunes: stateAfterTimed.suppressedRunes,
    });
    return enterDeckDraftMode({
      ...stateAfterTimed,
      player: { ...victoryDeck.player, wall: createEmptySpellWall() },
      enemy: endTurnEffects.enemy,
      hand: victoryDeck.hand,
      discardPile: victoryDeck.discardPile,
      suppressedRunes: [],
      selectedHandRuneId: null,
      runeSoundSignals: applyRuneSoundEvents(stateAfterTimed.runeSoundSignals, runeSoundEvents),
    });
  }

  if (endTurnEffects.player.health <= 0) {
    trackDefeat(stateAfterTimed, endTurnEffects.player);
    return {
      ...stateAfterTimed,
      hand: [],
      discardPile: [...stateAfterTimed.discardPile, ...stateAfterTimed.hand],
      selectedHandRuneId: null,
      isDefeat: true,
      combatPhase: 'defeat',
      longestRun: Math.max(stateAfterTimed.longestRun, stateAfterTimed.gameIndex),
      runeSoundSignals: applyRuneSoundEvents(stateAfterTimed.runeSoundSignals, runeSoundEvents),
    };
  }

  const enemyTurnResult = resolveEnemyTurn({
    player: endTurnEffects.player,
    enemy: endTurnEffects.enemy,
    enemyBoard: stateAfterTimed.enemyBoard,
    enemyQueuedRunes: stateAfterTimed.enemyQueuedRunes,
    turnNumber: stateAfterTimed.enemyTurnNumber,
    activeArtefacts: stateAfterTimed.activeArtefacts,
  });
  const enemyAttackSoundSignal = stateAfterTimed.enemyAttackSoundSignal + (enemyTurnResult.healthDamage > 0 ? 1 : 0);
  const preventedDamage = enemyTurnResult.logs.some((log) => (
    (log.effectId === 'passive.reduceDamage' && log.output.previousValue !== log.output.nextValue)
    || (log.effectId === 'rune.consume' && typeof log.output.reduction === 'number' && log.output.reduction > 0)
  ));
  const shieldedAttack = enemyTurnResult.healthDamage === 0 && (
    totalWallShield(enemyTurnResult.player.wall) < totalWallShield(endTurnEffects.player.wall) || preventedDamage
  );
  const shieldSoundSignal = stateAfterTimed.shieldSoundSignal + (shieldedAttack ? 1 : 0);
  runeSoundEvents = mergeRuneSoundEvents(
    runeSoundEvents,
    countRuneSoundEvents({ logs: enemyTurnResult.logs, wall: enemyTurnResult.player.wall }),
  );
  const discardPile = [...stateAfterTimed.discardPile, ...stateAfterTimed.hand];

  if ((enemyTurnResult.enemy?.health ?? 1) <= 0) {
    const victoryDeck = collectVictoryDeck({
      player: enemyTurnResult.player,
      hand: stateAfterTimed.hand,
      discardPile: stateAfterTimed.discardPile,
      suppressedRunes: stateAfterTimed.suppressedRunes,
    });
    return enterDeckDraftMode({
      ...stateAfterTimed,
      player: { ...victoryDeck.player, wall: createEmptySpellWall() },
      enemy: enemyTurnResult.enemy,
      enemyBoard: enemyTurnResult.enemyBoard,
      hand: victoryDeck.hand,
      discardPile: victoryDeck.discardPile,
      suppressedRunes: [],
      enemyQueuedRunes: enemyTurnResult.enemyQueuedRunes,
      enemyTurnNumber: stateAfterTimed.enemyTurnNumber + 1,
      selectedHandRuneId: null,
      runeSoundSignals: applyRuneSoundEvents(stateAfterTimed.runeSoundSignals, runeSoundEvents),
      enemyAttackSoundSignal,
      shieldSoundSignal,
    });
  }

  if (enemyTurnResult.player.health <= 0 || enemyTurnResult.boardFull) {
    trackDefeat(stateAfterTimed, enemyTurnResult.player);
    return {
      ...stateAfterTimed,
      player: enemyTurnResult.player,
      enemy: enemyTurnResult.enemy,
      hand: [],
      discardPile,
      enemyBoard: enemyTurnResult.enemyBoard,
      enemyQueuedRunes: enemyTurnResult.enemyQueuedRunes,
      enemyTurnNumber: stateAfterTimed.enemyTurnNumber + 1,
      selectedHandRuneId: null,
      isDefeat: true,
      combatPhase: 'defeat',
      longestRun: Math.max(stateAfterTimed.longestRun, stateAfterTimed.gameIndex),
      runeSoundSignals: applyRuneSoundEvents(stateAfterTimed.runeSoundSignals, runeSoundEvents),
      enemyAttackSoundSignal,
      shieldSoundSignal,
    };
  }

  const refill = endPlayerTurn({
    player: enemyTurnResult.player,
    hand: stateAfterTimed.hand,
    discardPile: stateAfterTimed.discardPile,
  });
  const stateAtStartTurn: GameState = {
    ...stateAfterTimed,
    player: refill.player,
    enemy: enemyTurnResult.enemy,
    hand: refill.hand,
    discardPile: refill.discardPile,
    enemyBoard: enemyTurnResult.enemyBoard,
    enemyQueuedRunes: enemyTurnResult.enemyQueuedRunes,
    enemyTurnNumber: stateAfterTimed.enemyTurnNumber + 1,
    selectedHandRuneId: null,
    combatPhase: 'player-turn',
    runeSoundSignals: applyRuneSoundEvents(stateAfterTimed.runeSoundSignals, runeSoundEvents),
    enemyAttackSoundSignal,
    shieldSoundSignal,
  };
  return finishPlayerStartTurn(stateAtStartTurn);
}

function resolvePendingTimedTarget(
  state: GameState,
  position: WallPosition | null,
  skip: boolean,
): GameState {
  const continuation = state.pendingCombatResolution?.continuation;
  if (!continuation || continuation.kind === 'cast') return state;
  const baseState = { ...state, pendingCombatResolution: null };
  if (continuation.kind === 'endTurn') {
    return runCombatTurn(baseState, continuation.processedRemovalKeys, position ?? undefined, skip);
  }
  return finishPlayerStartTurn(baseState, continuation.processedRemovalKeys, position ?? undefined, skip);
}

export interface GameplayStore extends GameState {
  startSoloRun: () => void;
  prepareSoloMode: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  returnToMapAfterReward: () => void;
  sacrificeCardAtAltar: (runeId: string) => void;
  skipSacrificialAltar: () => void;
  revealMapRoadTarget: (target: Extract<MapTravelTarget, { kind: 'road' }>) => Extract<MapTravelTarget, { kind: 'location' }> | null;
  travelToMapTarget: (target: MapTravelTarget) => void;
  selectHandRune: (runeId: string) => void;
  castRuneToWall: (row: number, col: number) => void;
  selectPendingRuneTarget: (side: 'player' | 'enemy', row: number, col: number) => void;
  skipPendingRuneTarget: () => void;
  endCombatTurn: () => void;
  resetGame: () => void;
  selectDeckDraftOffer: (offerId: string) => void;
}

export const gameplayStoreConfig = (
  set: StoreApi<GameplayStore>['setState']
): GameplayStore => ({
  ...createInitialSoloRunState(),

  startSoloRun: () => {
    set(() => {
      const baseState = createInitialSoloRunState();
      const selectedArtefacts = getSelectedArtefactIds();
      const nextState = {
        ...baseState,
        gameStarted: true,
        soloPhase: 'map' as const,
        activeArtefacts: selectedArtefacts,
      };

      return nextState;
    });
  },

  prepareSoloMode: () => {
    set(() => ({
      ...createInitialSoloRunState(),
      gameStarted: false,
    }));
  },

  hydrateGameState: (nextState: GameState) => {
    set((state) => normalizeHydratedGameState(state, nextState));
  },

  returnToStartScreen: () => {
    set((state) => {
      if (state.isDefeat || state.isVictory) {
        clearPersistedSoloRun();
      }

      return {
        ...createInitialSoloRunState(),
        gameStarted: false,
      };
    });
    navigateToSoloRun();
  },

  resetGame: () => {
    set(() => createInitialSoloRunState());
  },

  revealMapRoadTarget: (target) => {
    let arrivalTarget: Extract<MapTravelTarget, { kind: 'location' }> | null = null;
    set((state) => {
      if (!state.gameStarted || state.soloPhase !== 'map' || state.isDefeat || state.isVictory) {
        return state;
      }

      const discovery = discoverSoloMapRoad(state.soloMap, target);
      if (!discovery) {
        return state;
      }

      arrivalTarget = discovery.arrivalTarget;
      return {
        ...state,
        soloMap: discovery.map,
      };
    });
    return arrivalTarget;
  },

  travelToMapTarget: (target: MapTravelTarget) => {
    set((state) => {
      if (!state.gameStarted || state.soloPhase !== 'map' || state.isDefeat || state.isVictory) {
        return state;
      }

      const currentEvent = getCurrentMapLocationEvent(state.soloMap);
      if (currentEvent?.kind === 'sacrificial-altar' && !currentEvent.cleared) {
        return state;
      }

      const result = travelOnSoloMap(state.soloMap, target);
      if (result.map === state.soloMap) {
        return state;
      }

      if (result.enteredEncounter) {
        return initializeEncounterForMapLocation(state, result.map);
      }

      const eventToken = getRegionEventToken(result.triggeredEvent?.tokenId ?? null);
      const healingAmount = eventToken?.kind === 'healing'
        ? state.player.maxHealth * ((eventToken.healingPercent ?? 0) / 100)
        : 0;

      return {
        ...state,
        soloPhase: 'map',
        soloMap: result.map,
        player: healingAmount > 0
          ? { ...state.player, health: Math.min(state.player.maxHealth, state.player.health + healingAmount) }
          : state.player,
      };
    });
  },

  sacrificeCardAtAltar: (runeId: string) => {
    set((state) => {
      if (!state.gameStarted || state.soloPhase !== 'map' || state.isDefeat || state.isVictory) {
        return state;
      }

      const result = resolveSacrificialAltar(state, runeId);
      if (result.status !== 'sacrificed') return state;
      return {
        ...state,
        soloMap: result.soloMap,
        player: result.player,
        fullDeck: result.fullDeck,
      };
    });
  },

  skipSacrificialAltar: () => {
    set((state) => {
      if (!state.gameStarted || state.soloPhase !== 'map' || state.isDefeat || state.isVictory) {
        return state;
      }

      const result = resolveSacrificialAltar(state, null);
      return result.status === 'skipped'
        ? { ...state, soloMap: result.soloMap }
        : state;
    });
  },

  selectHandRune: (runeId: string) => {
    set((state) => {
      if (state.combatPhase !== 'player-turn' || state.isDefeat || state.deckDraftState || state.pendingCombatResolution) {
        return state;
      }

      if (!state.hand.some((rune) => rune.id === runeId)) {
        return state;
      }

      return {
        ...state,
        selectedHandRuneId: state.selectedHandRuneId === runeId ? null : runeId,
      };
    });
  },

  castRuneToWall: (row: number, col: number) => {
    set((state) => {
      if (state.combatPhase !== 'player-turn' || state.isDefeat || state.deckDraftState || state.pendingCombatResolution) {
        return state;
      }

      const selectedRune = state.hand.find((rune) => rune.id === state.selectedHandRuneId);
      const manaCost = selectedRune?.manaCost ?? 2;
      if (!selectedRune || manaCost > state.player.mana) {
        return state;
      }

      const result = castRuneToWallSlot({
        player: state.player,
        hand: state.hand,
        discardPile: state.discardPile,
        selectedHandRuneId: state.selectedHandRuneId,
        row,
        col,
      });

      if (result.status === 'invalid') {
        return state;
      }

      if (result.status === 'completed' && result.completedRune) {
        const completedPosition = result.completedPosition;
        if (!completedPosition) return state;
        const resolvedEffects = resolveCompletedRuneCastEffects({
          player: result.player,
          enemy: state.enemy,
          rune: result.completedRune,
          activeArtefacts: state.activeArtefacts,
          sourcePosition: result.completedPosition,
          suppressedRunes: state.suppressedRunes,
          handSize: result.hand.length,
          enemyBoard: state.enemyBoard,
        });
        return applyCompletedCastResolution({
          state,
          resolvedEffects,
          completedRune: result.completedRune,
          sourcePosition: completedPosition,
          hand: result.hand,
          discardPile: result.discardPile,
          manaSpent: manaCost,
        });
      }

      return state;
    });

  },

  selectPendingRuneTarget: (side, row, col) => {
    set((state) => {
      const pending = state.pendingCombatResolution;
      if (!pending) return state;
      const expectedSide = pending.target.effectRef.effectId === 'rune.consume' ? 'player' : 'enemy';
      if (side !== expectedSide) return state;
      return pending.continuation.kind === 'cast'
        ? resolvePendingCastTarget(state, { row, col }, false)
        : resolvePendingTimedTarget(state, { row, col }, false);
    });
  },

  skipPendingRuneTarget: () => {
    set((state) => state.pendingCombatResolution?.continuation.kind === 'cast'
      ? resolvePendingCastTarget(state, null, true)
      : resolvePendingTimedTarget(state, null, true));
  },

  endCombatTurn: () => {
    set((state) => {
      if (state.combatPhase !== 'player-turn' || state.isDefeat || state.deckDraftState || state.pendingCombatResolution) {
        return state;
      }
      return runCombatTurn(state);
    });

  },

  selectDeckDraftOffer: (offerId: string) => {
    set((state) => {
      if (!state.deckDraftState) {
        return state;
      }

      const selectedOffer = state.deckDraftState.offers.find((offer) => offer.id === offerId);
      if (!selectedOffer) {
        return state;
      }

      return {
        ...state,
        deckDraftState: {
          ...state.deckDraftState,
          selectedOffer: state.deckDraftState.selectedOffer?.id === offerId ? null : selectedOffer,
        },
      };
    });
  },

  returnToMapAfterReward: () => {
    set((state) => {
      if (
        state.soloPhase !== 'reward'
        || !state.deckDraftState
        || !state.soloMap.activeEncounter
      ) {
        return state;
      }

      const selectedOffer = state.deckDraftState.selectedOffer;

      return {
        ...state,
        fullDeck: selectedOffer ? mergeDeckWithOffer(state.fullDeck, selectedOffer) : state.fullDeck,
        soloPhase: 'map',
        soloMap: completeActiveMapEncounter(state.soloMap),
        gameIndex: state.gameIndex + 1,
        deckDraftState: null,
        selectedHandRuneId: null,
      };
    });
  },
});

export const useGameplayStore = create<GameplayStore>((set) => gameplayStoreConfig(set));
replaceGameplayState(useGameplayStore.getState());
useGameplayStore.subscribe((state) => {
  replaceGameplayState(state);
});
attachGameplayPersistence();

export function createGameplayStoreInstance() {
  const store = create<GameplayStore>((set) => gameplayStoreConfig(set));
  replaceGameplayState(store.getState());
  store.subscribe((state) => {
    replaceGameplayState(state);
  });
  return store;
}
