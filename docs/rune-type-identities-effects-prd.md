# Rune Type Identities + Effects PRD

## Summary

Define rune identities, effect vocabulary, timing, mutation, and implementation impact for the next rune effects pass.

Core decisions:
- Adjacent = edge or corner, max 8.
- Counts use completed wall runes only.
- Random targets exclude source rune.
- Hand cap = 10 for draw/return overflow.
- Destroyed runes unavailable until encounter ends; victory restores deck.
- Converted runes become common target-type runes with no effects.
- `triggerType` and `retriggerSynergy` merge into one type-targeted retrigger.
- Internal effect ids may use clearer names than original brainstorm names.

## Goals

- Give every rune type a clear rarity ladder identity.
- Fully specify all 33 proposed effects.
- Keep effects registry-backed, serializable, deterministic, and testable.
- Support board mutation without permanent deck loss inside an encounter.
- Avoid retrigger loops and ambiguous damage math.

## Non-Goals

- No new rune types.
- No new rarity tiers.
- No new routes, enemy systems, libraries, or save migration.
- No Channel or ChannelSynergy.
- No implementation in this PRD.

## Effect Lifecycle

- Cast effects resolve only when a wall slot completes.
- Passive-only runes are allowed; completion activates passive and has no immediate cast payload.
- Rune passives are active only while completed on the wall.
- Start-turn passives resolve after normal hand refill.
- End-turn passives resolve before enemy attack.
- Enemy attack reduction applies before armor.
- Enemy HP 0 still opens deck draft immediately; enemy does not attack.

## Counting + Targeting

- Board counts include completed wall cells only.
- Partial charge runes do not count.
- The resolving rune counts for board totals unless an effect says source excluded.
- Adjacent means any of the 8 surrounding cells within bounds.
- Random type effects choose uniformly among eligible completed cells, excluding source.
- If no eligible targets, effect no-ops and logs no target.

## Damage + Healing Rules

- Flat damage bonuses apply before percent damage boosts.
- Positive percent-boosted damage rounds up to nearest 1.
- Zero damage stays zero.
- `damageFragile` floors at 0.
- Vampire heals from actual enemy HP loss after modifiers and overkill clamp.
- Healing cannot exceed max health.
- Max health increase also heals by the same amount.
- Max health decrease clamps current health to new max.

## Board Mutation Rules

- Destroy clears a completed wall cell and suppresses that rune until encounter recovery.
- Return clears a completed wall cell and puts the original rune in hand if hand has space.
- Return no-ops for each returned rune that would exceed hand cap 10.
- Convert clears source identity and writes a common no-effect rune of target type.
- Converted runes count as completed target-type wall runes.
- Converted runes do not preserve rarity, cast effects, or passive effects.
- Destroy/convert trigger `explosive` once.
- Explosive damage does not chain more mutation or retrigger effects.
- Victory restores original deck ownership for destroyed, converted, returned, wall, and charge-spent runes.
- Virtual charge increments adjacent incomplete charge counters by 1 and creates no card.
- Virtual charge can complete progress only if a later real rune fills the slot.

## Retrigger Rules

- Retrigger effects replay cast effects from completed wall runes.
- Retriggered cast effects skip all retrigger effects.
- `retriggerAdjacent` targets adjacent completed runes.
- Type-targeted retrigger targets completed runes of target type.
- Retriggered effects use current board state at time of replay.
- Retriggers do not recurse.

## Effect Vocabulary

Cast effects:
- `damage`: deal X damage.
- `damageAdjacent`: deal X damage per adjacent completed rune.
- `damageSynergy`: deal X damage per completed target-type rune.
- `damageFragile`: deal max(0, X - Y per completed target-type rune).
- `damageConditional`: deal X damage if at least Y completed target-type runes exist.
- `damageConsuming`: deal X damage per adjacent completed rune, then destroy those adjacent runes.
- `armor`: gain X armor.
- `armorAdjacent`: gain X armor per adjacent completed rune.
- `armorSynergy`: gain X armor per completed target-type rune.
- `heal`: heal X.
- `healAdjacent`: heal X per adjacent completed rune.
- `healSynergy`: heal X per completed target-type rune.
- `healthIncrease`: increase max health by X and heal X.
- `healthDecrease`: reduce max health by X and clamp current health.
- `arcaneDust`: gain X arcane dust.
- `arcaneDustAdjacent`: gain X arcane dust per adjacent completed rune.
- `drawAdjacent`: draw 1 rune per adjacent completed rune, up to hand cap.
- `destroyType`: destroy one random completed target-type rune, excluding source.
- `convertRandom`: convert one random completed source-type rune into target type.
- `convertAdjacent`: convert all adjacent completed runes into target type.
- `returnAdjacent`: return adjacent completed runes to hand, up to hand cap.
- `chargeAdjacent`: add 1 virtual charge to adjacent incomplete slots.
- `retriggerAdjacent`: retrigger adjacent completed runes' cast effects.
- `retriggerType`: retrigger completed target-type runes' cast effects.

Passive effects:
- `addDamage`: target rune type deals X additional damage.
- `reduceDamage`: reduce incoming enemy attack damage by X before armor.
- `armorBoost`: increase all armor gained by X.
- `healingStartTurn`: at start of turn heal X.
- `drawingStartTurn`: at start of turn draw X additional runes, up to hand cap.
- `damageBoostSynergy`: increase all damage by X% per completed target-type rune.
- `explosive`: deal X damage if this rune is destroyed or transformed.
- `pulseSynergy`: at end of turn deal X damage per completed target-type rune.
- `vampire`: heal X% of actual enemy HP loss.

## Rune Rarity Assignments

Fire:
- Common: `damageAdjacent` 1.
- Uncommon: `damageSynergy` 5 Fire.
- Rare: `damageFragile` 25 minus 5 per Frost.
- Epic: `addDamage` Fire 5.

Frost:
- Common: `armor` 3.
- Uncommon: `armorAdjacent` 3.
- Rare: `armorSynergy` 5 Frost.
- Epic: `armorBoost` 5.

Life:
- Common: `heal` 2.
- Uncommon: `healthIncrease` 1.
- Rare: `healingStartTurn` 2.
- Epic: `healSynergy` 3 Life.

Lightning:
- Common: `damageBoostSynergy` 5% Frost.
- Uncommon: `damageBoostSynergy` 15% Lightning.
- Rare: `retriggerAdjacent`.
- Epic: `explosive` 50.

Void:
- Common: `damageConditional` 25 if at least 2 Void.
- Uncommon: `pulseSynergy` 5 Void.
- Rare: `damageConsuming` 10.
- Epic: `vampire` 25%.

Wind:
- Common: `arcaneDust` 10.
- Uncommon: `drawAdjacent`.
- Rare: `drawingStartTurn` 1.
- Epic: `returnAdjacent`.

Unassigned but specced:
- `destroyType`
- `reduceDamage`
- `healthDecrease`
- `convertRandom`
- `convertAdjacent`
- `retriggerType`
- `arcaneDustAdjacent`
- `chargeAdjacent`

## Proposed File-Level Changes Before Implementation

- `src/utils/effectCatalog.ts`: add effect ids, descriptions, display hints, passive metadata.
- `src/utils/effectResolver.ts`: add damage pipeline, timing triggers, board/hand mutation outputs, retrigger guard.
- `src/utils/combatResolution.ts`: thread wall, charge, hand, discard, and encounter recovery state through resolver.
- `src/utils/runeEffects.ts`: replace rarity effect table with assignments above.
- `src/types/game.ts`: add resolver result fields for wall, charges, hand, discard, recovered encounter runes, and effect context metadata if needed.
- Tests: add focused unit coverage for assignments, damage math, timing, adjacency, mutation, retrigger, and victory recovery.

## Acceptance Criteria

- Every listed effect has deterministic behavior.
- Current rarity table maps to effect refs without effect-level rarity.
- Completed-only counting is consistent across damage, armor, heal, dust, pulse, and boosts.
- Board mutation never permanently loses deck cards before encounter end.
- Retriggers cannot recurse.
- Passive-only runes display clearly and activate only from completed wall cells.
- Existing old-save invalidation remains acceptable; no migration required.

## Test Scenarios

- Rarity assignments produce expected cast/passive refs.
- Adjacency includes diagonals and excludes out-of-bounds cells.
- Synergy counts completed wall cells only.
- Damage applies flat bonus, percent boost, then positive round-up.
- Vampire heals from actual enemy HP loss only.
- Start-turn heal/draw runs after normal refill.
- End-turn pulse runs before enemy attack.
- Reduce damage applies before armor.
- Destroy, convert, return, and charge mutate wall/hand/charges as specified.
- Explosive fires once on destroy/convert and does not chain.
- Retrigger adjacent/type skips retrigger effects.
- Victory restores encounter-suppressed runes to deck.

## Unresolved Questions

None.
