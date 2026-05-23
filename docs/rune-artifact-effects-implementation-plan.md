# Rune + Artifact Effects Implementation Plan

Source PRD: `docs/rune-artifact-effects-prd.md`

## Summary

Implement registry-backed rune and artefact effects in 9 independently testable stages.

Principles:
- Stage 1 cuts away from old `Rune.effects`; old effects may no-op until restored by later stages.
- Each stage must build/test and keep `/solo` loadable.
- Delete old segment/pattern-line scoring effect code by final stage.
- No long-term dual schema or old `effects` fallback.
- Code keeps `artefact` spelling where existing files use it.
- Tome new behavior is `+1 damage on all casts`.
- Effect logs are resolver return values only in v1.

Automated checks for every code stage:
- `npx vitest run`
- `npm run build`
- `npm run lint`

## Stage 1: Schema Cutover + Save Invalidation ✅ Done

File-level changes:
- `src/types/game.ts`: replace `Rune.effects`/`RuneEffects` with `rarity`, `castEffectRefs`, `passiveEffectRefs`.
- `src/types/artefacts.ts`: add `passiveEffectRefs`.
- `src/utils/gameInitialization.ts`, `src/utils/deckDrafting.ts`: create runes with new fields.
- `src/utils/soloPersistence.ts`: bump save version.

Implement:
- Add typed effect ref types and rarity type.
- Add empty/pass-through refs where behavior is not restored yet.
- Invalidate old active solo saves.
- Update test factories to compile with new rune shape.
- Keep `/solo` loadable; cast effects may no-op.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Start solo.
- Open deck.
- Select and cast rune without crash.

## Stage 2: Effect Catalog + Display Metadata ✅ Done

File-level changes:
- `src/utils/effectCatalog.ts`: add central registry.
- `src/utils/runeEffects.ts`: replace legacy effect arrays with catalog/ref helpers.
- `src/utils/tooltipCards.ts`, `src/components/RuneCell.tsx`, `src/features/gameplay/components/Player/CardView.tsx`: read rune rarity directly.

Implement:
- Add cast effect IDs for existing rune effects.
- Add passive effect IDs for current artefacts.
- Add catalog descriptions/display hints.
- Replace `getRuneRarity(effects)` with direct `rune.rarity`.
- Replace rune tooltip descriptions with catalog-derived text.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Rune art rarity renders.
- Rune and artefact tooltips render.

## Stage 3: Cast Effect Resolver ✅ Done

File-level changes:
- `src/utils/effectResolver.ts`: add pure cast resolver.
- `src/utils/combatResolution.ts`: call resolver on completed wall casts.
- `src/utils/combatResolution.test.ts`: update cast effect tests.

Implement:
- Resolve `Damage`, `Healing`, `Armor`, `Fortune`.
- Resolve `Synergy`, `ArmorSynergy`, `Fragile` against whole completed wall.
- Represent `Channel` and `ChannelSynergy` as no-op cast effects.
- Return state patch + per-effect log from pure resolver.
- Do not persist effect log in Zustand.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Final wall cast updates enemy HP/player health/armor/dust.

## Stage 4: Passive Resolver Core

File-level changes:
- `src/utils/effectResolver.ts`: add passive collection/order/stacking.
- `src/types/game.ts`: add trigger/source/log types if not already included.
- Add or update resolver tests.

Implement:
- Support triggers: `onCast`, `onEnemyAttack`, `startTurn`, `endTurn`, `onDeckDraftOffer`.
- Collect active passives from wall runes and active artefacts.
- Order by trigger phase, source type, priority, stable source order.
- Apply flat additions before multipliers.
- Keep passive rarity conditions out of v1 gameplay.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Start solo and cast/end turn without crash while passives are present.

## Stage 5: Combat Artefact Passives

File-level changes:
- `src/types/artefacts.ts`: define Rod/Potion/Tome passive refs.
- `src/utils/artefactEffects.ts`: replace combat modifier helpers with catalog/passive resolver wrappers or remove them.
- `src/state/stores/gameplayStore.ts`, `src/utils/combatResolution.ts`: use passive resolver output.

Implement:
- Rod: `onCast` healing multiplier.
- Potion: `onCast` armor gain modifier.
- Tome: `+1 damage on all casts`.
- Remove artifact-ID switches from combat effect resolution.
- Keep artefact descriptions catalog-driven.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Select Rod/Potion/Tome.
- Confirm selected artefacts change cast results.

## Stage 6: Deck Draft Passives

File-level changes:
- `src/types/artefacts.ts`: define Ring/Robe passive refs.
- `src/utils/deckDrafting.ts`: resolve `onDeckDraftOffer`.
- `src/utils/artefactEffects.ts`: remove Ring/Robe hard-coded helpers.
- `src/utils/deckDrafting.test.ts`: update rarity expectations.

Implement:
- Ring: modifies draft rarity odds through passive resolver.
- Robe: modifies deck draft selection limit through passive resolver.
- Drafted runes receive direct `rarity` plus catalog cast refs.
- Disenchant value reads `rune.rarity`.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Win encounter.
- Deck draft opens.
- Reward selection works with Ring/Robe selected.

## Stage 7: UI + Persistence Cleanup

File-level changes:
- `src/features/gameplay/components/DeckOverlay.tsx`, `src/features/gameplay/components/WallCell.tsx`, `src/features/gameplay/components/Player/ScoringWall.tsx`: remove old effect-field assumptions.
- `src/utils/tooltipCards.ts`, `src/components/ArtefactsRow.tsx`: use catalog descriptions.
- Persistence tests as needed.

Implement:
- Wall cells store completed rune effect refs, not legacy effects.
- Deck overlay sorting/disenchant uses rarity field.
- Artefact tooltips use registry metadata.
- Remove obsolete hydration paths for `firstRuneEffects`/`primaryRuneEffects`.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Deck overlay, wall tooltip, artefact tooltip all render.
- Old persisted schema invalidates safely.

## Stage 8: Delete Legacy Scoring Effects

File-level changes:
- `src/utils/scoring.ts`, `src/utils/scoring.test.ts`: delete or strip obsolete segment effect resolution.
- `src/state/stores/gameplayStore.ts`: remove old pattern-line/scoring effect imports/usages.
- Any old tests/fixtures still using `RuneEffects`: update or delete.

Implement:
- Remove old `RuneEffect`/`RuneEffects` type usage completely.
- Remove old `getRuneEffectsForType`, `getDraftEffectsForType`, `copyRuneEffects` APIs if replaced.
- Delete segment scoring effect paths; keep only wall geometry helpers if still imported.
- Ensure `rg "RuneEffects|\\.effects|getRuneRarity\\(" src` finds no legacy runtime usage.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- `/solo` loadable.
- Combat and deck draft still work.

## Stage 9: Final PRD Acceptance

File-level changes:
- Mark implementation plan stages complete as done.
- Update README/current docs only if they reference old effect model.

Implement:
- Confirm new rune cast effect requires registry entry + rune data ref only.
- Confirm new passive artefact requires registry entry + artefact passive ref only.
- Confirm no resolver switches directly on artefact id.
- Confirm no gameplay state stores non-serializable effect behavior.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual full-loop check:
- Start solo.
- Cast rune.
- End turn.
- Win encounter.
- Draft reward.
- Start next encounter.

Final search checks:
- `rg "rarity:" src/utils src/types`
- `rg "activeArtefacts\\.includes|hasArtefact|switch.*artefact" src/utils src/state`
- `rg "RuneEffects|RuneEffect\\b|\\.effects" src`

## Unresolved Questions

None.
