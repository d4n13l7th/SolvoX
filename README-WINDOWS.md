# Solvox V103 — Setup Windows

Dokumen ini untuk menjalankan **frontend** di Windows. Backend produksi
adalah Cloudflare Worker dan tidak perlu dijalankan di sini.

Detail arsitektur ada di [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 1. Extract

Extract ZIP, lalu buka PowerShell **di dalam** folder hasil extract.

Jangan `npm install` dari folder induknya. Kalau PowerShell error
`ENOENT` untuk `package.json`, berarti kamu masih di folder yang salah.

Pastikan file ini terlihat:

```text
package.json
frontend\package.json
worker\wrangler.toml
```

## 2. Install

```powershell
npm install
```

Butuh Node.js 18 LTS atau lebih baru. Cek dengan:

```powershell
node -v
```

## 3. Jalankan frontend

```powershell
npm run dev
```

Lalu buka `http://localhost:5173`.

## ⚠️ ⚠️ Penting：`npm run dev` menembak backend produksi

Tidak ada proxy Vite. `frontend\public\config.js` sudah mengarah ke Worker
produksi, jadi duel yang kamu coba dari dev server akan membuat room
sungguhan di produksi dan memakai kuota harian.

Kalau mau arahkan ke backend lokal:

```powershell
cd worker
npm install
npm run dev          # wrangler dev, default http://127.0.0.1:8787
```

Lalu di terminal terpisah:

```powershell
$env:VITE_BACKEND_URL = "http://127.0.0.1:8787"
npm run dev
```

> Backend lokal tidak punya CORS untuk origin Vite, jadi panggilan dari
> browser akan gagal dengan error CORS. Itu normal — backend lokal bukan
> untuk diuji lewat browser tanpa penyesuaian CORS.

## 4. Jangan pakai `npm start` untuk menilai multiplayer

```powershell
npm start
```

Perintah ini menjalankan **server Express lama** (`server.js`), bukan Worker
yang dipakai produksi. Bisa dipakai untuk sekadar melihat tampilan, tapi
perilaku multiplayer-nya tidak mewakili produksi.

## 5. Build produksi

```powershell
npm run build
```

Output ada di `frontend\dist\`. Untuk deploy ke Worker:

```powershell
cd worker
npm run deploy
```

Setelah deploy, cek:

```powershell
curl.exe -s https://solvox-api.solvox-worker.workers.dev/health
```

## 6. QA opsional

```powershell
npm run qa
```
