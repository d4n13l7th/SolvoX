# V75 — Solvox Utility Icon Integration

Integrated the five user-supplied utility artworks without replacing the existing UI architecture.

## Integrated assets
- Main → Home primary action and Home navigation.
- Dashboard Pemain → Home profile action, multiplayer dashboard trigger, and profile panel header.
- Pengaturan → Home navigation, global settings action, and Settings panel header.
- Feedback → Home navigation, global feedback action, and Feedback panel header.
- Back → Mode Select, Chapter Select, Multiplayer, and Battle navigation controls.

The compact navigation icons are derived from the supplied artwork with the embedded label region cropped out, so the existing bilingual text labels remain localized. Full supplied artwork remains available for Main / Dashboard / Pengaturan / Feedback header placements where the artwork is intended to be read as a title graphic; Back uses the compact derivative so navigation labels can stay localized.

## Cleanup
- Removed obsolete V32 reference navigation PNGs that no longer have runtime references: `nav-home-icon.png`, `nav-dashboard-icon.png`, `nav-settings-icon.png`, `nav-exit-icon.png`.
- Removed their dead raster mappings from `PixelIcon.jsx`.
- Removed the unused WorldMap reference constant and unused `PixelIcon` import from `App.jsx`.
- Added one V75 utility-art stylesheet as the final visual layer to avoid reactivating legacy overrides.

## Validation
- `qa-check.js`: PASS.
- No references remain to removed nav PNGs.
- All V75 utility-art asset paths resolve inside the project.
- ZIP integrity verified with `unzip -t`.
