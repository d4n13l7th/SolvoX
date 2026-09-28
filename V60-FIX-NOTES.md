# NumeriCore V60 — Boss Renderer Build Fix

## Root cause fixed
`frontend/src/components/BossMonster.jsx` had malformed `useImperativeHandle` calls. The dependency arrays were attached after the returned object with `}, [...]` instead of closing the returned callback object with `}), [...]`.

This caused Vite/esbuild errors such as:
- `Expected "]" but found ","`
- `Expected ")" but found ";"`

## Changes
- Fixed both `useImperativeHandle` calls in `BossMonster.jsx`.
- Added a BossMonster delimiter/syntax regression guard to `qa-check.js`.
- Added exact guards preventing the malformed hook pattern from returning.
- Verified the QA guard fails when the bad hook syntax is deliberately restored, then passes after the fix.
- Kept Wolf/Wraith WebP architecture and Chapter 3–5 boss slots unchanged.

## Verification
- `node --check qa-check.js` — PASS
- `npm run qa` — PASS
- Deliberate malformed BossMonster regression test — DETECTED/PASS

A full Vite production build must still be run after dependencies are installed on the target machine (`npm install` then `npm start`).
