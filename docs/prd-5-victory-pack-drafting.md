# Victory Pack Drafting PRD

## Summary

Replace victory draft rows with six rune-type packs:
- Fire.
- Life.
- Wind.
- Frost.
- Void.
- Lightning.

Rules:
- Player may pick one pack or skip.
- Picked pack adds 3 runes of that type.
- Every pack has at least one uncommon-or-better rune.
- No implementation in this task.

## Goals

- Simpler victory choice.
- Type-directed deck growth.
- Keep rarity excitement.
- Remove current row bonuses.

## Non-Goals

- No new rune types.
- No new rarity tiers.
- No new libraries.
- No new routes.
- No legacy systems.

## Pack Rules

- Create six pack choices in existing rune type order.
- Each pack contains exactly 3 runes.
- All 3 runes in a pack share the pack rune type.
- Each rune rolls rarity independently.
- Roll order: epic, rare, uncommon, common fallback.
- Epic/rare odds keep current cleared-enemy scaling.
- Uncommon odds: `10% + 3% per clear`.
- Cap uncommon after epic/rare so total odds never exceed 100%.
- Common gets remaining probability.
- If all 3 runes roll common, force first rune to uncommon.
- Disable draft artefact passives for this system.

## Removed Draft Bonuses

- Remove heal reward.
- Remove max-health reward.
- Remove Better Runes reward.
- Remove Robe multi-select draft behavior.
- Keep separate victory resources outside draft row bonuses unchanged.

## UI

- Show six clickable pack cards.
- No Draft button.
- Pack text: `Contains 3 Fire runes`.
- Actual 3 runes hidden before selection.
- Pack card art reflects best rarity contained in pack.
- Hover highlight matches current selected-card highlight.
- On pick, reveal awarded runes.
- On pick, update deck count.
- Keep View Deck / Next Game flow after pick.
- Allow skip to next encounter with no added runes.

## File-Level Changes For Future Implementation

- `src/utils/deckDrafting.ts`: six typed packs, no draft effects, uncommon odds, uncommon guarantee.
- `src/types/game.ts`: add pack metadata if needed for rune type/reveal state.
- `src/features/gameplay/components/DeckDraftingModal.tsx`: clickable packs, reveal chosen runes, remove Draft buttons/bonus labels.
- Tests: six packs, 3 same-type runes, uncommon guarantee, skip, reveal, removed bonuses.

## Acceptance

- Victory opens six pack choices, one per rune type.
- Selecting Fire adds exactly 3 Fire runes.
- Every generated pack has at least one uncommon-or-better rune.
- Runes use registry-backed rarity/effect refs.
- Common rewards remain possible.
- Uncommon odds apply and improve with clears.
- Rare/epic scaling remains current behavior.
- No heal/max-health/Better Runes/Robe multi-select reward remains.
- Pack can be skipped.
- Hover and selected visual states match existing selected-card highlight.

## Assumptions

- Rune type order: Fire, Life, Wind, Frost, Void, Lightning.
- "Clears" means the same progression value current draft odds use.
- Separate victory resources are not part of draft row replacement.

## Unresolved Questions

None.
