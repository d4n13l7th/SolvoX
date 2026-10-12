# Arsitektur Solvox

```text
Browser → Vercel (React/Vite) → Cloudflare Worker → Durable Objects + D1
```

- Vercel menyajikan frontend statis.
- Cloudflare Worker menyediakan API.
- Durable Objects memiliki state room multiplayer selama pertandingan berlangsung.
- D1 menyimpan data yang harus bertahan: guest session, save, checkpoint, riwayat match, feedback, dan evaluasi.

Semua request frontend dibentuk oleh `apiUrl()` dan realtime melalui `services/realtime.js`.
