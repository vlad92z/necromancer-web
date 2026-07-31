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
} from '../../types/game';
import {
  createEmptyWall,
  createEnemySpellBoard,
  createGoblinEnemy,
  createRuneSoundSignals,
  initializeSoloGame,
  rollEnemyArcaneDustReward,
} from '../../utils/gameInitialization';
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
  resolveCompletedEndTurnEffects,
  resolveCompletedRuneCastEffects,
  resolveCompletedStartTurnEffects,
  resolveEnemyTurn,
} from '../../utils/combatResolution';
import { completeActiveMapEncounter, travelOnSoloMap } from '../../utils/soloMap';
import {
  clearPersistedSoloRun,
  getSelectedArtefactIds,
  navigateToSoloRun,
} from '../../systems/gameplayOrchestrator';
import { trackGameplayDefeat, trackGameplayNewGame } from '../../systems/gameplayAnalytics';
import { attachGameplayPersistence } from './gameplayPersistence';
import { replaceGameplayState } from './gameplayState';

function enterDeckDraftMode(state: GameState): GameState {
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
    enemyMaxHealth: typeof nextState.enemyMaxHealth === 'number' ? nextState.enemyMaxHealth : currentState.enemyMaxHealth,
    arcaneDust: typeof nextState.arcaneDust === 'number' ? nextState.arcaneDust : currentState.arcaneDust,
    enemy: nextState.enemy ?? createGoblinEnemy(
      nextState.enemyMaxHealth ?? currentState.enemyMaxHealth
    ),
    combatPhase: nextState.combatPhase ?? 'player-turn',
    hand: nextState.hand ?? [],
    discardPile: nextState.discardPile ?? [],
    suppressedRunes: nextState.suppressedRunes ?? [],
    enemyBoard: nextState.enemyBoard ?? createEnemySpellBoard(),
    enemyQueuedRunes: nextState.enemyQueuedRunes ?? [],
    enemyTurnNumber: typeof nextState.enemyTurnNumber === 'number' ? nextState.enemyTurnNumber : 0,
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
  const encounterState = initializeSoloGame(state.enemyMaxHealth, state.fullDeck);
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
    enemyMaxHealth: state.enemyMaxHealth,
    isDefeat: false,
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
    enemyMaxHealth: nextState.enemyMaxHealth,
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
    enemyMaxHealth: state.enemyMaxHealth,
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

export interface GameplayStore extends GameState {
  startSoloRun: () => void;
  prepareSoloMode: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  returnToMapAfterReward: () => void;
  travelToMapTarget: (target: MapTravelTarget) => void;
  selectHandRune: (runeId: string) => void;
  castRuneToWall: (row: number, col: number) => void;
  endCombatTurn: () => void;
  resetGame: () => void;
  selectDeckDraftOffer: (offerId: string) => void;
}

export const gameplayStoreConfig = (
  set: StoreApi<GameplayStore>['setState']
): GameplayStore => ({
  ...initializeSoloGame(),

  startSoloRun: () => {
    set(() => {
      const baseState = initializeSoloGame();
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
      ...initializeSoloGame(),
      gameStarted: false,
    }));
  },

  hydrateGameState: (nextState: GameState) => {
    set((state) => normalizeHydratedGameState(state, nextState));
  },

  returnToStartScreen: () => {
    set((state) => {
      if (state.isDefeat) {
        clearPersistedSoloRun();
      }

      return {
        ...initializeSoloGame(),
        gameStarted: false,
      };
    });
    navigateToSoloRun();
  },

  resetGame: () => {
    set(() => initializeSoloGame());
  },

  travelToMapTarget: (target: MapTravelTarget) => {
    set((state) => {
      if (!state.gameStarted || state.soloPhase !== 'map' || state.isDefeat) {
        return state;
      }

      const result = travelOnSoloMap(state.soloMap, target);
      if (result.map === state.soloMap) {
        return state;
      }

      if (result.enteredEncounter) {
        return initializeEncounterForMapLocation(state, result.map);
      }

      return {
        ...state,
        soloPhase: 'map',
        soloMap: result.map,
      };
    });
  },

  selectHandRune: (runeId: string) => {
    set((state) => {
      if (state.combatPhase !== 'player-turn' || state.isDefeat || state.deckDraftState) {
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
      if (state.combatPhase !== 'player-turn' || state.isDefeat || state.deckDraftState) {
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
        const resolvedEffects = resolveCompletedRuneCastEffects({
          player: result.player,
          enemy: state.enemy,
          rune: result.completedRune,
          activeArtefacts: state.activeArtefacts,
          sourcePosition: result.completedPosition,
          suppressedRunes: state.suppressedRunes,
          handSize: result.hand.length,
        });

        const resolvedRuneSoundEvents = countRuneSoundEvents({
          completedRune: result.completedRune,
          logs: resolvedEffects.logs,
          wall: resolvedEffects.player.wall,
        });
        const handWithReturnedRunes = [...result.hand, ...resolvedEffects.returnedRunes];
        const discardWithResolvedRunes = [
          ...result.discardPile,
          ...resolvedEffects.returnedOverflowRunes,
        ];

        if ((resolvedEffects.enemy?.health ?? 1) <= 0 || isWallFull(resolvedEffects.player.wall)) {
          const victoryDeck = collectVictoryDeck({
            player: resolvedEffects.player,
            hand: handWithReturnedRunes,
            discardPile: discardWithResolvedRunes,
            suppressedRunes: resolvedEffects.suppressedRunes,
          });

          return enterDeckDraftMode({
            ...state,
            player: {
              ...victoryDeck.player,
              wall: createEmptyWall(),
            },
            enemy: resolvedEffects.enemy,
            arcaneDust: state.arcaneDust + resolvedEffects.arcaneDustDelta,
            hand: victoryDeck.hand,
            discardPile: victoryDeck.discardPile,
            suppressedRunes: [],
            selectedHandRuneId: null,
            runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, resolvedRuneSoundEvents),
          });
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

        return {
          ...state,
          player: {
            ...drawResult.player,
            mana: state.player.mana - manaCost,
          },
          enemy: resolvedEffects.enemy,
          arcaneDust: state.arcaneDust + resolvedEffects.arcaneDustDelta,
          hand: drawResult.hand,
          discardPile: drawResult.discardPile,
          suppressedRunes: resolvedEffects.suppressedRunes,
          selectedHandRuneId: result.selectedHandRuneId,
          runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, resolvedRuneSoundEvents),
        };
      }

      return state;
    });

  },

  endCombatTurn: () => {
    set((state) => {
      if (state.combatPhase !== 'player-turn' || state.isDefeat || state.deckDraftState) {
        return state;
      }

      const endTurnEffects = resolveCompletedEndTurnEffects({
        player: state.player,
        enemy: state.enemy,
        activeArtefacts: state.activeArtefacts,
      });
      let runeSoundEvents = countRuneSoundEvents({
        logs: endTurnEffects.logs,
        wall: endTurnEffects.player.wall,
      });

      if ((endTurnEffects.enemy?.health ?? 1) <= 0) {
        const victoryDeck = collectVictoryDeck({
          player: endTurnEffects.player,
          hand: state.hand,
          discardPile: state.discardPile,
          suppressedRunes: state.suppressedRunes,
        });

        return enterDeckDraftMode({
          ...state,
          player: {
            ...victoryDeck.player,
            wall: createEmptyWall(),
          },
          enemy: endTurnEffects.enemy,
          hand: victoryDeck.hand,
          discardPile: victoryDeck.discardPile,
          suppressedRunes: [],
          selectedHandRuneId: null,
          runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, runeSoundEvents),
        });
      }

      const enemyTurnResult = resolveEnemyTurn({
        player: endTurnEffects.player,
        enemy: endTurnEffects.enemy,
        enemyBoard: state.enemyBoard,
        enemyQueuedRunes: state.enemyQueuedRunes,
        turnNumber: state.enemyTurnNumber,
        activeArtefacts: state.activeArtefacts,
      });
      const enemyAttackSoundSignal = state.enemyAttackSoundSignal + (enemyTurnResult.healthDamage > 0 ? 1 : 0);
      const passivePreventedDamage = enemyTurnResult.logs.some((log) => (
        log.effectId === 'passive.reduceDamage'
        && log.output.previousValue !== log.output.nextValue
      ));
      const shieldedAttack = enemyTurnResult.healthDamage === 0 && (
        enemyTurnResult.player.armor < endTurnEffects.player.armor
        || passivePreventedDamage
      );
      const shieldSoundSignal = state.shieldSoundSignal + (shieldedAttack ? 1 : 0);
      runeSoundEvents = mergeRuneSoundEvents(
        runeSoundEvents,
        countRuneSoundEvents({
          logs: enemyTurnResult.logs,
          wall: enemyTurnResult.player.wall,
        })
      );
      const discardPile = [...state.discardPile, ...state.hand];

      if (enemyTurnResult.player.health <= 0 || enemyTurnResult.boardFull) {
        trackDefeat(state, enemyTurnResult.player);
        return {
          ...state,
          player: enemyTurnResult.player,
          enemy: enemyTurnResult.enemy,
          hand: [],
          discardPile,
          enemyBoard: enemyTurnResult.enemyBoard,
          enemyQueuedRunes: enemyTurnResult.enemyQueuedRunes,
          enemyTurnNumber: state.enemyTurnNumber + 1,
          selectedHandRuneId: null,
          isDefeat: true,
          combatPhase: 'defeat',
          longestRun: Math.max(state.longestRun, state.gameIndex),
          runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, runeSoundEvents),
          enemyAttackSoundSignal,
          shieldSoundSignal,
        };
      }

      const result = endPlayerTurn({
        player: enemyTurnResult.player,
        hand: state.hand,
        discardPile: state.discardPile,
      });
      const startTurnEffects = resolveCompletedStartTurnEffects({
        player: result.player,
        activeArtefacts: state.activeArtefacts,
      });
      runeSoundEvents = mergeRuneSoundEvents(
        runeSoundEvents,
        countRuneSoundEvents({
          logs: startTurnEffects.logs,
          wall: startTurnEffects.player.wall,
        })
      );
      const startTurnDrawResult = startTurnEffects.drawCount > 0
        ? drawRunes({
          player: startTurnEffects.player,
          hand: result.hand,
          discardPile: result.discardPile,
          drawCount: startTurnEffects.drawCount,
          handLimit: EXTRA_DRAW_HAND_LIMIT,
        })
        : {
          player: startTurnEffects.player,
          hand: result.hand,
          discardPile: result.discardPile,
        };

      return {
        ...state,
        player: {
          ...startTurnDrawResult.player,
          mana: startTurnDrawResult.player.maxMana,
        },
        enemy: enemyTurnResult.enemy,
        hand: startTurnDrawResult.hand,
        discardPile: startTurnDrawResult.discardPile,
        enemyBoard: enemyTurnResult.enemyBoard,
        enemyQueuedRunes: enemyTurnResult.enemyQueuedRunes,
        enemyTurnNumber: state.enemyTurnNumber + 1,
        selectedHandRuneId: null,
        combatPhase: 'player-turn',
        runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, runeSoundEvents),
        enemyAttackSoundSignal,
        shieldSoundSignal,
      };
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
