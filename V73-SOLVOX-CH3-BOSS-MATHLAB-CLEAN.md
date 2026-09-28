# Solvox V73 — Chapter 3 Boss Position + Math Lab Removal

## Chapter 3 boss
- Equation Drake stays on the existing V72 WebP renderer and animation pipeline.
- Only the Chapter 3 boss slot is lifted with a responsive bottom margin so its feet remain fully above the `battle-question-panel-v43` dock.
- Player positioning and boss JS/canvas attack transforms are untouched.

## Math Lab removal
- Removed the `MathActivities` screen/component and its route from `App.jsx`.
- Removed the Math Lab item from the home navigation in `WorldMap.jsx`.
- Removed Math Lab/activity translation keys from bilingual i18n.
- Removed activity-only CSS from `ui-v42.css`.
- Removed `activityLogs` from the active progress schema. Existing saved states are sanitized so the retired field is dropped when loaded.
- Removed the unused `MathActivities.jsx` component file.
- Updated README/package description so Math Lab is no longer presented as a current feature.

## Validation
- `node qa-check.js` — V61 QA STATIC + REGRESSION PASS
- `node qa-check.js` — V62 QA MOTION + MULTIPLAYER PASS
- Final archive integrity checked with `unzip -t`.
