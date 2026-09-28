# Solvox V63 — Battle Panel & Animation Polish

## What changed

- `SpriteCharacter.jsx`
  - Reused the stable frame-stepping approach from the V57 reference.
  - Removed cross-fade between sprite frames, which was producing visible ghosting/blinking.
  - Fixed player attack lunge: calculated `motionX` is now actually applied to the draw position.
  - Kept the V62 one-shot transition so attack/hurt return to idle without a blank render frame.
  - Removed unused motion state and the old smoothing helper.

- `BossMonster.jsx`
  - WebP attack/hurt/die sequences now use discrete frame rendering instead of cross-fading.
  - Attack impact timing remains synchronized to the sequence timeline.
  - Canvas remains the single animation renderer; CSS does not animate the WebP transform.
  - Removed unused smoothing/frame state.

- `battle-v43.css`
  - Refined `battle-question-panel-v43` into a cleaner three-column battle console.
  - Improved hierarchy, spacing, focus states, progress track, answer controls, hint rail, and keypad keys.
  - Added the existing `stage-frame-clean.png` reference asset as a subtle question-header ornament.
  - Removed the extra player canvas CSS drop-shadow to avoid duplicate filtering.

- Branding
  - Runtime branding is now `Solvox`.
  - Browser title, package names, game metadata, translations, server log, and current localStorage keys use Solvox.
  - Old Numericore / AljabarMaster storage keys remain only as migration fallbacks so existing progress/settings are not lost.

## Validation

- Project QA: PASS.
- JSON manifests: PASS.
- Sprite/Boss render guards: PASS.
- Full Vite build could not be executed in this environment because dependency installation timed out and the local `vite` package remained incomplete.
