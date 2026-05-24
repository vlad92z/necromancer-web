# Massive Spell: Arcane Arena

A single-player roguelite rune-drafting game where players cast elemental runes into a spell wall, defeat enemies, and draft deck rewards between encounters.

## Tech Stack

- **React 19.2** + **TypeScript 5.9** (strict mode)
- **Vite 7.2** for dev/build
- **Zustand 5** for split global state stores
- **Framer Motion 12** for animation
- **React Router 7** for app screens
- **Tailwind CSS 3** for styling
- **Vitest 4** for tests

## Quick Start

### Prerequisites
- Node.js 20 (see `.node-version`)
- npm

### Installation & Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
npx vitest run
npm run preview
```

## Gameplay Rules (current build)

### Board & Setup
- Spell wall size is 6x6 with 6 unique rune types.
- The player draws a hand of up to 6 runes from the draw deck.
- Rune types: Fire, Life, Wind, Frost, Void, Lightning.
- Each enemy shows HP and an intent. The current basic intent is Attack 5.

### Cast Runes
- Select a rune from hand, then click a matching empty wall slot.
- Wall rows require increasing charges: row 1 completes with 1 rune, row 2 with 2 runes, and so on.
- Incomplete charged slots show progress like `1/3`.
- Invalid casts leave the selected card active.
- Final charges place the rune on the wall and resolve its effects.

### Rune Effects
- Damage lowers enemy HP.
- Healing restores player health up to max health.
- Armor absorbs enemy attacks before health.
- Fortune grants Arcane Dust.
- Synergy and ArmorSynergy count matching rune types across the completed wall.
- Fragile checks for absence across the completed wall.

### Turn End & Deck Cycle
- End Turn discards the remaining hand.
- The enemy attacks before the next hand is drawn.
- The player draws up to 6 cards from the draw deck.
- If the draw deck runs short, the discard pile is shuffled only when needed.

### Victory & Run End
- An encounter is won when the enemy reaches 0 HP.
- Victory immediately opens deck draft rewards.
- Deck draft rewards can add upgraded runes, heal, raise max health, or improve rune rarity.
- Starting the next encounter creates a fresh wall, hand, discard pile, and stronger enemy.
- A **Run** ends when the player reaches 0 HP.

## Project Structure

```
src/
├── assets/                 # Rune art, artefacts, stats, sounds
├── components/             # Reusable UI (layout primitives, runes, stats)
├── features/gameplay/      # Gameboard, overlays, Solo UI
├── hooks/                  # Zustand selector/action hooks
├── routes/                 # MainMenu and Solo screens
├── state/stores/           # Zustand stores (run, board, combat, gameplay, UI)
├── styles/                 # Design tokens and global styles
├── systems/                # Gameplay orchestration and analytics
├── types/                  # Domain types (game, rune, controllers)
├── utils/                  # Pure logic (scoring, init, rune effects)
├── App.tsx
└── main.tsx
```

`App.tsx` wires `/` and `/solo`, with unknown paths redirected to `/`.

## Deployment (Cloudflare Pages)

### Automatic Deployment
1. Connect repository to Cloudflare Pages
2. Configure build settings:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js version: `20`

### Manual Deployment
```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=necromancer-web
```

## Mixpanel (Analytics)

To avoid committing sensitive tokens, Mixpanel is configured to read the token from an environment variable when the app starts.

- Create a local environment file at the project root named `.env.local` (this file is ignored by Git by default).
- Add your Mixpanel token using the `VITE_` prefix so Vite exposes it to the app:

```env
# .env.local (DO NOT COMMIT)
VITE_MIXPANEL_TOKEN=your_mixpanel_project_token_here
```

- The app reads `import.meta.env.VITE_MIXPANEL_TOKEN` and will skip initialization if the value is missing.
- Use the helper in `src/utils/mixpanel.ts` to track events:

```ts
import { trackEvent, identify } from './utils/mixpanel'

trackEvent('game_started', { mode: 'solo' })
identify('player-1234')
```

If you prefer injecting the token programmatically, `initMixpanel(token)` accepts a token argument.

Configuration files: `wrangler.toml`, `.node-version`, `public/_headers`, `public/_redirects`

---

## Architecture Notes

- `gameplayStore.ts` owns current encounter actions only: start, cast, end turn, defeat, victory, deck draft, and next encounter.
- Read ownership is split across `runStore`, `boardStore`, `combatStore`, `uiStore`, and `artefactStore`.
- Pure game rules live in `src/utils/`; side-effect orchestration lives in `src/systems/`.
- See `Agents.md` for detailed AI agent workflows and coding standards.

---

## Design System

Centralized design tokens in `src/styles/tokens.ts` provide consistent colors, spacing, typography, shadows, and radii.

**Usage Example:**
```tsx
import { COLORS, SPACING, RADIUS } from '../styles/tokens';
import { Button, Grid } from '../components/layout';

const style = {
  padding: `${SPACING.lg}px`,
  borderRadius: `${RADIUS.md}px`,
  backgroundColor: COLORS.ui.surface,
};

<Grid columns={2} gap="md" style={style}>
  <Button variant="primary">Start</Button>
  <Button variant="secondary">Settings</Button>
</Grid>
```

---

## Contributing

This project follows strict TypeScript practices:
- Strict mode enabled, no `any` types
- Explicit return types on exported functions
- Discriminated unions for rune types and effects
- Functional components with hooks only
- Tailwind where possible, inline CSS as a fallback

See `Agents.md` for AI-assisted development workflows and agent specializations.
