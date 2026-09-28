# Solvox V82 — Back Artwork + Multiplayer Header Frame

## Changes
- Replaced the shared Back button artwork with the supplied `frame_05.webp`.
- Removed the superseded `back.png` asset.
- Reused the existing V78 04B font only for the Back label (`Back` / `Kembali`), keeping body typography unchanged.
- Applied the new Back artwork to Multiplayer, Mode Select, Chapter Select, and Battle through the shared `SolvoxUtilityArt` registry.
- Removed the sticky viewport behavior from `multi-header-v26`.
- `multi-header-v26` is now a framed, responsive block inside the existing scroll container, so it naturally follows the page while scrolling and keeps its frame dimensions fluid.
- Preserved the existing Multiplayer grid/arena/gameplay behavior.

## Cleanup
- No legacy Back asset remains in the runtime asset tree.
- No new duplicate header component or second Multiplayer layout was introduced.
