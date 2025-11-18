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
  - `RuneToken`: Displays individual runes with color-coding and SVG graphics
  - `RuneCell`: Enhanced rune display component with animation support
  - `Factory`: Shows factory containers with interactive selection
  - `PatternLines`: Displays 5-tier pattern lines with progress
  - `ScoringWall`: Renders 5x5 scoring grid
  - `PlayerBoard`: Complete player board with pattern lines, wall, and floor line
  - `GameBoard`: Main game layout with factories, center pool, and both players
  - `RuneAnimation`: Handles smooth rune movement animations
  - `RunePower`: Displays rune power/effect information

- Styling:
  - Inline CSS with custom rune colors
  - Dark theme optimized for game visibility
  - Fully responsive design with mobile-first approach
  - Touch-optimized interactions for mobile devices

**Tech Stack:**
- React 19 + TypeScript (strict mode)
- Vite 7 for dev server and build
- Inline CSS for styling
- Zustand for state management
- Framer Motion for animations
- Component-based architecture with feature organization
- Mobile-first responsive design

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
  - `calculateWallPower(wall, floorPenaltyCount)`: Simplified spellpower calculation
    - **Essence** = total number of active runes on the wall
    - **Focus** = size of the largest connected segment
    - **Spellpower** = Essence × max(1, Focus - floorPenaltyCount)
    - Floor penalties reduce Focus only (not a separate deduction)
    - Runes are connected if they share an edge (not diagonal)
    - Example with 0 floor penalties: 12 total runes, 5 largest segment = 12 × 5 = 60 spellpower
    - Example with 2 floor penalties: 12 total runes, 5 largest segment = 12 × 3 = 36 spellpower
  - `getWallColumnForRune()`: Determines wall placement position
    - Each rune type has fixed column per row (rotated Azul pattern)
    - Prevents duplicate types in same row/column

- Round scoring logic (`gameStore.endRound`):
  - Process each player's completed pattern lines:
    - Line must be full (count === tier)
    - Move one rune to scoring wall at correct position
    - Clear completed pattern line for next round
  - Calculate spellpower using simplified formula
    - Essence = total active runes on wall
    - Focus = largest connected segment size
    - Floor penalties reduce Focus (minimum 1)
  - Add wall power to existing score (accumulative)
  - Clear floor lines after scoring
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
4. Spellpower calculated using simplified formula:
   - Essence (total runes) × Focus (largest segment size)
   - Floor penalties reduce Focus: max(1, largestSegment - floorPenaltyCount)
   - Example with 0 floor: 12 runes, 5 largest = 12 × 5 = 60 spellpower
   - Example with 2 floor: 12 runes, 5 largest = 12 × 3 = 36 spellpower
5. Each player's spellpower is dealt as damage to their opponent
6. Damage accumulates over all rounds
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
- **Winner**: Player who took the least damage (each round's spellpower becomes damage to opponent)
- Game over modal displays on the game board:
  - Final board state remains visible behind modal
  - Damage taken for each player (opponent's accumulated spellpower)
  - Victory/Defeat announcement (or draw if damage is equal)
  - "Return to Start" button to go back to start screen
  - Players can review final board configuration before proceeding

**Wall Validation:**
- Prevents placing runes if that rune type already exists in the wall row
- Validation in both backend (placeRunes) and frontend (isLineValid)
- Invalid pattern lines are dimmed and unclickable

**Floor Line Direct Placement:**
- Option to place selected runes directly in floor line (strategic discard)
- Floor line shows red ring when runes are selected
- Clickable with visual feedback
- Useful for avoiding bad placements or blocking opponent

**Game Mode:**
- PvE only: Play against AI opponent
  - AI makes random legal moves (draft + placement)
  - 800ms delay between AI actions for visibility
  - AI completes full turns automatically
  - Start Game Screen: Welcome screen before gameplay begins
  - Game Over returns to Start Screen instead of auto-restart

**Start Game Screen:**
- Displays before gameplay begins
- Shows game title and brief description
- Game mode selection toggle (Classic vs Standard)
- "Start Game" button to initialize gameplay
- Responsive design matching game theme
- Game Over modal returns to this screen instead of immediately restarting

**Game Modes:**
- **Classic Mode**: Play without rune modifiers
  - Pure strategic gameplay focused on pattern building and wall connections
  - Runes function identically with no special effects
  - Simplified scoring: Essence × Focus
  - Recommended for learning the core mechanics
- **Standard Mode**: Play with rune modifiers (coming soon)
  - Each rune type has unique tactical effects
  - Fire adds bonus essence, Frost freezes factories, Poison reduces opponent focus
  - Void destroys factory runes, Wind mitigates floor penalties
  - Advanced gameplay with deeper strategic decisions
  - See "Rune Effects System" section below for detailed mechanics

**Selection & Cancellation:**
- Click rune selection tracks source (factory or center)
- Cancel selection by clicking anywhere on player boards (outside pattern/floor lines)
- Canceled runes return to original factory (not center)
- Selected runes moved to center only return to center

**UI Improvements:**
- SVG rune graphics from `src/assets/runes/` (fire, frost, poison, void, wind)
- Inline styles used for consistent styling (sizing, colors, layouts)
- Wall cells show faded grayscale preview of expected rune type when empty
- Player boards show deck count and score
- Active player board has subtle blue border glow
- Horizontal factory layout for better visibility
- Vertical player arrangement (Player 1 top, factories middle, Player 2 bottom)
- Game over modal displays on game board (final state visible behind it)
- Framer Motion animations for runes appearing in pattern lines, scoring wall, and floor line (spring animation)
- Animated round-end scoring sequence with timing delays:
  - Moving completed pattern lines to wall (2 second delay)
  - Calculating scores from wall connections (2 second delay)
  - Clearing floor line penalties (1.5 second delay)
  - Visual feedback through rune animations showing each change

**Mobile & Touch Optimizations:**
- `FactoryOverlay`: Enlarged modal view for selecting runes from factories/center on mobile
  - Groups runes by type for easier selection
  - Touch-friendly tap targets
  - Backdrop click to close
- `DeckOverlay`: Full-screen view of player's remaining deck
  - Organized grid layout grouped by rune type
  - Shows rune counts and visual previews
  - Accessible via deck count button on player boards
- Responsive breakpoints optimized for mobile (375px+), tablet (768px+), and desktop
- Touch-optimized button sizes and spacing
- Mobile-friendly overlay patterns for all complex selections

**Information Overlays:**
- `RulesOverlay`: Comprehensive game rules and instructions
  - Explains drafting mechanics, pattern line placement, scoring system
  - Floor line penalties and wall power calculation details
  - Accessible via "Rules" button on game board
- `GameLogOverlay`: Round-by-round history and statistics
  - Displays each round's scoring breakdown
  - Shows essence, focus, and spellpower (damage dealt) per round
  - Tracks both player and opponent performance over time
  - Accessible via "History" button on game board
- `SelectedRunesOverlay`: In-game selection feedback
  - Displays currently selected runes above factories
  - Shows count and provides placement instructions
  - Cancel option to return runes to source

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

## Deployment

### Cloudflare Pages

This project is configured for deployment to Cloudflare Pages.

#### Prerequisites
- Cloudflare account
- GitHub repository connected to Cloudflare Pages
- Or Wrangler CLI for direct deployments

#### Automatic Deployment (Recommended)

1. **Connect your repository to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project" → "Connect to Git"
   - Select your repository

2. **Configure build settings:**
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `20` (set via `.node-version` file)

3. **Deploy:**
   - Cloudflare will automatically deploy on every push to your main branch
   - Preview deployments are created for pull requests

#### Manual Deployment via Wrangler

Install Wrangler CLI:
```bash
npm install -g wrangler
```

Login to Cloudflare:
```bash
wrangler login
```

Build and deploy:
```bash
npm run build
wrangler pages deploy dist --project-name=necromancer-web
```

#### Configuration Files

- `wrangler.toml`: Cloudflare Pages configuration
- `.node-version`: Specifies Node.js version (20)
- `public/_headers`: HTTP headers for security and caching
- `public/_redirects`: SPA routing configuration (all routes → index.html)

#### Custom Domain

To add a custom domain:
1. Go to your Cloudflare Pages project
2. Navigate to "Custom domains"
3. Add your domain and follow DNS configuration steps

## Project Structure

```
src/
├── assets/
│   └── runes/          # SVG rune graphics (fire, frost, poison, void, wind)
├── components/          # Reusable UI components
│   ├── RuneAnimation.tsx  # Rune movement animations
│   ├── RuneCell.tsx       # Enhanced rune display with animation support
│   └── RuneToken.tsx      # Basic rune display with SVG assets
├── features/           # Feature-based organization
│   └── gameplay/       # Gameplay-specific features
│       └── components/ # Gameplay UI components
│           ├── CenterPool.tsx          # Center pool display and interaction
│           ├── DeckOverlay.tsx         # Full-screen deck viewer (mobile-optimized)
│           ├── FactoriesAndCenter.tsx  # Combined factories and center layout
│           ├── Factory.tsx             # Individual factory display
│           ├── FactoryOverlay.tsx      # Enlarged factory/center selector (mobile)
│           ├── FloorLine.tsx           # Floor line (penalty area) display
│           ├── GameBoard.tsx           # Main game orchestrator
│           ├── GameLogOverlay.tsx      # Round history and statistics
│           ├── GameOverModal.tsx       # End-game modal with results
│           ├── OpponentView.tsx        # AI opponent's board (read-only)
│           ├── PatternLines.tsx        # 5-tier pattern lines display
│           ├── PlayerBoard.tsx         # Shared board rendering logic
│           ├── PlayerView.tsx          # Human player's board (interactive)
│           ├── RulesOverlay.tsx        # Game rules explanation
│           ├── RunePower.tsx           # Rune power/effect display
│           ├── ScoringWall.tsx         # 5x5 scoring grid
│           ├── SelectedRunesOverlay.tsx # Selected runes feedback display
│           └── WallCell.tsx            # Individual wall cell component
├── hooks/              # Custom React hooks
│   ├── useGameActions.ts  # Game action hooks (draft, place, etc.)
│   └── useGameState.ts    # State selector hooks
├── state/              # Global state management
│   └── gameStore.ts    # Zustand store with game state and actions
├── types/              # TypeScript type definitions
│   └── game.ts         # Core types: Rune, Factory, Player, GameState, PlayerType
├── utils/              # Utility functions
│   ├── aiPlayer.ts     # AI opponent logic with strategic decision-making
│   ├── gameInitialization.ts  # Game setup and factory filling
│   ├── runeHelpers.ts  # Rune display utilities
│   └── scoring.ts      # Wall power calculation with floor penalties
├── App.tsx             # Root component, game lifecycle & AI turn triggering
└── main.tsx            # Entry point
```


## Next Steps

### Architecture Improvements (Completed ✅)
- [x] Extract duplicated rune helper functions to utils
- [x] Set up Zustand for state management
- [x] Reorganize components into features structure
- [x] Add custom hooks for game actions and state selectors
- [x] Implement inline CSS styling for consistency
- [x] Component-based architecture with clear separation of concerns
- [x] Separate view components for player and opponent

### Gameplay Implementation (Completed ✅)
- [x] Step 2: Make factories/runes selectable, implement Azul factory taking
- [x] Step 3: Allow placing picked runes onto pattern lines
- [x] Step 4: End-of-round detection and scoring with connected segment power calculation
- [x] Step 5: Turn alternation system
- [x] Step 6: Wall validation (prevent duplicate rune types in row)
- [x] Step 7: Floor line direct placement option
- [x] Step 8: Deck management with 2:2 split per factory
- [x] Step 9: Game over condition and modal on game board
- [x] Step 10: Active player highlighting and UI polish
- [x] Step 11: PvE-only mode (local PvP removed)
- [x] Step 12: AI opponent with random legal moves
- [x] Step 13: SVG rune assets integration
- [x] Step 14: Cancel selection (returns runes to source)
- [x] Step 15: Floor penalty focus system (reduces segment scoring)

## Rune Effects System

Each rune type has a unique effect that triggers during gameplay, creating strategic depth and tactical decisions.

### 🔥 Fire (Power)
**Effect:** Every active Fire rune adds +1 Essence
- **Example:** Having 4 active Fire runes on the Spell Wall will increase total Essence by 4
- **Strategy:** Maximize active Fire runes to significantly increase Spellpower
- **Balance:** High offensive power, no defensive value

### ❄️ Frost (Control)
**Effect:** When you place Frost rune(s) in a pattern line, freeze one factory of your choice
- Your opponent cannot draft from that factory on their next turn
- Multiple Frost runes in one turn still only freeze one factory
- **Strategy:** Block factories containing runes your opponent needs
- **Balance:** Tactical control without being oppressive, opponent has 4 other factories + center

### ☠️ Poison (Offense)
**Effect:** Each Poison rune on your scoring wall reduces your opponent's focus by 1 (minimum 1×)
- Only affects opponent's scoring, not your own
- **Example:** You have 3 Poison runes → opponent's 5×3 segment becomes 2×3 = 6 points instead of 15
- **Strategy:** Collect Poison to cripple opponent's scoring potential
- **Balance:** Strong but requires building up multiple Poison runes over time

### 🌑 Void (Destruction)
**Effect:** When you place Void rune(s) in a pattern line, destroy all runes in one factory of your choice
- Powerful denial tool to remove colors you don't want or opponent needs
- Can clear problematic factories before opponent's turn
- **Strategy:** Deny key runes to opponent or clean up unwanted colors
- **Balance:** High disruption but doesn't directly score points

### 💨 Wind (Mitigation)
**Effect:** Wind runes placed in the floor line reduce penalties instead of increasing them
- Each Wind rune in the floor line cancels out one other floor penalty
- Wind runes still occupy a floor slot (count toward the 7-rune limit)
- Only affects your own floor penalties, not opponent's
- **Example:** Floor has [Fire, Fire, Frost, Wind, Wind] = 3 penalties (not 5)
- **Strategy:** Use Wind as insurance when you can't place runes optimally, or intentionally draft Wind to mitigate unavoidable floor penalties
- **Balance:** Valuable defensive rune that rewards planning and risk management without being overpowered

### Implementation TODO

- [x] **✅ Implemented Fire effect**
  - Modified scoring calculation to count total Fire runes on the Scoring Wall
  - Added Fire count to Essence before multiplying
  - Updated `calculateWallPower()` in `src/utils/scoring.ts`
  - Updated `calculateWallPowerWithSegments()` for game log display
  - Updated `calculateProjectedPower()` for RunePower preview
  - Added visual indicator (🔥 emoji) showing Fire bonus in RunePower component
  - Updated tooltip to explain Fire effect

- [x] **✅ Implemented Poison effect**
  - Modified all three scoring functions to accept `opponentPoisonCount` parameter
  - Opponent Poison count reduces player's Focus (minimum 1)
  - Updated `calculateWallPower()`, `calculateWallPowerWithSegments()`, and `calculateProjectedPower()` in `src/utils/scoring.ts`
  - Added helper function `countPoisonRunes()` in gameStore to count Poison runes
  - Updated gameStore to pass opponent Poison counts during scoring calculations
  - Added visual indicator (☠️ emoji) showing Poison reduction in RunePower component
  - Updated tooltip to explain Poison effect
  - Only affects opponent's scoring, not your own

- [x] **✅ Implemented Wind effect**
  - Created `calculateEffectiveFloorPenalty()` helper function in `src/utils/scoring.ts`
  - Each Wind rune in floor line cancels one other floor penalty (minimum 0)
  - Wind runes still count toward floor line capacity (7 max)
  - Updated all three scoring functions to document Wind effect
  - Updated gameStore to use `calculateEffectiveFloorPenalty()` in all scoring phases
  - Added visual indicator (💨 emoji) in RunePower component showing Wind mitigation
  - Added detailed Wind mitigation display in FloorLine component
  - Shows calculation: "X runes - Y Wind = Z penalties"
  - Wind runes in floor line have green background and border
  - Updated tooltip to explain Wind effect
  - Only affects your own floor penalties, not opponent's

- [x] **✅ Implemented Void effect**
  - Added `voidEffectPending` state to GameState to track when Void effect is active
  - Updated `placeRunes()` to detect Void runes and trigger factory destruction
  - Added `destroyFactory()` action to remove all runes from selected factory
  - Created `chooseFactoryToDestroy()` AI function in `src/utils/aiPlayer.ts`
  - AI strategically destroys factories with runes the opponent needs
  - Integrated Void effect handling in App.tsx for AI turns
  - Direct factory click interaction with purple highlighting
  - Purple-themed message banner for player guidance
  - Player who places Void gets to choose which factory to destroy

- [x] **✅ Implemented Frost effect**
  - Added `frostEffectPending` and `frozenFactories` state to GameState
  - Updated `placeRunes()` to detect Frost runes and trigger factory freeze
  - Added `freezeFactory()` action to freeze selected factory
  - Frozen factories disabled for opponent's next turn only
  - Clear frozen state automatically when opponent drafts
  - Created `chooseFactoryToFreeze()` AI function in `src/utils/aiPlayer.ts`
  - AI strategically freezes factories with runes opponent needs
  - Integrated Frost effect handling in App.tsx for AI turns
  - Direct factory click interaction with cyan highlighting
  - Frozen factories show icy blue styling with snowflake indicator (❄️)
  - Cyan-themed message banner for player guidance
  - Player who places Frost gets to choose which factory to freeze



- [ ] **TODO: Update UI for rune effects**
  - Add effect indicators/tooltips on rune tokens
  - Show active effects in game state (frozen factories, Poison count, etc.)
  - Add effect feedback animations when triggered
  - Update `RulesOverlay` with rune effect explanations

- [ ] **TODO: Update AI to consider rune effects**
  - Evaluate Fire runes for scoring potential
  - Weight Poison collection strategically
  - Value Wind as floor insurance and penalty mitigation
  - Consider Void and Frost for denial tactics (already implemented in chooseFactoryToDestroy/Freeze)

### Future Enhancements
- [ ] Boss selection and special modifiers
- [ ] Meta-progression (unlocks after losses)
- [ ] Deck customization UI before game start
- [ ] Run summary and statistics (enhanced beyond current game log)
- [ ] Online multiplayer (server-based PvP)
- [ ] Sound effects and background music
- [ ] Enhanced animations (particle effects, celebrations)
- [ ] Undo/redo for moves
- [ ] End-game bonuses (row/column/type completion)
- [ ] Tutorial/onboarding for new players
- [ ] Save/load game state for resuming later
- [ ] Difficulty settings for AI opponent
- [ ] Achievements and unlockable content

---

## 🚨 Critical Refactoring TODOs (Before Adding New Features)

### Priority 1: State Architecture Refactoring 🔴 **URGENT**

**Problem**: `gameStore.ts` is 727 lines and contains all game logic, side effects, and state. Will become unmaintainable when adding deck drafting, campaign, and PvP features.

#### TODO: Split Monolithic Store
- [ ] **Split `gameStore.ts` into modular stores:**
  - [ ] Create `src/state/stores/gameplayStore.ts` - Current game state (factories, turns, runes, drafting, placement)
  - [ ] Create `src/state/stores/campaignStore.ts` - Roguelite progression, boss unlocks, win streaks, rewards
  - [ ] Create `src/state/stores/deckStore.ts` - Deck management, collection, deck drafting mode
  - [ ] Create `src/state/stores/matchStore.ts` - Online PvP matchmaking, synchronization, ELO
  - [ ] Create `src/state/stores/uiStore.ts` - Overlay states, modal management, transient UI state
  - [ ] Update all components to import from new store locations
  - [ ] Test thoroughly after migration

#### TODO: Remove Side Effects from State
- [ ] **Extract all 12 `setTimeout` calls from gameStore.ts to component useEffect hooks:**
  - [ ] Move end-round timer (line 223) to GameBoard component
  - [ ] Move floor placement timer (line 276) to GameBoard component
  - [ ] Move factory destruction timer (line 352) to App.tsx
  - [ ] Move void skip timer (line 383) to App.tsx
  - [ ] Move frost freeze timer (line 418) to App.tsx
  - [ ] Move scoring step timers (lines 439, 505, 574, 599, 687, 700) to GameBoard component
  - [ ] Add proper cleanup functions (return () => clearTimeout(timer))
  - [ ] Test animation timing remains consistent

- [ ] **Create animation queue system:**
  - [ ] Create `src/systems/animationQueue.ts` to manage sequential animations
  - [ ] Replace manual setTimeout chaining with queue-based approach
  - [ ] Support pause/resume/cancel for animations
  - [ ] Make animations deterministic for testing

#### TODO: Extract AI Orchestration
- [ ] **Move AI logic out of App.tsx:**
  - [ ] Create `src/systems/aiController.ts` for AI turn orchestration
  - [ ] Create `src/systems/turnManager.ts` for turn flow management
  - [ ] Create `src/systems/effectResolver.ts` for Void/Frost/Poison effect handling
  - [ ] Remove 3 AI-related useEffect hooks from App.tsx
  - [ ] Support multiple AI difficulty levels
  - [ ] Make AI behavior pluggable (different strategies for campaign bosses)

### Priority 2: Routing & Navigation 🟡 **HIGH**

**Problem**: Single-page app with boolean toggles won't scale to deck drafting, campaign map, post-match rewards, and matchmaking screens.

#### TODO: Add React Router
- [ ] **Install and configure routing:**
  - [ ] `npm install react-router-dom`
  - [ ] Create `src/routes/` folder
  - [ ] Create route components:
    - [ ] `MainMenu.tsx` - Game mode selection, continue campaign
    - [ ] `CampaignMap.tsx` - Boss selection, progression visualization
    - [ ] `DeckBuilder.tsx` - Pre-match deck drafting interface
    - [ ] `GameMatch.tsx` - Main game (move GameBoard here)
    - [ ] `PostMatchRewards.tsx` - Deck improvements, rewards after winning
    - [ ] `Matchmaking.tsx` - Online PvP lobby, waiting room
  - [ ] Set up router in App.tsx with `<BrowserRouter>` and route definitions
  - [ ] Add navigation guards (prevent leaving match without confirmation)

- [ ] **Update state management for routing:**
  - [ ] Make stores route-aware (clear game state on route change)
  - [ ] Add route parameters for campaign boss selection
  - [ ] Support deep linking to game states (for PvP match URLs)

### Priority 3: Persistence Layer 🟡 **HIGH**

**Problem**: No storage for campaign progress, deck collections, player stats, or PvP ELO. All features in roadmap require persistence.

#### TODO: Add Client-Side Storage
- [ ] **Create storage services:**
  - [ ] Create `src/services/storage/localStorage.ts` - Persistent client storage wrapper
  - [ ] Create `src/services/storage/sessionStorage.ts` - Temporary storage for current session
  - [ ] Add versioning for storage schema (handle migrations)
  - [ ] Add error handling for quota exceeded, corrupted data

- [ ] **Define data schemas:**
  - [ ] Campaign progress schema (unlocked bosses, win streak, current run)
  - [ ] Deck collection schema (owned runes, deck configurations)
  - [ ] Player stats schema (total wins/losses, best spellpower, fastest win)
  - [ ] Settings schema (audio preferences, UI preferences)

- [ ] **Integrate with stores:**
  - [ ] Add persistence middleware to campaignStore
  - [ ] Add persistence middleware to deckStore
  - [ ] Auto-save on state changes (debounced)
  - [ ] Load saved state on app startup

#### TODO: Prepare API Layer Structure
- [ ] **Create API service stubs (for future PvP):**
  - [ ] Create `src/services/api/matchmaking.ts` - PvP matchmaking endpoints
  - [ ] Create `src/services/api/campaign.ts` - Campaign state sync (optional cloud save)
  - [ ] Create `src/services/api/decks.ts` - Deck CRUD operations
  - [ ] Create `src/services/api/auth.ts` - Player authentication (for PvP)
  - [ ] Add API client configuration (base URL, headers, error handling)
  - [ ] Add mock API responses for development

### Priority 4: Game Configuration System 🟡 **MEDIUM**

**Problem**: Game mode is hardcoded at start. Campaign bosses need different rules, deck drafting changes available runes, PvP needs standardized rules.

#### TODO: Make Game Rules Configurable
- [ ] **Create GameRules interface:**
  ```typescript
  interface GameRules {
    runeEffectsEnabled: boolean;
    deckSize: number;
    factoryCount: number;
    runesPerFactory: number;
    roundLimit?: number;
    specialRules?: BossModifier[];
    allowedRuneTypes?: RuneType[];
    floorPenaltyMultiplier?: number;
  }
  ```
- [ ] **Create rule presets:**
  - [ ] Classic mode rules (no effects)
  - [ ] Standard mode rules (current implementation)
  - [ ] Campaign boss-specific rules (different per boss)
  - [ ] Draft mode rules (limited rune pool)
  - [ ] PvP ranked rules (balanced, standardized)

- [ ] **Update game initialization:**
  - [ ] Pass GameRules to `initializeGame()`
  - [ ] Apply rules throughout game logic (factory filling, scoring, effects)
  - [ ] Validate moves against current rule set

### Priority 5: Style Token System 🟢 **MEDIUM**

**Problem**: Inline styles are scattered across components with hardcoded colors/spacing. Deck builder, campaign map, and PvP UI will need complex layouts with consistent theming.

#### TODO: Extract Design Tokens
- [ ] **Create centralized style tokens:**
  - [ ] Create `src/styles/tokens.ts` with:
    ```typescript
    export const COLORS = {
      runes: { Fire: '#FF4500', Frost: '#1E90FF', Poison: '#32CD32', Void: '#8B008B', Wind: '#F0E68C' },
      ui: { background: '#1a1a1a', surface: '#2a2a2a', border: '#333', accent: '#4a9eff' },
      status: { success: '#00ff00', error: '#ff0000', warning: '#ffaa00', info: '#00aaff' }
    };
    export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
    export const TYPOGRAPHY = { small: 12, base: 14, large: 16, xlarge: 20, heading: 24 };
    export const RADIUS = { sm: 4, md: 8, lg: 12, round: '50%' };
    export const SHADOWS = { sm: '0 2px 4px rgba(0,0,0,0.3)', md: '0 4px 8px rgba(0,0,0,0.4)' };
    ```
  - [ ] Replace hardcoded values throughout codebase
  - [ ] Support dark/light theme variants (future)

- [ ] **Create reusable layout components:**
  - [ ] `<Stack direction="vertical|horizontal" spacing={}>` - Flexbox wrapper
  - [ ] `<Grid columns={} gap={}>` - CSS Grid wrapper
  - [ ] `<Modal>` - Standardized modal component
  - [ ] `<Button variant="primary|secondary|danger">` - Consistent buttons
  - [ ] `<Card>` - Reusable card container

### Priority 6: Error Handling & Resilience 🟢 **LOW-MEDIUM**

#### TODO: Add Error Boundaries
- [ ] **Create error boundary components:**
  - [ ] Root error boundary in App.tsx (catch all errors)
  - [ ] GameBoard error boundary (recover from game state errors)
  - [ ] Overlay error boundary (graceful modal failures)
  - [ ] Add error logging service

- [ ] **Add state validation:**
  - [ ] Create `validateGameState()` function
  - [ ] Run validation after each state mutation (dev mode only)
  - [ ] Detect impossible states (negative scores, invalid turn order)
  - [ ] Add recovery mechanisms for corrupted state

### Priority 7: Performance Optimizations 🟢 **LOW**

#### TODO: Optimize Re-renders
- [ ] **Extract repeated hooks:**
  - [ ] Create `useIsAITurn()` hook (replaces 10+ inline checks)
  - [ ] Create `useCurrentPlayer()` and `useOpponent()` hooks
  - [ ] Create `useGamePhase()` hook

- [ ] **Memoize expensive calculations:**
  - [ ] Memoize `getWallColumnForRune()` results
  - [ ] Memoize AI move calculation (debounce)
  - [ ] Add `useMemo` to wall power calculations
  - [ ] Use `React.memo` for static components (RuneToken, WallCell)

- [ ] **Extract utility functions:**
  - [ ] Create `getNextPlayerIndex(current)` util (replaces ternary operator pattern)
  - [ ] Create `isFactoryEmpty(factory)` util
  - [ ] Create `hasRuneTypeOnWall(wall, row, runeType)` util

---

## Refactoring Timeline Estimate

**Phase 1: State Architecture** (2-3 days)
- Split gameStore.ts into 5 modular stores
- Extract all setTimeout calls to useEffect hooks
- Create systems folder (turnManager, aiController, effectResolver)

**Phase 2: Routing** (1-2 days)
- Install React Router
- Create route components (stubs)
- Update navigation flow

**Phase 3: Persistence** (1-2 days)
- Create storage services
- Define data schemas
- Add save/load integration

**Phase 4: Configuration & Tokens** (1 day)
- Create GameRules interface and presets
- Extract style tokens
- Create layout components

**Phase 5: Polish** (1 day)
- Add error boundaries
- Performance optimizations
- Code cleanup

**Total Estimated Time**: 6-9 days

**Payoff**: Clean, maintainable architecture ready for 6+ months of feature development without technical debt

### AI Improvements
- [x] **Simple strategies (Completed ✅):**
  - [x] Prioritize completing pattern lines (focus on lines almost full)
  - [x] Avoid floor line penalties (only use floor when necessary)
  - [x] Block opponent (take runes the opponent needs)
  - [x] Maximize wall points (choose placements that create longer connections)
- [x] **Medium complexity (Completed ✅):**
  - [x] Look-ahead planning (consider which runes will be available next turn)
  - [x] Value higher tier lines (tier 5 = more points potential with exponential scaling)
  - [x] Avoid wasted runes (don't draft more than a line can hold, exponential waste penalties)
- [x] **Advanced strategies:**
  - [x] Minimax algorithm (evaluate multiple moves ahead)
  - [x] Scoring simulation (calculate expected points for each move)

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
