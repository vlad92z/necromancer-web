# Agents.md

## Purpose

This document defines the AI agent workflow for the **Massive Spell: Arcane Arena** front-end development. Agents are specialized AI assistants (e.g., Cursor, Claude, GPT) that collaborate with human developers to build, maintain, and improve the game's UI and gameplay logic.

Each agent has a specific domain, quality bar, and boundaries. The goal is **incremental, safe, and reviewable changes** that compound into a robust, maintainable codebase.

---

## Current Architecture (November 2025)

**Game Mode**: PvE Only (Player vs AI Opponent)
- Local PvP (pass-and-play) has been removed
- Game launches directly into gameplay without mode selection
- Player always plays as index 0, AI opponent as index 1
- Separate view components: `PlayerView` (interactive) and `OpponentView` (read-only)

**Component Structure**:
- `GameBoard`: Main game orchestration, factories, turn management
- `PlayerView`: Human player's board with full interaction (pattern lines, floor line, scoring wall)
- `OpponentView`: AI opponent's board (display-only, no interaction handlers)
- `PlayerBoard`: Shared board rendering logic used by both views

**State Management**: Zustand store (`gameStore.ts`)
- Always initializes as PvE (no gameMode parameter)
- Player names: "Player" (human), "Opponent" (AI)
- AI turns triggered automatically via `triggerAITurn()` in App.tsx

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
- Define folder structure (`src/components`, `src/features/gameplay`, `src/features/meta`, `src/hooks`, `src/state`, `src/types`, `src/utils`).
- Design global state management approach (React Context + hooks, or Zustand for game/meta state).
- Establish routing structure (`/`, `/game`, `/deck`, `/run-summary`, `/rune-selection`).
- Define TypeScript module boundaries and shared types (e.g., `RuneType`, `RuneEffect`, `GameState`).
- Configure Vite plugins, environment variables, and build optimizations.
- Design API boundary layer (mocking strategy, type contracts for backend endpoints).

**Inputs Required**:
- High-level game features and screen flow.
- Tech stack constraints (React, TypeScript, Vite, react-router).
- State management preferences (Context vs. library).

**Outputs Expected**:
- `src/` folder structure with README explaining each directory.
- State management setup (Context providers, store initialization).
- Routing configuration (`src/routes.tsx` or equivalent).
- Shared type definitions (`src/types/runes.ts`, `src/types/game.ts`).
- Architecture decision records (ADRs) for major choices.

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
1. "Set up the initial folder structure for Massive Spell: Arcane Arena, including separate directories for gameplay features, meta-progression, and shared components. Use Zustand for game state management."
2. "Define TypeScript types for `Rune`, `Factory`, `PatternLine`, and `ScoringGrid`. Use discriminated unions for `RuneType` (Fire, Frost, Poison, Void, Wind) and `RuneEffect`."
3. "Create a routing structure with react-router for: home screen, active game, deck view, rune selection after round, and run summary. Include type-safe route parameters."

---

### 2. UIUXDesigner

**Domain**: Component design, layout, visual hierarchy, animations, accessibility, game feel, responsiveness.

**Typical Tasks**:
- Design responsive layouts for game board (factories, pattern lines, scoring grid, floor line).
- Create reusable UI components (Button, Card, Modal, RuneToken, FactoryDisplay).
- Propose color schemes and visual identity for rune types (Fire = red, Frost = blue, etc.).
- Design animations for rune drafting, placement, line completion, scoring.
- Ensure accessibility (colorblind-friendly palettes, keyboard navigation, screen reader support).
- Optimize layouts for desktop, mobile, and Steam Deck aspect ratios.
- Define spacing, typography, and theming system.

**Inputs Required**:
- Game mechanics (how factories work, how pattern lines fill, scoring rules).
- Branding guidelines (if any) or creative freedom to propose.
- Target platforms (desktop first, mobile secondary).

**Outputs Expected**:
- React components for core UI elements (`RuneToken.tsx`, `Factory.tsx`, `PatternLine.tsx`, `ScoringGrid.tsx`).
- Tailwind utility classes or CSS Modules for styling (choose one and be consistent).
- Animation specs (CSS transitions, Framer Motion configs, or react-spring setups).
- Accessibility audit checklist and implementation (ARIA labels, focus management).
- Responsive breakpoints and layout variants.

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
1. "Design a responsive layout for the main game board: factories in the center, player pattern lines on the left, opponent pattern lines on the right, scoring grid below, floor line at bottom. Mobile should stack vertically."
2. "Create a `RuneToken` component that displays rune type (color-coded) and effect (as a glyph icon). Ensure it's accessible and includes hover/focus states for selection."
3. "Propose an animation sequence for completing a pattern line: runes slide into the scoring grid, points increment with a bounce effect, and the line resets. Use Framer Motion or CSS animations."

---

### 3. GameplayLogicEngineer

**Domain**: Turn flow, game state transitions, rune drafting logic, pattern line mechanics, scoring calculations, floor line penalties.

**Typical Tasks**:
- Implement state machine for turn phases (draft, place, end-of-round, scoring).
- Write logic for drafting runes from factories (selecting, removing remaining runes to center).
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
- Backend communication (delegate to FrontendArchitect).
- Meta-progression logic (delegate to MetaProgressionEngineer).

**Example Prompts**:
1. "Implement the rune drafting logic: when a player selects runes from a factory, remove them and move the remaining runes to the center. Update game state immutably."
2. "Write the pattern line placement logic: given a selected rune type and target tier (1–5), validate that the line can accept the rune, fill the line, and handle overflow to the floor line."
3. "Create the end-of-round scoring function: for each completed pattern line, move one rune to the scoring grid, calculate points based on horizontal/vertical combos, apply floor line penalties, and reset pattern lines."

---

### 4. MetaProgressionEngineer

**Domain**: Deck-building UI, rune acquisition after rounds, boss selection, run summary, unlocks, persistence.

**Typical Tasks**:
- Build screens for post-round rune selection (3 random runes, pick 1).
- Implement deck view UI (list all runes, show counts, filters by type/effect).
- Design boss selection screen (3 bosses, unique modifiers, pick 1).
- Create run summary screen (wins, losses, runes acquired, final score).
- Integrate localStorage or IndexedDB for persisting run state.
- Handle meta-unlocks (new rune effects unlocked after losing, progression tree).
- Implement matchmaking UI (mock or real, showing opponent's win count).

**Inputs Required**:
- Meta-progression rules (how runes are offered, boss mechanics, unlock conditions).
- State management setup from FrontendArchitect.
- UI components and layout from UIUXDesigner.

**Outputs Expected**:
- React components for meta screens (`RuneSelection.tsx`, `DeckView.tsx`, `BossSelection.tsx`, `RunSummary.tsx`).
- State hooks or Zustand slices for meta state (`useRunState`, `useDeck`, `useUnlocks`).
- Persistence logic (save/load run state, sync with backend if applicable).
- Integration with routing (navigate to meta screens after round ends).

**Quality Bar**:
- Meta state must be serializable (for persistence and undo/redo).
- Deck view must be performant with 100+ runes.
- Persistence must handle browser refresh without data loss.
- UI must clearly communicate progression (progress bars, unlock animations).

**Out of Scope**:
- Implementing core gameplay logic (delegate to GameplayLogicEngineer).
- Backend matchmaking algorithm (assume API contract, mock if needed).
- Visual design details (delegate to UIUXDesigner for layout proposals).

**Example Prompts**:
1. "Build a rune selection screen that displays 3 random runes after a round win. Each rune shows type, effect, and a brief description. Player clicks one to add it to their deck."
2. "Create a deck view component that lists all runes grouped by type, with counts and filters. Include a search bar for filtering by effect name."
3. "Implement localStorage persistence for the current run state: deck, wins, losses, current round, boss selections. Load on app start and save after each round."

---

### 5. TestEngineer

**Domain**: Unit tests, component tests, integration tests, test utilities, mocking, regression prevention.

**Typical Tasks**:
- Write Vitest unit tests for pure game logic (scoring, placement rules, state reducers).
- Write React Testing Library tests for components (user interactions, state updates).
- Create test utilities (mock game states, factories, runes, API responses).
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
- Test files colocated with source (`Factory.test.tsx`, `scoring.test.ts`).
- Test utilities in `src/test-utils/` (mock factories, render helpers).
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
2. "Write a React Testing Library test for the `Factory` component: render with mock runes, simulate click on a rune, verify that `onRuneDrafted` callback is called with correct rune."
3. "Create a test utility `mockGameState` that generates a valid game state with factories, pattern lines, and scoring grid for integration tests."

---

### 6. RefactorAgent

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

### 7. DocsAgent

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

Typical workflow for a new feature (e.g., "Implement boss selection screen"):

1. **FrontendArchitect**: Defines routing, state shape, API contract.
   - Output: Route definition, TypeScript types for boss data, mock API.
2. **UIUXDesigner**: Proposes layout, components, and interactions.
   - Output: `BossSelection.tsx` component structure, styling (Tailwind/CSS Modules).
3. **MetaProgressionEngineer**: Implements logic for boss selection, state updates, persistence.
   - Output: State hooks, event handlers, integration with routing.
4. **TestEngineer**: Writes component tests and integration tests.
   - Output: `BossSelection.test.tsx`, mock boss data utilities.
5. **DocsAgent**: Updates README and writes developer guide for adding new bosses.
   - Output: Updated docs, inline comments in boss selection logic.

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
├── components/          # Reusable UI components (Button, Card, Modal)
├── features/
│   ├── gameplay/       # Game board, factories, pattern lines, scoring
│   ├── meta/           # Deck view, rune selection, boss selection, run summary
├── hooks/              # Custom hooks (useGameState, useDeck)
├── state/              # Global state (Context providers, Zustand stores)
├── types/              # Shared TypeScript types (runes, game, meta)
├── utils/              # Pure utility functions (scoring, validation)
├── test-utils/         # Test helpers (mock factories, render utilities)
├── routes.tsx          # React Router configuration
├── App.tsx             # Root component
├── main.tsx            # Entry point
```

**Naming conventions**:
- Components: PascalCase (`RuneToken.tsx`)
- Hooks: camelCase with `use` prefix (`useGameState.ts`)
- Utilities: camelCase (`calculateScore.ts`)
- Types: PascalCase (`Rune`, `GameState`)

### Styling

**Option: Tailwind CSS** (chosen for this project)

- Use Tailwind utility classes for styling.
- Extract repeated patterns into components (not `@apply` in CSS).
- Use `tailwind.config.js` to define theme colors for rune types:
  ```javascript
  theme: {
    extend: {
      colors: {
        fire: '#FF4500',
        frost: '#1E90FF',
        poison: '#32CD32',
        void: '#8B008B',
        wind: '#F0E68C',
      },
    },
  }
  ```
- Avoid "class hell": if a component has >10 utility classes, extract a component.
- Use `clsx` or `classnames` for conditional classes.

**Alternative: CSS Modules** (if Tailwind is not preferred)

- File naming: `ComponentName.module.css`
- Use BEM-lite naming within modules: `.component`, `.component__element`, `.component--modifier`.
- Avoid deeply nested selectors (max 2 levels).
- Use CSS custom properties for theming (`--color-fire`, `--color-frost`).

### Testing

- **Test file naming**: `ComponentName.test.tsx` or `functionName.test.ts`, colocated with source.
- **Test structure**: Arrange-Act-Assert (AAA) pattern.
- **What to test**:
  - Core game logic (scoring, placement, drafting): unit tests, >90% coverage.
  - Critical UI flows (drafting runes, completing lines): integration tests.
  - Edge cases (full pattern line, invalid moves, empty factories).
- **What NOT to test**:
  - Implementation details (internal state, private functions).
  - Styling (unless testing conditional class application).
  - Third-party libraries (assume they work).
- **Mocking**: Use Vitest mocks for API calls, `@testing-library/user-event` for interactions.
- **Test utilities**: Create factories for test data (`createMockRune()`, `createMockGameState()`).

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

**Feature**: Implement rune factories and drafting logic.

### Phase 1: Architecture (FrontendArchitect)

**Prompt**: "Define TypeScript types for `Factory`, `Rune`, and the `draftRune` action. Factories contain 4 runes each, and the center factory accumulates leftover runes. Draft action removes selected runes from a factory and moves leftovers to center."

**Output**:
- `src/types/game.ts`: Types for `Factory`, `Rune`, `GameState`.
- `src/state/gameState.ts`: Zustand store with `draftRune` action.

### Phase 2: UI Design (UIUXDesigner)

**Prompt**: "Design a `Factory` component that displays 4 rune tokens in a circular layout. Runes are clickable and highlight on hover. When clicked, call `onRuneDrafted(runeType)` callback."

**Output**:
- `src/features/gameplay/Factory.tsx`: Component with Tailwind styling.
- `src/components/RuneToken.tsx`: Reusable rune display component.

### Phase 3: Logic Implementation (GameplayLogicEngineer)

**Prompt**: "Implement the `draftRune` action in Zustand: given a factory ID and rune type, remove all runes of that type from the factory, move leftovers to the center factory, and update the player's hand."

**Output**:
- `src/state/gameState.ts`: `draftRune` function with immutable state updates.
- `src/utils/draftLogic.ts`: Pure helper functions for rune removal logic.

### Phase 4: Testing (TestEngineer)

**Prompt**: "Write unit tests for `draftRune` logic: test drafting from a standard factory, drafting from the center factory, and edge case where factory is empty."

**Output**:
- `src/utils/draftLogic.test.ts`: Unit tests for draft helpers.
- `src/features/gameplay/Factory.test.tsx`: Component test simulating rune click.

### Phase 5: Documentation (DocsAgent)

**Prompt**: "Add JSDoc comments to the `draftRune` function explaining the drafting rules and state updates. Update README with a brief overview of the gameplay feature."

**Output**:
- JSDoc in `src/state/gameState.ts`.
- Updated `README.md` with "Gameplay Features" section.

---

## Conclusion

This `Agents.md` document is the single source of truth for AI-assisted development on Massive Spell's front-end. Agents should refer to this document before starting work, coordinate with other agents via clear handoffs, and maintain code quality through strict TypeScript, comprehensive testing, and incremental changes.

When in doubt, **ask the human developer** rather than making assumptions. Keep this document updated as the project evolves.
