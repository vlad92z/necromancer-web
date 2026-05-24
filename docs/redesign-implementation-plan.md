# Massive Spell Redesign Implementation Plan

Source PRD: `docs/redesign-prd.md`

## Summary

Implement the combat redesign in 9 playable stages.

Principles:
- Replace old live solo combat early, no feature flag.
- Add a new combat store/slice and bridge to existing run/deck-draft systems.
- Each stage keeps `/solo` loadable and interactable.
- Each stage lists file-level changes before implementation.
- Each stage ends with automated checks and manual play checks.
- Final state fully satisfies the PRD: no visible runeforge, pattern line, overload, connected-segment, or RuneScore combat UI.

Automated checks for code stages:
- `npx vitest run`
- `npm run build`
- `npm run lint`

## Stage 1: Combat Foundation + Save Invalidation (Done)

File-level changes:
- `src/types/game.ts`: add combat types.
- `src/state/stores/`: add new combat store/slice.
- `src/utils/gameInitialization.ts`: initialize combat state.
- `src/utils/soloPersistence.ts`: add save versioning/invalidation.

Implement:
- Add `Enemy`, `EnemyIntent`, `CombatPhase`, `SpellWallCharge`, `CombatZoneState`.
- Add hand and discard state.
- Add goblin enemy: HP = `targetScore`, intent = Attack 5.
- Add new saved-state version.
- Invalidate old saved solo runs instead of migrating runeforge/pattern/overload state.
- No visible gameplay change required yet.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Start `/solo`.
- Existing game may still show.
- App does not crash.
- Old saves clear or are ignored safely.

## Stage 2: Replace Main Combat Layout Shell (Done)

File-level changes:
- `src/features/gameplay/components/SoloGameBoard.tsx`: replace visible combat shell.
- `src/features/gameplay/components/GameContainer.tsx`: wire new combat selectors as needed.
- `src/hooks/useGameState.ts`: add combat selector hooks.
- `src/features/gameplay/components/EnemyPanel.tsx`: add enemy display.
- `src/features/gameplay/components/EndTurnButton.tsx`: add placeholder button.

Implement:
- Hide/remove visible runeforge table from combat.
- Hide/remove visible pattern lines from combat.
- Hide overload and RuneScore from combat header.
- Show enemy panel with goblin image, HP, and Attack 5 intent.
- Keep existing scoring wall visible.
- Keep temporary hand placeholder if hand UI is not wired yet.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Start solo.
- See enemy plus wall.
- No runeforges, pattern lines, overload, or RuneScore combat UI visible.
- Settings/deck/start flow still works.

## Stage 3: Hand UI From TooltipView (Done)

File-level changes:
- `src/features/gameplay/components/Player/TooltipView.tsx`: repurpose into playable hand view.
- `src/features/gameplay/components/Player/CardView.tsx`: add selected/disabled visuals only if needed.
- Combat store/selectors/actions: add hand selection.

Implement:
- Deal up to 6 runes into hand on encounter start.
- Display hand as the existing card fan.
- Click card to select it.
- Highlight selected card.
- Casting may still be a no-op in this stage.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Start solo.
- Hand shows up to 6 cards.
- Click cards and see selection state.
- Refresh/new run remains playable.

## Stage 4: Wall Slot Charge + Placement (Done)

File-level changes:
- `src/features/gameplay/components/Player/ScoringWall.tsx`: make cells placement targets.
- `src/features/gameplay/components/WallCell.tsx`: show charge state.
- `src/utils/combatResolution.ts`: add wall placement helpers.
- Combat store/actions: add `castRuneToWall`.

Implement:
- Clicking valid wall slot consumes selected hand rune.
- Slot accepts only matching expected rune type.
- Row N requires N matching rune plays.
- Show simple charge text, e.g. `1/3`.
- Non-final charges do not resolve effects.
- Final charge fills the cell.
- Wrong-type or filled slots reject placement and keep card selected.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Select rune, click matching row 1 slot; cell fills.
- Select rune, click row 3 matching slot; charge increments.
- Wrong type and filled slots reject without crashing.

## Stage 5: Turn End + Deck/Discard Cycle (Done)

File-level changes:
- Combat store/actions/selectors: add draw, discard, and end-turn behavior.
- `src/features/gameplay/components/EndTurnButton.tsx`: wire action.
- Header/count UI: show deck, discard, and hand counts where practical.

Implement:
- End Turn moves remaining hand to discard.
- Enemy attack may be stubbed or applied if ready.
- Next turn draws up to 6.
- Draw uses deck first.
- Reshuffle discard only when needed.
- Partial and empty hands are allowed.
- Empty hand does not auto-end.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Play one card.
- Press End Turn.
- Remaining hand moves to discard.
- New hand is dealt.
- Exhaust deck enough to verify discard reshuffle.

## Stage 6: Basic Combat Resolution (Done)

File-level changes:
- `src/utils/combatResolution.ts`: add basic effect and enemy-turn resolution.
- Combat store/actions: apply cast results and enemy attack.
- `src/features/gameplay/components/EnemyPanel.tsx`: update HP display.
- `src/features/gameplay/components/HealthView.tsx`: update only if needed for armor clarity.

Implement:
- Final-cast Damage reduces enemy HP.
- Final-cast Healing restores player health up to max.
- Final-cast Armor adds armor.
- Final-cast Fortune adds arcane dust.
- Enemy Attack 5 consumes armor before health.
- Health 0 triggers defeat.
- Enemy HP 0 triggers immediate victory.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Cast damage rune and see enemy HP drop.
- Press End Turn and see player health/armor update.
- Kill goblin and confirm enemy does not attack.
- Reduce player to 0 and confirm defeat modal.

## Stage 7: Victory + Existing Deck Draft (Done)

File-level changes:
- Combat store/actions: bridge victory into existing deck draft state.
- `src/features/gameplay/components/DeckDraftingModal.tsx`: update integration only if needed.
- Existing `startNextSoloGame` flow: initialize new combat encounter.

Implement:
- On victory, return completed wall runes to deck.
- Return charge-spent runes to deck.
- Reset wall, charges, hand, and discard for next encounter.
- Open existing deck draft modal.
- Keep reward UI runeforge wording for now.
- Starting next game creates a fresh goblin encounter.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Kill enemy.
- Deck draft modal opens.
- Pick reward if possible.
- Start next game.
- See fresh wall, new hand, and enemy HP from next `targetScore`.

## Stage 8: Advanced Effect Mapping (Done)

File-level changes:
- `src/utils/combatResolution.ts`: add whole-wall effect mapping.
- `src/utils/scoring.test.ts`: update or replace obsolete segment tests.
- `src/utils/runeEffects.ts`: update tooltip copy.

Implement:
- Synergy counts matching rune type across the whole completed wall.
- ArmorSynergy counts matching rune type across the whole completed wall.
- Fragile checks whole completed wall absence.
- Channel and ChannelSynergy are disabled/no-op in combat.
- Tooltip copy no longer mentions RuneScore, segments, or overload for active v1 effects.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual play check:
- Use test fixtures or a prepared deck to verify whole-wall synergy.
- Confirm no segment scoring is visible or used.
- Tooltips describe enemy damage and whole-wall behavior.

## Stage 9: Cleanup + PRD Acceptance (Done)

File-level changes:
- Remove visible combat references to runeforges, pattern lines, overload, and RuneScore.
- Update obsolete tests.
- Remove dead old combat files only when import search proves safe.
- Update README current gameplay section if included.

Implement:
- No visible old combat UI remains.
- No old combat actions are used by live solo route.
- Deck draft and reward code remains intact.
- Old files remain only if still referenced or useful for rewards.

Automated checks:
- `npx vitest run`
- `npm run build`
- `npm run lint`

Manual full-loop check:
- Start solo.
- Select hand rune.
- Charge wall slot.
- Complete row 1 cast.
- Press End Turn.
- Enemy attacks.
- Cycle deck/discard.
- Kill enemy.
- Enter deck draft.
- Start next encounter.
- Lose by health reaching 0.

## Public Interfaces And Types

Add:
- `Enemy`
- `EnemyIntent`
- `CombatPhase`
- `SpellWallCharge`
- `CombatZoneState`

Add combat selectors for:
- Enemy
- Hand
- Discard
- Wall charges
- Selected hand rune

Add combat actions for:
- Draw hand
- Select hand rune
- Cast rune to wall
- End turn
- Resolve enemy intent
- Complete victory
- Complete defeat

## Assumptions

- Existing PRD remains source of truth.
- Target file is `docs/redesign-implementation-plan.md`.
- Implementation replaces live solo combat early.
- New combat store/slice is preferred over patching the old runeforge action engine.
- Every stage must keep `/solo` loadable and interactable.
- Automated checks are `npx vitest run`, `npm run build`, and `npm run lint`.
- No unresolved questions.
