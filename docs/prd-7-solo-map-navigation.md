# Solo Map Navigation

## Goal

Put a persistent traversable map between solo encounters.

## Tile Model

- Infinite integer grid; start tile `(0,0)`.
- All tiles use `tile_1.png`, native 256×256.
- Start tile: center `(128,128)`; connects to all 8 roads; no A–D encounters.
- Forest locations: A `(91,73)`, B `(137,100)`, C `(95,160)`, D `(156,190)`.
- Internal graph: A–B–C–D.
- Roads: A → left-75/top-75; B → top-195/right-75; C → left-155/bottom-75; D → right-155/bottom-195.
- Opposites preserve coordinate: left/right 75, left/right 155, top/bottom 75, top/bottom 195.

## Navigation

- Only graph-adjacent targets interactive.
- Frontier road click creates missing neighbor, then arrives at receiving road’s location.
- Existing neighbor exposes its connected location directly; no wind marker between discovered tiles.
- Cleared locations remain traversable.
- Camera centers player; all discovered tiles remain rendered.

## Markers

- Life: player.
- Fire: uncleared encounter.
- Frost: cleared encounter.
- Wind: unexplored frontier.
- Marker center uses supplied coordinate; art displays at 32×32.

## State + Flow

- Serializable tile record, encounters, player position, `soloPhase`, nullable active encounter.
- New Run → map.
- Cleared arrival → map movement only.
- Uncleared arrival → Goblin encounter → reward → Return to Map.
- Location clears only when leaving rewards.
- Continue restores map, encounter, or reward.
- Save schema 20; older saves invalid.
- Existing schema-20 navigation saves remain valid.

## Acceptance

- Start exposes 8 roads.
- Every road enters correct neighboring location.
- Backtracking works internally and across tiles.
- Discovered edges hide wind markers; duplicate tiles never created.
- Uncleared locations launch combat; cleared locations do not.
- Reward exit clears the active location and returns to the map.
- Pointer travel neutral; keyboard travel keeps real focus.

## Unresolved Questions

- None.
