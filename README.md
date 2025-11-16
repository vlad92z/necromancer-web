# Massive Spell: Arcane Arena

An Azul-inspired roguelite deck-building 1v1 duel game.

## Development Progress

### ✅ Step 1: GameState/Types & Static Board (Completed)

**Implemented:**
- Core type definitions (`src/types/game.ts`):
  - `RuneType`: Fire, Frost, Poison, Void, Wind
  - `Rune`: Individual rune with type and effect
  - `Factory`: Container for runes to draft from
  - `PatternLine`: 5-tier lines (capacity 1-5) for building combos
  - `ScoringWall`: 5x5 grid for scoring
  - `Player`: Complete player state with pattern lines, wall, floor line, score
  - `GameState`: Main game state with 2 players, factories, center pool, turn tracking

- Game initialization (`src/utils/gameInitialization.ts`):
  - Empty wall creation
  - Pattern line setup (5 lines, tiers 1-5)
  - Mock player decks (20 runes per player)
  - Game state initialization with 5 factories (standard for 2-player Azul)

- UI Components:
  - `RuneToken`: Displays individual runes with color-coding and glyphs (🔥❄️☠️🌀💨)
  - `Factory`: Shows factory containers (currently empty)
  - `PatternLines`: Displays 5-tier pattern lines with progress
  - `ScoringWall`: Renders 5x5 scoring grid
  - `PlayerBoard`: Complete player board with pattern lines, wall, and floor line
  - `GameBoard`: Main game layout with factories, center pool, and both players

- Styling:
  - Tailwind CSS configured with custom rune colors
  - Dark theme optimized for game visibility
  - Responsive layout foundations

**Tech Stack:**
- React 19 + TypeScript (strict mode)
- Vite 7 for dev server and build
- Tailwind CSS for styling
- Zustand for state management
- Component-based architecture with feature organization

### ✅ Step 2: Factory Drafting Mechanics (Completed)

**Implemented:**
- Factory initialization with runes:
  - `fillFactories()`: Fills 5 factories with 4 runes each from combined player decks
  - Runes are randomly distributed (shuffled) across factories
  - Uses standard Azul 2-player configuration (5 factories, 4 runes each)

- Azul-style drafting logic (`src/state/gameStore.ts`):
  - `draftRune(factoryId, runeType)`: Select all runes of a type from a factory
    - Removes selected runes from factory
    - Moves remaining runes to center pool
    - Adds selected runes to player's hand
  - `draftFromCenter(runeType)`: Select all runes of a type from center pool
    - Works identically to factory drafting but from center

- Interactive UI components:
  - `Factory`: Click any rune to select all runes of that type
    - Visual feedback (hover effects, scale on hover)
    - Disabled state when runes already selected
    - Keyboard accessible (focus rings, ARIA labels)
  - Center Pool: Click runes to draft from center
    - Same interaction pattern as factories
  - Selected Runes Display: Shows currently selected runes
    - Appears below factories when runes are selected
    - Shows count and visual preview
    - Provides instruction for next step (place on pattern line)

- State management:
  - `selectedRunes` tracks currently held runes
  - Factories become disabled after selection (prevents multiple drafts)
  - Turn phase tracking ensures drafting only during draft phase

**How it works:**
1. Click any rune in a factory → all runes of that type are selected
2. Remaining runes in that factory move to center pool
3. Selected runes appear in a highlighted "Selected Runes" section
4. Factories and center become disabled until runes are placed
5. Ready for Step 3: placing runes on pattern lines

### ✅ Step 3: Pattern Line Placement (Completed)

**Implemented:**
- Pattern line placement logic (`src/state/gameStore.ts`):
  - `placeRunes(patternLineIndex)`: Place selected runes on a pattern line
    - Validates line can accept runes (empty or same type)
    - Validates line is not already full
    - Fills pattern line up to capacity
    - Overflow runes go to floor line (penalty area)
    - Clears selected runes after placement
    - Returns to draft phase for next turn

- Azul validation rules:
  - Pattern line must be empty OR contain same rune type
  - Pattern line must have available space (not full)
  - Only current player's pattern lines are clickable
  - Visual feedback shows valid vs invalid placement options

- Interactive UI (`PatternLines` component):
  - Click a pattern line to place selected runes
  - Valid lines highlighted with blue ring
  - Invalid lines dimmed (wrong type or full)
  - Hover effects on valid lines
  - Shows capacity progress (e.g., "2/3" filled)
  - Keyboard accessible with ARIA labels

- Overflow handling:
  - Excess runes beyond pattern line capacity go to floor line
  - Floor line accumulates penalty runes
  - Floor line respects max capacity (7 runes)

**How it works:**
1. After drafting runes, valid pattern lines show blue ring highlight
2. Click a valid pattern line → runes fill the line
3. If more runes than space, extras go to floor line (penalties)
4. Selected runes clear, back to draft phase
5. Invalid lines (wrong type or full) are dimmed and unclickable
6. Example: Select 4 Fire runes, click tier-3 line → 3 fit, 1 to floor

### ✅ Step 4: End-of-Round Scoring (Completed)

**Implemented:**
- End-of-round detection:
  - Automatically triggers when all factories and center pool are empty
  - Switches to 'scoring' phase before processing
  - Console logs scoring details for debugging

- Scoring utilities (`src/utils/scoring.ts`):
  - `calculateWallPower()`: Connected segment scoring system
    - Uses flood-fill algorithm to find all connected segments
    - Each segment's power = (number of runes)²
    - Runes are connected if they share an edge (not diagonal)
    - Example: 7 connected runes = 49 points, 1 isolated rune = 1 point
  - `calculateFloorPenalty()`: Standard Azul penalties
    - Progressive penalties: -1, -2, -4, -6, -8, -11, -14
    - Score cannot go below 0
  - `getWallColumnForRune()`: Determines wall placement position
    - Each rune type has fixed column per row (rotated Azul pattern)
    - Prevents duplicate types in same row/column

- Round scoring logic (`gameStore.endRound`):
  - Process each player's completed pattern lines:
    - Line must be full (count === tier)
    - Move one rune to scoring wall at correct position
    - Clear completed pattern line for next round
  - Calculate total wall power from all connected segments
  - Apply floor line penalties to both players
  - Add wall power + penalties to existing score (accumulative)
  - Clear floor lines after penalty application
  - Refill factories from player decks (2 runes per player per factory)
  - Increment round counter
  - Return to draft phase

- Wall placement rules:
  - Pattern line index = wall row (line 1 → row 0, line 5 → row 4)
  - Column determined by rune type and row (Azul rotation pattern)
  - Empty cells show faded grayscale preview of expected rune type
  - Example: Fire in row 0 → column 0, Fire in row 1 → column 1

**How it works:**
1. Players draft and place runes until all factories empty
2. Last placement triggers automatic end-of-round scoring
3. Completed pattern lines (full) move to wall:
   - One rune placed at calculated position
   - Pattern line clears for next round
4. Total wall power calculated from connected segments:
   - Each connected segment contributes (size)² points
   - Example: 3 connected + 2 connected = 9 + 4 = 13 points
5. Floor line penalties applied (can't go below 0)
6. Round score added to existing score from previous rounds
7. Factories refill with 2 runes from each player's deck per factory
8. New round begins

### ✅ Additional Features (Completed)

**Turn System:**
- Players alternate turns after each action (draft + placement)
- Active player highlighted with faint blue border
- Active indicator with pulsing dot and "Your Turn" label
- Opponent's board dimmed and non-interactive during other player's turn

**Deck Management:**
- Each player starts with 20 runes (4 of each type)
- Factory filling uses 2 runes from each player's deck per factory
- Deck counts displayed on player boards
- Game ends when a player has fewer than 10 runes remaining

**Game Over Condition:**
- Checked at end of each round before refilling factories
- Requires minimum 10 runes per player (2 per factory × 5 factories)
- Game over modal displays:
  - Final scores for both players
  - Remaining rune counts
  - Winner announcement (or tie)
  - "New Game" button to restart

**Wall Validation:**
- Prevents placing runes if that rune type already exists in the wall row
- Validation in both backend (placeRunes) and frontend (isLineValid)
- Invalid pattern lines are dimmed and unclickable

**Floor Line Direct Placement:**
- Option to place selected runes directly in floor line (strategic discard)
- Floor line shows red ring when runes are selected
- Clickable with visual feedback
- Useful for avoiding bad placements or blocking opponent

**UI Improvements:**
- Inline styles used instead of Tailwind for reliability (sizing, colors)
- Rune glyphs with color coding: 🔥(Fire) ❄️(Frost) ☠️(Poison) 🌀(Void) 💨(Wind)
- Wall cells show faded grayscale preview of expected rune type when empty
- Player boards show deck count and score
- Active player board has subtle blue border glow
- Horizontal factory layout for better visibility
- Vertical player arrangement (Player 1 top, factories middle, Player 2 bottom)

## Getting Started

### Prerequisites
- Node.js 22+ (or Node.js 20.17.0+)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the game.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GameBoard.tsx
│   ├── PatternLines.tsx
│   ├── PlayerBoard.tsx
│   ├── RuneToken.tsx
│   └── ScoringWall.tsx
├── features/           # Feature-based organization
│   └── gameplay/       # Gameplay-specific features
│       └── components/ # Factory, GameBoard, PatternLines, PlayerBoard, ScoringWall
├── hooks/              # Custom React hooks
│   ├── useGameActions.ts  # Game action hooks
│   └── useGameState.ts    # State selector hooks
├── state/              # Global state management
│   └── gameStore.ts    # Zustand store with game state and actions
├── types/              # TypeScript type definitions
│   └── game.ts
├── utils/              # Utility functions
│   ├── gameInitialization.ts
│   └── runeHelpers.ts  # Rune display utilities
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

**Note:** The project is in transition - gameplay components exist in both `components/` and `features/gameplay/components/`. The app currently uses the `features/` versions. Future work will complete the migration by removing duplicates from `components/`.


## Next Steps

### Architecture Improvements (Completed ✅)
- [x] Extract duplicated rune helper functions to utils
- [x] Set up Zustand for state management
- [x] Reorganize components into features structure
- [x] Add custom hooks for game actions and state selectors
- [x] Standardize Tailwind formatting across components

### Gameplay Implementation (Completed ✅)
- [x] Step 2: Make factories/runes selectable, implement Azul factory taking
- [x] Step 3: Allow placing picked runes onto pattern lines
- [x] Step 4: End-of-round detection and scoring with connected segment power calculation
- [x] Step 5: Turn alternation system
- [x] Step 6: Wall validation (prevent duplicate rune types in row)
- [x] Step 7: Floor line direct placement option
- [x] Step 8: Deck management with 2:2 split per factory
- [x] Step 9: Game over condition and modal
- [x] Step 10: Active player highlighting and UI polish

### Future Enhancements
- [ ] Rune effects system (currently all runes have effect: 'None')
- [ ] Boss selection and special modifiers
- [ ] Meta-progression (unlocks after losses)
- [ ] Deck customization UI
- [ ] Run summary and statistics
- [ ] Matchmaking (currently local 2-player)
- [ ] Sound effects and animations
- [ ] Mobile/touch optimization
- [ ] Undo/redo for moves
- [ ] End-game bonuses (row/column/type completion)

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
