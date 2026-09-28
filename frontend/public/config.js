// Runtime configuration for Solvox.
//
// This file is served as-is from the web root and is NOT bundled, so you can
// edit it on a live deployment (Vercel, or `frontend/dist/` on a static host)
// without rebuilding the app.
//
// `backendUrl` targets the Cloudflare Worker (Workers + Durable Object) that
// runs the 24/7 multiplayer backend.
// Leave it empty to use the same origin that served the page.
window.SOLVOX_CONFIG = {
  backendUrl: 'https://solvox-api.solvox-worker.workers.dev',
};