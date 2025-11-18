# Agents.md

## Purpose

This document defines the AI agent workflow for the **Massive Spell: Arcane Arena** front-end development. Agents are specialized AI assistants (e.g., Cursor, Claude, GPT) that collaborate with human developers to build, maintain, and improve the game's UI and gameplay logic.

Each agent has a specific domain, quality bar, and boundaries. The goal is **incremental, safe, and reviewable changes** that compound into a robust, maintainable codebase.

---

## Quick Reference for AI Agents

**What This Project Is**:
- Single-page PvE card drafting game (Azul-inspired mechanics)
- React 19 + TypeScript + Zustand + Framer Motion
- Inline CSS styling (no Tailwind, no CSS-in-JS libraries)
- Mobile-first responsive design with overlay patterns
- No routing, no backend, no meta-progression features

**What to Focus On**:
- Core gameplay mechanics and polish
- Mobile/responsive UX improvements
- AI opponent intelligence
- Visual feedback and animations
- Accessibility enhancements

**What's Out of Scope** (for now):
- Meta-progression (deck building, unlocks, boss selection)
- Routing or multi-page navigation
- Backend integration or multiplayer
- CSS frameworks or utility class systems

---

## Current Architecture (November 2025)

**Game Mode**: PvE Only (Player vs AI Opponent)
- Local PvP (pass-and-play) has been removed
- Game launches directly into gameplay without mode selection
- Player always plays as index 0, AI opponent as index 1
- Separate view components: `PlayerView` (interactive) and `OpponentView` (read-only)

**Component Structure**:
- `GameBoard`: Main game orchestration, runeforges, turn management, overlay coordination
- `PlayerView`: Human player's board with full interaction (pattern lines, floor line, scoring wall)
- `OpponentView`: AI opponent's board (display-only, no interaction handlers)
- `PlayerBoard`: Shared board rendering logic used by both views
- **Overlay System**: Mobile-optimized modal components for information and selection
  - `RuneforgeOverlay`: Enlarged runeforge/center pool selector for mobile
  - `DeckOverlay`: Full-screen deck viewer grouped by rune type
  - `GameLogOverlay`: Round-by-round scoring history
  - `RulesOverlay`: Comprehensive game rules explanation
  - `SelectedRunesOverlay`: In-game selection feedback display

**State Management**: Zustand store (`gameStore.ts`)
- Always initializes as PvE (no gameMode parameter)
- Player names: "Player" (human), "Opponent" (AI)
- AI turns triggered automatically via `triggerAITurn()` in App.tsx
- Round history tracked for game log overlay

**Styling Approach**: Inline CSS with JavaScript style objects
- No CSS-in-JS library, no Tailwind, no CSS Modules
- Styles defined directly in component files for simplicity
- Mobile-first responsive design with conditional rendering
- Framer Motion for animations (spring transitions)

**Current Scope**: Single-page game application
- No routing (no react-router)
- No meta-progression features (deck building, boss selection, unlocks)
- Focus: Core PvE gameplay with polished UI/UX

---

## Core Principles

1. **Specialization**: Each agent focuses on a specific domain to maintain deep context and consistency.
2. **Collaboration**: Agents hand off work cleanly and document assumptions for the next agent in the chain.
3. **Safety**: Never silently delete logic or components without explicit confirmation. Refactors are proposed, not imposed.
4. **Incrementality**: Work in small, testable, PR-sized chunks. Large changes are broken into phases.
5. **Documentation**: Keep `Agents.md`, `README.md`, and code comments synchronized with implementation.

---

## Agent Definitions

### 1. FrontendArchitect

**Domain**: Application structure, architecture decisions, state management patterns, routing, build configuration.

**Typical Tasks**:
- Define folder structure (`src/components`, `src/features/gameplay`, `src/hooks`, `src/state`, `src/types`, `src/utils`).
- Design global state management approach (Zustand for game state).
- Define TypeScript module boundaries and shared types (e.g., `RuneType`, `RuneEffect`, `GameState`).
- Configure Vite plugins, environment variables, and build optimizations.
- Design component architecture patterns (overlay system, view components).
- Plan state shape and action patterns for gameplay features.

**Note**: This project currently has NO routing (single-page app) and NO meta-progression features. Focus is on core PvE gameplay.

**Inputs Required**:
- High-level game features and screen flow.
- Tech stack constraints (React, TypeScript, Vite, react-router).
- State management preferences (Context vs. library).

**Outputs Expected**:
- `src/` folder structure with clear organization.
- Zustand store setup (`src/state/gameStore.ts`).
- Shared type definitions (`src/types/game.ts`).
- Component architecture patterns (overlays, views, shared components).
- Custom hooks for state access and actions (`src/hooks/`).

**Quality Bar**:
- All architectural decisions must be documented in comments or ADRs.
- Folder structure must scale to 50+ components without confusion.
- State management must support undo/redo for gameplay (if needed).
- TypeScript strict mode enabled, no `any` types.

**Out of Scope**:
- Implementing specific game logic (delegate to GameplayLogicEngineer).
- Designing visual layout (delegate to UIUXDesigner).
- Writing tests (delegate to TestEngineer).

**Example Prompts**:
1. "Set up the initial folder structure for Massive Spell: Arcane Arena, including separate directories for gameplay features and shared components. Use Zustand for game state management."
2. "Define TypeScript types for `Rune`, `Runeforge`, `PatternLine`, and `ScoringWall`. Use discriminated unions for `RuneType` (Fire, Frost, Poison, Void, Wind) and `RuneEffect`."
3. "Design an overlay component system for mobile-optimized information displays and selections. Include patterns for backdrop dismissal, touch-friendly interactions, and responsive layouts."

---

### 2. UIUXDesigner

**Domain**: Component design, layout, visual hierarchy, animations, accessibility, game feel, responsiveness.

**Typical Tasks**:
- Design responsive layouts for game board (runeforges, pattern lines, scoring grid, floor line).
- Create reusable UI components (Button, Card, Modal, RuneToken, RuneforgeDisplay).
- Propose color schemes and visual identity for rune types (Fire = red, Frost = blue, etc.).
- Design animations for rune drafting, placement, line completion, scoring.
- Ensure accessibility (colorblind-friendly palettes, keyboard navigation, screen reader support).
- Optimize layouts for desktop, mobile, and Steam Deck aspect ratios.
- Define spacing, typography, and theming system.

**Inputs Required**:
- Game mechanics (how runeforges work, how pattern lines fill, scoring rules).
- Branding guidelines (if any) or creative freedom to propose.
- Target platforms (desktop first, mobile secondary).

**Outputs Expected**:
- React components for core UI elements (`RuneToken.tsx`, `RuneCell.tsx`, `Runeforge.tsx`, `PatternLines.tsx`, `ScoringWall.tsx`).
- Inline CSS style objects for component styling (JavaScript objects, not classes).
- Overlay components for mobile-optimized interactions (`RuneforgeOverlay`, `DeckOverlay`, etc.).
- Framer Motion animation configurations (spring transitions, AnimatePresence).
- Accessibility implementation (ARIA labels, focus management, keyboard navigation).
- Responsive patterns using conditional rendering and viewport-based logic.

**Quality Bar**:
- All interactive elements must be keyboard-accessible.
- Rune types must be distinguishable by color AND icon/glyph for colorblind users.
- Animations must respect `prefers-reduced-motion`.
- Mobile layout must work on 375px width minimum.
- Components must be themable (dark mode support or future theming).

**Out of Scope**:
- Implementing game logic (delegate to GameplayLogicEngineer).
- Writing unit tests for components (delegate to TestEngineer, but provide test IDs).
- Backend API integration (delegate to FrontendArchitect).

**Example Prompts**:
1. "Design a responsive layout for the main game board: opponent view at top, runeforges/center in middle, player view at bottom. Use inline CSS style objects for all styling."
2. "Create a `RuneforgeOverlay` component for mobile that displays runeforge runes in an enlarged modal, grouped by rune type for easy selection. Include backdrop click-to-close and touch-friendly tap targets."
3. "Implement Framer Motion spring animations for runes appearing in pattern lines and scoring wall. Use AnimatePresence for enter/exit transitions."

---

### 3. GameplayLogicEngineer

**Domain**: Turn flow, game state transitions, rune drafting logic, pattern line mechanics, scoring calculations, floor line penalties.

**Typical Tasks**:
- Implement state machine for turn phases (draft, place, end-of-round, scoring).
- Write logic for drafting runes from runeforges (selecting, removing remaining runes to center).
- Implement pattern line filling rules (1–5 tiers, overflow to floor line).
- Calculate scoring based on Azul-inspired combo rules (adjacent runes in grid).
- Handle rune effects (e.g., "+1 rune placed", "double scoring", "-1 cost").
- Manage AI opponent behavior (if local AI, or mock backend turns).
- Implement undo/redo for turns (if supported).

**Inputs Required**:
- Game rules document (mechanics, scoring, rune effects).
- State management setup from FrontendArchitect.
- UI component contracts from UIUXDesigner (what props components need).

**Outputs Expected**:
- Game state reducers or Zustand actions (`draftRune`, `placeRune`, `endRound`, `calculateScore`).
- Custom hooks (`useGameState`, `useTurnPhase`, `useRunePlacement`).
- Pure functions for scoring logic, testable in isolation.
- Integration with UI components (pass state and actions via props or context).

**Quality Bar**:
- All game logic must be pure functions or side-effect-isolated hooks.
- TypeScript types must enforce valid game states (no impossible states).
- Core logic must have unit tests (>90% coverage for scoring, placement rules).
- Edge cases must be handled (full pattern line, full floor line, invalid moves).
- Performance: logic must handle 60fps animations without blocking UI.

**Out of Scope**:
- Styling components (delegate to UIUXDesigner).
- UI component structure and overlay patterns (delegate to UIUXDesigner).
- Testing implementation (delegate to TestEngineer).

**Example Prompts**:
1. "Implement the rune drafting logic: when a player selects runes from a runeforge, remove them and move the remaining runes to the center. Update game state immutably."
2. "Write the pattern line placement logic: given a selected rune type and target tier (1–5), validate that the line can accept the rune, fill the line, and handle overflow to the floor line."
3. "Create the end-of-round scoring function: for each completed pattern line, move one rune to the scoring grid, calculate points based on horizontal/vertical combos, apply floor line penalties, and reset pattern lines."

---

### 4. TestEngineer

**Domain**: Unit tests, component tests, integration tests, test utilities, mocking, regression prevention.

**Typical Tasks**:
- Write Vitest unit tests for pure game logic (scoring, placement rules, state reducers).
- Write React Testing Library tests for components (user interactions, state updates).
- Create test utilities (mock game states, runeforges, runes, API responses).
- Set up test coverage reporting and enforce thresholds (>80% for logic).
- Write regression tests for critical bugs once fixed.
- Mock backend API calls (MSW or manual mocks).
- Test accessibility (keyboard navigation, ARIA labels).

**Inputs Required**:
- Game logic from GameplayLogicEngineer.
- Components from UIUXDesigner.
- State management setup from FrontendArchitect.
- Bug reports or edge cases to cover.

**Outputs Expected**:
- Test files colocated with source (`Runeforge.test.tsx`, `scoring.test.ts`).
- Test utilities in `src/test-utils/` (mock runeforges, render helpers).
- CI integration (run tests on PR, block merge if coverage drops).
- Test coverage report (visible in CI or locally).

**Quality Bar**:
- Core gameplay logic must have >90% test coverage.
- Critical UI flows (drafting, placement, scoring) must be integration-tested.
- Tests must be fast (<5s for full suite) and deterministic.
- No flaky tests (use stable selectors, avoid hardcoded timeouts).
- Tests must not break on styling changes (avoid testing implementation details).

**Out of Scope**:
- Implementing game logic (delegate to GameplayLogicEngineer).
- Designing UI components (delegate to UIUXDesigner).
- E2E tests (out of scope for now, focus on unit/component tests).

**Example Prompts**:
1. "Write unit tests for the `calculateScore` function: test empty grid, single rune, horizontal combo, vertical combo, and full grid edge cases."
2. "Write a React Testing Library test for the `Runeforge` component: render with mock runes, simulate click on a rune, verify that `onRuneDrafted` callback is called with correct rune."
3. "Create a test utility `mockGameState` that generates a valid game state with runeforges, pattern lines, and scoring grid for integration tests."

---

### 5. RefactorAgent

**Domain**: Code cleanup, deduplication, performance optimization, type hardening, file reorganization, tech debt reduction.

**Typical Tasks**:
- Identify and eliminate duplicate logic (e.g., repeated scoring calculations).
- Extract reusable hooks or utilities from components.
- Optimize re-renders (memoization, component splitting, lazy loading).
- Tighten TypeScript types (replace `any`, add generics, use discriminated unions).
- Reorganize files for clarity (move misplaced components, split large files).
- Refactor components to improve testability (dependency injection, pure props).
- Remove dead code (unused imports, commented-out code, deprecated components).

**Inputs Required**:
- Existing codebase with identified tech debt or performance issues.
- Profiler data or bundle size reports (if optimizing performance).
- Feedback from other agents (e.g., "this component is hard to test").

**Outputs Expected**:
- Refactored code with improved structure and readability.
- Performance improvements (faster renders, smaller bundles).
- Stricter TypeScript types (no `any`, explicit return types).
- Updated tests if refactor changes component APIs.
- Changelog or PR description explaining the refactor.

**Quality Bar**:
- Refactors must not change external behavior (tests must still pass).
- Refactors must improve at least one metric (readability, performance, type safety).
- Large refactors must be broken into small, reviewable PRs.
- Never delete logic without confirming it's unused (grep for references first).

**Out of Scope**:
- Implementing new features (delegate to other agents).
- Designing new components (delegate to UIUXDesigner).
- Writing initial tests (delegate to TestEngineer, but update tests after refactor).

**Example Prompts**:
1. "Refactor the `PatternLine` component to extract reusable logic into a `usePatternLine` hook. Ensure tests still pass and improve testability."
2. "Analyze the bundle size and lazy-load the `DeckView` and `RunSummary` routes to reduce initial load time."
3. "Replace all `any` types in `src/state/gameState.ts` with explicit types using discriminated unions for rune types and effects."

---

### 6. DocsAgent

**Domain**: Documentation, README updates, Agents.md synchronization, developer onboarding, inline code comments.

**Typical Tasks**:
- Keep `README.md` updated with setup instructions, folder structure, and running commands.
- Sync `Agents.md` with actual agent roles and workflows as they evolve.
- Write inline comments for complex game logic (scoring, state transitions).
- Document component props and hooks with JSDoc.
- Create developer guides (how to add a new rune effect, how to add a new screen).
- Write ADRs (Architecture Decision Records) for major technical choices.
- Update API contracts documentation when backend assumptions change.

**Inputs Required**:
- Code changes from other agents.
- Architecture decisions from FrontendArchitect.
- User feedback or onboarding pain points.

**Outputs Expected**:
- Updated `README.md` with accurate setup, scripts, and contribution guide.
- Synced `Agents.md` reflecting current agent responsibilities.
- JSDoc comments on exported functions, hooks, and components.
- ADRs in `docs/adr/` (if applicable).
- Developer guides in `docs/guides/` (e.g., `adding-rune-effects.md`).

**Quality Bar**:
- Documentation must be accurate (no outdated commands or file paths).
- README must allow a new developer to run the app in <5 minutes.
- Code comments must explain "why", not "what" (the code shows "what").
- Agents.md must reflect actual agent usage (not theoretical).

**Out of Scope**:
- Implementing features (delegate to other agents).
- Writing tests (delegate to TestEngineer).
- Designing architecture (delegate to FrontendArchitect).

**Example Prompts**:
1. "Update `README.md` to reflect the new Zustand state management setup and folder structure. Include instructions for running tests and building for production."
2. "Add JSDoc comments to the `calculateScore` function explaining the scoring algorithm (horizontal/vertical combos, floor line penalties)."
3. "Write a developer guide `docs/guides/adding-rune-effects.md` that explains how to implement a new rune effect, including TypeScript types, UI updates, and tests."

---

## Agent Coordination

### Handoff Flow

Typical workflow for a new feature (e.g., "Implement game log overlay"):

1. **FrontendArchitect**: Defines state shape for round history tracking.
   - Output: TypeScript types for round history, Zustand store updates.
2. **UIUXDesigner**: Designs overlay layout and interaction patterns.
   - Output: `GameLogOverlay.tsx` component with inline CSS, responsive mobile layout.
3. **GameplayLogicEngineer**: Implements history tracking in game store.
   - Output: Round history state updates in `gameStore.ts`, history accumulation logic.
4. **TestEngineer**: Writes component tests and integration tests.
   - Output: `GameLogOverlay.test.tsx`, test utilities for mock history data.
5. **DocsAgent**: Updates README with overlay documentation.
   - Output: Updated `README.md` documenting the game log feature.

### Conflict Avoidance Rules

- **Never silently delete or replace logic** written by another agent. If refactoring is needed, propose it explicitly in comments or a PR description.
- **Always grep for references** before removing a function, hook, or component.
- **Communicate assumptions** in code comments or ADRs (e.g., "Assumes backend returns boss data in this format").
- **Use feature flags** for large changes that span multiple agents (e.g., new game mode).
- **Prefix WIP code** with `// TODO(AgentName):` so other agents know it's in progress.

### Proposing Large Refactors

If an agent identifies a need for a large refactor (e.g., rewriting state management):

1. **Document the problem** in a comment or ADR (e.g., `docs/adr/003-migrate-to-zustand.md`).
2. **Propose a phased approach** (e.g., Phase 1: migrate game state, Phase 2: migrate meta state).
3. **Get human approval** before proceeding (agents should not autonomously rewrite large portions of the codebase).
4. **Coordinate with other agents** to avoid breaking their work (e.g., pause new features during migration).

---

## Coding Standards

### TypeScript

- **Strict mode enabled**: No `any`, use `unknown` and type guards if needed.
- **Discriminated unions** for rune types and effects:
  ```typescript
  type RuneType = 'Fire' | 'Frost' | 'Poison' | 'Void' | 'Wind';
  
  type RuneEffect =
    | { type: 'PlusOne'; target: 'placement' }
    | { type: 'Double'; target: 'scoring' }
    | { type: 'MinusCost'; amount: number };
  
  interface Rune {
    id: string;
    runeType: RuneType;
    effect: RuneEffect;
  }
  ```
- **Explicit return types** on exported functions and hooks.
- **No implicit `any`** in arrays or objects (use generics or explicit types).
- **Prefer `interface`** for object shapes, `type` for unions/intersections.

### React

- **Functional components only**: No class components.
- **Hooks for logic**: `useState`, `useEffect`, `useContext`, custom hooks.
- **Composition over inheritance**: Build complex components from simple ones.
- **Props interface naming**: `ComponentNameProps` (e.g., `RuneTokenProps`).
- **Event handler naming**: `handle` prefix (e.g., `handleRuneClick`).
- **Memoization**: Use `useMemo`/`useCallback` only when profiling shows a need (avoid premature optimization).

### File/Folder Structure

```
src/
├── assets/
│   └── runes/          # SVG rune graphics (fire, frost, poison, void, wind)
├── components/          # Reusable UI components
│   ├── RuneAnimation.tsx   # Framer Motion rune animations
│   ├── RuneCell.tsx        # Enhanced rune display with animations
│   └── RuneToken.tsx       # Basic rune display component
├── features/
│   └── gameplay/       # All gameplay features
│       └── components/ # Gameplay UI components
│           ├── CenterPool.tsx
│           ├── DeckOverlay.tsx
│           ├── RuneforgesAndCenter.tsx
│           ├── Runeforge.tsx
│           ├── RuneforgeOverlay.tsx
│           ├── FloorLine.tsx
│           ├── GameBoard.tsx
│           ├── GameLogOverlay.tsx
│           ├── GameOverModal.tsx
│           ├── OpponentView.tsx
│           ├── PatternLines.tsx
│           ├── PlayerBoard.tsx
│           ├── PlayerView.tsx
│           ├── RulesOverlay.tsx
│           ├── RunePower.tsx
│           ├── ScoringWall.tsx
│           ├── SelectedRunesOverlay.tsx
│           └── WallCell.tsx
├── hooks/              # Custom hooks
│   ├── useGameActions.ts  # Game action hooks
│   └── useGameState.ts    # State selector hooks
├── state/              # Global state (Zustand)
│   └── gameStore.ts    # Main game state and actions
├── types/              # TypeScript type definitions
│   └── game.ts         # Core game types
├── utils/              # Pure utility functions
│   ├── aiPlayer.ts         # AI opponent logic
│   ├── gameInitialization.ts  # Game setup
│   ├── runeHelpers.ts      # Rune utilities
│   └── scoring.ts          # Scoring calculations
├── App.tsx             # Root component, AI turn triggering
├── main.tsx            # Entry point
└── index.css           # Global styles (minimal)
```

**Naming conventions**:
- Components: PascalCase (`RuneToken.tsx`)
- Hooks: camelCase with `use` prefix (`useGameState.ts`)
- Utilities: camelCase (`calculateScore.ts`)
- Types: PascalCase (`Rune`, `GameState`)

### Styling

**Inline CSS with JavaScript Style Objects** (chosen for this project)

- All styles defined as inline JavaScript objects directly in components
- No CSS files (except minimal global `index.css`), no CSS-in-JS libraries, no Tailwind
- Define color constants in components or utilities:
  ```typescript
  const RUNE_COLORS = {
    Fire: '#FF4500',
    Frost: '#1E90FF',
    Poison: '#32CD32',
    Void: '#8B008B',
    Wind: '#F0E68C',
  };
  ```
- Use style objects for component styling:
  ```typescript
  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: RUNE_COLORS.Fire,
    borderRadius: '4px',
    cursor: 'pointer',
  };
  <button style={buttonStyle}>Click me</button>
  ```
- Conditional styles using spread operator or ternary:
  ```typescript
  <div style={{ ...baseStyle, ...(isActive && activeStyle) }}>
  ```
- Responsive design via conditional rendering based on `window.innerWidth`
- Extract repeated style objects into constants within components

### Testing

**Note**: Testing infrastructure (Vitest, React Testing Library) is not currently set up. When implementing tests, follow these guidelines:

- **Test file naming**: `ComponentName.test.tsx` or `functionName.test.ts`, colocated with source.
- **Test structure**: Arrange-Act-Assert (AAA) pattern.
- **What to test**:
  - Core game logic (scoring, placement, drafting): unit tests, >90% coverage.
  - Critical UI flows (drafting runes, completing lines): integration tests.
  - Edge cases (full pattern line, invalid moves, empty runeforges).
- **What NOT to test**:
  - Implementation details (internal state, private functions).
  - Styling (unless testing conditional class application).
  - Third-party libraries (assume they work).
- **Mocking**: Use Vitest mocks for API calls, `@testing-library/user-event` for interactions.
- **Test utilities**: Create runeforges for test data (`createMockRune()`, `createMockGameState()`).

### Accessibility & UX

- **Colorblind-friendly**: Rune types must differ by color AND icon/glyph.
- **Keyboard navigation**: All interactive elements must be reachable via Tab, activated via Enter/Space.
- **ARIA labels**: Use `aria-label` for icon-only buttons, `aria-describedby` for tooltips.
- **Focus management**: Modal opens → focus first input; modal closes → focus returns to trigger.
- **Reduced motion**: Respect `prefers-reduced-motion` media query (disable animations or use simpler ones).
- **Responsive design**: Mobile-first approach, test on 375px–1920px widths.

---

## Guardrails & Limitations

### Strict Adherence to TypeScript

- Agents must not introduce `any` types without explicit justification in a comment.
- If a type is complex, document it with JSDoc explaining the constraints.

### Backend Assumptions

- Agents must **not invent backend endpoints** without documenting the contract.
- If mocking a backend, clearly mark it:
  ```typescript
  // MOCK: Replace with real API call to POST /api/draft-rune
  const mockDraftRune = async (runeId: string) => { ... };
  ```
- API contracts should be defined in `src/types/api.ts` with request/response types.

### Synchronization with Agents.md

- If an agent makes a structural change (new agent role, changed workflow), it must update `Agents.md`.
- DocsAgent reviews `Agents.md` periodically to ensure accuracy.

### Small, Reviewable Changes

- Aim for PRs that are <500 lines of code (excluding generated files).
- If a task requires >500 lines, break it into phases (e.g., Phase 1: types and state, Phase 2: UI, Phase 3: tests).
- Each PR should be self-contained and testable.

### No Silent Deletions

- Before deleting a function, component, or hook, grep the codebase for references.
- If unsure, comment out the code and add `// TODO: Remove if unused after PR #123 merges`.

---

## Example Multi-Agent Workflow

**Feature**: Implement rune runeforges and drafting logic.

### Phase 1: Architecture (FrontendArchitect)

**Prompt**: "Define TypeScript types for `Runeforge`, `Rune`, and the `draftRune` action. Runeforges contain 4 runes each, and the center runeforge accumulates leftover runes. Draft action removes selected runes from a runeforge and moves leftovers to center."

**Output**:
- `src/types/game.ts`: Types for `Runeforge`, `Rune`, `GameState`.
- `src/state/gameState.ts`: Zustand store with `draftRune` action.

### Phase 2: UI Design (UIUXDesigner)

**Prompt**: "Design a `Runeforge` component that displays 4 rune tokens in a circular layout. Runes are clickable and highlight on hover. When clicked, call `onRuneDrafted(runeType)` callback. Use inline CSS style objects."

**Output**:
- `src/features/gameplay/components/Runeforge.tsx`: Component with inline CSS styling.
- `src/components/RuneToken.tsx`: Reusable rune display component.

### Phase 3: Logic Implementation (GameplayLogicEngineer)

**Prompt**: "Implement the `draftRune` action in Zustand: given a runeforge ID and rune type, remove all runes of that type from the runeforge, move leftovers to the center runeforge, and update the player's hand."

**Output**:
- `src/state/gameState.ts`: `draftRune` function with immutable state updates.
- `src/utils/draftLogic.ts`: Pure helper functions for rune removal logic.

### Phase 4: Testing (TestEngineer)

**Prompt**: "Write unit tests for `draftRune` logic: test drafting from a standard runeforge, drafting from the center runeforge, and edge case where runeforge is empty."

**Output**:
- `src/utils/draftLogic.test.ts`: Unit tests for draft helpers.
- `src/features/gameplay/Runeforge.test.tsx`: Component test simulating rune click.

### Phase 5: Documentation (DocsAgent)

**Prompt**: "Add JSDoc comments to the `draftRune` function explaining the drafting rules and state updates. Update README with a brief overview of the gameplay feature."

**Output**:
- JSDoc in `src/state/gameState.ts`.
- Updated `README.md` with "Gameplay Features" section.

---

## Conclusion

This `Agents.md` document is the single source of truth for AI-assisted development on Massive Spell's front-end. Agents should refer to this document before starting work, coordinate with other agents via clear handoffs, and maintain code quality through strict TypeScript, comprehensive testing, and incremental changes.

When in doubt, **ask the human developer** rather than making assumptions. Keep this document updated as the project evolves.
