# V62 — Character animation + Multiplayer polish

## Changes
- Traveler canvas animation now uses time-based frame selection, cross-fading between adjacent frames, and smoother idle/attack/hurt/die motion.
- WebP boss animation now uses requestAnimationFrame timing and cross-faded adjacent frames instead of interval-based frame snapping.
- Multiplayer page is a dedicated scroll container with smooth scrolling, stable scrollbar space, sticky navigation, and horizontally scrollable dashboard tables.
- Multiplayer room and battle surfaces use staged entrance motion, active-player glow, attack anticipation/lunge/settle, hit recoil, damage numbers, smoother HP transitions, and improved question/answer transitions.
- Character picker selections receive subtle motion without introducing a second animation system.
- Reduced-motion handling is preserved.

## Architecture
No parallel renderer was introduced. Player motion remains in `SpriteCharacter`, boss motion remains in `BossMonster`, and multiplayer presentation remains in the existing `ui-v34.css` visual layer.
