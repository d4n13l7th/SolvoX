# Solvox di Windows

Instal Node.js 18 atau lebih baru, lalu dari root repo:

```powershell
npm ci
npm run build
```

Frontend produksi berada di Vercel dan backend produksi berada di Cloudflare Workers. Untuk mengembangkan backend lokal, jalankan Wrangler dari folder `worker/`, lalu arahkan `VITE_BACKEND_URL` ke Worker lokal sebelum menjalankan Vite.
