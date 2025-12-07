# Massive Spell: Arcane Arena

A Roguelite deck-building game where players draft magical runes to cast spells while trying to survive arcane overload damage

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 7** for dev/build
- **Zustand 5** for state
- **Framer Motion 12** for animation
- **React Router** for screens (main menu, solo, dev sandbox)
- **Inline style objects** for styling

## Quick Start

### Prerequisites
- Node.js 22+ (or Node.js 20.17.0+)
- npm

### Installation & Development

```bash
npm install
npm run dev  # Opens at http://localhost:5173
npm run build
npm run lint
```

## Gameplay Rules (current build)

### Board & Setup
- Board size 6x6 with 6 unique rune types.
- The center pool opens once your personal runeforges are empty, carrying leftover runes forward.

### Draft & Place (Actions)
- On your turn, take all runes of one type from a runeforge (leftovers drop to the center).
- Once all your Runeforges are empty - draft from the shared center pool.
- Place all drafted runes on a single pattern line that is empty or already holds that type. You cannot place a rune type in a row where it already sits on your wall.
- Overflow goes to the floor, damaging the player. This damage scales every round (strain).

### Segment Damage (instant scoring)
- When a pattern line fills, the first rune jumps to your wall immediately and clears that line.
- The placement deals instant damage (increase rune score) equal to the size of the connected segment it joins (orthogonal adjacency, minimum 1). Build dense clusters so every later placement hits harder.

### Round End & Run Progression
- A **Round** ends when all runeforges and the center are empty, then runeforges are repopulated from the player's deck.
- Resolve any end-of-round effects.
- Unlock empty pattern lines.
- Clears floor runes.
- Strain (overload multiplier) grows each round.

- A **Game** completes when the player reaches the target Rune Score and drafts new runes for their deck.

- A **Run** ends when the player dies (0 HP).
- Game over triggers at 0 HP or when there are not enough runes to refill runeforges; Solo checks Rune Power against the target score when the deck runs dry.

## Project Structure

```
src/
├── assets/                 # SVGs and rune art
├── components/             # Reusable UI (layout primitives, runes, stats)
├── features/gameplay/      # Gameboard, overlays, Solo UI
├── hooks/                  # Zustand selector/action hooks
├── routes/                 # MainMenu, Solo, Developer, etc.
├── state/stores/           # Zustand stores (gameplay, UI)
├── styles/                 # Design tokens and global styles
├── types/                  # Domain types (game, rune, controllers)
├── utils/                  # Pure logic (scoring, init, rune effects)
├── App.tsx
└── main.tsx
```

See `ROUTING_IMPLEMENTATION.md` for full technical details.

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

## Prioritized TODOs

#### State Management
- [ ] Split `gameplayStore.ts` into modular stores (gameplay, deck, campaign, player stats, matchmaking)

## Architecture Decision Records

See `Agents.md` for detailed AI agent workflows and coding standards.

See `ROUTING_IMPLEMENTATION.md` for routing architecture details.

See `REFACTORING_COMPLETE.md` for state management refactoring history.

---

## Design System

Centralized design tokens in `src/styles/tokens.ts` provide consistent colors, spacing, typography, shadows, and radii.

**Usage Example:**
```typescript
import { COLORS, SPACING, RADIUS } from '../styles/tokens';
import { Stack, Button, Card } from '../components/layout';

const style = {
  padding: `${SPACING.lg}px`,
  borderRadius: `${RADIUS.md}px`,
  backgroundColor: COLORS.ui.surface,
};

<Stack direction="vertical" spacing="md">
  <Card variant="elevated">
    <Button variant="primary">Click me</Button>
  </Card>
</Stack>
```

---

## Contributing

This project follows strict TypeScript practices:
- Strict mode enabled, no `any` types
- Explicit return types on exported functions
- Discriminated unions for rune types and effects
- Functional components with hooks only
- Inline CSS styling (no CSS-in-JS libraries, no Tailwind)

See `Agents.md` for AI-assisted development workflows and agent specializations.
