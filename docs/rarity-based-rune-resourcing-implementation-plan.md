# Rarity-Based Rune Resourcing Implementation Plan

Source PRD: `docs/rarity-based-rune-resourcing-prd.md`

## Summary

Implement in 5 independent vertical stages.

Rules:
- Solo playable after every stage.
- Each stage manually testable alone.
- No new libraries/routes/enemies/artefacts.
- No Channel/ChannelSynergy.
- Save version bump required.
- Fresh completed wall-copy id per completion.
- Return overflow goes to discard.

Checks every stage:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual smoke every stage:
- Start solo.
- Cast rune.
- End turn.
- Win encounter.
- Pick draft reward.
- Start next encounter.

## Stage 1: Rarity Charge Slot Core (Done)

File-level changes before implementation:
- `src/types/game.ts`: staged rune data in `SpellWallCharge`; rarity-derived requirement fields.
- `src/utils/gameInitialization.ts`: initialize charge slots without row costs.
- `src/utils/combatResolution.ts`: staged-rune lifecycle.
- `src/utils/soloPersistence.ts`: bump schema.
- Tests: update row-cost expectations.

Implement:
- Add `getRequiredChargesForRarity`: common 0, uncommon 1, rare 2, epic 3.
- First valid empty-slot placement stages exact rune type.
- Common completes immediately from any row.
- Non-common stores staged physical rune, locks type, shows `0/N`.
- Matching charge rune adds 1. Rarity/effects ignored.
- Wrong type, invalid family, completed slot rejected.
- Completion creates wall copy with fresh id.
- Completion discards staged rune plus charge runes.
- Non-final charge effects do not resolve.

Tests:
- Common immediate in row 6.
- Uncommon `0/1` then complete.
- Rare `0/2`; epic `0/3`.
- Rare charge fuel adds only 1.
- Wrong type rejected.
- Charge rune effects do not resolve.
- Completion discard contains staged + charges.
- Remove row required-count tests.

Manual:
- Cast common into bottom row; effect resolves.
- Stage uncommon/rare/epic; charge matching type; observe progress/completion.

## Stage 2: Wall Copy + Completed-Only Semantics (Done)

File-level changes before implementation:
- `src/types/game.ts`: completed wall copy stores type, rarity, refs, unique copy id.
- `src/utils/combatResolution.ts`: incomplete staged slots invisible to completed-wall logic.
- `src/utils/effectResolver.ts`: completed copies only for synergy/passive/targeting.
- `src/utils/wallCellRune.ts`: preserve wall-copy data.
- Tests: add staged-vs-completed coverage.

Implement:
- Incomplete staged rune does not count for synergy, fragile, passives, adjacency, retrigger, destroy, convert, return.
- Completed wall copy counts normally.
- Same physical card concept can create multiple independent wall copies.
- Sound/log mapping uses wall-copy id, not staged physical id.

Tests:
- Staged incomplete ignored by synergy/passive/targeting.
- Completed copy counted by synergy/passive/targeting.
- Two completions from same copied concept get distinct ids.
- Retrigger uses wall-copy ids.

Manual:
- Stage non-common next to adjacency-dependent rune; confirm no benefit.
- Complete it; confirm benefit appears.

## Stage 3: Encounter Deck vs Base Deck (Done)

File-level changes before implementation:
- `src/utils/gameInitialization.ts`: each encounter draw deck from fresh copied `fullDeck`.
- `src/state/stores/gameplayStore.ts`: keep `fullDeck` canonical; encounter mutations stay encounter-only.
- `src/utils/combatResolution.ts`: remove victory deck reconstruction into base deck.
- `src/utils/deckDrafting.ts`: draft rewards still append to base deck.
- `src/utils/soloPersistence.ts`: update persistence tests/version.

Implement:
- `player.deck`, hand, discard, staged, charge, suppressed, generated copies are encounter-only.
- Victory opens draft without collecting encounter mutations into base deck.
- Draft selection updates `fullDeck`.
- Next encounter starts from copied updated `fullDeck`.
- Defeat clears saved solo state as today.

Tests:
- Combat-generated/returned/suppressed copies do not persist after victory.
- Draft pack modifies `fullDeck`.
- Next encounter includes draft rewards only.
- Defeat clears persisted state.
- Old save schema invalidates.

Manual:
- Win after staging/completing runes.
- Pick draft pack.
- Start next encounter; deck is base + reward, no duplicate combat-used cards.

## Stage 4: Resolver Mutations + Virtual Charge

File-level changes before implementation:
- `src/utils/effectResolver.ts`: clear/return/charge-adjacent semantics.
- `src/utils/combatResolution.ts`: helper for virtual-charge completion.
- `src/state/stores/gameplayStore.ts`: apply returned hand/discard deltas.
- Tests: update mutation and virtual-charge coverage.

Implement:
- Destroy/remove clears wall copy only.
- Return clears wall copy, creates exact fresh-id physical copy.
- Return fills hand to cap 10; overflow to discard.
- `chargeAdjacent` targets adjacent incomplete staged slots only.
- Virtual charge adds 1, creates no physical rune, does not stage empty slots.
- Virtual charge can complete staged rune and cast immediately in same sequence.
- Multiple virtual completions resolve deterministic adjacent order.

Tests:
- Destroy does not remove physical deck/discard/hand cards.
- Return creates fresh id with exact type/rarity/refs.
- Return overflow to discard.
- Virtual charge ignores empty/completed slots.
- Virtual charge completes 1-away staged rune and resolves cast effects.
- Virtual charge completion can trigger victory before enemy attack.

Manual:
- Use `chargeAdjacent` near staged slots.
- Empty ignored; staged progresses; 1-away completes/casts.

## Stage 5: UI Text + Final Acceptance

File-level changes before implementation:
- `src/features/gameplay/components/WallCell.tsx`: show staged progress from `0/N`.
- `src/components/RuneCell.tsx` or `src/utils/runeEffects.ts`: append charge requirement text.
- `src/features/gameplay/components/DeckOverlay.tsx`: verify rarity text/art.
- Tests: tooltip/card text and gameplay expectations.
- Docs: remove active row-charge copy only if user-facing stale text remains.

Implement:
- Common text unchanged.
- Uncommon: `Requires 1 charge`.
- Rare: `Requires 2 charges`.
- Epic: `Requires 3 charges`.
- Staged wall slot shows locked rune icon/type and progress.
- Completed wall slot renders as completed rune.

Tests:
- Tooltip/card text includes requirement only for non-common.
- Wall progress renders `0/1`, `0/2`, `1/2`, `0/3`.
- Deck overlay rarity rendering still works.
- Full common/uncommon/rare/epic acceptance flow.

Manual:
- Inspect common/uncommon/rare/epic card text.
- Stage non-common and confirm progress.
- Complete encounter, draft, start next encounter.

## Public Interfaces / Types

- `SpellWallCharge`: add serializable staged-rune fields and wall-copy id semantics.
- `WallCell`: completed-copy data only: rune type, rarity, cast refs, passive refs.
- `fullDeck`: canonical base deck.
- `player.deck`: encounter draw deck.
- `resolveCastEffects`: return hand/discard deltas for returned copies.
- Persistence schema bumps from current version.

## Final Acceptance

- Slot row never affects charge requirement.
- Common immediate; uncommon/rare/epic require 1/2/3 charges.
- Staged incomplete persists across turns but does not count completed.
- Completed wall copies activate synergy/passives/targeting.
- Physical staged + charge runes discard on completion.
- Encounter-only mutations disappear after victory/defeat.
- Draft rewards still modify base deck.
- `rg "requiredCount: row \\+ 1|rowIndex \\+ 1|requiredCount: 6" src` finds no active row-cost expectation.
- `npx vitest run`, `npm run build`, `npm run lint` pass.

## Unresolved Questions

None.
