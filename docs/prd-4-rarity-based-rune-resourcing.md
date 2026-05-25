# Rarity-Based Rune Resourcing PRD

## Summary

Replace row-scaling wall charge costs with rarity-based charge costs.

Reason:
- Make combat faster.
- Current lower-row costs slow the game as encounters progress.
- Rarity should define cast investment, not wall row.

## Goals

- Make every wall row equally usable.
- Make common runes fast and immediate.
- Make higher-rarity runes stronger but slower to cast.
- Preserve completed-wall synergy/passive gameplay.
- Keep combat mutations encounter-only.

## Non-Goals

- No new rune types.
- No new rarity tiers.
- No new routes, enemies, artefacts, or libraries.
- No Channel or ChannelSynergy.

## Core Rule Change

Remove row-based required charge counts:
- Row 1 no longer requires 1.
- Row 2 no longer requires 2.
- Row 3 no longer requires 3.
- Row 4 no longer requires 4.
- Row 5 no longer requires 5.
- Row 6 no longer requires 6.

Required charges now come from the staged rune rarity:
- Common: 0 charges. Cast immediately.
- Uncommon: 1 charge.
- Rare: 2 charges.
- Epic: 3 charges.

Slot row has no effect on charge requirement.

## Cast Lifecycle

On first valid placement into an empty slot:
- The played rune becomes the staged rune for that slot.
- The slot locks to that rune's exact rune type.
- Charge requirement is set from that rune's rarity.
- Common runes complete and cast immediately.
- Non-common runes remain staged until enough charges are added.

On charging a staged slot:
- Charge rune must match staged rune's exact rune type.
- Charge rune rarity does not matter.
- Charge rune effects do not resolve.
- Each real charge rune adds exactly 1 charge progress.
- Wrong rune type is rejected.

On completion:
- Staged rune's cast effects resolve immediately.
- Completed wall copy remains in the slot.
- Physical staged rune moves to discard.
- Physical charge runes move to discard.
- Completed wall copy counts for synergies, passives, and targeting.

## Slot State

Incomplete staged rune:
- Persists across turns.
- Does not count for synergy.
- Does not activate passives.
- Is not eligible as a completed-wall target.
- Shows charge progress only, e.g. `0/2`, `1/2`.

Completed slot:
- Is single-use for the encounter.
- Rejects new placements.
- Can be cleared only by effects that remove or return wall runes.
- Stores a wall copy, not the physical card.

Same physical rune card may later be drawn and cast again. Therefore the same card concept can appear on the wall multiple times as separate wall copies.

## Wall Copy Rules

Completed wall copies:
- Store rune type, rarity, cast effects, and passive effects.
- Count as completed wall runes.
- Activate passives while present.
- Can be targeted by existing completed-wall effects.

Destroy/remove wall effects:
- Clear the wall copy only.
- Do not remove any physical card from draw deck, hand, discard, or base deck.

Return wall effects:
- Clear the wall copy.
- Create an exact physical card copy with a fresh unique id.
- Copy rune type, rarity, cast effects, and passive effects.
- Put copy into hand if hand has space.
- If hand cap 10 is exceeded, put copy into discard.

## Deck Model

Base deck:
- Canonical player deck for the run.
- Updated by draft rewards only.
- Not mutated by combat effects.

Encounter deck:
- Fresh copy of base deck at each encounter start.
- Owns draw deck, hand, discard, staged runes, charge runes, and generated copies.
- May mutate significantly during an encounter.
- Disappears when encounter ends.

Encounter start:
- Draw deck starts as fresh combat copy of base deck.
- Hand empty.
- Discard empty.
- Wall empty.
- Staged/charge state empty.

Victory:
- Draft rewards modify base deck.
- Encounter-only mutations do not persist.
- Next encounter starts from updated base deck.

Defeat:
- Run ends as today.
- Saved solo state clears as today.
- Encounter-only mutations disappear.

## Virtual Charge

`chargeAdjacent` changes behavior:
- Targets adjacent incomplete slots that already have staged/locked runes.
- Adds 1 virtual charge progress.
- Creates no physical card.
- Can complete a staged rune.
- If it completes a rune, that rune casts immediately during the same resolution sequence.

Virtual charge does not stage an empty slot.

## Card Text

Common rune text stays unchanged.

Non-common rune cards add one line below effect text:
- Uncommon: `Requires 1 charge`
- Rare: `Requires 2 charges`
- Epic: `Requires 3 charges`

## Proposed File-Level Changes Before Implementation

- `src/types/game.ts`: represent staged rune, staged rarity charge requirement, completed wall copy identity, and base deck vs encounter deck semantics if needed.
- `src/utils/gameInitialization.ts`: initialize slots without row-based charge costs; start each encounter from a fresh base deck copy.
- `src/utils/combatResolution.ts`: implement rarity-based staging, exact-type charging, discard timing, wall-copy completion, and completed-slot rejection.
- `src/utils/effectResolver.ts`: update wall remove/return semantics, generated copy behavior, hand-cap overflow, and virtual charge completion.
- UI files: update wall progress display and rune tooltip/card text.
- Persistence: invalidate old saves if state shape changes.

## Acceptance Criteria

- Slot rows do not affect charge requirement.
- Common runes cast immediately.
- Uncommon, Rare, and Epic runes require 1, 2, and 3 charges.
- First placed rune determines the staged/cast rune.
- Charge runes must match exact staged rune type.
- Charge rune rarity and effects do not alter progress.
- Completed cast discards all physical runes used.
- Completed cast leaves wall copy for synergies/passives.
- Incomplete staged runes do not count as completed wall runes.
- Combat mutations do not persist to base deck.
- Draft rewards still modify base deck.

## Test Scenarios

- Common casts immediately and moves physical card to discard while leaving wall copy.
- Uncommon stages at `0/1`, then casts after one exact-type charge.
- Rare stages at `0/2`, then casts after two exact-type charges.
- Epic stages at `0/3`, then casts after three exact-type charges.
- Rare charge rune adds only 1 progress when used as charge fuel.
- Charge rune effects do not resolve.
- Wrong rune type cannot charge staged slot.
- Staged incomplete rune does not count for synergy, passive, or targeting.
- Completed wall copy counts for synergy, passive, and targeting.
- Completed slot rejects new placement until cleared.
- Destroy removes wall copy only.
- Return creates exact fresh-id physical copy.
- Return copy goes to discard when hand cap 10 is exceeded.
- Virtual charge completes a staged rune with 1 remaining charge and immediately triggers cast effects.
- Virtual charge does not stage empty slots.
- New encounter starts from base deck plus rewards, without encounter-only mutations.
- Old row-based charge expectations are removed.

## Unresolved Questions

None.
