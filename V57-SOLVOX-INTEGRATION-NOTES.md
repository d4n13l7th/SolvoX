# V57 — SOLVOX Content Integration

## Source of truth
- `SOAL SOAL SOLVOX.docx` → 50 fixed questions and answers, Chapters 1–5.
- `HINT SOAL SOLVOX.docx` → 3 hints for every question.
- `FEEDBACK SOAL SOAL SOLVOX.docx` → per-question feedback.
- `EVALUASI SOAL SOLVOX.docx` → chapter-level diagnostic evaluation rules.
- `hurt-wolf.zip` → 5 WebP hurt frames for Shadow Wolf.

## Code changes
- Replaced procedural/random Single Player question generation with the fixed SOLVOX pack.
- Added per-question hints and feedback to the battle flow.
- Raised hint capacity from 2 visible steps to the supplied 3-step hint structure; each hint still costs 5 HP.
- Answers may now accept multiple valid forms (used for Question 7: `2.5` or `5/2`).
- Added source-derived chapter evaluation to the evaluation modal.
- Added Shadow Wolf `hurt` WebP sequence and wired `bossHurt()` to play it.

## Scope note
The SOLVOX source materials are Indonesian. Question, hint, feedback, and evaluation copy are preserved in Indonesian in this integration rather than silently inventing English source content.

The same fixed 50-question pack is also used by the Node question generator so multiplayer does not silently fall back to the previous procedural question set.
