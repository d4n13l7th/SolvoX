# V61 Integration Notes

## Player visual replacement
- Replaced the active single-player combat character with the provided Traveler animation pack.
- Added `frontend/src/data/playerAssets.js` as the single player sprite registry.
- Added `frontend/src/data/player.js` as the single active player identity/state source.
- Removed the legacy Wanderer player data module and sprite folder.
- Home and Battle player portraits now use the Traveler idle frame.

## Chapter 2 Wraith idle
- Replaced the placeholder one-frame Wraith idle with the supplied six-frame WebP sequence:
  `17.webp` through `22.webp`.
- `bossAssets.js` remains the single source of truth; no second Wraith renderer or animation controller was added.

## Regression protection
- QA now verifies Traveler frame counts, the new player registry, Wraith idle frame count, and SpriteCharacter delimiter balance.
- Legacy Wanderer sprite/data/portrait references are explicitly rejected.

## Scope
- Battle rules, HP calculations, attack distance, boss renderer, and existing Wolf/Wraith attack/hurt/die animations were left intact.
