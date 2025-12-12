# Copilot Instructions for Massive Spell: Arcane Arena

## Project Overview

**Massive Spell: Arcane Arena** is a single-player roguelite rune-drafting game inspired by Azul's drafting mechanics. Players select runes from runeforges, place them on pattern lines, and complete lines to add runes to their scoring wall. The goal is to build connected segments of runes to maximize spell damage while surviving arcane overload.

### Tech Stack
- **React 19** + **TypeScript** (strict mode)
- **Vite 7** for development and builds
- **Zustand 5** for global state management
- **Framer Motion 12** for all animations
- **Inline CSS + Tailwind** styling (Tailwind used wherever possible; no CSS Modules or CSS-in-JS libraries)

### Current Scope
- Solo Game Mode only: reach the target RuneScore before succumbing to Arcane Overload (no duel mode or AI opponents)

---

## Agent Behavior Guidelines

### General Principles

**Consistency First**: Always analyze existing patterns before creating new code. Match the established conventions in:
- Component structure and naming
- TypeScript type definitions
- State management patterns
- Styling approaches
- Animation configurations

**Incremental Changes**: Make small, focused changes that build on existing code rather than large rewrites. Each change should be reviewable and testable in isolation.

**Composability**: Build small, single-responsibility components that can be composed into larger features. Avoid monolithic components that mix UI rendering, game logic, and state management.

**Predictability**: Game state transitions must be deterministic and serializable. All game logic should be pure functions or clearly isolated side effects.

### When Creating Files

- Place files in the appropriate directory according to the folder structure (see below)
- Match the naming conventions of existing files
- Use named exports for components, hooks, and utilities unless default exports are clearly established
- Include a JSDoc comment at the top explaining the file's purpose
- Import types explicitly with `type` keyword: `import type { Rune } from '../types/game'`

### When Modifying Files

- Preserve existing patterns and conventions
- Do not introduce new architectural patterns without explicit discussion
- Keep changes focused on the specific task
- Update related types, tests, and documentation as needed
- Never silently delete logic—always verify it's unused first

### When Making Architectural Decisions

- Consult the existing `Agents.md` document for agent roles and workflows
- Follow the established separation of concerns (UI components, game logic, state management)
- Keep game rules in `src/utils/` or dedicated logic modules, not in React components
- Maintain serializable state for future multiplayer/backend expansion
- Document significant decisions in code comments or ADRs

---

## Folder Structure & File Placement

```
src/
├── assets/                 # Static assets (SVGs, sounds, images)
│   ├── artefacts/
│   ├── runes/
│   ├── sounds/
│   └── stats/
├── components/             # Reusable UI components (domain-agnostic)
│   ├── ArtefactsRow.tsx
│   ├── ArtefactsView.tsx
│   ├── ClickSoundButton.tsx
│   ├── FieldConfig.tsx
│   ├── RuneAnimation.tsx
│   ├── RuneCell.tsx
│   ├── SettingsOverlay.tsx
│   ├── SliderConfig.tsx
│   ├── StatBadge.tsx
│   ├── TooltipBubble.tsx
│   ├── VolumeControl.tsx
│   └── layout/
│       ├── Button.tsx
│       ├── Grid.tsx
│       ├── index.ts
│       └── Modal.tsx
├── examples/               # Example / demo components or pages
├── features/               # Feature-scoped UI (gameplay screens)
│   └── gameplay/
│       └── components/
│           ├── Center/
│           │   ├── GameMetadataView.tsx
│           │   ├── Runeforge.tsx
│           │   ├── RuneSelectionTable.tsx
│           │   └── RuneTypeTotals.tsx
│           ├── DeckDraftingModal.tsx
│           ├── DeckOverlay.tsx
│           ├── GameBoardFrame.tsx
│           ├── OverloadOverlay.tsx
│           ├── ProgressStatOverlay.tsx
│           ├── RulesOverlay.tsx
│           ├── SoloGameBoard.tsx
│           ├── SoloGameOverModal.tsx
│           ├── SoloStartScreen.tsx
│           ├── SoloRuneScoreOverlay.tsx
│           ├── WallCell.tsx
│           └── Player/
│               ├── CardView.tsx
│               ├── PatternLines.tsx
│               ├── PlayerBoard.tsx
│               ├── ScoringWall.tsx
│               └── StatsView.tsx
├── hooks/                  # Custom React hooks
│   ├── useArcaneDustSound.ts
│   ├── useBackgroundMusic.ts
│   ├── useClickSound.ts
│   ├── useGameActions.ts
│   ├── useGameState.ts
│   ├── useHealthChangeSound.ts
│   ├── useRunePlacementAnimations.ts
│   └── useRunePlacementSounds.ts
├── routes/                 # Minimal route/screens
│   ├── CampaignMap.tsx
│   ├── DeckBuilder.tsx
│   ├── Developer.tsx
│   ├── MainMenu.tsx
│   ├── Matchmaking.tsx
│   ├── PostMatchRewards.tsx
│   └── SoloStartScreen.tsx
├── state/                  # Global state (Zustand stores)
│   └── stores/
│       ├── artefactStore.ts
│       ├── gameplayStore.ts
│       ├── index.ts
│       └── uiStore.ts
├── styles/                 # Style tokens and helpers
│   ├── gradientButtonClasses.ts
│   ├── tokens.ts
│   └── uiClasses.ts
├── systems/                # Game systems and side-effect orchestration
├── types/                  # TypeScript definitions
│   ├── artefacts.ts
│   └── game.ts
├── utils/                  # Pure utility functions and game logic
│   ├── arcaneDust.ts
│   ├── artefactEffects.ts
│   ├── artefactPersistence.ts
│   ├── deckDrafting.ts
│   ├── gameInitialization.ts
│   ├── mixpanel.ts
│   ├── overload.ts
│   ├── patternLineHelpers.ts
│   ├── runeCounting.ts
│   ├── runeEffects.ts
│   ├── runeHelpers.ts
│   ├── scoring.ts
│   ├── soloPersistence.ts
│   └── tooltipCards.ts
├── App.tsx                 # Root component
├── main.tsx                # Application entry point
└── index.css               # Global styles (minimal)
```

### Placement Rules


**`src/components/`**: Reusable, domain-agnostic UI components
- ✅ `RuneCell`, `RuneAnimation`, `VolumeControl` and other small UI pieces
- ❌ Game-specific screens like `SoloGameBoard` or `ScoringWall`

**`src/features/gameplay/components/`**: Game-specific UI components
- ✅ `GameBoard`, `PlayerView`, `Runeforge`, `PatternLines`, `ScoringWall`, overlays
- ✅ Player-centered components under `Player/` and center UI under `Center/`

**`src/hooks/`**: Custom React hooks for state access, audio and action adapters
- ✅ `useGameState`, `useGameActions`, audio hooks (e.g. `useClickSound`, `useBackgroundMusic`)
- ❌ Game rules — those belong in `src/utils/`

**`src/state/stores/`**: Global state management (Zustand stores)
- ✅ `gameplayStore.ts`, `artefactStore.ts`, `uiStore.ts`, and an index aggregator
- ❌ Storing non-serializable values or DOM refs in stores

**`src/types/`**: TypeScript type definitions
- ✅ Core domain types (`Rune`, `RuneType`, `RuneEffect`, `Player`, `GameState`, etc.)
- ✅ Discriminated unions and explicit interfaces

**`src/utils/`**: Pure functions and game logic
- ✅ Scoring calculations, rune helpers, deck/drafting logic, persistence helpers
- ❌ React components, hooks, or direct DOM interactions

**`src/assets/`**: Static assets (images, SVGs, audio). Keep these serialized and stable for builds.


---

## Coding Conventions

### React Rules

**Functional Components Only**: No class components. Use hooks for all state and side effects.

**Component Structure**:
```tsx
/**
 * ComponentName - brief description
 */

import type { SomeType } from '../types/game';

interface ComponentNameProps {
  someProp: SomeType;
  onAction?: () => void;
}

export function ComponentName({ someProp, onAction }: ComponentNameProps) {
  // Hooks at the top
  const [localState, setLocalState] = useState(initialValue);
  
  // Event handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div style={containerStyle}>
      {/* JSX */}
    </div>
  );
}
```

**Named Exports**: Use named exports for all components, hooks, and utilities unless the file clearly establishes a default export pattern.

**Props Interface Naming**: `ComponentNameProps` (e.g., `RuneTokenProps`, `GameBoardProps`)

**Event Handler Naming**: Use `handle` prefix (e.g., `handleRuneClick`, `handlePlacement`, `handleDraft`)

**UI Purity**: Keep UI components pure. No game logic, state mutations, or complex calculations in components. Delegate to hooks or utility functions.

**Memoization**: Use `useMemo`/`useCallback` only when profiling shows a performance need. Avoid premature optimization.

### TypeScript Rules

**Strict Mode**: Always enabled. No `any` types unless absolutely necessary (document with a comment if used).

**Explicit Types**: All exported functions, hooks, and public APIs must have explicit parameter and return types.

**Discriminated Unions**: Use discriminated unions for game domain concepts:
```typescript
export type RuneType = 'Fire' | 'Frost' | 'Poison' | 'Void' | 'Wind' | 'Lightning';

export type RuneEffect =
  | { type: 'PlusOne'; target: 'placement' }
  | { type: 'Double'; target: 'scoring' }
  | { type: 'MinusCost'; amount: number }
  | { type: 'None' };

export interface Rune {
  id: string;
  runeType: RuneType;
  effect: RuneEffect;
}
```

**Interface vs Type**:
- Use `interface` for object shapes (e.g., `Player`, `GameState`, `Rune`)
- Use `type` for unions, intersections, and aliases (e.g., `RuneType`, `TurnPhase`)

**Immutability**: All state updates must be immutable. Use spread operators or Immer (if integrated) for updates.

**Type Imports**: Import types explicitly with `type` keyword:
```typescript
import type { Rune, RuneType, GameState } from '../types/game';
```

### Styling Rules

**Inline CSS with JavaScript Style Objects**: This project uses inline CSS exclusively.

**Do NOT**:
- Add CSS files (except minimal global `index.css`)
- Introduce CSS-in-JS libraries (styled-components, emotion, etc.)
- Use Tailwind or utility class systems
- Mix CSS and inline styles on the same element

**Do**:
- Define styles as JavaScript objects:
  ```typescript
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
  };
  ```
- Extract repeated styles into constants within the component or a shared utility
- Use conditional styles with spread operator or ternary:
  ```typescript
  <div style={{ ...baseStyle, ...(isActive && activeStyle) }}>
  ```
- Define color constants for rune types:
  ```typescript
  const RUNE_COLORS = {
    Fire: '#FF4500',
    Frost: '#1E90FF',
    Poison: '#32CD32',
    Void: '#8B008B',
    Wind: '#F0E68C',
  };
  ```

**Responsive Design**: Use conditional rendering based on `window.innerWidth` or media query checks. Mobile-first approach (design for 375px minimum width).

---

## Zustand State Management

### Store Structure

**Single Root Store**: All game state lives in `src/state/gameStore.ts` (Zustand store).

**State + Actions Pattern**: The store contains both state and action functions:
```typescript
interface GameStore extends GameState {
  // State is inherited from GameState interface
  
  // Actions
  startGame: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType) => void;
  placeRunes: (patternLineIndex: number) => void;
  endRound: () => void;
  // ...
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  ...initializeGame(),
  
  // Action implementations
  draftRune: (runeforgeId, runeType) => {
    set((state) => {
      // Immutable state update logic
      return { ...state, /* updated fields */ };
    });
  },
  // ...
}));
```

**No Immer (Currently)**: State updates use manual immutability (spread operators). If Immer is added later, follow the same pattern but with mutable-looking updates inside `produce()`.

### Selector Hooks

**Custom Hooks for Selectors**: Define selector hooks in `src/hooks/useGameState.ts` to optimize re-renders:
```typescript

export function useFactories() {
  return useGameStore((state) => ({
    runeforges: state.runeforges,
    centerPool: state.centerPool,
  }));
}
```

**Action Hooks**: Define action hooks in `src/hooks/useGameActions.ts` for cleaner component code:
```typescript
export function useGameActions() {
  return {
    draftRune: useGameStore((state) => state.draftRune),
    placeRunes: useGameStore((state) => state.placeRunes),
    endRound: useGameStore((state) => state.endRound),
  };
}
```

### Rules for New State

- **All global game state** must use Zustand (do not introduce Redux, MobX, Recoil, or React Context for game state)
- **UI-only state** (overlay visibility, hover states, etc.) should use component-level `useState`
- **Derived state** should be computed in selectors or components, not stored
- **State must be serializable** (no functions, class instances, or DOM references in state)
- **Actions must be synchronous** (use `useEffect` in components for side effects like timers or audio cues)

---

## Framer Motion Conventions

### Primary Animation Library

**Framer Motion is the primary and only animation library**. Do not introduce alternative animation libraries (React Spring, GSAP, etc.) or CSS animations unless they are already established patterns.

### Animation Patterns

**`motion` Components**: Use `motion.div`, `motion.span`, etc. for animated elements:
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

**AnimatePresence**: Use for enter/exit animations:
```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {content}
    </motion.div>
  )}
</AnimatePresence>
```

**Reusable Animation Configs**: Extract repeated animation configs into constants:
```tsx
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

<motion.div {...fadeInUp}>
  {content}
</motion.div>
```

**Custom Easing**: Use custom easing functions for specific effects:
```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    duration: 0.5,
    ease: [0.4, 0.0, 0.2, 1], // Custom cubic-bezier
  }}
/>
```

**Staggered Animations**: Use delays for sequential animations:
```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.1 }}
  >
    {item.content}
  </motion.div>
))}
```

### Animation Guidelines

- **Prefer declarative animations** (`initial`, `animate`, `exit`) over imperative (`controls`)
- **Use spring physics** for natural motion: `transition={{ type: 'spring', stiffness: 300, damping: 30 }}`
- **Avoid mixing CSS animations and Framer Motion** on the same element
- **Respect `prefers-reduced-motion`** (if implemented, check before enabling animations)
- **Keep animations short** (0.2–0.5s for most UI transitions, 0.5–1s for game actions)

---

## Game Domain Model

### Core Concepts

**Rune Types** (5 elemental types):
- `Fire`: Red (#FF4500)
- `Frost`: Teal (#1E90FF)
- `Poison`: Green (#32CD32)
- `Void`: Purple (#8B008B)
- `Wind`: Blue (#1E90FF)
- `Lightning`: Yellow (#F0E68C)

**Rune Effects** (discriminated union):
```typescript
type RuneEffect =
  | { type: 'Damage'; amount: number; rarity: RuneEffectRarity } // Deals Damage
  | { type: 'Healing'; amount: number; rarity: RuneEffectRarity } // Heals
  | { type: 'Synergy'; amount: number; synergyType: RuneType; rarity: RuneEffectRarity } // Deals damage for every other rune of synergyType in the segment
  | { type: 'Fortune'; amount: number; rarity: RuneEffectRarity } // Adds Arcane Dust
  | { type: 'Fragile'; amount: number; fragileType: RuneType; rarity: RuneEffectRarity } // Deals damage only if fragileType is not present in the segment
```

**Game Structure**:
- **Runeforges** (5 for 2-player): Containers holding 4 runes each at round start
- **Center Pool**: Accumulates leftover runes when a runeforge is drafted from
- **Pattern Lines**: 5 tiers (capacity 1–5) where players place drafted runes
- **Scoring Wall**: 5×5 grid where completed pattern lines are scored
- **Floor Line**: Penalty area for overflow runes (max 7 slots)

**Turn Phases**:
```typescript
type TurnPhase = 'select' | 'place' | 'end-of-round' | 'scoring' | 'game-over';
```
- `select`: Player selects runes from runeforge or center
- `place`: Player places selected runes on pattern line or floor
- `end-of-round`: All runeforges and center are empty, trigger scoring
- `scoring`: Animated scoring sequence (move to wall, calculate power, clear floor)
- `game-over`: A player reaches 100+ damage, determine winner

### Domain Rules for Copilot

**Extend, Don't Invent**: When adding features, extend existing types and patterns. Do not create parallel type systems or duplicate concepts.

**Consistent Naming**: Match the established terminology:
- Use `runeforge`, not `factory` (legacy term)
- Use `wall`, not `grid` or `board`
- Use `patternLines`, not `buildLines` or `staging`
- Use `selectionTable`, not `centerPool`, `centerFactory` or `center`

**Serializable State**: All game state must be serializable (no functions, class instances, DOM refs). This ensures future multiplayer/backend integration.

**Pure Game Logic**: Game rules and calculations must be pure functions in `src/utils/`. Do not embed game logic directly in components or Zustand actions.

**Type Safety**: Use discriminated unions for rune types, effects, and turn phases. Leverage TypeScript's exhaustiveness checking:
```typescript
function handleEffect(effect: RuneEffect) {
  switch (effect.type) {
    case 'Damage':
      damage += effect.amount;
      break;
    case 'Healing':
      healing += effect.amount;
      break;
    case 'Synergy': {
      // Add amount to damage for each synergyType rune in the segment
      const synergyCount = runeTypeCounts.get(effect.synergyType) ?? 0;
      damage += effect.amount * synergyCount;
      break;
    }
    case 'Fortune':
      // Add amount to arcane dust
      arcaneDust += effect.amount;
      break;
    case 'Fragile': {
      // Add amount to damage if the segment has no fragileType runes
      const fragileTypeCount = runeTypeCounts.get(effect.fragileType) ?? 0;
      if (fragileTypeCount === 0) {
        damage += effect.amount;
      }
      break;
    }
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Do NOT Do These Things

**State Management**:
- Do not introduce Redux, MobX, Recoil, or other state libraries
- Do not use React Context for global game state (Zustand only)
- Do not store non-serializable data in Zustand (functions, DOM refs, class instances)

**Styling**:
- Do not add CSS files (except minimal global styles)
- Do not introduce CSS-in-JS libraries (styled-components, emotion, stitches, etc.)
- Do not use Tailwind or utility class systems
- Do not mix CSS animations and Framer Motion on the same element

**Animations**:
- Do not introduce alternative animation libraries (React Spring, GSAP, Anime.js, etc.)
- Do not use CSS keyframe animations unless already established

**Component Structure**:
- Do not create monolithic components mixing UI, logic, and state management
- Do not embed game logic directly in components (delegate to `src/utils/`)
- Do not use `useEffect` for complex imperative game logic (use Zustand actions)

**Architecture**:
- Do not add libraries without explicit user approval
- Do not introduce routing libraries (this is a single-page app)
- Do not create meta-progression features (deck building, unlocks, boss selection)—out of scope
- Do not implement backend integration or multiplayer—out of scope

**TypeScript**:
- Do not use `any` without documenting why it's necessary
- Do not create parallel type systems (extend existing types)
- Do not use `as` casts without exhausting type-safe alternatives first

---

## Future-Facing Guidance

### Design for Expansion

The codebase should remain resilient to future features without requiring major refactors. Keep these potential expansions in mind:

**Multiplayer State Syncing**:
- Keep game state serializable (no closures, class instances, or DOM references)
- All game actions should be deterministic (same input = same output)
- State updates should be described as events (for replay/undo/network sync)

**Backend Game State Validation**:
- Separate game logic from UI (keep scoring, placement rules in `src/utils/`)
- Pure functions can be shared between frontend and backend
- API contracts should match `GameState` structure

**Adding New Rune Types and Effects**:
- Use discriminated unions for extensibility
- New rune types require: type definition, color constant, SVG asset, effect implementation
- Effects are modular (`RuneEffect` union can be extended without breaking existing code)

**New Game Modes, Maps, or Screens**:
- New modes should extend `GameState` without altering core types
- Screens should be components in `src/features/` with clear navigation contracts

**Mobile and Steam Deck Expansion**:
- Mobile-first responsive design already established
- Use `window.innerWidth` or viewport checks for responsive behavior
- Touch-optimized interactions (overlay patterns for complex selections)
- Ensure 375px minimum width support

### Guidelines for Agents

When adding new features:
- **Maintain serializable, deterministic state** (for multiplayer/backend readiness)
- **Keep UI separate from logic** (for cross-platform reuse)
- **Use discriminated unions** (for type-safe extensibility)
- **Follow established patterns** (for consistency and maintainability)
- **Document architectural decisions** (for future contributors and AI agents)

---

## Summary

This document defines how Copilot Agents should work within the **Massive Spell: Arcane Arena** project. Follow these guidelines to maintain consistency, quality, and future-readiness:

1. **Analyze before creating**: Match existing patterns in components, state, types, and styles
2. **Stay in scope**: PvE gameplay only, no routing, no backend, no meta-progression (yet)
3. **Use the right tools**: Zustand for state, Framer Motion for animations, inline CSS for styles
4. **Keep logic pure**: Game rules in `src/utils/`, UI in components, state in Zustand
5. **Think ahead**: Write serializable, deterministic code for future multiplayer/backend expansion

When in doubt, refer to this document, the `Agents.md` workflow guide, or ask for clarification before making structural changes.
