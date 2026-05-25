# Rune + Artifact Effects PRD

## Summary

Replace current hard-coded rune/artefact effect handling with registry-backed effects.

Core model:
- Runes have cast effects, passive effects, and rune-level rarity.
- Artefacts have passive effects only.
- Effects do not store rarity.
- Cast and passive effects use shared effect refs: `{ effectId, params }`.
- Passive resolution is trigger-driven, deterministic, pure, serializable.
- Old saves invalidated, not migrated.

## Goals

- Make rune and artefact effects easy to add, tune, test.
- Remove artifact-ID branching from effect resolution.
- Decouple rarity from effect behavior.
- Support future passive triggers: enemy attack, start turn, end turn, deck draft.
- Keep all gameplay state serializable.

## Non-Goals

- No save migration.
- No new rune rarity tiers.
- No player-chosen effect ordering.
- No gameplay use of rune rarity in v1 passives.
- No React/Zustand dependency in effect resolution.

## Data Model

Rune:
- `id`
- `runeType`
- `rarity: common | uncommon | rare | epic`
- `castEffectRefs`
- `passiveEffectRefs`

Artefact:
- Existing id, name, cost, image.
- Add `passiveEffectRefs`.
- No cast effects.

Effect ref:
- `effectId`
- `params`

Effect catalog:
- Central typed registry.
- Defines params, resolver behavior, display description, display hints.
- Same effect id can be reused with different params.

## Cast Effects

Current rune effects become cast effects:
- `Damage`
- `Healing`
- `Armor`
- `Fortune`
- `Synergy`
- `ArmorSynergy`
- `Fragile`
- `Channel`
- `ChannelSynergy`

Rules:
- Resolve only when a wall slot completes.
- Use the completing rune's cast effect refs.
- Synergy checks whole completed wall.
- Fragile checks whole completed wall.
- Channel effects exist but may no-op until channel mechanic is redesigned.

## Passive Effects

Passive effects declare explicit triggers:
- `onCast`
- `onEnemyAttack`
- `startTurn`
- `endTurn`
- `onDeckDraftOffer`

V1 active sources:
- Wall runes.
- Active artefacts.

Rune passive v1:
- Active only after rune is on wall.

Artefact passive v1:
- Active while artefact is selected for run.

Current artefacts map to passives:
- Ring: modify deck-draft rarity odds.
- Robe: modify deck-draft selection limit.
- Rod: modify healing.
- Potion: modify armor gain.
- Tome: modify output from single-slot/single-cast effects.

Future:
- Passive conditions may inspect rune rarity.
- V1 passive gameplay should not depend on rarity.

## Resolution

Resolver inputs:
- Trigger.
- Cast rune, when relevant.
- Wall state.
- Player/enemy combat state.
- Active artefacts.
- Draft context, when relevant.

Resolver output:
- State patch.
- Ordered effect log.

Effect log entry:
- Source type.
- Source id.
- Effect id.
- Trigger.
- Input snapshot needed for display/debug.
- Output delta or patch summary.
- Display hint.

Ordering:
- Trigger phase.
- Source type.
- Explicit priority.
- Stable source order.

Stacking:
- Flat additions first.
- Multipliers second.
- Deterministic order inside each bucket.

## Rarity

Rarity lives on rune, not effect.

Rarity drives:
- Card art.
- Tooltip styling.
- Draft odds.

Rarity does not drive v1 effect resolution.

## Proposed File-Level Changes Before Implementation

- `src/types/game.ts`: replace `Rune.effects` with rune rarity, cast effect refs, passive effect refs.
- `src/types/artefacts.ts`: add passive effect refs to artefact definitions.
- `src/utils/runeEffects.ts`: replace rarity-coupled effect helpers with effect refs, catalog access, descriptions.
- `src/utils/artefactEffects.ts`: replace artifact-ID branching with passive effect refs/catalog resolution.
- `src/utils/combatResolution.ts`: resolve cast effects and passives through pure resolver.
- `src/utils/deckDrafting.ts`: use rarity field and deck-draft passive trigger.
- UI tooltip/rarity consumers: read rune rarity directly and render descriptions from catalog.
- Persistence helpers: invalidate old active saves.

## Acceptance Criteria

- New rune cast effect requires registry entry + data ref only.
- New passive artefact requires registry entry + artefact passive ref only.
- No effect resolver switches directly on artefact id.
- Rarity no longer exists inside effect data.
- Effect resolution deterministic and testable without React/Zustand.
- UI renders effect descriptions from registry metadata.
- Old persisted schema does not crash app and is cleared/ignored.

## Test Scenarios

- Cast damage, healing, armor, fortune effects resolve from refs.
- Synergy and Fragile inspect whole completed wall.
- Multiple passives resolve in deterministic order.
- Flat bonuses apply before multipliers.
- Artefact passives affect cast output.
- Artefact passives affect deck draft.
- Rune rarity controls card art and draft odds.
- Effect data contains no rarity.
- Old persisted schema is invalidated safely.

## Unresolved Questions

None.
