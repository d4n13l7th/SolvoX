# Solvox

Solvox adalah game belajar aljabar berbasis React.

## Produksi

- Frontend: Vercel — `https://solvoxweb.vercel.app`
- Backend: Cloudflare Workers + Durable Objects + D1 — `https://solvox-api.solvox-worker.workers.dev`

Frontend mengarah ke Worker lewat `frontend/public/config.js`. Durable Objects mengelola room multiplayer aktif. D1 menyimpan sesi guest, save petualangan, checkpoint, riwayat match, feedback, dan evaluasi.

## Pengembangan

```bash
npm ci
npm run build
```

Untuk frontend lokal, jalankan Vite dari workspace `frontend`. Untuk backend lokal, jalankan Wrangler dari `worker/` dan set `VITE_BACKEND_URL` ke URL Worker lokal.

Jangan memakai API relatif `/api/...`; gunakan `apiUrl()` dari `frontend/src/config.js`. Multiplayer memakai `frontend/src/services/realtime.js`.
