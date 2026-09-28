# V79 — Solvox Chapter-Aware Battle Question Panel Themes

## Perubahan
- `BattleQuestionPanel` sekarang membawa satu theme-token map untuk Chapter 1–5.
- Token visual diterapkan lewat CSS custom properties pada `.battle-question-panel-v43`.
- Layout, grid, spacing, scrolling Chapter 5, input, hint rail, keypad, dan battle logic tidak diubah.
- Warna, border glow, progress accent, answer field, attack button, hint surface, dan keypad diberi nuansa yang mengikuti karakter background tiap chapter.

## Mapping nuansa
- Chapter 1: forest / temple — hijau lumut, teal, dan emas lembut.
- Chapter 2: cold power factory — biru baja, icy blue, dan indigo.
- Chapter 3: canyon / mystical tree — navy, magenta batuan, dan cyan energy.
- Chapter 4: overgrown stone temple — teal batu, hijau dedaunan, dan mist blue.
- Chapter 5: shadow fortress — plum gelap, emerald-shadow, dan emas boss.

## Guardrail
Perubahan sengaja hanya visual. Tidak ada perubahan pada handler submit, hint, keypad, scroll Chapter 5, renderer fighter/boss, atau struktur grid.
