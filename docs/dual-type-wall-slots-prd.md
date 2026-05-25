# Dual-Type Wall Slots PRD

## Summary

Replace fixed rune wall slots with 3 families:
- Fire/Void.
- Lightning/Wind.
- Life/Frost.

Rules:
- Empty unlocked slot accepts either family rune.
- First real charge locks slot to exact rune type.
- Locked partial slot accepts only locked type until completion.
- Completed slot resolves/counts as completing rune type.
- Existing solo saves invalidated.

## File-Level Changes

- `src/types/game.ts`: add slot family + locked rune type to charge state.
- `src/utils/scoring.ts`: add family loop, labels, acceptance helper.
- `src/utils/gameInitialization.ts`: initialize family pattern.
- `src/utils/combatResolution.ts`: validate family/lock rules.
- `src/features/gameplay/components/WallCell.tsx`: render family placeholders + locked ghost rune.
- `src/utils/soloPersistence.ts`: bump save version.

## Grid Pattern

Formula: `(row + col) % 3`.
- `0`: Fire/Void.
- `1`: Lightning/Wind.
- `2`: Life/Frost.

First rows:
- Row 1: Fire/Void, Lightning/Wind, Life/Frost, repeat.
- Row 2: Lightning/Wind, Life/Frost, Fire/Void, repeat.
- Row 3: Life/Frost, Fire/Void, Lightning/Wind, repeat.

## Acceptance

- Fire starts Fire/Void slot.
- Void cannot continue Fire-locked slot.
- Void can start separate Fire/Void slot.
- Virtual charge does not lock slot.
- Empty family placeholders render.
- Partial locked slot renders common rune ghost + progress.
- Old saves clear safely.

## Unresolved Questions

None.
