# V87 — Solvox Mobile Scroll Conflict Fix

## Root cause

The previous responsive layer attempted to create nested scroll containers while `ui-v42.css` still applied a fixed viewport contract to `html`, `body`, `#root`, and `.app-shell` using `height: 100% / 100dvh` plus `overflow: hidden`. This made touch scrolling unreliable on mobile browsers.

## New rule

Portrait/narrow layouts now use the document itself as the primary vertical scroll surface. Mode Select, Chapter Select, Multiplayer, and Battle are normal-flow pages on mobile rather than competing scroll roots.

## Changes

- Replaced the active responsive source with `responsive-v87.css`.
- Removed the obsolete `responsive-v86.css` source file.
- Removed the legacy fixed-viewport overflow rules from `ui-v42.css`.
- Added a mobile document-scroll contract for `html`, `body`, and `#root`.
- Set `touch-action: pan-y` for the mobile document flow.
- Converted mobile Mode Select and Chapter Select from nested `overflow-y:auto` containers to normal-flow document scrolling.
- Kept desktop geometry unchanged.
- Kept mobile battle fighter sizing from V86 while moving scroll ownership to the document.
- Added extra bottom breathing room so portrait pages have usable scroll continuation.
- Disabled pointer events on purely decorative full-screen backdrops so they cannot interfere with touch gestures.

## QA target

The existing regression checker was updated to validate V87 as the active responsive source and to reject the retired fixed-viewport overflow rules.
