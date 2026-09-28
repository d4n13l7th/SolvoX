# NumeriCore V55 — Code Cleanup & Battle UI Map

## Frontend ownership
- `frontend/src/App.jsx` — screen routing and top-level application state.
- `frontend/src/components/WorldMap.jsx` — Home/brand hub only.
- `frontend/src/components/Battle.jsx` — battle state machine, answer validation, HP, timing, completion data.
- `frontend/src/components/CombatStage.jsx` — fighter placement + animation commands only.
- `frontend/src/components/BattleQuestionPanel.jsx` — question, hint, answer field, and keypad UI only.
- `frontend/src/components/SpriteCharacter.jsx` — player animation system.
- `frontend/src/components/BossMonster.jsx` — boss animation/renderer, including Shadow Wolf.
- `frontend/src/components/Keypad.jsx` — math keypad key definitions and input behavior.
- `frontend/src/data/*.js` — content/configuration data; no layout CSS belongs here.

## Styling ownership
- `frontend/src/styles/app.css` — shared component primitives and non-battle application styling.
- `frontend/src/styles/ui-v42.css` — Home, mode select, activities, and chapter-select visual layers.
- `frontend/src/styles/battle-v43.css` — the **single source of truth for current Single Player battle geometry**.

## Battle panel spacing
`battle-question-panel-v43` no longer uses the previous negative margin/oversized width hack. It now fills the third grid row at `margin: 0`, with one unified shell and subtle internal separators.

## Removed/cleaned
- Dead legacy Battle root selectors that required V23/V24 page containers were removed from `app.css`.
- The stale direct-multiplayer branch in `WorldMap.jsx` is not present.
- The unused `finalizeQuestion` helper was removed from `Battle.jsx`.
- `feedback` is no longer passed as a dead prop to `BattleQuestionPanel`.
- Duplicate backend `clearTimer` helper is removed when present.
- Old Battle geometry is no longer mixed into `ui-v42.css`.

## Where to change future battle visuals
Start with `frontend/src/styles/battle-v43.css`. Avoid adding another numbered battle layout layer unless a genuinely new layout is introduced.
