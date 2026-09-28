# V80 — Solvox Responsive Portrait + Full English Content

## Scope
- Added a portrait-first responsive layer for desktop and phone layouts.
- Removed the old landscape recommendation overlay.
- Single Player questions now localize text, context, concepts, hints, error tags, and per-question feedback from the same fixed 50-question pack.
- Multiplayer backend now serves the English question pack when a room is created with `lang: 'en'`.
- Chapter evaluation messages now switch between Indonesian and English using the active language.
- Chapter 5 story-question scrolling remains isolated to Chapter 5.

## Cleanup
- Removed the unused `OrientationNotice.jsx` component.
- Removed the obsolete `landscapeRecommended` / `landscapeHint` translation keys.
- No gameplay state machine or battle layout hierarchy was replaced; the responsive layer changes geometry only.
