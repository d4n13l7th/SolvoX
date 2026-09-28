# V84 — SOLVOX Logo + Mode Background Video

## Logo
- Replaced the V83 HTML/CSS wordmark with a single SVG brand asset rendered by the reusable `SolvoxBrandLogo` component.
- The SVG follows the supplied logo concept: fantasy serif SOLVO wordmark, emerald/crystal fill, gold edging, custom crossed-blade X, crystal core, orbit energy and sparkles.
- The whole visual is contained in one SVG for crisp responsive scaling and a matching SVG favicon is wired through `index.html`.
- Removed the obsolete V83 HTML/CSS logo implementation and standalone V83 logo asset.

## Mode selection background
- Single Player / Multiplayer selection now uses the exact same home background video as the Home screen:
  - `/assets/home/home-background-v83.mp4`
  - `/assets/home/home-background-v83-poster.jpg`
- The previous mode-selection video source was removed from `ModeSelect.jsx`.
- The old cinematic background asset is retained because Chapter Select still references it; it was not deleted because it remains in active use.

## Cleanup
- No duplicate logo component remains.
- No duplicate V84 mode background asset is created; Home and Mode Select share one source video.
