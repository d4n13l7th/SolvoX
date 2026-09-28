# V77 — Solvox Home Menu Rework

## Home composition
- Replaced the old RPG dashboard-style Home composition with a menu-first layout inspired by the supplied reference screenshot.
- Kept the existing Solvox cinematic Home background video unchanged.
- Added the supplied green Solvox logo as the Home brand artwork.
- Home navigation is now a clean vertical text menu with four entries: Main, Dashboard, Settings/Pengaturan, Feedback.
- Removed utility icons from those four Home navigation entries.
- Active Main item uses a small CSS diamond marker instead of an icon asset.
- Removed the old Home hero title/description, continue/profile action buttons, top profile chip, status rail, character layer, footer progress controls, and next-destination banner from the rendered Home screen.

## Cleanup
- Renamed `WorldMap.jsx` to `HomeMenu.jsx` because the screen is no longer a world map.
- Removed the unused Home-only `main` utility icon mapping and its PNG assets.
- Removed legacy `home-v31` CSS from the shared style files and replaced it with one dedicated `home-menu-v77.css` source of truth.
- Removed obsolete Home-only translation keys that are no longer referenced.
- No Battle, boss, chapter, question, hint, keypad, evaluation, multiplayer, settings, or feedback gameplay logic was changed.

## Validation
- Existing static/regression QA: PASS.
- JavaScript/JSX transpile check: PASS (37 source files).
- CSS parse check: PASS.
- No `home-v31` selectors or retired Home hero strings remain in `frontend/src`.
- Production Vite build was not run because project dependencies are not installed in this source package.
