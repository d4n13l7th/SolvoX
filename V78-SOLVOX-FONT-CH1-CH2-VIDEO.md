# V78 — Solvox selective font + Chapter 1/2 animated backgrounds

## Selective font integration

Integrated the supplied `04B_30__.TTF` as `Solvox04B`. The font is limited to high-salience UI: home navigation labels, mode/chapter headings, chapter titles, battle stage title, and selected modal headings. Long-form question text, hints, feedback, keypad labels, and body copy keep the existing readable typography.

## Chapter 1 / Chapter 2 animation

The two supplied MP4 animations are integrated as the chapter arena backgrounds through `ArenaBackground`:
- Chapter 1 → `level1/chapter1-arena.mp4`
- Chapter 2 → `level2/chapter2-arena.mp4`

Poster frames are provided for first paint. The previous `background.gif` assets for levels 1 and 2 were removed because they are no longer referenced.

## Cleanup

- The supplied font archive is not shipped into the game; only the required `.ttf` asset is kept.
- The archive's `about.gif` is not used.
- No existing battle renderer, question flow, hint system, feedback system, or Chapter 3 background was replaced.
