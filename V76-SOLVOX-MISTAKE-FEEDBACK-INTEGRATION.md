# V76 — Solvox Mistake Feedback Integration

## Purpose
Wire the user-supplied `FEEDBACK SOAL SOAL SOLVOX.docx` content into the active single-player battle mistake banner.

## Behavior
- A wrong answer opens `battle-mistake-banner-v41`.
- The banner displays the feedback stored on the active question object (`q.feedback`).
- The question number and `errorTag` are shown alongside the explanation for context.
- The same question-specific feedback remains the source for both first and second wrong attempts.
- Correct answers keep the existing attack flow and do not show the mistake banner.

## Content validation
- 50 SOLVOX questions are present.
- 50 question-specific feedback entries are present, matching the supplied 5-page feedback document structure (10 questions per chapter).
- The existing `solvoxQuestions.js` entries already carry the document-derived feedback; no duplicate feedback database was introduced.

## Cleanup
- Reused the existing `battle-mistake-banner-v41` selector instead of adding a second competing banner system.
- Replaced the banner body with a dedicated readable hierarchy: title, question number, learning feedback, and error tag.
- No legacy feedback panel was restored inside the question console.

## QA
- Existing V61/V62 QA checks pass.
- New V76 guards verify all 50 question feedback entries and active banner rendering.
