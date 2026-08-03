# Consumption and Destroy

## Contract

- `rune.consume`: on cast, replace one eligible occupied slot with the new rune. The target wall is explicitly self or opponent.
- `rune.destroy`: remove up to the configured count of eligible runes from the explicitly configured self or opponent wall. Self-Destruction excludes the source.
- Target may be any rune or require one rune type. Multi-type runes match any listed type.
- Selection is manual or random. Enemies resolve choices randomly.
- A Consume card with no target cannot be cast. Destroy resolves against every available target up to count, including zero.
- Manual multi-Destroy pauses with committed prior state until the count is met or no eligible target remains. It cannot be skipped.
- Consume and Destroy trigger ordered on-removal effects. Consume then places the cast rune in the vacated cell; the destination wall owns its passives.

## Cards

- Headwind: `Destroy a random Wind rune on your wall to reduce incoming damage by 5` before shield. Multiple live Headwinds resolve in wall order while damage remains.
- Amplify Magic destroys one random other rune on its wall at end turn.
- Avalanche: `Destroy a rune`; Golem Lord chooses randomly from the player's wall.
- Void Blast removed.

## Persistence

- Pending Destroy target, remaining count, and continuation are serializable combat state.
- Schema 39; older saves invalid.

## Unresolved Questions

None.
