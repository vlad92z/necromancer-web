# Massive Spell: Arcane Arena

An Azul-inspired roguelite deck-building 1v1 duel game where players draft magical runes, build spell patterns, and compete in tactical duels.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 7** - dev server and build
- **Zustand** - state management
- **Framer Motion** - animations
- **React Router** - navigation
- **Inline CSS** - styling approach
- Mobile-first responsive design

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

## Core Game Mechanics

### Drafting & Placement
- Draft runes from 5 runeforges or center pool (Azul-style)
- Place runes in 5-tier pattern lines (capacity 1-5)
- Complete lines transfer to 5×5 scoring wall
- Overflow runes go to floor line (penalties)

### Scoring System
- **Essence** = total runes on wall
- **Focus** = largest connected segment size
- **Spellpower** = Essence × max(1, Focus - floor penalties)
- Spellpower dealt as damage to opponent
- Winner = least damage taken when decks exhaust

### Game Modes
- **Classic**: Pure strategy without rune effects
- **Standard**: Includes rune special effects (see Rune Effects below)
- **PvE**: Play against AI opponent
- **Campaign** (planned): Progress through boss encounters
- **PvP** (planned): Online multiplayer

## Rune Effects (Standard Mode)

### 🔥 Fire (Power)
**Effect**: Every active Fire rune adds +1 Essence  
**Strategy**: Maximize Fire runes for bonus spellpower  
**Status**: ✅ Implemented

### ❄️ Frost (Control)
**Effect**: Freeze one of the opponent's pattern lines after placing Frost runes  
**Strategy**: Lock the line they most need so they can't place there next turn  
**Status**: ✅ Implemented

### 💚 Life (Sustain)
**Effect**: Active Life runes heal the player for 10 HP per active Life rune each round  
**Strategy**: Collect Life runes for sustain and survivability  
**Status**: ✅ Implemented

### 🌑 Void (Destruction)
**Effect**: Destroy all runes in one runeforge when placing Void  
**Strategy**: Deny key runes or clear unwanted colors  
**Status**: ✅ Implemented

### 💨 Wind (Mitigation)
**Effect**: Wind runes held in pattern lines cancel floor penalties  
**Strategy**: Bank Wind runes in pattern lines as insurance before scoring  
**Status**: ✅ Implemented

## Project Structure

```
src/
├── assets/runes/       # SVG rune graphics
├── components/         # Reusable UI components
│   ├── layout/        # Layout primitives (Button, Card, Grid, Modal, Stack)
│   ├── RuneAnimation.tsx
│   ├── RuneCell.tsx
│   └── RuneToken.tsx
├── examples/          # Design system examples
├── features/gameplay/ # Gameplay components
│   └── components/    # GameBoard, PlayerView, OpponentView, overlays, etc.
├── hooks/             # Custom React hooks
├── routes/            # React Router routes (MainMenu, GameMatch, etc.)
├── state/stores/      # Zustand stores (gameplayStore, uiStore)
├── styles/            # Design tokens (colors, spacing, typography)
├── systems/           # Game systems (aiController)
├── types/             # TypeScript definitions
├── utils/             # Utility functions (scoring, AI, initialization)
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
- [ ] Add effect indicators/tooltips on rune tokens
- [ ] Show active effects in game state (frozen runeforges, Life healing)
- [ ] Add effect feedback animations when triggered
- [ ] Update `RulesOverlay` with rune effect explanations
- [ ] Active player indicator with pulsing dot and "Your Turn" label
- [ ] Dim opponent's board during other player's turn

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
- [ ] Create rule presets (Classic, Standard, Campaign boss-specific, Draft, PvP ranked)
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
