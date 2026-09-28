# Solvox V65 — Battle Readability + Player Visibility

## Fixed
- Corrected the player canvas transport line from an undefined `c.style` to `canvas.style`.
- Added a stable player canvas visibility/overflow guard.
- Kept the V64 transform-based attack transport without reverting the V64 renderer.

## Battle UI polish
- Added a dedicated question-copy surface for stronger hierarchy.
- Darkened and cleaned the answer field so it matches the battle console instead of browser/default input styling.
- Strengthened the attack button as the primary combat action.
- Increased hint title/body typography for easier reading.
- Kept keypad styling from V64 intact.

No legacy battle renderer was reintroduced.
