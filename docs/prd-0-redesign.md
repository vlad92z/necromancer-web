# Massive Spell Combat Redesign PRD

## Summary

Redesign core combat around hand-driven rune casting and enemy encounters.

Remove from combat:
- Runeforges
- Pattern lines
- Overload
- Connected segment scoring
- RuneScore as win condition

Keep:
- Massive Spell fantasy
- Rune cards
- 6x6 spell wall
- Deck growth and deck draft rewards
- Player health, armor, healing, damage, arcane dust

Primary v1 loop:
1. Start encounter.
2. Deal player up to 6 runes.
3. Show enemy with queued intent.
4. Player casts hand runes into matching spell wall slots.
5. Completed slot resolves rune effect immediately.
6. Player presses End Turn.
7. Enemy attacks.
8. New player turn begins.
9. Repeat until enemy HP reaches 0 or player health reaches 0.

## Goals

- Make combat understandable from one screen.
- Reduce decision objects to hand, wall, enemy.
- Make victory emotional: defeat enemy, not hit abstract score.
- Preserve long-term spell-building through wall investment.
- Preserve deckbuilding runway for future roguelite progression.

## Non-Goals

- No new enemy intent variety in v1.
- No row or column passive bonuses in v1.
- No overload replacement in v1.
- No connected segment logic.
- No full reward UI rename in v1.
- No new route or backend system.

## Player Experience

### Combat Screen

The player sees:
- Enemy panel with goblin image.
- Enemy HP.
- Enemy queued intent: Attack 5.
- Player health and armor.
- Deck, discard, and hand counts.
- 6x6 spell wall.
- Hand of rune cards.
- End Turn button bottom-right.

Use `src/assets/enemies/goblin.png` for the v1 enemy.

### Player Turn

At turn start:
- Deal up to 6 runes into hand.
- If draw deck has fewer than needed, draw remaining deck first.
- If hand still has fewer than 6 and discard pile is non-empty, shuffle discard into draw deck and continue drawing.
- Partial hands are allowed.
- Empty hand is allowed.

During turn:
- Player selects one rune from hand.
- Player selects a matching spell wall slot.
- A slot is valid only if:
  - Expected slot rune type matches selected rune type.
  - Slot is not fully cast.
- Invalid slots do nothing except keep selection active.
- Player may play any number of hand cards.
- Player must press End Turn, even if hand is empty.

At End Turn:
- Remaining hand cards move to discard pile.
- Enemy takes queued action.
- If player survives, next player turn starts.

### Enemy Turn

V1 enemy action:
- Attack 5.
- Armor absorbs damage before health.
- If health reaches 0, player is defeated.
- Armor resets before the next encounter, not during the current encounter.

### Victory

Enemy HP reaching 0:
- Ends encounter immediately.
- Enemy does not take queued action.
- Wall runes and charge-spent runes return to deck.
- Encounter wall resets.
- Existing deck draft modal opens.

Use current deck draft flow for v1.
Runeforge-themed reward language can remain temporarily.

## Spell Wall Rules

Keep current 6x6 expected-rune wall pattern.

Each wall cell has:
- Expected rune type.
- Charge count.
- Required charge count.
- Completed rune, if fully cast.
- Spent charge runes, for encounter card return.

Required charge count:
- Row 1: 1 matching rune.
- Row 2: 2 matching runes.
- Row 3: 3 matching runes.
- Row 4: 4 matching runes.
- Row 5: 5 matching runes.
- Row 6: 6 matching runes.

Charge behavior:
- Non-final matching runes add 1 charge and are spent.
- Non-final charge runes do not resolve effects.
- Final matching rune fills the slot and resolves effects immediately.
- Filled slot cannot receive more runes.
- Charge persists across turns within the encounter.
- Wall resets after encounter.

Example:
- Row 3 Fire slot needs 3 Fire runes.
- First Fire charges 1/3, no effect.
- Second Fire charges 2/3, no effect.
- Third Fire completes slot, resolves effect, occupies wall.

## Rune Effects

Damage:
- Reduces enemy HP.
- Existing Damage effect amounts are reused.
- Existing RuneScore damage becomes enemy damage.

Healing:
- Restores player health up to max health.

Armor:
- Adds armor.
- Armor absorbs enemy attack before health.

Fortune:
- Adds arcane dust as today.

Synergy:
- No segment logic.
- Counts matching synergy rune type across the whole completed spell wall.

ArmorSynergy:
- Counts matching synergy rune type across the whole completed spell wall.

Fragile:
- Triggers if fragile rune type is absent from the whole completed spell wall.

Channel and ChannelSynergy:
- Disabled in v1 because overload is removed.
- Future redesign needed.

Effect resolution:
- Resolve only when a slot completes.
- Use the completing rune's effects.
- Completed wall rune stores rune type and effects.

## Enemy Model

V1 enemy:
- Name: Goblin.
- Image: `src/assets/enemies/goblin.png`.
- Max HP: current `targetScore`.
- Current HP starts at max HP.
- Intent: Attack 5.

Enemy state must be serializable.

Suggested fields:
- `id`
- `name`
- `imageSrc`
- `health`
- `maxHealth`
- `intent`

Intent v1:
- `{ type: 'Attack'; amount: 5 }`

## Deck Lifecycle

Combat card zones:
- Draw deck
- Hand
- Discard pile
- Wall runes
- Slot charge spent runes

At encounter start:
- Draw deck starts from player deck.
- Hand empty.
- Discard empty.
- Wall empty.
- Slot charges empty.

On turn start:
- Draw up to 6.
- If draw deck empties, shuffle discard into draw deck only when needed.
- If no cards remain, deal partial or empty hand.
- No defeat from deck exhaustion.

On rune play:
- Rune leaves hand.
- If non-final charge, store under target slot charge.
- If final cast, store as completed wall rune.

On End Turn:
- Remaining hand moves to discard pile.

On victory:
- Completed wall runes return to deck.
- Charge-spent runes return to deck.
- Discard and draw deck remain part of deck.
- Rewards then modify deck.

On defeat:
- Run ends.
- Saved solo state cleared.

## State And Type Changes

Update core game types to support:
- Enemy state.
- Enemy intent.
- Hand.
- Discard pile.
- Slot charge state.
- Combat phase values.

Avoid non-serializable state.

Prefer explicit types:
- `Enemy`
- `EnemyIntent`
- `SpellWallCharge`
- `CombatZoneState`

Likely state changes:
- Add `enemy: Enemy | null`.
- Add `hand: Rune[]`.
- Add `discardPile: Rune[]`.
- Add wall charge data.
- Keep `player.deck` as draw deck during encounter.
- Keep `fullDeck` as run blueprint.
- Keep `deckDraftState`.

Compatibility:
- Invalidate old saved solo runs.
- Do not migrate old runeforges/pattern lines/overload state.

## Action Changes

New or replacement actions:
- `startEncounter`
- `drawHand`
- `selectHandRune`
- `castRuneToWall`
- `endTurn`
- `resolveEnemyIntent`
- `completeEncounter`
- `handlePlayerDefeat`

Remove from core combat:
- `draftRune`
- `placeRunes`
- `placeRunesInFloor`
- `moveRunesToWall`
- `endRound`
- Auto-placement from runeforges/pattern lines

Implementation can temporarily keep old actions if needed for deck draft or compatibility, but combat UI must not use them.

## UI Changes

Replace center runeforge table with enemy panel:
- Enemy image.
- Enemy HP bar/text.
- Intent badge: Attack 5.

Replace tooltip-only hand behavior:
- The current tooltip card view becomes the actual hand display.
- Cards are clickable/selectable.
- Selected card highlights.

Update spell wall:
- Cells are clickable placement targets.
- Show expected rune type placeholders.
- Show charge pips/count for incomplete slots.
- Show completed rune when filled.
- Reject wrong type and completed slots.

Remove/hide from combat:
- Pattern lines.
- Overload button/overlay.
- RuneScore view.
- Runeforge table.

Keep:
- Health view.
- Armor display if currently separate or in Health view.
- Deck overlay, adapted to show draw/discard if useful.
- Settings.
- Arcane dust.

End Turn:
- Visible bottom-right.
- Enabled during player turn.
- Required even with empty hand.

## File-Level Implementation Targets

Primary files:
- `src/types/game.ts`: add enemy, intent, hand, discard, charge types.
- `src/state/stores/gameplayStore.ts`: replace combat transition logic.
- `src/utils/gameInitialization.ts`: initialize enemy encounter and combat zones.
- `src/utils/scoring.ts`: replace segment resolver with whole-wall cast resolver or add new resolver.
- `src/features/gameplay/components/SoloGameBoard.tsx`: replace combat layout.
- `src/features/gameplay/components/Player/ScoringWall.tsx`: make wall cells placement targets and charge display.
- `src/features/gameplay/components/Player/TooltipView.tsx`: evolve into hand view.

Likely new files:
- `src/features/gameplay/components/EnemyPanel.tsx`
- `src/features/gameplay/components/EndTurnButton.tsx`
- `src/utils/combatResolution.ts`

Likely removed or unused in combat:
- `src/features/gameplay/components/Center/RuneSelectionTable.tsx`
- `src/features/gameplay/components/Center/RuneforgeView.tsx`
- `src/features/gameplay/components/Player/PatternLines.tsx`
- `src/components/OverloadButton.tsx`
- `src/features/gameplay/components/OverloadOverlay.tsx`

Do not delete old files until references are verified.

## Acceptance Criteria

Start:
- New solo game starts with goblin enemy.
- Enemy HP equals current `targetScore`.
- Player hand has up to 6 runes.
- No runeforges, pattern lines, overload UI, or RuneScore win UI in combat.

Casting:
- Selecting a card and clicking matching wall slot plays the card.
- Wrong-type slot rejects placement.
- Completed slot rejects placement.
- Row N slot completes only after N matching plays.
- Non-final plays do not resolve effects.
- Final play resolves effect and fills slot.

Enemy:
- End Turn moves remaining hand to discard.
- Enemy attacks for 5.
- Armor absorbs before health.
- Health 0 causes defeat.
- Enemy HP 0 causes immediate victory.

Deck:
- Draw uses deck, then reshuffles discard only when needed.
- Partial hands are allowed.
- Empty hand does not auto-end.
- End Turn required.

Victory:
- Used encounter cards return to deck.
- Wall resets.
- Existing deck draft opens.

Persistence:
- Old saved solo runs are invalidated.
- New state remains serializable.

## Test Plan

Unit tests:
- Deal up to 6 cards.
- Draw from deck then reshuffle discard when needed.
- Partial hand when total available cards < 6.
- Charge row requirement by row index.
- Non-final charge does not resolve effect.
- Final charge resolves effect and fills wall cell.
- Damage reduces enemy HP.
- Healing caps at max health.
- Armor absorbs enemy attack.
- Synergy counts whole wall.
- Fragile checks whole wall absence.
- Channel effects disabled.
- Victory returns wall and spent charge runes to deck.

Store tests:
- Start solo run initializes enemy, hand, deck, discard, wall charge state.
- End Turn discards hand and resolves enemy attack.
- Lethal enemy attack sets defeat.
- Lethal player cast enters deck draft immediately.
- Old saved state is rejected or cleared.

UI tests/manual scenarios:
- Goblin image renders.
- Enemy intent visible.
- End Turn bottom-right.
- Hand cards selectable.
- Wall charge pips visible.
- No old combat UI visible.

## Open Questions

None for v1.

Future questions:
- Enemy variety and intent sequencing.
- Row/column completion passives.
- Replacement design for Channel effects.
- Reward UI terminology.
- Long-term wall persistence across encounters.
- Balancing enemy HP and deck size.
