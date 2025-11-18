# AGENTS.md

**Massive Spell: Arcane Arena --- Engineering Standards for AI Agents**

This document defines how AI agents must work within this repository.
Follow all rules precisely. Do not deviate from established patterns.

## 1. Project Overview (for context only)

-   **React 19 + TypeScript (strict)**
-   **Vite 7**
-   **Zustand 5** for global game state
-   **Framer Motion 12** for all animations
-   **Inline CSS (style objects)** --- no CSS libraries
-   Single-page PvE game (no routing, no backend)

Only implement features within this scope.

## 2. General Agent Behavior

### 2.1 Core Principles

-   Match existing patterns.
-   Prefer incremental changes.
-   Preserve architecture.
-   Keep logic pure/deterministic.
-   State must remain serializable.
-   Respect folder & naming conventions.

### 2.2 When Creating Files

-   Place files in correct directories.
-   Use named exports.
-   Add a brief JSDoc header.
-   Use type-only imports.

### 2.3 When Modifying Files

-   Follow existing conventions.
-   Keep changes isolated.
-   Update related types/utilities.
-   Don't delete logic without verifying it's unused.

## 3. Folder Responsibilities

    src/
    ├── assets/
    ├── components/          # Reusable generic UI components
    ├── features/
    │   └── gameplay/
    │       └── components/  # Game-specific UI
    ├── hooks/               # Zustand selector/action hooks
    ├── routes/              # Minimal routing (if any)
    ├── state/               # Zustand store(s)
    ├── styles/              # Tokens (colors, spacing)
    ├── systems/             # Game systems
    ├── types/               # Domain types
    ├── utils/               # Pure game logic
    ├── App.tsx
    └── main.tsx

### Placement rules

-   Reusable UI → `src/components/`
-   Gameplay UI → `src/features/gameplay/components/`
-   Pure logic → `src/utils/`
-   State → `src/state/`
-   Selector/action hooks → `src/hooks/`

## 4. Coding Conventions

### 4.1 React

-   Functional components only.
-   Pure components (no logic).
-   Structure:

``` tsx
/**
 * ComponentName - description
 */
interface ComponentNameProps {}

export function ComponentName(props: ComponentNameProps) {
  // hooks
  // handlers
  return <div />;
}
```

### 4.2 TypeScript

-   Strict mode.
-   No `any` unless justified.
-   Explicit return types.
-   Discriminated unions for domain types.
-   Use `import type`.

## 5. State Management (Zustand)

-   Single global store: `src/state/gameStore.ts`.
-   Store = state + synchronous actions.
-   Side effects (AI, timers) go in components (`useEffect`).
-   State must be serializable.
-   Selector hooks in `src/hooks/useGameState.ts`.
-   Action hooks in `src/hooks/useGameActions.ts`.

## 6. Game Logic Rules

-   All game logic must be pure functions in `src/utils/`.
-   Components cannot:
    -   compute scoring
    -   mutate arrays
    -   perform AI logic
    -   implement placement rules

## 7. Styling Rules (Strict)

Allowed: - Inline CSS (`React.CSSProperties`) - Style objects -
Conditional merges

Forbidden: - Tailwind - CSS Modules - Styled-components - Emotion -
Additional CSS files (except minimal global) - CSS animations

## 8. Animation Rules (Framer Motion Only)

Allowed: - `motion.div`, `motion.span`, etc. - Variants -
AnimatePresence - Spring transitions - Staggered animations

Forbidden: - React Spring - GSAP - CSS keyframes

### Example:

``` tsx
<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} />
```

## 9. Naming Conventions

### Components

-   PascalCase
-   `ComponentName.tsx`
-   Props interface = `ComponentNameProps`

### Hooks

-   `useSomething.ts`
-   Examples: `useGameState`, `useGameActions`

### Zustand

-   `gameStore.ts`
-   `useGameStore`

### Types

-   `Rune`, `GameState`, `Player`, `TurnPhase`
-   `RuneType`, `RuneEffect`

## 10. Anti-Patterns (Forbidden)

-   New state libraries (Redux, MobX, Recoil)
-   New styling systems
-   New animation libraries
-   Mixing UI with logic
-   Storing non-serializable state
-   Duplicating domain types
-   Monolithic components
-   Adding routing/backends/multiplayer without instruction

## 11. Task Execution Rules

1.  Match patterns.
2.  Place files correctly.
3.  Keep logic pure.
4.  Keep UI pure.
5.  Keep state deterministic.
6.  Use only Zustand, Framer Motion, inline CSS.
7.  Extend types safely.

### When uncertain:

Follow existing patterns---do not invent new architecture.

### Large changes:

Explain the plan first.

## 12. Summary

-   Follow conventions exactly.
-   Never introduce new paradigms.
-   Keep UI pure, state serializable, and logic isolated.
-   Use Zustand + Framer Motion + inline CSS only.
-   Extend domain types safely.
-   Small, incremental changes only.

Match existing patterns. Keep changes minimal. Preserve architecture.
