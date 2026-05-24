# Copilot Instructions for Massive Spell: Arcane Arena

## Project Overview

**Massive Spell: Arcane Arena** is a single-player roguelite rune-casting game. Players draw rune cards, cast them into matching charged spell-wall slots, defeat an enemy encounter, then draft deck rewards before the next encounter.

Current scope:
- Solo combat only.
- One active route flow: main menu to solo.
- Core combat objects: hand, draw deck, discard pile, 6x6 spell wall, wall charges, enemy, player health/armor, active artefacts.
- Removed legacy systems must not be reintroduced: runeforges, pattern lines, overload, RuneScore, connected-segment scoring, round scoring, and Channel effects.

## Tech Stack

- React 19 + TypeScript strict mode.
- Vite 7.
- Zustand 5 for global state.
- Framer Motion 12 for animation.
- Tailwind CSS where practical; inline style objects are acceptable for existing local patterns.

## File Placement

- `src/components/`: reusable UI such as rune cells, buttons, overlays, settings, artefact rows.
- `src/features/gameplay/components/`: solo gameplay UI such as enemy panel, spell wall, hand, end turn, deck draft modal.
- `src/hooks/`: selector/action hooks and audio hooks.
- `src/state/stores/`: Zustand stores. Current read stores are run, board, combat, UI, artefact; `gameplayStore` owns actions.
- `src/systems/`: cross-store orchestration and analytics only.
- `src/types/`: serializable game and artefact types.
- `src/utils/`: pure game logic such as initialization, combat resolution, effect resolution, deck drafting, persistence, tooltip data.

## Current Combat Rules

- At encounter start, deal up to 6 runes into hand from the player deck.
- Player selects a hand rune and clicks a matching wall slot.
- A slot accepts only its expected rune type and only while unfilled.
- Row 1 needs 1 charge; row 2 needs 2; through row 6 needs 6.
- Non-final charges store spent runes and resolve no effects.
- Final charge fills the slot with the completing rune and resolves cast effects immediately.
- End Turn discards remaining hand, enemy attacks, then the next hand is drawn.
- Armor absorbs enemy attack before health.
- Enemy HP 0 opens deck draft immediately; enemy does not attack.
- Player health 0 ends the run and clears the saved solo state.

## Effect Model

- Runes store `rarity`, `castEffectRefs`, and `passiveEffectRefs`.
- Artefacts store passive effect refs only.
- Rarity must not live inside effect params.
- Effect resolution is registry-backed, deterministic, pure, and independent of React/Zustand.
- Cast effects currently allowed: Damage, Healing, Armor, Fortune, Synergy, ArmorSynergy, Fragile.
- Passive sources currently active: completed wall runes and selected artefacts.
- Do not add Channel or ChannelSynergy without a new PRD.

## State Rules

- Global game state must remain serializable.
- Do not store DOM refs, class instances, timers, closures, or non-serializable values in Zustand.
- Keep game rules in `src/utils/`, not React components.
- Store actions should orchestrate pure helpers and cross-store side effects explicitly.
- Old saves are invalidated by schema version; do not migrate legacy combat state.

## Coding Rules

- Match existing component/hook/store patterns before introducing new structure.
- Use named exports for components, hooks, and utilities unless a file already establishes a default export.
- Import types with `import type`.
- Prefer small focused changes.
- Add abstractions only when they remove real duplication or match existing architecture.
- Do not add new libraries without explicit approval.
- Do not add routes for future modes unless explicitly requested.

## Testing

Keep tests focused on current systems:
- Game initialization: enemy, hand, deck, discard, wall charges.
- Combat resolution: valid/invalid casts, charge completion, enemy damage, healing, armor, fortune, synergy, fragile.
- Turn flow: discard, draw, discard reshuffle, partial/empty hands.
- Victory: return hand/discard/wall/spent charge runes to deck and open draft offers.
- Deck drafting: offer generation, offer selection, artefact passives, rarity, disenchanting.
- Persistence: old schema invalidation and current schema load/save.
