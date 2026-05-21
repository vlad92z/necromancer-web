/**
 * Scoring sequence runner - timer orchestration for scoring display pulses.
 */

import type { StoreApi } from 'zustand';
import type { ScoringSequenceState, ScoringStep } from '../types/game';

interface ScoringSequenceStoreState {
  scoringSequence: ScoringSequenceState | null;
}

const SCORING_DELAY_BASE_MS = 420;
const SCORING_DELAY_MIN_MS = 140;
const SCORING_DELAY_DECAY_MS = 22;

const scoringTimeoutRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };

export function getRuneResolutionDelayMs(segmentSize: number): number {
  const normalizedSize = Math.max(1, segmentSize);
  const scaledDelay = SCORING_DELAY_BASE_MS - (normalizedSize - 1) * SCORING_DELAY_DECAY_MS;
  return Math.max(SCORING_DELAY_MIN_MS, Math.round(scaledDelay));
}

export function clearScoringSequenceTimer(): void {
  if (scoringTimeoutRef.current !== null) {
    clearTimeout(scoringTimeoutRef.current);
    scoringTimeoutRef.current = null;
  }
}

export function accumulateScoringDeltas(steps: ScoringStep[]): {
  damage: number;
  healing: number;
  armor: number;
  arcaneDust: number;
} {
  return steps.reduce(
    (totals, step) => ({
      damage: totals.damage + step.damageDelta,
      healing: totals.healing + step.healingDelta,
      armor: totals.armor + step.armorDelta,
      arcaneDust: totals.arcaneDust + step.arcaneDustDelta,
    }),
    { damage: 0, healing: 0, armor: 0, arcaneDust: 0 }
  );
}

function getDisplayTotalsForIndex(sequence: ScoringSequenceState, activeIndex: number): {
  health: number;
  armor: number;
  runePowerTotal: number;
  arcaneDust: number;
} {
  const clampedIndex = Math.max(0, Math.min(activeIndex, sequence.steps.length - 1));
  const partialDeltas = accumulateScoringDeltas(sequence.steps.slice(0, clampedIndex + 1));
  const nextHealth = Math.min(sequence.maxHealth, sequence.startHealth + partialDeltas.healing);
  const nextArmor = Math.max(0, sequence.startArmor + partialDeltas.armor);
  const nextRunePowerTotal = sequence.startRunePowerTotal + partialDeltas.damage;
  const nextArcaneDust = Math.max(0, sequence.startArcaneDust + partialDeltas.arcaneDust);

  return {
    health: nextHealth,
    armor: nextArmor,
    runePowerTotal: nextRunePowerTotal,
    arcaneDust: nextArcaneDust,
  };
}

export function runScoringSequence<TState extends ScoringSequenceStoreState>(
  sequence: ScoringSequenceState,
  set: StoreApi<TState>['setState'],
  onComplete?: () => void
): void {
  clearScoringSequenceTimer();

  if (sequence.steps.length === 0) {
    set((state) => {
      if (!state.scoringSequence || state.scoringSequence.sequenceId !== sequence.sequenceId) {
        return state;
      }
      return { ...state, scoringSequence: null };
    });
    onComplete?.();
    return;
  }

  const executeStep = (index: number): void => {
    const step = sequence.steps[index];
    const nextDisplays = getDisplayTotalsForIndex(sequence, index);

    set((state) => {
      const activeSequence = state.scoringSequence;
      if (!activeSequence || activeSequence.sequenceId !== sequence.sequenceId) {
        return state;
      }

      return {
        ...state,
        scoringSequence: {
          ...activeSequence,
          activeIndex: index,
          displayHealth: nextDisplays.health,
          displayArmor: nextDisplays.armor,
          displayRunePowerTotal: nextDisplays.runePowerTotal,
          displayArcaneDust: nextDisplays.arcaneDust,
        },
      };
    });

    const hasNextStep = index + 1 < sequence.steps.length;
    const delay = step.delayMs;

    scoringTimeoutRef.current = setTimeout(() => {
      if (hasNextStep) {
        executeStep(index + 1);
        return;
      }

      scoringTimeoutRef.current = setTimeout(() => {
        set((state) => {
          if (!state.scoringSequence || state.scoringSequence.sequenceId !== sequence.sequenceId) {
            return state;
          }
          return { ...state, scoringSequence: null };
        });
        onComplete?.();
      }, delay);
    }, delay);
  };

  executeStep(0);
}
