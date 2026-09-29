# Arsitektur Solvox

Dokumen ini adalah **pondasi teknis proyek**. Berisi struktur, aturan main, dan
konvensi yang harus dijaga ketika mengubah kode.

Rilis berjalan: **V103** · Ringkasan versi: [`V103.md`](V103.md)

---

## 1. Dua backend — hanya satu yang hidup

| Backend | Lokasi | Status |
|---|---|---|
| **Cloudflare Workers + Durable Objects** | `worker/` | ✅ **INI YANG DIPAKAI** |
| Express + Socket.IO | `backend/`, `server.js` | 📦 arsip, jangan di-deploy |

Migrasi ke Workers terjadi di commit `8c6cb5b`. Berkas arsip sengaja
dipertahankan sebagai referensi, tapi **berjalan di produksi akan salah**.

Alamat produksi:

- Frontend — https://solvoxweb.vercel.app (terhubung git ke `main`, auto-deploy)
- Worker — https://solvox-api.solvox-worker.workers.dev
- Health — `GET /health` → menyentuh Durable Object, balas **503** kalau mati

## 2. Ownership file frontend

Tidak boleh ada dua file melakukan hal yang sama. Setiap file punya satu tugas.

| File | Tanggung jawab |
|---|---|
| `App.jsx` | Routing layar + state aplikasi tingkat atas |
| `main.jsx` | Mount React + daftar import CSS |
| `HomeMenu.jsx` | Menu Home, brand, pintu masuk ke mode |
| `ModeSelect.jsx` | Layar pilih Single Player / Multiplayer |
| `ChapterSelect.jsx` | Daftar chapter |
| `Battle.jsx` | State machine battle, validasi jawaban, HP, timing |
| `CombatStage.jsx` | Penempatan fighter + perintah animasi **saja** |
| `BattleQuestionPanel.jsx` | UI soal, hint, field jawaban, keypad |
| `SpriteCharacter.jsx` | Sistem animasi player |
| `BossMonster.jsx` | Renderer/animasi boss |
| `Keypad.jsx` | Definisi tombol keypad + perilaku input |
| `HitEffect.jsx` | Efek hit |
| `ArenaBackground.jsx` | Latar arena (video/gambar per chapter) |
| `Multiplayer.jsx` | Layar multiplayer duel |
| `Evaluation.jsx` | Evaluasi setelah boss |
| `ProfilePanel.jsx`, `Settings.jsx`, `Feedback.jsx` | Modal masing-masing |
| `AboutDevelopers.jsx`, `Tutorial.jsx` | Halaman informasi & panduan |
| `data/*.js` | **Hanya data/konfigurasi — tidak ada CSS di sini** |

> Catatan: `WorldMap.jsx` yang pernah ada sudah diganti `HomeMenu.jsx`.

## 3. Aturan stylesheet

**`styles/battle-v43.css` adalah satu-satunya sumber geometri battle.**
Jangan menATA battle di stylesheet lain — itu memunculkan override yang
saling menimpa (persis masalah yang pernah terjadi di V32–V42).

- `app.css` — primitif komponen bersama, styling non-battle
- `ui-v42.css`, `ui-v32/33/34.css` — layer Home, mode select, chapter select
- `battle-v43.css` — **sumber kebenaran geometri battle**
- `responsive-v102.css` — satu-satunya lapisan responsif aktif
- `tutorial-v102.css`, `ui-v96.css` — layer khusus fitur terbaru

Anchor battle yang tunggal dan wajib dipakai apa adanya:

```
combat-stage-v43   fighter-player-v43   fighter-boss-v43
```

Slot fighter punya tinggi tetap dan baseline bawah sama untuk semua chapter,
sehingga aspect ratio aset tidak mendorong karakter ke arah question panel.

Aturan responsive: **hanya boleh ada satu sumber responsif aktif.** Kalau
menambah, hapus yang lama dalam commit yang sama.

## 4. Registry aset boss

```text
frontend/public/assets/characters/
  wolf/     idle/  attack/  hurt/  die/
  wraith/   idle/  attack/  hurt/  die/
```

Cara menambah boss baru:

1. Taruh aset WebP di `public/assets/characters/<nama>/` dengan folder
   `idle/ attack/ hurt/ die/`
2. Daftarkan di `frontend/src/data/bossAssets.js`
3. Set `spriteId` + `renderer: 'webp'` di `frontend/src/data/bosses.js`

Chapter 3, 4, dan 5 sudah punya slot boss eksplisit di `bosses.js` supaya paket
WebP berikutnya bisa ditambahkan **tanpa mengubah state machine battle**.

Jarak attack dipakai bersama oleh boss prosedural maupun WebP. Portrait boss
diambil dari registry yang sama dengan renderer battle.

## 5. Animasi

- Player & boss WebP memakai canvas + `requestAnimationFrame`.
- **Jangan** menjalankan CSS frame-sheet animation bersamaan dengan canvas —
  keduanya akan saling-tindih.
- Transisi one-shot (`attack`/`hurt`) kembali ke idle secara atomik agar tidak
  pernah ada frame canvas kosong.
- Filter GPU berat per-frame dihapus; motion blur hanya saat attack.

## 6. Transport realtime

`frontend/src/services/realtime.js` adalah **satu-satunya** jalan ke backend.
Komponen **tidak boleh** import `socket.io-client`.

Isinya: shim WebSocket + fallback HTTP long-poll, antrean frame saat
transport mati, heartbeat, reconnect, dan penanganan token.

Event yang dikirim komponen:

```
room:create   room:join   player:ready   answer:submit
turn:hint     player:update   rematch
```

Endpoint REST — **harus dibungkus `apiUrl()`**, bukan `fetch('/api/...')` polos:

```js
import { apiUrl } from '../config';
fetch(apiUrl('/api/dashboard?limit=20'))
```

Kalau polos, request kena origin Vercel dan **404 senyap** karena backend-nya
ada di domain Worker.

## 7. Konfigurasi backend runtime

`frontend/public/config.js` dilayani apa adanya dari web root (tidak di-bundle),
supaya URL backend bisa diubah tanpa build ulang:

```js
window.SOLVOX_CONFIG = {
  backendUrl: 'https://solvox-api.solvox-worker.workers.dev',
};
```

`frontend/src/config.js` membacanya jadi `BACKEND_URL` + helper `apiUrl()`.

## 8. Batas kuota Workers Free

| Batas | Nilai |
|---|---|
| Requests | 100.000/hari (reset 00:00 UTC = 07:00 WIB) |
| CPU per request | 10 ms |
| Memori | 128 MB |
| Ukuran worker | 3 MB |
| Duration DO | 13.000 GB-s/hari |
| Storage DO | 5 GB |

Melewati kuota requests → **Error 1027** sampai reset tengah malam.

Heartbeat 10 detik per pemain adalah penyumbang terbesar. Menaikkannya ke
25 detik mensyaratkan `PONG_TIMEOUT_MS` **dan** `ROOM_GRACE_MS` ikut naik —
mengubah satu angka saja justru memperburuk (reconnect datang setelah room
dibuang).

## 9. QA

```bash
npm run qa     # static QA (node qa-check.js)
npm run build  # build produksi
```

Regresi backend (butuh argumen URL):

```bash
node worker/test/duel.js       https://solvox-api.solvox-worker.workers.dev
node worker/test/poll.js       https://solvox-api.solvox-worker.workers.dev
node worker/test/reconnect.js  https://solvox-api.solvox-worker.workers.dev
node worker/test/timeout.js    https://solvox-api.solvox-worker.workers.dev
```

> `reconnect.js` kadang gagal 1 dari 4. Penyebabnya assertion-nya menunggu
> `game:finished` hanya 60 detik, sedangkan satu turn timeout adalah 45 detik.
> Semua pemeriksaan substantif (duel bertahan, kursi/integritas, tidak ada
> pemain duplikat) selalu lulus.

## 10. Versi dan rollback

```bash
git tag -l
# known-good-v93-multiplayer   versi sebelum V103
# v103-live                    V103 yang sedang produksi
```

Rollback:

```bash
git checkout known-good-v93-multiplayer
```

## 11. Saat mengintegrasikan folder versi baru

Folder dari luar repo **masih memakai `socket.io` dan `fetch('/api/...')`
same-origin**. sebelum menyalin:

1. **Jangan pernah** timpa `worker/`, `.github/`, `frontend/src/config.js`,
   `frontend/src/services/realtime.js`, `frontend/public/config.js`
2. Bungkus ulang 4 file: `Multiplayer.jsx`, `Evaluation.jsx`,
   `ProfilePanel.jsx`, `services/feedback.js`
3. `Multiplayer.jsx` perlu 3 baris tambahan: import shim, `io(BACKEND_URL…)`,
   `apiUrl` untuk dashboard
4. Hapus stylesheet responsif lama bila ada yang baru, jangan sampai dua aktif
5. Jalankan `npm run build` + keempat test regresi sebelum merge
