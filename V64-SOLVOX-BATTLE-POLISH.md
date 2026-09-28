# Solvox V64 — Battle Attack + Hint/Keypad Polish

## Fixes
- Player and WebP boss attacks now apply lunge travel to the canvas element instead of drawing the sprite outside the canvas bitmap. This prevents attack poses from being clipped/invisible.
- Player attack keeps discrete frame stepping and adds a readable slash telegraph.
- Hint rail receives clearer hierarchy, usage status, numbered reveal cards, and a stable bottom action.
- Math keypad receives semantic number/operator/variable/power treatments, larger touch targets, clearer footer actions, and focus/hover states.
- Existing V43/V62 structure and runtime flow are preserved; this is a scoped polish layer.
