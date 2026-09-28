# NumeriCore V47 — Attack Reach + Home Cleanup

## Attack fix
- CombatStage now measures the live gap to both regular bosses and Shadow Wolf.
- Removed the 330px boss-distance cap that prevented long-range attacks from reaching the opponent.
- Removed the 760px player travel cap; travel now uses the measured arena gap.
- The Shadow Wolf path no longer falls back to a viewport-based distance because its selector is now included.

## Home cleanup
Removed only the elements shown in the supplied screenshot:
- Chapter completed / Questions answered / Accuracy stat strip.
- Current Chapter active quest card.

Dead CSS for those removed elements and the now-unused WorldMap boss import were removed as well.
V54 notes: Home background slightly brightened and previously approved Home button styling restored. No experimental Solfox assets added.
