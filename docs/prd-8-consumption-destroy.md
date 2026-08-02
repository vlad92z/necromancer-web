# Consumption and Destroy

## Contract

- `rune.consume`: remove a valid rune from the source owner's wall; source cannot target itself.
- `rune.destroy`: remove a valid rune from the opposing wall.
- Target may be any rune or require one rune type. Multi-type runes match any listed type.
- Selection is manual or random. Enemies always choose randomly.
- Missing target or Skip suppresses that wrapper's optional payload only; effects continue in listed order.
- Manual cast/start/end resolution pauses combat with committed prior state, valid board targets, and Skip.
- Removal clears only the wall copy. Consumption and Destroy both trigger on-removal effects; return-to-hand does not.

## Cards

- Headwind: `Consume a random Wind Rune to reduce incoming damage by 5` before shield. Multiple live Headwinds resolve in wall order while damage remains.
- Avalanche: `Destroy 1 Enemy Rune`; Golem Lord chooses randomly.
- Void Blast removed.

## Persistence

- Pending target and continuation are serializable combat state.
- Schema 29; older saves invalid.

## Unresolved Questions

None.
