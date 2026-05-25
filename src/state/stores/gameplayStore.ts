/**
 * Gameplay Store - current solo encounter action engine.
 */

import { create, type StoreApi } from 'zustand';
import type { EffectResolutionLog, GameState, Player, Rune, RuneType, ScoringWall, SpellWallCharge } from '../../types/game';
import {
  createEmptyWall,
  createEmptyWallCharges,
  createGoblinEnemy,
  createRuneSoundSignals,
  DEFAULT_ENEMY_ATTACK_DAMAGE,
  initializeSoloGame,
  scaleEnemyAttackDamage,
  scaleEnemyMaxHealth,
} from '../../utils/gameInitialization';
import {
  advanceDeckDraftState,
  applyDeckDraftEffectToPlayer,
  createDeckDraftState,
  getDeckDraftSelectionLimit,
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
import { getArcaneDustReward } from '../../utils/arcaneDust';
import {
  addGameplayArcaneDust,
  clearPersistedSoloRun,
  getSelectedArtefactIds,
  navigateToSoloRun,
} from '../../systems/gameplayOrchestrator';
import { trackGameplayDefeat, trackGameplayNewGame } from '../../systems/gameplayAnalytics';
import { attachGameplayPersistence } from './gameplayPersistence';
import { replaceGameplayState } from './gameplayState';

function enterDeckDraftMode(state: GameState): GameState {
  const nextLongestRun = Math.max(state.longestRun, state.gameIndex);
  const selectionLimit = getDeckDraftSelectionLimit(state.activeArtefacts);
  const deckDraftState = createDeckDraftState(
    state.player.id,
    nextLongestRun,
    state.activeArtefacts,
    selectionLimit
  );

  const currentEnemyAttackDamage = typeof state.enemyAttackDamage === 'number'
    ? state.enemyAttackDamage
    : state.enemy?.intent.amount ?? DEFAULT_ENEMY_ATTACK_DAMAGE;

  return {
    ...state,
    deckDraftState,
    deckDraftReadyForNextGame: false,
    combatPhase: 'victory',
    isDefeat: false,
    longestRun: nextLongestRun,
    enemyMaxHealth: scaleEnemyMaxHealth(state.enemyMaxHealth),
    enemyAttackDamage: scaleEnemyAttackDamage(currentEnemyAttackDamage),
    baseEnemyMaxHealth: state.baseEnemyMaxHealth || state.enemyMaxHealth,
    selectedHandRuneId: null,
  };
}

function awardDeckDraftEntryArcaneDust(gameIndex: number): void {
  const arcaneDustReward = getArcaneDustReward(gameIndex);
  if (arcaneDustReward > 0) {
    addGameplayArcaneDust(arcaneDustReward);
  }
}

function normalizeHydratedGameState(currentState: GameState, nextState: GameState): GameState {
  const enemyAttackDamage = typeof nextState.enemyAttackDamage === 'number'
    ? nextState.enemyAttackDamage
    : currentState.enemyAttackDamage;

  return {
    ...currentState,
    ...nextState,
    deckDraftState: nextState.deckDraftState ?? null,
    deckDraftReadyForNextGame: nextState.deckDraftReadyForNextGame ?? false,
    enemyMaxHealth: typeof nextState.enemyMaxHealth === 'number' ? nextState.enemyMaxHealth : currentState.enemyMaxHealth,
    enemyAttackDamage,
    baseEnemyMaxHealth: typeof nextState.baseEnemyMaxHealth === 'number'
      ? nextState.baseEnemyMaxHealth
      : currentState.baseEnemyMaxHealth,
    enemy: nextState.enemy ?? createGoblinEnemy(
      nextState.enemyMaxHealth ?? currentState.enemyMaxHealth,
      enemyAttackDamage
    ),
    combatPhase: nextState.combatPhase ?? 'player-turn',
    hand: nextState.hand ?? [],
    discardPile: nextState.discardPile ?? [],
    suppressedRunes: nextState.suppressedRunes ?? [],
    wallCharges: nextState.wallCharges ?? createEmptyWallCharges(),
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

function getWallRuneTypeFromLogSource(sourceId: string, wall: ScoringWall): RuneType | null {
  const match = /^wall:(\d+):(\d+)$/.exec(sourceId);
  if (!match) {
    return null;
  }

  const row = Number.parseInt(match[1], 10);
  const col = Number.parseInt(match[2], 10);
  return wall[row]?.[col]?.runeType ?? null;
}

function getCompletedRuneTypesById(wall: ScoringWall, wallCharges: SpellWallCharge[][]): Map<string, RuneType> {
  return wallCharges.reduce<Map<string, RuneType>>((runeTypesById, chargeRow) => {
    chargeRow.forEach((charge) => {
      if (!charge.completedRuneId) {
        return;
      }

      const runeType = wall[charge.row]?.[charge.col]?.runeType;
      if (runeType) {
        runeTypesById.set(charge.completedRuneId, runeType);
      }
    });
    return runeTypesById;
  }, new Map<string, RuneType>());
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
  wallCharges,
}: {
  completedRune?: Rune | null;
  logs: EffectResolutionLog[];
  wall: ScoringWall;
  wallCharges: SpellWallCharge[][];
}): Record<RuneType, number> {
  const events = createEmptyRuneSoundEvents();
  const completedRuneTypesById = getCompletedRuneTypesById(wall, wallCharges);
  const retriggeredRuneIdsByType = new Map<RuneType, Set<string>>();

  if (completedRune) {
    addRuneSoundEvent(events, completedRune.runeType);
  }

  logs.forEach((log) => {
    if (log.sourceType !== 'rune') {
      return;
    }

    if (log.effectId.startsWith('passive.')) {
      const runeType = getWallRuneTypeFromLogSource(log.sourceId, wall);
      if (runeType) {
        addRuneSoundEvent(events, runeType);
      }
      return;
    }

    const runeType = completedRuneTypesById.get(log.sourceId);
    if (
      log.effectId.startsWith('cast.') &&
      log.sourceId !== completedRune?.id &&
      runeType
    ) {
      const retriggeredRuneIds = retriggeredRuneIdsByType.get(runeType) ?? new Set<string>();
      retriggeredRuneIds.add(log.sourceId);
      retriggeredRuneIdsByType.set(runeType, retriggeredRuneIds);
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
  startNextSoloGame: () => void;
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
        activeArtefacts: selectedArtefacts,
      };

      trackGameplayNewGame({
        gameNumber: nextState.gameIndex,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        enemyMaxHealth: nextState.enemyMaxHealth,
        startingHealth: nextState.startingHealth,
      });

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
    let arcaneDustGain = 0;
    let deckDraftRewardGameIndex: number | null = null;

    set((state) => {
      if (state.combatPhase !== 'player-turn' || state.isDefeat || state.deckDraftState) {
        return state;
      }

      const result = castRuneToWallSlot({
        player: state.player,
        hand: state.hand,
        discardPile: state.discardPile,
        wallCharges: state.wallCharges,
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
          wallCharges: result.wallCharges,
          suppressedRunes: state.suppressedRunes,
          handSize: result.hand.length,
        });

        arcaneDustGain += resolvedEffects.arcaneDustDelta;
        const resolvedRuneSoundEvents = countRuneSoundEvents({
          completedRune: result.completedRune,
          logs: resolvedEffects.logs,
          wall: resolvedEffects.player.wall,
          wallCharges: resolvedEffects.wallCharges,
        });

        if ((resolvedEffects.enemy?.health ?? 1) <= 0) {
          deckDraftRewardGameIndex = state.gameIndex;
          const handWithReturnedRunes = [...result.hand, ...resolvedEffects.returnedRunes];
          const victoryDeck = collectVictoryDeck({
            player: resolvedEffects.player,
            hand: handWithReturnedRunes,
            discardPile: result.discardPile,
            suppressedRunes: resolvedEffects.suppressedRunes,
            wallCharges: resolvedEffects.wallCharges,
          });

          return enterDeckDraftMode({
            ...state,
            player: {
              ...victoryDeck.player,
              wall: createEmptyWall(),
            },
            enemy: resolvedEffects.enemy,
            hand: victoryDeck.hand,
            discardPile: victoryDeck.discardPile,
            suppressedRunes: [],
            wallCharges: createEmptyWallCharges(),
            selectedHandRuneId: null,
            runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, resolvedRuneSoundEvents),
          });
        }

        const handWithReturnedRunes = [...result.hand, ...resolvedEffects.returnedRunes];
        const plainDrawResult = resolvedEffects.drawCount > 0
          ? drawRunes({
            player: resolvedEffects.player,
            hand: handWithReturnedRunes,
            discardPile: result.discardPile,
            drawCount: resolvedEffects.drawCount,
            handLimit: EXTRA_DRAW_HAND_LIMIT,
          })
          : {
            player: resolvedEffects.player,
            hand: handWithReturnedRunes,
            discardPile: result.discardPile,
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
          player: drawResult.player,
          enemy: resolvedEffects.enemy,
          hand: drawResult.hand,
          discardPile: drawResult.discardPile,
          suppressedRunes: resolvedEffects.suppressedRunes,
          wallCharges: resolvedEffects.wallCharges,
          selectedHandRuneId: result.selectedHandRuneId,
          runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, resolvedRuneSoundEvents),
        };
      }

      return {
        ...state,
        player: result.player,
        hand: result.hand,
        discardPile: result.discardPile,
        wallCharges: result.wallCharges,
        selectedHandRuneId: result.selectedHandRuneId,
      };
    });

    if (arcaneDustGain > 0) {
      addGameplayArcaneDust(arcaneDustGain);
    }
    if (deckDraftRewardGameIndex !== null) {
      awardDeckDraftEntryArcaneDust(deckDraftRewardGameIndex);
    }
  },

  endCombatTurn: () => {
    let deckDraftRewardGameIndex: number | null = null;

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
        wallCharges: state.wallCharges,
      });

      if ((endTurnEffects.enemy?.health ?? 1) <= 0) {
        deckDraftRewardGameIndex = state.gameIndex;
        const victoryDeck = collectVictoryDeck({
          player: endTurnEffects.player,
          hand: state.hand,
          discardPile: state.discardPile,
          suppressedRunes: state.suppressedRunes,
          wallCharges: state.wallCharges,
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
          wallCharges: createEmptyWallCharges(),
          selectedHandRuneId: null,
          runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, runeSoundEvents),
        });
      }

      const enemyTurnResult = resolveEnemyTurn({
        player: endTurnEffects.player,
        enemy: endTurnEffects.enemy,
        activeArtefacts: state.activeArtefacts,
      });
      const enemyPerformedAttack = endTurnEffects.enemy?.intent.type === 'Attack';
      const enemyAttackSoundSignal = state.enemyAttackSoundSignal + (enemyTurnResult.healthDamage > 0 ? 1 : 0);
      const shieldSoundSignal = state.shieldSoundSignal + (enemyPerformedAttack && enemyTurnResult.healthDamage === 0 ? 1 : 0);
      runeSoundEvents = mergeRuneSoundEvents(
        runeSoundEvents,
        countRuneSoundEvents({
          logs: enemyTurnResult.logs,
          wall: enemyTurnResult.player.wall,
          wallCharges: state.wallCharges,
        })
      );
      const discardPile = [...state.discardPile, ...state.hand];

      if (enemyTurnResult.player.health <= 0) {
        trackDefeat(state, enemyTurnResult.player);
        return {
          ...state,
          player: enemyTurnResult.player,
          enemy: endTurnEffects.enemy,
          hand: [],
          discardPile,
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
          wallCharges: state.wallCharges,
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
        player: startTurnDrawResult.player,
        enemy: endTurnEffects.enemy,
        hand: startTurnDrawResult.hand,
        discardPile: startTurnDrawResult.discardPile,
        selectedHandRuneId: null,
        combatPhase: 'player-turn',
        runeSoundSignals: applyRuneSoundEvents(state.runeSoundSignals, runeSoundEvents),
        enemyAttackSoundSignal,
        shieldSoundSignal,
      };
    });

    if (deckDraftRewardGameIndex !== null) {
      awardDeckDraftEntryArcaneDust(deckDraftRewardGameIndex);
    }
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

      const playerAfterEffect = applyDeckDraftEffectToPlayer(
        state.player,
        selectedOffer.deckDraftEffect,
        state.startingHealth
      );
      const updatedDeckTemplate = mergeDeckWithOffer(state.fullDeck, selectedOffer);
      const updatedPlayer: Player = {
        ...playerAfterEffect,
        deck: mergeDeckWithOffer(playerAfterEffect.deck, selectedOffer),
      };

      const selectionLimit = state.deckDraftState.selectionLimit ?? 1;
      const selectionsThisOffer = state.deckDraftState.selectionsThisOffer ?? 0;
      const nextSelectionsThisOffer = selectionsThisOffer + 1;
      const remainingOffers = state.deckDraftState.offers.filter((offer) => offer.id !== offerId);
      const shouldAdvanceOffer =
        nextSelectionsThisOffer >= selectionLimit || remainingOffers.length === 0;

      if (shouldAdvanceOffer) {
        const draftStateAfterSelection = {
          ...state.deckDraftState,
          offers: remainingOffers,
          selectionsThisOffer: nextSelectionsThisOffer,
        };
        const nextDraftState = advanceDeckDraftState(
          draftStateAfterSelection,
          state.player.id,
          state.longestRun,
          state.activeArtefacts
        );

        if (!nextDraftState) {
          return {
            ...state,
            player: updatedPlayer,
            fullDeck: updatedDeckTemplate,
            deckDraftState: {
              offers: [],
              picksRemaining: 0,
              totalPicks: state.deckDraftState.totalPicks,
              selectionLimit,
              selectionsThisOffer: 0,
            },
            baseEnemyMaxHealth: state.baseEnemyMaxHealth || state.enemyMaxHealth,
            deckDraftReadyForNextGame: true,
          };
        }

        return {
          ...state,
          player: updatedPlayer,
          deckDraftState: nextDraftState,
          fullDeck: updatedDeckTemplate,
          deckDraftReadyForNextGame: false,
        };
      }

      return {
        ...state,
        player: updatedPlayer,
        deckDraftState: {
          ...state.deckDraftState,
          offers: remainingOffers,
          selectionsThisOffer: nextSelectionsThisOffer,
        },
        fullDeck: updatedDeckTemplate,
        deckDraftReadyForNextGame: false,
      };
    });
  },

  startNextSoloGame: () => {
    set((state) => {
      const nextEnemyMaxHealth = state.enemyMaxHealth;
      const nextEnemyAttackDamage = state.enemyAttackDamage;
      const nextGameIndex = state.gameIndex + 1;
      const previousHealth = Math.max(0, state.player.health);
      const nextMaxHealth = state.player.maxHealth ?? state.startingHealth;
      const clampedHealth = Math.min(nextMaxHealth, previousHealth);
      const nextGameState = initializeSoloGame(nextEnemyMaxHealth, state.fullDeck, nextEnemyAttackDamage);
      const nextState = {
        ...nextGameState,
        player: {
          ...nextGameState.player,
          health: clampedHealth,
          maxHealth: nextMaxHealth,
        },
        gameIndex: nextGameIndex,
        gameStarted: true,
        fullDeck: state.fullDeck,
        baseEnemyMaxHealth: state.baseEnemyMaxHealth || nextEnemyMaxHealth,
        deckDraftState: null,
        deckDraftReadyForNextGame: false,
        activeArtefacts: state.activeArtefacts,
      };

      trackGameplayNewGame({
        gameNumber: nextState.gameIndex,
        activeArtefacts: nextState.activeArtefacts,
        deck: nextState.player.deck,
        enemyMaxHealth: nextState.enemyMaxHealth,
        startingHealth: nextState.startingHealth,
      });

      return nextState;
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
