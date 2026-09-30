# Solvox

**V103** — math-first RPG dengan chapter battles, UI bilingual, progresi
single-player, dan duel multiplayer real-time.

| Dokumen | Isi |
|---|---|
| [`V103.md`](V103.md) | Ringkasan perubahan versi V93 → V103 |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Pondasi teknis: struktur, aturan main, cara integrasi |

---

## ⚠️ Baca dulu: dua backend

Repo ini berisi **dua** backend, dan hanya satu yang dipakai produksi.

| Backend | Lokasi | Status |
|---|---|---|
| Cloudflare Workers + Durable Objects | `worker/` | ✅ **INI YANG DIPAKAI** |
| Express + Socket.IO | `server.js`, `backend/` | 📦 arsip saja |

Migrasi ke Workers terjadi di commit `8c6cb5b`. Berkas Express sengaja
dipertahankan sebagai referensi historis.

Konsekuensi praktisnya:

- `npm start` di root menjalankan **server Express lama** — bukan produksi.
  Jangan pakai hasilnya untuk menilai perilaku multiplayer yang sebenarnya.
- `frontend/` talking ke Worker, bukan ke `server.js`.
- Jangan pernah deploy `server.js` / `backend/`.

Produksi:

- Frontend — https://solvoxweb.vercel.app
- Worker — https://solvox-api.solvox-worker.workers.dev
- Health — `GET /health` (menyentuh Durable Object, balas 503 kalau mati)

---

## Quick start

```bash
npm install
npm run dev     # Vite dev server untuk frontend saja
```

### ⚠️ `npm run dev` menembak backend **produksi**

Tidak ada proxy Vite. `frontend/public/config.js` dilayani apa adanya dan
sekarang berisi:

```js
window.SOLVOX_CONFIG = {
  backendUrl: 'https://solvox-api.solvox-worker.workers.dev',
};
```

Artinya menjalankan `npm run dev` lalu mencoba duel **membuat room sungguhan
di produksi** dan memakai kuota Worker harian. Untuk menentukan backend:

```bash
# frontend → backend lokal (Wrangler)
VITE_BACKEND_URL=http://127.0.0.1:8787 npm run dev

# frontend → backend produksi
npm run dev
```

Worker memantulkan origin di CORS (`Access-Control-Allow-Origin` = origin
peminta) dan tidak memvalidasi Origin pada upgrade WebSocket, jadi
`http://127.0.0.1:8787` boleh diakses langsung dari Vite tanpa penyesuaian
apa pun.

### Backend Worker di lokal

```bash
cd worker
npm install
npm run dev      # wrangler dev, default http://127.0.0.1:8787
```

Untuk menjalankan backend Express lama (arsip — **bukan** produksi):

```bash
npm start          # build + server Express di http://localhost:3000
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Vite dev server (frontend) |
| `npm run build` | QA statis + build produksi frontend |
| `npm run qa` | Static QA (`node qa-check.js`) |
| `npm start` | ⚠️ build + **Express lama** — bukan produksi |
| `cd worker && npm run dev` | Wrangler dev (backend Worker) |
| `cd worker && npm run deploy` | Deploy Worker ke Cloudflare |
| `cd worker && npm run tail` | Live log Worker |

Node.js 18 LTS atau lebih baru.

## Struktur

```text
solvox/
├─ frontend/            # React + Vite (deploy ke Vercel)
│  ├─ src/
│  │  ├─ components/    # satu file satu tanggung jawab
│  │  ├─ data/          # hanya data — tidak ada CSS
│  │  ├─ services/      # realtime, evaluation, feedback, i18n, profile
│  │  ├─ config.js      # BACKEND_URL + apiUrl()
│  │  └─ styles/        # battle-v43.css = sumber geometri battle
│  └─ public/
│     ├─ config.js      # runtime backend URL, tidak di-bundle
│     └─ assets/
├─ worker/              # Cloudflare Workers + Durable Objects (PRODUKSI)
│  ├─ src/{index,room,game}.js
│  ├─ wrangler.toml
│  └─ test/             # duel, poll, reconnect, timeout
├─ backend/, server.js  # arsip Express + Socket.IO
├─ data/
├─ qa-check.js
├─ V103.md
└─ ARCHITECTURE.md
```

## Aturan singkat

- **Jangan** import `socket.io-client` di komponen — semua lewat
  `frontend/src/services/realtime.js`
- **Jangan** `fetch('/api/...')` polos — pakai `apiUrl()`, kalau tidak akan
  404 senyap di domain Vercel
- **Jangan** tata battle di stylesheet lain — `styles/battle-v43.css` satu-satunya
- **Jangan** menimpa `worker/`, `.github/`, `src/config.js`,
  `src/services/realtime.js`, atau `public/config.js` saat mengintegrasikan
  folder versi baru
- Detail lengkap + alasannya ada di [`ARCHITECTURE.md`](ARCHITECTURE.md)

## Deploy

Frontend otomatis: Vercel terhubung ke branch `main`, jadi cukup `git push`.
Backend harus manual:

```bash
cd worker && npm run deploy
```

Setelah deploy worker, cek:

```bash
curl -s https://solvox-api.solvox-worker.workers.dev/health
```

## Rollback

```bash
git tag -l
# known-good-v93-multiplayer   versi sebelum V103
# v103-live                    V103 yang sedang produksi
```

```bash
git checkout known-good-v93-multiplayer
```

## Riwayat versi

Catatan versi V93 → V103 diringkas di [`V103.md`](V103.md).
Riwayat commit penuh tetap tersedia di git, dan tag di atas.
