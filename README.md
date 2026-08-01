# Massive Spell: Arcane Arena

A single-player roguelite rune-casting game. Travel through Greenwood, build a rune deck, fill a spell wall, defeat encounters, and choose rewards after each non-boss victory.

## Tech stack

- React 19 + TypeScript 5.9 (strict mode)
- Vite 7
- Zustand 5 for serializable global state
- Framer Motion 12
- React Router 7
- Tailwind CSS 4 through `@tailwindcss/vite`
- Vitest 4

## Quick start

Prerequisites: Node.js 20 (see `.node-version`) and npm.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
npx vitest run
npm run preview
```

There is intentionally no `npm run test` script; run Vitest with `npx vitest run`.

## Gameplay

### Adventure map

- A solo run begins in Greenwood. The map reveals forest tiles and connected roads as the player travels.
- Locations can contain Goblin combats, healing shrines, or the Golem Lord boss. Cleared encounters remain traversable.
- The map, player position, deck, health, and encounter state are persisted for **Continue Run**. Saved combat state is versioned; incompatible older saves are discarded.

### Player turn

- The player starts with a 12-card deck and draws up to **five** runes at an encounter start and after each completed turn.
- The spell wall is a neutral 6×6 grid. Select a rune in hand, then place it in any empty slot; every rarity resolves immediately.
- Casting spends the card's mana cost. Players start each turn with 7 mana; mana refreshes to full after the enemy turn.
- Filled wall runes provide their passive effects while they remain on the wall. Cards may deal damage, grant armor, heal, draw or return cards, and interact with neighbouring or matching runes.
- Consumption removes another rune from its owner's wall before resolving an optional payload; Destroy removes an opposing wall rune. Manual effects pause for a valid board target or Skip, while random effects and all enemy choices resolve automatically.
- Armor absorbs incoming damage before health. A player is defeated at 0 health.

### Enemy turn and victory

- **End Turn** resolves the player's end-turn effects, discards the remaining hand, resolves the enemy turn, then draws the next hand and resolves player start-turn effects.
- Enemies play their turn cards into a persistent 6×6 enemy spellboard. Their cards resolve in order and can damage the player, grant enemy armor, or apply other effects.
- The enemy wins if its board fills; the player also loses at 0 health.
- Reducing enemy health to 0, or filling the player wall, wins the encounter immediately—before an enemy turn.
- A normal victory awards Arcane Dust and three single-rune offers from that enemy's reward pool. Select at most one, then continue to the map. Boss victory ends the run.

### Current encounters

- Goblin: 20 health; repeatedly plays three Throw Rocks and Hide. Victories offer Goblin reward cards.
- Golem Lord: 50-health boss with a cycling turn sequence of Barricades, Hurl Rocks, and Avalanche; Avalanche destroys one random player-wall rune.

### Arena catalogue

- Arena is a read-only enemy catalogue available from the main menu.
- Every catalogue enemy is shown with its maximum health. Selecting one shows each row of its repeating turn cycle and every card in its possible loot pool.
- Arena does not start combat or change run state, rewards, or saved progress.

## Combat layout

The combat view is composed in `SoloGameBoard.tsx`: player panel, player spell wall, enemy spellboard, enemy panel, then the hand tray and End Turn control. The metadata bar tracks run and combat state. Hovering a filled wall rune shows its original card preview near its respective health panel.

## Project structure

```
src/
├── assets/                 # Art, fonts, sounds, and stat icons
├── components/             # Reusable UI and overlays
├── features/               # Arena catalogue plus map, combat, hand, and reward UI
├── hooks/                  # Zustand selectors/actions and audio hooks
├── routes/                 # Main menu, Adventure, and Arena entry screens
├── state/stores/           # Run, map, board, combat, UI, artefact, gameplay stores
├── styles/                 # Shared pixel theme and TypeScript style tokens
├── systems/                # Cross-store orchestration and analytics
├── types/                  # Serializable game and artefact types
├── utils/                  # Pure rules, catalogues, effects, persistence, map logic
├── App.tsx
└── main.tsx
```

`App.tsx` exposes `/` for the main menu, `/solo` for Adventure, and `/arena` for the read-only enemy catalogue. Unknown routes redirect to `/`.

## Architecture

- `gameplayStore.ts` orchestrates travel, encounter setup, casting, turns, rewards, and persistence notifications.
- Read state is split across `runStore`, `mapStore`, `boardStore`, `combatStore`, `uiStore`, and `artefactStore`; `gameplayState.ts` maintains the combined serializable snapshot.
- Game rules are pure utilities in `src/utils/`. The registry-backed effect resolver is deterministic and independent of React and Zustand.
- Runes hold rarity, card/token artwork, cast/passive refs, and optional typed Consumption/Destroy wrappers. Pending target resolution remains serializable.
- `cardCatalog.ts`, `monsterCatalog.ts`, and `regionCatalog.ts` are the canonical gameplay catalogues.
- Keep global state serializable: no DOM refs, timers, class instances, or closures in Zustand.

## Styling and accessibility

`src/index.css` imports Tailwind and the shared pixel theme:

```css
@import 'tailwindcss';
@import './styles/pixel-theme.css';
```

Use `src/styles/pixel-theme.css` for shared pixel palette, panels, buttons, and focus treatment; use Tailwind utilities for local layout. `src/index.css` defines `.font-pixel` for pixel display text.

Keyboard selection must update real DOM focus as well as visible active state. Modal overlays own keyboard input while open: dialog semantics, initial focus, Tab trapping, Escape/close behaviour, and focus restoration to the invoking control. Keep DOM refs local to components and close transient overlays before navigation.

## Deployment (Cloudflare Pages)

Connect the repository to Cloudflare Pages with:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 20

For a manual deployment:

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=necromancer-web
```

Deployment configuration is in `wrangler.toml`, `.node-version`, `public/_headers`, and `public/_redirects`.

## Analytics

Mixpanel initializes from `src/main.tsx` through `src/utils/mixpanel.ts`. Set `VITE_MIXPANEL_TOKEN=skip` in `.env.local` to disable it locally. Use the exported helpers for product events:

```ts
import { identify, trackEvent } from './utils/mixpanel'

trackEvent('game_started', { mode: 'solo' })
identify('player-1234')
```

## Contributing

- Keep TypeScript strict and import types with `import type`.
- Prefer focused changes that follow existing component, hook, store, and utility patterns.
- Keep rules out of React components, preserve serializable state, and retain the shared pixel UI primitives.
- Preserve DOM-focus and modal-ownership behaviour when changing interactive UI.
- Add focused tests for changes to initialization, combat, turns, rewards, map flow, or persistence.
- Read `AGENTS.md` for the full project guidance.
