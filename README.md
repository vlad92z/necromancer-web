# Massive Spell: Arcane Arena

A single-player roguelite rune-casting game. Build a deck, complete runes on a spell wall, defeat encounters, and choose a rune pack after each victory.

## Tech Stack

- React 19 + TypeScript 5.9 (strict mode)
- Vite 7
- Zustand 5 for split global state
- Framer Motion 12 for animation
- React Router 7
- Tailwind CSS 4, integrated through `@tailwindcss/vite`
- Vitest 4

## Quick Start

### Prerequisites

- Node.js 20 (see `.node-version`)
- npm

### Install and run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
npx vitest run
npm run preview
```

## Gameplay Rules

### Player spell wall

- The player has a 6×6 spell wall built from six rune types: Fire, Life, Wind, Frost, Void, and Lightning.
- An encounter starts with up to six runes drawn into hand.
- Select a rune, then choose an empty compatible wall slot.
- A rune's rarity determines its charge requirement: Common completes immediately; Uncommon needs one extra charge; Rare needs two; Epic needs three.
- The first rune locks an incomplete slot to its rune type. Completing the slot places the staged rune and resolves its effects.
- Armor absorbs damage before health.

### Enemy turn

- Ending a turn discards the remaining hand, then resolves the enemy turn before the next hand is drawn.
- The enemy plays three 1-damage Life runes into random open slots on its own persistent 6×6 spellboard.
- Enemy runes resolve in dealt order; armor can absorb their damage.
- The run ends if player health reaches zero or the enemy spellboard fills.

### Deck cycle and victory

- The next hand is drawn up to six cards; the discard pile is shuffled into the deck only when necessary.
- Reducing enemy health to zero opens deck drafting immediately, before an enemy turn.
- Choose one of six rune-type packs. Each selected pack adds three runes to the deck; rarity odds improve with wins.
- The next encounter starts with a fresh player wall and enemy board. Enemy health and damage scale between encounters.

### Combat layout

- The metadata bar shows run and combat information.
- The combat area is ordered left-to-right: player panel, player spell wall, enemy spellboard, enemy panel.
- The hand tray spans the bottom of the view with the End Turn action.

## Project Structure

```
src/
├── assets/                 # Art, fonts, sounds, and stat icons
├── components/             # Reusable UI and overlays
├── features/gameplay/      # Combat board, panels, hand tray, deck draft
├── hooks/                  # Zustand selectors, actions, and audio hooks
├── routes/                 # Main menu and solo start screen
├── state/stores/           # Run, board, combat, gameplay, UI, artefact stores
├── styles/                 # Tokens and shared CSS theme primitives
├── systems/                # Cross-store orchestration and analytics
├── types/                  # Serializable game and artefact types
├── utils/                  # Pure combat, initialization, effects, persistence
├── App.tsx
└── main.tsx
```

`App.tsx` currently exposes `/` for the main menu and `/solo` for solo play. Unknown paths redirect to `/`.

## Styling and Pixel Theme

Tailwind 4 is configured through the Vite plugin. Global styles begin in `src/index.css`, which imports Tailwind and the shared pixel theme:

```css
@import 'tailwindcss';
@import './styles/pixel-theme.css';
```

`src/styles/pixel-theme.css` is the theme foundation for the pixel-art UI. It contains:

- CSS custom properties for the pixel palette, text, panels, focus state, and button variants.
- Reusable component classes: `.pixel-screen`, `.pixel-panel`, `.pixel-panel-inset`, `.pixel-message-panel`, and `.pixel-button`.
- Button variants: `.pixel-button--primary` and `.pixel-button--utility`.

Use these stable primitives for shared visual treatment, then add Tailwind utilities locally for each view's layout and responsive behavior:

```tsx
<main className="pixel-screen min-h-screen px-6 py-10">
  <section className="pixel-panel p-2">
    <div className="pixel-panel-inset px-6 py-10">
      <button className="pixel-button pixel-button--primary">Play</button>
    </div>
  </section>
</main>
```

The pixel font is defined in `src/index.css` as `.font-pixel`. Use it for display text and labels; do not duplicate the font declaration in individual screens. Keep game-specific layout styles in the component unless a primitive is needed by multiple views.

`src/styles/tokens.ts` remains available for existing TypeScript consumers. New pixel-theme colours and surfaces should normally be added to `pixel-theme.css` so CSS components and future screens share one source of truth.

## Keyboard and Overlay Behaviour

- Keyboard selection must drive real DOM focus as well as any visual active state. Arrow-key navigation should focus the newly selected control.
- Modal overlays own their keyboard handling while open. They must use dialog semantics, move focus inside on open, trap Tab navigation, and restore focus to the invoking control on close.
- Overlay visibility is global UI state, but DOM refs and previous-focus targets stay local to React components. Use explicit `openSettingsOverlay()` and `closeSettingsOverlay()` actions instead of toggling visibility when the intended state is known.
- Route transitions must close transient overlays so an overlay cannot appear unexpectedly on a later screen.

## Deployment (Cloudflare Pages)

### Automatic deployment

1. Connect the repository to Cloudflare Pages.
2. Configure:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js version: `20`

### Manual deployment

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=necromancer-web
```

Configuration files: `wrangler.toml`, `.node-version`, `public/_headers`, and `public/_redirects`.

## Analytics

Mixpanel is initialized in `src/main.tsx` through `src/utils/mixpanel.ts`. Set `VITE_MIXPANEL_TOKEN=skip` in `.env.local` to disable it locally. Use the exported helpers to record product events:

```ts
import { identify, trackEvent } from './utils/mixpanel'

trackEvent('game_started', { mode: 'solo' })
identify('player-1234')
```

## Architecture Notes

- `gameplayStore.ts` orchestrates encounter actions: start, cast, end turn, defeat, victory, deck draft, and next encounter.
- Read ownership is split across `runStore`, `boardStore`, `combatStore`, `uiStore`, and `artefactStore`.
- Global state must stay serializable. Pure game rules belong in `src/utils/`; cross-store side effects belong in `src/systems/`.
- `SoloGameBoard.tsx` composes the combat view. Dedicated components render player and enemy panels, both spellboards, tooltips, and the hand tray.

## Contributing

- Keep TypeScript strict; import types with `import type`.
- Prefer small focused changes and follow existing component, hook, and store patterns.
- Keep game rules out of React components and Zustand state serializable.
- Use Tailwind for local layout and the shared pixel theme for reusable visual primitives.
- Preserve keyboard focus and modal ownership when changing menus, buttons, or overlays.
- Read `Agents.md` for project-specific implementation and testing guidance.
