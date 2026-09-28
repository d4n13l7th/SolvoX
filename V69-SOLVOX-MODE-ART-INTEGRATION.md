# Solvox V69 — Mode Art Integration

## Changes

- Added the provided Single Player hero artwork to the mode-selection menu.
- Added the provided Multiplayer hero artwork to the mode-selection menu.
- Replaced the previous V42 mode-card implementation with the V45 mode-card component and stylesheet.
- Removed the old mode-select rules from `ui-v42.css` to avoid duplicate cascade/overrides.
- Kept the mode actions, localization, and navigation callbacks unchanged.
- Kept the existing background video and non-mode shared UI styles intact.

## Asset usage

- `frontend/public/assets/ui/modes/single-player-hero.png`
- `frontend/public/assets/ui/modes/multiplayer-hero.png`

## Cleanup

The old mode-select card icons/glow DOM from V42 are no longer rendered.
No existing shared PixelIcon assets were deleted because they are still used elsewhere in the application.
