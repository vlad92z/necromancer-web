# Rune Type Identities Effects Implementation Plan

Source PRD: `docs/rune-type-identities-effects-prd.md`

## Summary

Implement rune identity effects in 6 independently testable stages.

Rules:
- Every stage keeps solo combat playable.
- Every stage keeps deck draft usable.
- Every stage keeps tests/build/lint passing.
- Ship by gameplay surface: common, uncommon, rare, epic, cleanup, future effects.
- Higher rarities may keep current behavior until their stage.
- No new libraries, routes, enemy systems, or save migration unless recovery metadata requires save invalidation.

Automated checks every stage:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check every stage:
- Start solo.
- Cast valid rune.
- End turn.
- Win encounter.
- Pick draft reward.
- Start next encounter.

## Stage 1: Common Effects + Resolver Primitives ✅ Done

Completed:
- Common rune identity refs implemented.
- Adjacent, conditional, and percent-boost damage primitives implemented.
- Source position passed through wall completion resolution.
- Automated checks passed.

File-level changes before implementation:
- `src/utils/effectCatalog.ts`: add all new effect ids/descriptions; unused effects may be catalog-only.
- `src/utils/effectResolver.ts`: add completed-wall counts, adjacency, source-cell context, damage pipeline.
- `src/utils/runeEffects.ts`: update common rarity assignments only.

Implement:
- Fire common: `damageAdjacent` 1.
- Frost common: `armor` 3.
- Life common: `heal` 2.
- Lightning common: `damageBoostSynergy` 5% Frost.
- Void common: `damageConditional` 25 if at least 2 Void.
- Wind common: `arcaneDust` 10.
- Damage math: flat bonuses, then percent boosts, round up positive damage.
- Board counts use completed cells only.
- Adjacent includes edges and corners.

Tests:
- Common assignment refs.
- Adjacent includes diagonals.
- Completed-only counting.
- Conditional threshold.
- Percent boost rounding.
- Arcane dust reaches gameplay store.

Acceptance:
- Common-only deck is fully playable.
- Existing uncommon/rare/epic runes still work with prior behavior.

## Stage 2: Uncommon Effects + End-Turn Passive

File-level changes before implementation:
- `src/utils/runeEffects.ts`: update uncommon assignments.
- `src/utils/effectResolver.ts`: add adjacent armor/draw, synergy damage, end-turn passive damage.
- `src/utils/combatResolution.ts`: expose shared draw helper for cast/passive extra draws.
- `src/state/stores/gameplayStore.ts`: resolve end-turn passives before enemy attack.

Implement:
- Fire uncommon: `damageSynergy` 5 Fire.
- Frost uncommon: `armorAdjacent` 3.
- Life uncommon: `healthIncrease` 1.
- Lightning uncommon: `damageBoostSynergy` 15% Lightning.
- Void uncommon: `pulseSynergy` 5 Void.
- Wind uncommon: `drawAdjacent`.
- Hand cap 10 for extra draw.
- End-turn pulse can end combat before enemy attack.

Tests:
- Uncommon assignment refs.
- Health increase raises max health and current health.
- End-turn pulse before enemy attack.
- Draw adjacent respects hand cap 10.
- Mixed common/uncommon deck stays playable.

Acceptance:
- Uncommon rune rewards are playable and resolve new effects.

## Stage 3: Rare Effects + Mutation Foundation

File-level changes before implementation:
- `src/types/game.ts`: add serializable encounter recovery/mutation metadata if needed.
- `src/utils/runeEffects.ts`: update rare assignments.
- `src/utils/effectResolver.ts`: return wall/hand/charge/recovery deltas from resolver.
- `src/utils/combatResolution.ts`: apply resolver board mutation outputs.
- `src/state/stores/gameplayStore.ts`: resolve start-turn passives after normal refill.

Implement:
- Fire rare: `damageFragile` 25 minus 5 per Frost, floor 0.
- Frost rare: `armorSynergy` 5 Frost.
- Life rare: `healingStartTurn` 2.
- Lightning rare: `retriggerAdjacent`.
- Void rare: `damageConsuming` 10.
- Wind rare: `drawingStartTurn` 1.
- Destroyed consumed runes unavailable until encounter recovery.
- Retrigger adjacent replays cast effects only; skip retrigger effects.
- Start-turn heal/draw runs after normal refill.

Tests:
- Rare assignment refs.
- Fragile floor at 0.
- Start-turn heal/draw after refill.
- Damage consuming destroys adjacent completed cells.
- Destroyed runes restore on victory.
- Retrigger adjacent does not recurse.

Acceptance:
- Rare effects are playable without permanent deck loss.

## Stage 4: Epic Effects + Passive-Only Support

File-level changes before implementation:
- `src/utils/runeEffects.ts`: update epic assignments.
- `src/utils/effectResolver.ts`: add type-filtered rune passives and explosive/vampire/return handling.
- Tooltip consumers: update only if passive-only descriptions need clearer display.

Implement:
- Fire epic: `addDamage` Fire 5.
- Frost epic: `armorBoost` 5.
- Life epic: `healSynergy` 3 Life.
- Lightning epic: `explosive` 50.
- Void epic: `vampire` 25%.
- Wind epic: `returnAdjacent`.
- Passive-only runes resolve no immediate cast payload.
- Explosive fires once on destroy/convert.
- Vampire heals from actual enemy HP loss after overkill clamp.
- Return adjacent clears wall cells and moves original runes to hand up to cap 10.

Tests:
- Epic assignment refs.
- Passive-only completion no-ops safely.
- `addDamage` affects only target type.
- `armorBoost` applies to all armor gained.
- Explosive fires once.
- Vampire heals from actual HP loss.
- Return adjacent respects hand cap and recovery.

Acceptance:
- Full assigned rarity table is playable.

## Stage 5: Full Table Cleanup + Persistence Acceptance

File-level changes before implementation:
- `src/utils/runeEffects.ts`: remove old rarity effect values.
- `src/utils/effectResolver.ts`: remove transitional fallbacks.
- `src/utils/soloPersistence.ts`: bump schema only if saved state shape changes.
- Tooltip tests/files: update descriptions for final effect table.

Implement:
- All six rune types use final PRD assignments.
- Descriptions match final behavior.
- Deck overlay and wall tooltips show cast/passive effects.
- Save invalidation remains old-schema-only unless new metadata requires bump.

Tests:
- Full rarity matrix exact-ref test.
- Tooltip description tests.
- Persistence save/load tests if schema changes.
- Gameplay store victory recovery with suppressed/restored runes.

Acceptance:
- No old rune identity behavior remains in active table.
- Existing artefact effects still work.

## Stage 6: Future/Unassigned Effects

File-level changes before implementation:
- `src/utils/effectResolver.ts`: implement remaining PRD effects.
- `src/utils/effectCatalog.ts`: remove temporary unimplemented markers.
- Tests: add focused resolver/combat tests.

Implement:
- `destroyType`
- `reduceDamage`
- `healthDecrease`
- `convertRandom`
- `convertAdjacent`
- `retriggerType`
- `arcaneDustAdjacent`
- `chargeAdjacent`

Rules:
- Random targets exclude source.
- Convert writes common target-type no-effect wall rune.
- `reduceDamage` applies before armor.
- Virtual charge increments adjacent incomplete slots by 1 and creates no card.
- Type retrigger skips retrigger effects.

Tests:
- Deterministic random target eligibility with injected RNG.
- Convert random/adjacent loses rarity and effects.
- Health decrease clamps current health.
- Reduce damage before armor.
- Charge adjacent creates no spent rune.
- Type retrigger does not recurse.

Acceptance:
- All PRD effects are implemented even if unassigned.

## Public Interfaces / Types

- Extend resolver result with optional wall, charge, hand, discard, and recovery deltas.
- Add serializable encounter recovery metadata only if needed for original rune restoration.
- Keep `Rune`, `EffectRef`, and `RuneType` shape compatible unless recovery requires source ids.
- Keep effect ids string-backed.
- Keep effect logs resolver-return-only unless a later UI explicitly needs persistence.

## Final Acceptance

- `rg "Channel|ChannelSynergy|RuneEffects|\\.effects" src` finds no reintroduced legacy runtime path.
- `npx vitest run` passes.
- `npm run build` passes.
- `npm run lint` passes.
- Manual full-loop play check passes with common, uncommon, rare, and epic rewards.

## Unresolved Questions

None.
