# V70 — Solvox Brand Logo Integration

## Changes
- Added the supplied Solvox logo as the authoritative game-brand asset:
  `frontend/public/assets/ui/brand/solvox-logo.png`.
- Integrated the logo into the Home sidebar brand area.
- Integrated the logo into the global top bar used by secondary screens.
- Added the logo as the browser favicon in `frontend/index.html`.
- Added one dedicated stylesheet: `frontend/src/styles/brand-v46.css`.
- Removed unused legacy brand selectors from `app.css`, `ui-v32.css`, and `ui-v33.css` so the old sword/crest brand markup cannot conflict with the new logo.
- No gameplay, battle animation, chapter, hint, keypad, or multiplayer logic was changed.

## Asset handling
- The uploaded logo is used directly as the source artwork, with only transparent outer margin cropped for cleaner UI sizing.
- The source image retains transparency.

## Validation
- `node qa-check.js` => V61 QA STATIC + REGRESSION PASS
- `node qa-check.js` => V62 QA MOTION + MULTIPLAYER PASS
- Legacy brand selector search => no stale component/CSS references found.
