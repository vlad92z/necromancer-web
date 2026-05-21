# Massive Spell: Arcane Arena

A single-player roguelite rune-drafting game where players build spell segments from elemental runes, chase the target RuneScore, and survive escalating arcane overload damage.

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
- Board size 6x6 with 6 unique rune types.
- 6 pattern lines of length 1-6.
- 5 runeforges, each dealt 4 runes from the player's deck.
- Rune types: Fire, Life, Wind, Frost, Void, Lightning.

### Select & Place (Actions)
- In the single-forge stage, choose one rune type from an enabled runeforge, then place the selected runes.
- After placement, the chosen runeforge is disabled and selected runes are removed from it.
- Once every runeforge has been selected once, all runeforges unlock into the global draft stage.
- In the global draft stage, choosing a rune type collects that type from all runeforges.
- Place all selected runes on a single pattern line that is empty or already holds that type. You cannot place a rune type in a row where it already sits on your wall.
- Overflow goes to the Overload pile, damaging the player immediately. This damage scales by game and round.

### Segment Damage (instant scoring)
- When a pattern line fills, its primary rune moves to the wall immediately and clears that line.
- The effects of every rune in the connected wall segment resolve one by one.
- Effects currently include damage, healing, armor, fortune, synergy, fragile, channel, channel synergy, and armor synergy.

### Round End & Run Progression
- A **Round** ends when all runeforges are empty, then runeforges are repopulated from the player's deck.
- Locked pattern lines unlock when the next round starts.
- If there are not enough runes to refill runeforges, the run ends in defeat.

### Game End
- A **Game** completes when the player reaches the target RuneScore.
- The player enters deck draft, chooses a runeforge of upgraded runes, and can disenchant unwanted runes for Arcane Dust.
- Deck draft offers can also heal, raise max health, or improve rune rarity depending on the selected runeforge.
- The next game has a higher target RuneScore and higher overload pressure.
- Health is not automatically restored to max between games unless a deck draft effect does so.

### Run End
- A **Run** ends when the player dies (0 HP).
- Game over also triggers when there are not enough runes to refill runeforges.

## Project Structure

```
src/
├── assets/                 # Rune art, artefacts, stats, sounds
├── components/             # Reusable UI (layout primitives, runes, stats)
├── features/gameplay/      # Gameboard, overlays, Solo UI
├── hooks/                  # Zustand selector/action hooks
├── routes/                 # MainMenu, Solo, and future feature screens
├── state/stores/           # Zustand stores (run, board, resolution, selection, gameplay, UI)
├── styles/                 # Design tokens and global styles
├── systems/                # Gameplay orchestration, analytics, scoring sequences
├── types/                  # Domain types (game, rune, controllers)
├── utils/                  # Pure logic (scoring, init, rune effects)
├── App.tsx
└── main.tsx
```

`App.tsx` currently wires `/`, `/solo`, `/campaign`, `/deck-builder`, `/rewards`, and `/matchmaking`, with unknown paths redirected to `/`.

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

- `gameplayStore.ts` remains the compatibility action engine.
- Read ownership is split across `runStore`, `boardStore`, `resolutionStore`, `selectionStore`, `uiStore`, and `artefactStore`.
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
