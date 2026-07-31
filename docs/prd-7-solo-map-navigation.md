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
- Save schema 27; older saves invalid.

## Greenwood Final Boss

- Each newly discovered forest tile rolls once for a boss: 5% on the first tile, then +5 percentage points per tile, capped at 100%.
- Boss placement excludes the receiving location used to enter a newly discovered tile.
- Only one boss is placed. Greenwood selects randomly from its boss list; currently Golem Lord only.
- Empty tiles remain discoverable after normal events run out until the boss appears. Frontier exploration then closes once both the event pool is empty and the boss exists.
- Golem Lord: 50 health, Life-only enemy board, `golem.png`; repeats four Barricades, three Hurl Rocks, then one Avalanche.
- Hurl Rock costs 2 and deals 8 damage. Avalanche costs 5 and clears the topmost fullest player-wall row; removed wall copies do not affect card zones or the permanent deck.
- Zero boss health or a full player wall ends the adventure immediately in victory, without card or Arcane Dust rewards.

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
