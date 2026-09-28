# V90 — Solvox Logo + Multiplayer Toolbar Cleanup

- Replaced the V84 SVG logo with the user-provided emerald/gold Solvox artwork as `solvox-logo-v89.png`.
- Removed the retired V83/V84 logo style/asset files and rewired the global brand + favicon.
- Removed `multi-toolbar-v25` / `multi-toolbar-v26` markup from Multiplayer.
- Removed the corresponding retired toolbar CSS from shared styles.
- Multiplayer dashboard remains visible and continues to refresh through existing lifecycle hooks; no gameplay/socket logic changed.
