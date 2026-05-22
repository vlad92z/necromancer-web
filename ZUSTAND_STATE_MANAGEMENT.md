# Zustand State Management Audit

## Scope

This document describes how game state is currently managed with Zustand in the solo gameplay flow. It focuses on:

- store boundaries
- what each store owns
- how data moves between stores and UI
- where responsibilities blur
- current inefficiencies
- practical improvement opportunities

## Store Inventory

Current Zustand usage is split across four stores:

1. `src/state/stores/gameplayStore.ts`
2. `src/state/stores/selectionStore.ts`
3. `src/state/stores/uiStore.ts`
4. `src/state/stores/artefactStore.ts`

This is already more modular than a single global store, but the boundaries are uneven. The gameplay store still acts as a central orchestrator for domain state, transient animation state, persistence triggers, analytics, navigation hooks, and cross-store coordination.

## High-Level Ownership

### Gameplay Store

`gameplayStore.ts` is the main game store. It owns almost all run-level and match-level state:

- game lifecycle: `gameStarted`, `gameIndex`, `round`, `isDefeat`
- board state: `player.patternLines`, `player.wall`, `runeforges`
- scoring state: `runePowerTotal`, `targetScore`, `overloadDamage`, `overloadRunes`
- progression state: `fullDeck`, `deckDraftState`, `deckDraftReadyForNextGame`, `activeArtefacts`
- transient flow flags: `turnPhase`, `runeforgeDraftStage`, `lockedPatternLines`, `shouldTriggerEndRound`
- animation/display state: `scoringSequence`, `overloadSoundPending`, `channelSoundPending`
- tooltip UI state: `tooltipCards`, `tooltipOverrideActive`

It also owns the largest action surface:

- run lifecycle: `startSoloRun`, `prepareSoloMode`, `hydrateGameState`, `returnToStartScreen`, `startNextSoloGame`, `resetGame`
- drafting/placement: `draftRune`, `placeRunes`, `placeRunesInFloor`, `cancelSelection`, `autoPlaceSelection`
- resolution: `moveRunesToWall`, `endRound`
- deck drafting: `selectDeckDraftRuneforge`, `disenchantRuneFromDeck`
- tooltip controls: `setTooltipCards`, `resetTooltipCards`

In practice, this store is both:

- the domain state container
- the workflow engine for the solo run

### Selection Store

`selectionStore.ts` isolates rune-selection flow:

- `selectedRunes`
- `draftSource`
- `selectionTimestamp`
- `activeElement`

This store is responsible for the "selected runes pending placement" state that would otherwise bloat the gameplay store further. That split is useful because selection changes are high-frequency and UI-driven.

### UI Store

`uiStore.ts` owns overlay and sound preferences, plus some animation bookkeeping:

- overlays: rules, deck, overload, runeforge, settings
- audio settings: `soundVolume`, `isMusicMuted`, `hasMusicSessionStarted`
- placement display helpers: `hiddenPatternLines`, `playerHiddenPatternSlots`, `animatingRuneIds`, `isPlacementAnimating`

This store contains both durable UI preferences and ephemeral per-frame style state.

### Artefact Store

`artefactStore.ts` owns meta-progression and pre-run loadout state:

- `ownedArtefactIds`
- `selectedArtefactIds`
- `arcaneDust`

This is the cleanest store conceptually. Its state is small, focused, and easy to reason about.

## How State Flows Today

## 1. Game boot

`initializeSoloGame()` in `src/utils/gameInitialization.ts` creates the base `GameState`.

`useGameplayStore` initializes from that function directly. The store is not using Zustand middleware such as `persist`; instead, persistence is managed manually.

`SoloStartScreen.tsx`:

- calls `prepareSoloMode()`
- reloads artefact state via `useArtefactStore`
- optionally hydrates a saved run via `hydrateGameState()`

## 2. Rune drafting

`draftRune()` in `gameplayStore.ts` reads from `selectionStore` first.

Behavior:

- if a selection already exists, the same click path is reused to attempt auto-placement
- otherwise it finds matching runes in one or more runeforges
- it writes selection data into `selectionStore`
- gameplay state itself may not change at all for the draft click

This is an important design choice: selection is not modeled as gameplay state, but placement resolution still lives in the gameplay store and reaches into the selection store synchronously.

## 3. Placement

Placement is split between:

- `placeSelectionOnPatternLine()`
- `placeSelectionInFloor()`
- `attemptAutoPlacement()`

These helpers:

- read selected runes from `selectionStore`
- validate placement against gameplay state
- mutate board state inside gameplay store
- clear selection through `useSelectionStore.getState().clearSelection()`
- sometimes trigger defeat
- sometimes enter deck draft mode

This means the placement pipeline spans multiple stores, but the orchestration is centralized in gameplay actions.

## 4. Scoring and round resolution

`moveRunesToWall()`:

- resolves completed pattern lines
- writes to wall state
- computes scoring steps
- stores `scoringSequence`
- updates health, armor, rune power, arcane dust
- may trigger deck-draft mode
- may launch a timeout-driven scoring animation sequence

`GameContainer.tsx` then reacts to gameplay flags with `useEffect`:

- if completed lines exist, it schedules `moveRunesToWall()`
- if `shouldTriggerEndRound` is true, it schedules `endRound()`

So some workflow control is in the store, and some is in component effects.

## 5. Persistence

Persistence is manual and duplicated:

- `attachSoloPersistence()` subscribes to the gameplay store and saves the whole state to localStorage whenever `gameStarted` is true
- `SoloStartScreen.tsx` also subscribes to the gameplay store and saves/clears solo state again

Artefact persistence is also manual:

- the artefact store reads localStorage at initialization
- actions call `saveSelectedArtefacts()`, `saveOwnedArtefacts()`, and `saveArcaneDust()` directly

UI settings persistence is also manual:

- `uiStore.ts` reads `soundVolume` and `musicMuted` from localStorage on init
- write actions persist directly to localStorage

## 6. Cross-store coupling

The gameplay store directly reaches into other stores with `getState()`:

- `useSelectionStore.getState()` for selection lifecycle
- `useArtefactStore.getState()` for arcane dust and selected artefacts

This makes the gameplay store the orchestration center, but it also means store boundaries are not independent. They are split physically, but not fully separated behaviorally.

## What Is Working Well

### Useful splits already exist

The decision to keep artefacts, selection, UI, and gameplay in separate stores is directionally correct. The codebase is not locked into a single monolithic global store.

### Domain logic is often extracted into utilities

The gameplay store delegates substantial logic to utility modules:

- `scoring.ts`
- `deckDrafting.ts`
- `patternLineHelpers.ts`
- `artefactEffects.ts`
- `overload.ts`

This helps keep some game rules outside React and outside the store body.

### Most components use selector-based access

Components now read Zustand state through dedicated selector/action hooks in:

- `src/hooks/useGameState.ts`
- `src/hooks/useGameActions.ts`

Most component-level store access has been normalized behind narrow selectors, which is better than reading full stores or scattering many direct subscriptions through UI files.

## Current Inefficiencies And Separation Problems

## 1. Gameplay store is too broad

`gameplayStore.ts` currently mixes:

- durable domain state
- transient UI state
- animation sequencing
- persistence side effects
- analytics
- navigation integration

Examples:

- `tooltipCards` and `tooltipOverrideActive` are UI presentation state, not core gameplay state
- `overloadSoundPending` and `channelSoundPending` are audio trigger flags
- `scoringSequence` is animation/display state
- `navigationCallback` is routing integration held in module scope
- `scoringTimeoutRef` is imperative timer state held beside the store

This reduces readability because "gameplay store" no longer means one concern.

## 2. Cross-store writes inside gameplay actions create tight coupling

Gameplay helpers call into other stores directly:

- clearing selection during placement and round reset
- updating arcane dust during scoring and deck transitions
- reading selected artefacts during run start

This works, but it means the store boundaries are not composable. The gameplay store cannot be understood in isolation because its effects spill into selection and artefact stores.

## 3. Solo persistence ownership is now centralized

Solo run persistence is now owned by `attachSoloPersistence()` in `gameplayStore.ts`.

`SoloStartScreen.tsx` no longer saves or clears solo state. It is responsible only for:

- boot/loading persisted state
- deriving `Continue Run` visibility from storage
- updating longest-run UI

This removes duplicate writes and gives persistence a single owner at the gameplay store boundary.

## 4. Some store state is intentionally non-serializable

`uiStore.ts` stores:

- `Set<number>`
- `Set<string>`

These are fine for local UI usage, but they conflict with the project’s stated preference for serializable state. They also make future persistence, replay, or devtools inspection less straightforward.

This is not a bug in current behavior, but it is architectural drift.

## 5. Selector discipline is improved, but still policy-sensitive

The previous broad component subscriptions have been removed:

- `ArtefactsView.tsx` no longer subscribes to the full artefact store
- `SoloStartScreen.tsx` uses narrow selector hooks for render state and actions

Selector access is now centralized behind hook helpers, and grouped selectors use shallow-stable output.

Current state:

- `useGameState.ts` is no longer minimal; it provides dedicated gameplay, artefact, selection, and UI selectors
- `useGameActions.ts` now exists and centralizes grouped action access
- `useFactories()` now uses a shallow-stable selector instead of returning an unstable object literal

Remaining caveat:

- `SoloStartScreen.tsx` still uses `useGameplayStore.subscribe(...)` for longest-run UI sync; this is intentional and is not a render-subscription problem

So the codebase is no longer inconsistent about selector usage in components, but the selector surface now needs maintenance discipline to avoid drifting back toward ad hoc store access.

## 6. Workflow is split between store flags and component timers

Round progression currently depends on both store state and component `useEffect`s.

Examples:

- gameplay store sets `shouldTriggerEndRound`
- `GameContainer.tsx` waits 1 second and then calls `endRound()`
- gameplay store stores `scoringSequence`
- `GameContainer.tsx` watches board completion and later calls `moveRunesToWall()`

This works, but the lifecycle is spread across two layers:

- store decides what should happen
- component decides when it actually happens

That split makes flow harder to trace and test.

## 7. State shape drift is present

Several actions write keys that do not match the declared `GameState` contract:

- `totalRunesPerPlayer`
- `game`
- `strain`
- `soloDeckTemplate`
- `soloBaseTargetScore`

At the same time, the formal state shape uses:

- `gameIndex`
- `overloadDamage`
- `fullDeck`
- `baseTargetScore`

This is a maintainability problem. Even if runtime behavior is acceptable, it makes the state model less trustworthy and increases the chance of subtle bugs during hydration and progression.

## 8. Side effects are embedded directly in store actions

Gameplay and artefact actions perform:

- localStorage writes
- analytics tracking
- cross-store updates
- timeout scheduling

This reduces separation of concern. The actions are no longer pure state transitions plus a thin effect layer; they are the effect layer too.

## 9. State access intent now matches implementation better

Project guidance mentioned a `useGameActions.ts` pattern, and that file now exists in the current codebase alongside `useGameState.ts`.

That is an improvement because:

- documented state-access guidance now matches the code more closely
- component dependencies are easier to scan
- selector grouping is explicit instead of implicit at each call site

The remaining risk is not missing infrastructure anymore; it is keeping these hooks as the canonical access layer rather than allowing direct store usage to reappear in components.

## Readability Impact

The current code is still readable locally inside individual functions, but global readability suffers for three reasons:

1. responsibility spread: one gameplay action may update gameplay state, selection state, artefact state, storage, analytics, and timers
2. hidden dependencies: `getState()` calls and module-level refs make side effects less visible at the call site
3. mixed abstraction levels: pure scoring logic and UI timing flags live in the same store

The result is not that Zustand is the problem. The problem is that the main store has become the place where every concern meets.

## Improvement Opportunities

## Near-term, low-risk improvements

### 1. Tighten selectors everywhere

Status: completed.

Changes made:

- replaced the remaining full-store component subscription in `ArtefactsView.tsx`
- normalized component access behind `useGameState.ts` and `useGameActions.ts`
- added dedicated selector/action hooks for gameplay, artefact, selection, and UI
- used shallow-stable grouped selectors for object-returning hooks

Current benefit:

- fewer unnecessary renders from broad subscriptions or unstable grouped selectors
- more readable component dependencies
- a single access-layer convention for Zustand usage in UI code

Follow-up guidance:

- keep direct `use*Store(...)` usage inside hook modules or intentional imperative subscription sites
- prefer scalar selectors when a component needs one field
- prefer grouped shallow selectors when a component needs a coherent bundle of fields

### 2. Remove duplicate solo persistence

Choose one persistence owner.

Preferred options:

- keep persistence at the store boundary only
- or move it fully to a dedicated persistence module/hook

Do not keep both `attachSoloPersistence()` and `SoloStartScreen` save subscriptions.

Expected benefit:

- single persistence policy
- fewer duplicate localStorage writes
- easier hydration/debugging

### 3. Normalize state shape

Audit and remove undeclared legacy keys:

- `game`
- `strain`
- `soloDeckTemplate`
- `soloBaseTargetScore`
- `totalRunesPerPlayer`

Use only canonical `GameState` fields.

Expected benefit:

- stronger type trust
- less ambiguity during reset/hydration

### 4. Move tooltip state out of gameplay store

`tooltipCards` and `tooltipOverrideActive` are presentation state. They belong in a UI-focused store or local feature state.

Expected benefit:

- cleaner domain store
- clearer separation between board state and tooltip rendering

### 5. Move sound trigger flags out of gameplay store

`overloadSoundPending` and `channelSoundPending` are event-like UI/audio signals. They are not durable game state.

Preferred direction:

- emit UI events from a thin effect layer
- or move ephemeral trigger flags into `uiStore`

Expected benefit:

- gameplay store becomes more domain-centric

## Medium-term structural improvements

### 6. Split gameplay store by concern, not only by feature count

Current split:

- gameplay
- selection
- UI
- artefacts

Suggested gameplay decomposition:

- `gameplaySessionStore` or `runStore`: run state, progression, lifecycle
- `boardStore` or board slice: runeforges, pattern lines, wall, overload runes
- `resolutionStore` or resolution slice: scoring sequence, delayed resolution, end-round flags

This does not require separate Zustand stores if that feels heavy. Slices inside one store could also work. The important change is clearer ownership.

Expected benefit:

- smaller files
- clearer state contracts
- easier isolated tests

### 7. Extract orchestration/services from store actions

Store actions should mainly:

- validate inputs
- compute next state
- commit next state

External orchestration modules should handle:

- analytics
- persistence
- timers
- cross-store coordination

Examples:

- `soloRunPersistence.ts`
- `gameplayEffects.ts`
- `gameplayOrchestrator.ts`

Expected benefit:

- actions easier to reason about
- fewer hidden dependencies
- better testability

### 8. Consolidate the round-resolution state machine

Right now round progression depends on flags plus component timers.

Better options:

- explicit resolver service outside React
- or explicit state machine style phases inside gameplay resolution

Possible phase refinement:

- `select`
- `resolving-placement`
- `resolving-score`
- `resolving-end-round`
- `deck-draft`

Then one place owns timing and transitions.

Expected benefit:

- easier lifecycle tracing
- fewer component-side orchestration effects

### 9. Keep UI-only ephemeral data out of serializable stores where possible

Candidates:

- `hiddenPatternLines`
- `playerHiddenPatternSlots`
- `animatingRuneIds`
- maybe `activeElement`

These can live in:

- local component state
- feature-scoped context
- a UI animation store if shared globally

If they must stay in Zustand, prefer serializable arrays over `Set` for consistency with project goals.

Expected benefit:

- closer alignment with stated architecture
- easier persistence and inspection later

## Recommended Target Shape

If optimizing for modularity and readability, the clearest target would be:

### Domain stores

- gameplay/run domain store
- artefact/meta-progression store

### UI stores

- selection and input store
- overlay/audio/preferences store
- optional animation/ephemeral presentation store

### Services around stores

- persistence service
- analytics service
- gameplay orchestration service

That preserves Zustand as the state container, but stops using one large store as the place where all app behaviors converge.

## Practical Refactor Order

1. replace broad subscriptions with selectors
2. remove duplicate solo persistence ownership
3. normalize gameplay state shape and remove legacy keys
4. move tooltip/audio trigger state out of gameplay store
5. extract round-resolution orchestration from component effects and store helpers
6. decide whether the remaining gameplay store should become slices or multiple stores

This order keeps risk controlled and improves readability early.

## Summary

Current Zustand usage is functional and already partly modular, but the main gameplay store is carrying too many concerns.

The biggest issues are not "too many stores." The bigger issues are:

- orchestration concentrated in `gameplayStore.ts`
- duplicated persistence logic
- cross-store coupling through direct `getState()` access
- non-domain UI state mixed into domain state
- selector discipline now improved, but still dependent on keeping hooks as the only component access layer
- state shape drift

The best improvement path is incremental:

- keep selector access centralized in hooks
- centralize persistence
- normalize the state contract
- move UI/presentation concerns out of gameplay
- then split orchestration responsibilities more deliberately

That will improve modularity and separation of concern without making the architecture harder to read.
