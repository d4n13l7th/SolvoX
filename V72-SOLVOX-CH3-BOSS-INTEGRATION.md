# V72 — Solvox Chapter 3 Boss Integration

- Replaced the unused Chapter 3 SVG boss fallback with the uploaded WebP dragon boss (`Equation Drake`).
- Added idle (6), attack (9), hurt (6), and die (5) frame packs.
- Added a 3-frame elemental attack effect as a dedicated effect sequence.
- Added a pending-command guard so an early first attack cannot be lost while WebP assets are still preloading.
- Widened the canvas transport lane so attack motion/effect does not get clipped by the bitmap boundary.
- Kept existing Wolf/Wraith and Chapter 4/5 rendering paths intact.
- Removed retired Chapter 1/2/3 SVG boss renderers now that those chapters use the shared WebP asset pipeline.
- No uploaded manifest file is bundled into runtime because it is metadata only; only assets actually referenced by code are copied.
- Synchronized damage/impact timing in `Battle.jsx` to each boss asset's declared `impactMs`, so Chapter 3's elemental attack lands when its attack animation reaches the impact frame.
