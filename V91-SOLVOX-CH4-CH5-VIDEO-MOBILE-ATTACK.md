# Solvox V91 — Chapter 4/5 Video Backgrounds + Mobile Battle Polish

## Backgrounds
- Chapter 4 now uses the first newly supplied MP4 as `level4/chapter4-arena.mp4`.
- Chapter 5 now uses the second newly supplied MP4 as `level5/chapter5-arena.mp4`.
- Poster frames were generated for both videos.
- Replaced `level4/background.png` and `level5/background.png` were removed because they are no longer referenced.

## Mobile battle
- Player and boss are slightly larger than V88 on portrait screens while remaining constrained by the arena frame.
- Mobile question typography is reduced slightly and the question section height is shortened to keep the battle surface compact.
- Attack travel is now based on the actual CSS-space gap between fighters and converted back into each renderer's logical canvas space. This prevents mobile scaling from shortening the lunge.
- Desktop keeps the existing geometry and travel behavior.

## Cleanup
- Responsive source moved from `responsive-v87.css` to `responsive-v91.css`; the old responsive source was removed rather than stacked.

## V91 QA hotfix — 2026-09-28

Fixed a release-blocking QA regression in `qa-check.js`.

- The checker still tried to read deleted `frontend/src/styles/responsive-v87.css`.
- Updated the checker to use the active V91 stylesheet: `frontend/src/styles/responsive-v91.css`.
- Removed duplicated V88 fighter-sizing blocks from `responsive-v91.css` so V91 is the single mobile fighter sizing source.
- Updated responsive QA assertions to validate the V91 sizing values.
- `node qa-check.js` now passes.
