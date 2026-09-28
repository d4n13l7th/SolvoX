// Runtime configuration for Solvox.
//
// This file is served as-is from the web root and is NOT bundled, so you can
// edit it on a live deployment (Vercel, or `frontend/dist/` on a static host)
// without rebuilding the app.
//
// `backendUrl` must point at the machine running Express + Socket.IO.
// Leave it empty to use the same origin that served the page (the default,
// which is what you want when the backend also serves this frontend).
//
// The host serving this file sets it on deploy, e.g. Vercel project setting
//   VITE_BACKEND_URL / BACKEND_URL
window.SOLVOX_CONFIG = {
  backendUrl: 'https://recipients-stat-margin-vocabulary.trycloudflare.com',
};
