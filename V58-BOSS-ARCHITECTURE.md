# NumeriCore — Boss Asset Cleanup / V58

## What changed

- Replaced the one-off `shadowWolfAssets.js` + Shadow Wolf renderer branch with a shared `bossAssets.js` WebP asset registry.
- Renamed the current Chapter 1 Wolf asset directory from `shadow-wolf` to `wolf`.
- Integrated the supplied Wraith WebP animations:
  - idle: 1 frame (fallback because no dedicated idle pack was supplied)
  - attack: 7 frames
  - hurt: 5 frames
  - die: 6 frames
- Chapter 1 now uses `wolf`.
- Chapter 2 now uses `wraith`.
- Chapter 3, 4, and 5 retain explicit boss slots in `bosses.js` so future WebP packs can be added without changing the battle state machine.
- Fixed a real renderer bug: `CombatStage` now passes `levelId` into `BossMonster`; previously `BossMonster` could fall back to the Chapter 5 boss because it did not receive the active chapter ID.
- Attack distance is shared by both procedural and WebP bosses.
- Boss portrait selection now comes from the same asset registry as the battle renderer.
- Removed the obsolete Shadow Wolf manifest and stale runtime references.
- Added static QA checks for the new Wolf/Wraith packs and Chapter 3–5 slots.

## Asset structure

```text
frontend/public/assets/characters/
  wolf/
    idle/
    attack/
    hurt/
    die/
  wraith/
    idle/
    attack/
    hurt/
    die/
```

Future boss assets should follow the same state folders. Add the asset entry in
`frontend/src/data/bossAssets.js` and point the chapter's `spriteId` + `renderer: 'webp'`
to it in `frontend/src/data/bosses.js`.

## Validation

`node qa-check.js` passes the project's static QA checks.

A full Vite production build could not be executed in the isolated environment because
`npm ci` timed out while trying to obtain dependencies. No claim is made here that a
browser build was executed.
