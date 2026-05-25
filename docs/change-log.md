# Massive Spell: Arcane Arena Changelog

Compiled from PRDs; ordered by implementation.

## 1. Combat Redesign

- Implemented solo combat around hand, spell wall, enemy, player health, and armor.
- Replaced score-target victory with enemy HP defeat and a queued enemy Attack 5 intent.
- Added turn flow: draw up to 6 runes, cast matching wall slots, end turn, discard hand, enemy attacks, draw again.
- Made wall slots charge over turns, with effects resolving only when a slot completes.
- Returned wall, spent charge, hand, and discard runes to the deck on victory before opening draft rewards.

## 2. Rune + Artifact Effects

- Implemented registry-backed rune and artefact effects using serializable effect refs.
- Split rune data into rarity, cast effects, and passive effects.
- Made artefacts passive-only effect sources instead of hard-coded artefact-id branches.
- Kept active passive sources to completed wall runes and selected artefacts.
- Invalidated old persisted solo saves instead of migrating legacy combat state.

## 3. Rune Type Identities

- Implemented defined rarity ladders and identities for Fire, Frost, Life, Lightning, Void, and Wind.
- Added completed-wall-only counting for synergy, fragile, adjacency, targeting, passives, and mutation effects.
- Added deterministic damage, healing, armor, draw, dust, mutation, retrigger, pulse, explosive, and vampire rules.
- Made board mutation encounter-scoped, with destroyed, converted, returned, wall, and charge-spent runes recovered on victory.
- Prevented retrigger recursion and kept random targeting deterministic among eligible completed cells.

## 4. Dual-Type Wall Slots

- Replaced fixed rune wall slots with Fire/Void, Lightning/Wind, and Life/Frost slot families.
- Allowed empty unlocked slots to accept either rune in their family.
- Locked partial slots to the exact first real rune type until completion.
- Kept completed slots resolved and counted as the completing rune type.
- Invalidated existing solo saves for the new wall-slot state shape.

## 5. Rarity-Based Rune Resourcing

- Replaced row-based wall charge costs with rarity-based costs.
- Made Common runes cast immediately, Uncommon require 1 charge, Rare require 2, and Epic require 3.
- Made the first staged rune define slot type and charge requirement; later charge runes must match exact type.
- Made incomplete staged runes persist across turns without counting for synergy, passives, or completed-wall targeting.
- Made completed wall entries copies while physical staged and charge runes move through encounter zones only.

## 6. Victory Pack Drafting

- Replaced victory draft rows with six rune-type packs: Fire, Life, Wind, Frost, Void, and Lightning.
- Made each pack contain exactly 3 runes of the selected type.
- Guaranteed every generated pack has at least one uncommon-or-better rune.
- Allowed players to pick one pack or skip without adding runes.
- Removed draft artefact passives, Draft buttons, heal reward, max-health reward, Better Runes reward, and Robe multi-select behavior from this draft flow.

## Removed / Replaced Systems

- Runeforges.
- Pattern lines.
- Overload / Channel.
- RuneScore win condition.
- Connected-segment scoring.
- Row-based wall charge costs.
- Old victory draft row bonuses.
