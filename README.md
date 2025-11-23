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

### Player Setup
- Each player starts with **300 HP**
- Each player has a **personal deck of runes** (equal composition of the five rune types in Standard mode)
- Each player has **three personal Runeforges** used to draft runes at the start of each round
- Each player has **five Pattern Lines** (capacity 1–5)
- Each player has one **Floor Line** that accumulates overflow runes and applies penalties

### Drafting & Placement
At the start of each round:
- Populate **each player's 3 personal Runeforges** with random runes drawn from their deck
- Once all Runeforges are filled, drafting begins

Drafting:
- The first player to take a turn is chosen randomly. Players alternate for the rest of the game.
- On a player’s turn, they choose one of their Runeforges (or the shared pool if all Runeforges are empty)
- They must take **all runes of a single type** from the chosen source
- All remaining runes from that forge move into the **shared Center Pool**
- Drafted runes must be placed immediately

Pattern Lines:
- Players must place all drafted runes into **one Pattern Line**
- The chosen Pattern Line must either be empty or already contain the same rune type
- If there is not enough space, excess runes spill into the **Overflow**
- A full Pattern Line becomes eligible to transfer to the Spell Wall at the end of the round

Overflow:
- Overflow runes are placed here and generate **penalties**  
- Penalties reduce Focus by the number of runes in Overflow

### Scoring System
At the end of the round, scoring occurs in three steps:

#### 1. Completing Pattern Lines
- For each completed Pattern Line, all runes are combined into **one** and are added to the player’s **5×5 Spell Wall**
- Runes from incomplete Pattern Lines remain until completed in later rounds

#### 2. Applying Rune Effects
After all runes are added to the Wall:
- **Fire** increases Essence
- **Wind** cancels Floor penalties
- **Life** heals the player
- **Frost** and **Void** have unique effects during drafting. They do not impact end-of-round scoring.
  Effects resolve in this order: **Life → Fire → Wind**

#### 3. Calculating Damage
Definitions:
- **Essence** = total number of runes on the player’s Scoring Wall  
- **Focus** = size of the largest connected segment on the Wall. Two runes are connected if they share an edge.
- **Focus Penalty** = number of runes in Overflow minus the number of active **Wind** runes on the player's *Spel Wall**

```
Spellpower = Essence × max(1, Focus - Focus Penalty)
```

Damage & Healing:
- Life healing is applied before damage is dealt
- Spellpower is dealt as **damage to the opponent**
- If both players survive, a new round begins
- When both decks are exhausted, the game ends
- The player with the most HP remaining wins
- If both players are reduced to 0HP during a round, the game ends in a draw

### Game Modes
- **Classic**: Pure strategy without rune effects
- **Standard**: Includes rune special effects (see Rune Effects below)
- **PvE**: Play against AI opponent
- **Campaign** (planned): Progress through boss encounters
- **PvP** (planned): Online multiplayer

### Developer Mode
Access the Developer Mode from the main menu to preview and test Spellpower animations in isolation. Configure health, spellpower, healing, focus, essence, and animation speed to demo the visual behavior of the Spellpower component without playing a full game. Changes are non-destructive and do not affect game state.

## Rune Effects (Standard Mode)

### 💚 Life (Sustain)
**Effect**: Active Life runes heal the player for 10 HP per active Life rune each round  
**Strategy**: Life runes do not scale with other game mechanics, making them the simplest to use. Healing becomes less powerful in high spellpower games, and has the potential of being wasted if the player is already at full health.

### 🔥 Fire (Power)
**Effect**: Every active Fire rune adds +1 Essence  
**Strategy**: Scales with Focus. Fire runes will add little Spellpower in early turns, but can deal a lot of damage when Focus is high. Extra damage is always useful and has no potential of being wasted.

### 💨 Wind (Mitigation)
**Effect**: Wind runes placed on your scoring wall cancel floor penalties (completed Wind lines count instantly)  
**Strategy**: Scales with Essence. Wind runes have the highest potential for increasing Spellpower, because Essence is usually higher than Focus. Especially effective in the late game, when Overloading is more common. Can be wasted, if players do not need to Overload.

### ❄️ Frost (Control)
**Effect**: Freeze one of the opponent's pattern lines after placing Frost runes  
**Strategy**: Powerful board control tool to deny completing Pattern Lines for the opponent. Can completely ruin a turn, especially if the opponent has only one free Pattern Line or a single Runeforge remaining.

### 🌑 Void (Destruction)
**Effect**: Destroy any rune on the shared board (Runeforges or Center Pool) 
**Strategy**: Can be used offensively to deny completing Pattern Lines to the opponent or defensively to reduce your own Overload. This is a very flexible rune that requires a lot of planning.

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

##### Animation & Motion
- [ ] Animate runes traveling from the center to pattern or floor lines

##### Effects & Overlays
- [ ] Add effect indicators/tooltips on rune tokens
- [ ] Show active effects in game state (frozen runeforges, Life healing)
- [ ] Update `RulesOverlay` with rune effect explanations
- [ ] Add overlay buttons for rules, deck, and the game log

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
