# Massive Spell: Arcane Arena

An Roguelite deck-building game where players draft magical runes, balancing increasing magical powers against increasingly difficult arcane overload.

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

## Game Modes
- **Solo**: Draft from your own runeforges and survive increasing overload while chasing a target Rune Power score.
- **Quick Play (WIP)**: Human bottom seat vs configurable AI/human top seat. Board size and health scale with rune count (3x3 to 6x6 walls; 2-4 runeforges per player).
- **Spectator**: Watch AI vs AI on any board size.

## Gameplay Rules (current build)

### Board & Setup
- Board sizes track rune variety: 3-6 rune types map to 3x3-6x6 walls with matching pattern lines (tiers 1-6).
- Each player has personal runeforges; quick play deals 2-4 per player based on board size, with health scaling from 25-150.
- The center pool only opens once you clear your own runeforges. 
- In quick play, opponent runeforges are not draftable. Players only get access to enemy runes once they have moved to the shared center pool.

### Draft & Place
- On your turn, take all runes of one type from a runeforge (leftovers drop to the center).
- Once all your Runeforges are empty - draft from the shared center pool.
- Place all drafted runes on a single pattern line that is empty or already holds that type. You cannot place a rune type in a row where it already sits on your wall.
- Overflow goes to the floor, damaging the player. This damage scales every round.

### Segment Damage (instant scoring)
- When a pattern line fills, the first rune jumps to your wall immediately and clears that line.
- The placement deals instant damage equal to the size of the connected segment it joins (orthogonal adjacency, minimum 1). Build dense clusters so every later placement hits harder.
- In Solo, that hit also increases your cumulative Rune Power score.

### Round End & Victory
- A round ends when all runeforges and the center are empt. 
- Resolve any end of round effects.
- Unlock empty pattern lines.
- Clears floor runes.
- Strain (overload multiplier) grows each round.
- Game over triggers at 0 HP or when a player lacks enough runes to refill runeforges. The survivor or higher-health player wins; Solo checks Rune Power against the target score when the deck runs dry.

## Rune Effects (Standard Mode)

Currently runes have no active or passive effects applied. These will be unlocked as deck building is implemented.

## Solo Mode
- **Objective**: Accumulate Rune Power (total segment damage from placements) to reach the target score before you run out of runes or health.
- **Drafting**: Only from your own runeforges until they are empty; then from the center. Opponent runeforges are disabled.
- **Overload & Strain**: Overflowing to the floor immediately deals overload damage equal to added penalty x current strain. Strain starts at 1x by default and multiplies each round (configurable 1.0-2.0x); Frost mitigation hooks reduce it.
- **Healing & Effects**: Life/Wind/Frost runes heal when they land on the wall. Healing amount, strain, and rune counts are adjustable on the Solo start screen.
- **Config Defaults**: 100 HP (cap 1000), 5 personal runeforges, 15 of each rune type, 5 healing per support rune, 200 Rune Power target, pattern-line locking enabled (cleared between rounds).
- **Victory/Defeat**: Victory when Rune Power meets the target before the deck runs dry; defeat at 0 HP or by failing to hit the target once no new round can start.

## Project Structure

```
src/
├── assets/                 # SVGs and rune art
├── components/             # Reusable UI (layout primitives, runes, stats)
├── features/gameplay/      # Gameboard, overlays, Solo UI
├── hooks/                  # Zustand selector/action hooks
├── routes/                 # MainMenu, GameMatch, Solo, Developer, etc.
├── state/stores/           # Zustand stores (gameplay, UI)
├── styles/                 # Design tokens and global styles
├── systems/aiController.ts # AI driver for automated turns
├── types/                  # Domain types (game, rune, controllers)
├── utils/                  # Pure logic (scoring, init, AI helpers, rune effects)
├── stories/                # Storybook-like design previews
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

Configuration files: `wrangler.toml`, `.node-version`, `public/_headers`, `public/_redirects`

---

## Prioritized TODOs

### 🔴 Priority 1: Core Gameplay Polish (Immediate)

#### UI/UX Enhancements

##### Animation & Motion
- [x] Animate runes traveling from the center to pattern or floor lines

##### Effects & Overlays
- [x] Add effect indicators/tooltips on rune tokens
- [x] Show active effects in game state (frozen runeforges, Life healing)
- [x] Update `RulesOverlay` with rune effect explanations
- [x] Add overlay buttons for rules, deck, and the game log

#### AI Improvements
- [ ] Make AI evaluate Fire runes for scoring potential
- [ ] Add strategic Life collection weighting for survivability
- [ ] AI should value Wind as floor insurance
- [ ] Support multiple AI difficulty levels
- [ ] Make AI behavior pluggable (different strategies for campaign bosses)

### 🟡 Priority 2: Architecture Refactoring (Before New Features)

#### State Management
- [ ] Split `gameplayStore.ts` into modular stores (gameplay, deck, campaign, player stats, matchmaking)
- [ ] Move all `setTimeout` calls from stores to components (`useEffect` hooks)
- [ ] Create `src/systems/turnManager.ts` for turn flow management
- [ ] Create `src/systems/effectResolver.ts` for unified effect handling
- [ ] Extract repeated hooks: `useIsAITurn()`, `useCurrentPlayer()`, `useOpponent()`, `useGamePhase()`

#### Persistence Layer
- [ ] Create `src/services/storage/localStorage.ts` - persistent client storage
- [ ] Create `src/services/storage/sessionStorage.ts` - temporary session storage
- [ ] Define data schemas (campaign progress, deck collections, player stats, settings)
- [ ] Add persistence middleware to stores (campaignStore, deckStore)
- [ ] Add storage versioning for schema migrations
- [ ] Create API service stubs for future PvP (matchmaking, campaign sync, decks, auth)

#### Configuration System
- [ ] Create `GameRules` interface for configurable game rules
- [ ] Update game initialization to accept and apply `GameRules`

#### Code Quality
- [ ] Add error boundaries (root, GameBoard, overlays)
- [ ] Create `validateGameState()` function with dev-mode validation
- [ ] Memoize expensive calculations (`getWallColumnForRune()`, wall power, AI moves)
- [ ] Extract utility functions (`getNextPlayerIndex()`, `isRuneforgeEmpty()`, etc.)
- [ ] Add error logging service

### 🟢 Priority 3: Meta-Progression Features

#### Campaign System
- [ ] Implement campaign map with boss progression
- [ ] Design 8-12 unique boss encounters with special modifiers
- [ ] Add boss-specific environments and animations
- [ ] Track campaign win streaks and unlocks
- [ ] Implement meta-progression (unlocks after losses)

#### Deck Building
- [ ] Implement deck drafting mode before matches
- [ ] Create deck builder UI with rune selection
- [ ] Add deck customization system
- [ ] Track deck collections and loadouts

#### Rewards & Progression
- [ ] Implement post-match rewards screen
- [ ] Add run summary and detailed statistics
- [ ] Create achievement system
- [ ] Add unlockable content

### 🔵 Priority 4: Online Features

#### Multiplayer
- [ ] Implement online PvP matchmaking
- [ ] Add ELO rating system
- [ ] Create lobby/waiting room
- [ ] Add friend system and private matches
- [ ] Implement spectator mode

### 🎨 Priority 5: Visual & Audio Polish

#### Art & Animation
- [ ] Set up asset management system for environments, characters, VFX, UI
- [ ] Create background environment system with parallax layers
- [ ] Design and implement character sprites (player + bosses)
- [ ] Add spell VFX system (Fire/Frost/Life/Void/Wind animations)
- [ ] Enhance runeforge visuals (3D containers, glow effects)
- [ ] Add juice & feedback (screen shake, camera zoom, celebrations)

#### Audio
- [ ] Create audio manager with volume controls
- [ ] Add sound effects (draft, placement, spell cast, damage, victory/defeat)
- [ ] Add background music (menu, battle, boss themes)
- [ ] Respect audio settings in persistence layer

### 🟣 Priority 6: Quality of Life

#### Gameplay
- [ ] Implement undo/redo for moves
- [ ] Add tutorial/onboarding for new players
- [ ] Save/load game state for resuming later
- [ ] Add difficulty settings for AI
- [ ] Implement end-game bonuses (row/column/type completion)

#### Technical
- [ ] Set up Vitest and React Testing Library
- [ ] Add unit tests for scoring logic (>90% coverage)
- [ ] Add component tests for critical flows
- [ ] Create test utilities for mock game states
- [ ] Set up CI/CD with test coverage reporting

---

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
