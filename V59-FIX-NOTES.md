# V59 Build Fix Notes

## Fixed

- Fixed invalid `useImperativeHandle` syntax in `frontend/src/components/BossMonster.jsx`.
- Both imperative handles now correctly pass their dependency arrays as the third argument:
  - `WebPBossSprite`: `[asset, boss, onImpact]`
  - `BossMonster`: `[boss, isAssetBoss, onImpact]`
- The previous malformed form placed the dependency array inside the returned object, which caused Vite/esbuild to fail with:
  `Expected "]" but found ","`.
- Root `build` script now runs `npm run qa` before Vite. This makes the existing project-level regression checks run automatically whenever `npm run build` or `npm start` is used.

## Validation

- `node qa-check.js` -> `V58 QA STATIC PASS`
- No `shadow-wolf`, `shadowWolf`, or `ShadowWolf` references remain in `frontend/src` or `frontend/public`.
- Wolf and Wraith WebP packs match the expected frame counts.
- All `useImperativeHandle` occurrences were inspected; no other occurrence has the malformed dependency-array pattern found in the original `BossMonster.jsx`.

## Environment limitation

The packaged development environment had an incomplete `node_modules` installation and its dependency reinstall timed out, so a fresh Vite production build could not be executed here. The source-level regression QA passes; run `npm install`/`npm ci` once on the Windows machine if dependencies are not already installed, then `npm start`.
