# NumeriCore V62 — Single-Source Battle Cleanup

## Tujuan
Membersihkan implementasi Battle dari CSS/markup lama yang masih aktif dan dapat menimpa renderer/layout baru. Battle sekarang memiliki satu sumber gaya/layout aktif tanpa legacy V23–V42 battle overrides di stylesheet global.

## Perubahan utama

### 1. Battle stylesheet menjadi single source
- `frontend/src/styles/app.css` tidak lagi membawa selector battle legacy.
- `ui-v32.css` tidak lagi memiliki blok Battle V23/V24.
- `ui-v33.css` tidak lagi memiliki HUD Battle V33, stage crown lama, atau spacing question lama.
- `ui-v34.css` tidak lagi memiliki `sprite-wrap`, frame-sheet boss lama, atau global keypad Battle.
- `ui-v42.css` tidak lagi memiliki layout Battle V35/V37/V41.
- `battle-v43.css` menjadi satu-satunya stylesheet yang mengatur layout fighter, HP HUD, question deck, keypad Battle, sprite canvas, boss renderer, dan hit FX.

### 2. Fighter anchor dibuat benar-benar tunggal
- `CombatStage` sekarang hanya menggunakan `combat-stage-v43`, `fighter-player-v43`, dan `fighter-boss-v43`.
- Class V20/V21 yang hanya merupakan warisan layout lama dihapus.
- Slot fighter memiliki tinggi tetap dan baseline bawah yang sama untuk seluruh chapter.
- Ukuran sprite chapter/responsive hanya diatur pada satu blok responsive V62 sehingga aspect ratio asset tidak dapat mendorong karakter ke arah question panel.

### 3. Animasi player dan boss
- Player menggunakan loop `requestAnimationFrame` berbasis waktu dengan cross-fade antar-frame.
- Transisi one-shot (`attack`/`hurt`) kembali ke idle secara atomik sehingga tidak ada satu frame canvas kosong.
- Boss WebP memakai canvas + `requestAnimationFrame`, tanpa CSS transform animation yang berjalan bersamaan.
- CSS tidak lagi menjalankan frame-sheet animation pada boss canvas.
- Filter GPU berat per-frame pada canvas dihilangkan; motion blur hanya dipakai pada saat attack.

### 4. HP HUD
- HP HUD V62 tetap digunakan sebagai implementasi aktif.
- Tidak ada lagi override V23/V33 yang memengaruhi `hp-card-v62`.
- Player dan boss memiliki frame, portrait, percentage, progress track, dan footer status sendiri.

### 5. Cleanup CombatStage
- Import `PLAYER` dan `getBoss` yang sudah tidak digunakan dihapus.
- Prop `lang` yang sudah tidak digunakan dihapus.
- Markup fighter tag yang selalu disembunyikan dihapus.
- Elemen `combat-floor-glow`/`combat-path` yang tidak mempunyai implementasi aktif dihapus.
- Dynamic class `fighter-asset-boss-*` yang tidak memiliki consumer CSS dihapus.

### 6. QA checker
- `qa-check.js` diperbaiki agar membaca API dari `backend/server.js`, bukan hanya bootstrap `server.js`.
- Verifikasi attack-distance disesuaikan dengan implementasi aktif `getDistance()` + `getBoundingClientRect()`.
- Verifikasi Boss imperative handle disesuaikan dengan dua renderer aktif yang benar.

## Validasi
- CSS parser: **PASS**, tidak ada parse error pada stylesheet aktif.
- Legacy Battle selector scan: **PASS**, selector lama yang dibuang tidak lagi muncul di source tree Battle/global UI.
- `node qa-check.js`: **PASS** — `V61 QA STATIC + REGRESSION PASS` dan `V62 QA MOTION + MULTIPLAYER PASS`.
- `npm --workspace frontend run build`: belum dapat dijalankan pada environment audit karena executable `vite`/`node_modules` tidak tersedia di ZIP.
