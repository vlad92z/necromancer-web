/**
 * Gameplay Store - current solo encounter action engine.
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, Player } from '../../types/game';
import {
  createEmptyWall,
  createEmptyWallCharges,
  createGoblinEnemy,
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
  endPlayerTurn,
  EXTRA_DRAW_HAND_LIMIT,
  resolveCompletedEndTurnEffects,
  resolveCompletedRuneCastEffects,
  resolveCompletedStartTurnEffects,
  resolveEnemyTurn,
} from '../../utils/combatResolution';
import { getArcaneDustReward } from '../../utils/arcaneDust';
import { getRuneDisenchantDust } from '../../utils/runeRarity';
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
  disenchantRuneFromDeck: (runeId: string) => number;
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
        });

        arcaneDustGain += resolvedEffects.arcaneDustDelta;

        if ((resolvedEffects.enemy?.health ?? 1) <= 0) {
          deckDraftRewardGameIndex = state.gameIndex;
          const victoryDeck = collectVictoryDeck({
            player: resolvedEffects.player,
            hand: result.hand,
            discardPile: state.discardPile,
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
          });
        }

        const drawResult = resolvedEffects.drawCount > 0
          ? drawRunes({
            player: resolvedEffects.player,
            hand: result.hand,
            discardPile: state.discardPile,
            drawCount: resolvedEffects.drawCount,
            handLimit: EXTRA_DRAW_HAND_LIMIT,
          })
          : {
            player: resolvedEffects.player,
            hand: result.hand,
            discardPile: state.discardPile,
          };

        return {
          ...state,
          player: drawResult.player,
          enemy: resolvedEffects.enemy,
          hand: drawResult.hand,
          discardPile: drawResult.discardPile,
          suppressedRunes: resolvedEffects.suppressedRunes,
          wallCharges: resolvedEffects.wallCharges,
          selectedHandRuneId: result.selectedHandRuneId,
        };
      }

      return {
        ...state,
        player: result.player,
        hand: result.hand,
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
        });
      }

      const enemyTurnResult = resolveEnemyTurn({
        player: endTurnEffects.player,
        enemy: endTurnEffects.enemy,
      });
      const discardPile = [...state.discardPile, ...state.hand];

      if (enemyTurnResult.player.health <= 0) {
        trackDefeat(state, enemyTurnResult.player);
        return {
          ...state,
          player: enemyTurnResult.player,
          hand: [],
          discardPile,
          selectedHandRuneId: null,
          isDefeat: true,
          combatPhase: 'defeat',
          longestRun: Math.max(state.longestRun, state.gameIndex),
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
        hand: startTurnDrawResult.hand,
        discardPile: startTurnDrawResult.discardPile,
        selectedHandRuneId: null,
        combatPhase: 'player-turn',
      };
    });

    if (deckDraftRewardGameIndex !== null) {
      awardDeckDraftEntryArcaneDust(deckDraftRewardGameIndex);
    }
  },

  disenchantRuneFromDeck: (runeId: string) => {
    let dustAwarded = 0;

    set((state) => {
      if (!state.deckDraftState) {
        return state;
      }

      const runeInDeck = state.player.deck.find((rune) => rune.id === runeId);
      const runeInTemplate = state.fullDeck.find((rune) => rune.id === runeId);
      const runeToRemove = runeInDeck ?? runeInTemplate;

      if (!runeToRemove) {
        return state;
      }

      dustAwarded = getRuneDisenchantDust(runeToRemove.rarity);
      if (dustAwarded > 0) {
        addGameplayArcaneDust(dustAwarded);
      }

      return {
        ...state,
        player: {
          ...state.player,
          deck: runeInDeck ? state.player.deck.filter((rune) => rune.id !== runeId) : state.player.deck,
        },
        fullDeck: state.fullDeck.filter((rune) => rune.id !== runeId),
      };
    });

    return dustAwarded;
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
