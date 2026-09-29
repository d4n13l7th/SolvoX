// Runtime configuration for Solvox.
//
// This file is served as-is from the web root and is NOT bundled, so you can
// edit it on a live deployment (Vercel, or `frontend/dist/` on a static host)
// without rebuilding the app.
//
// `backendUrl` targets the Cloudflare Worker (Workers + Durable Object) that
// runs the 24/7 multiplayer backend.
// Leave it empty to use the same origin that served the page.
//
// Dev guard: on a Vite dev/preview port we deliberately do NOT point at the
// production Worker. Without a proxy, a dev server hitting the live Worker
// creates real rooms in production and burns the daily request quota. Failing
// loudly on localhost is the safe default — point it somewhere yourself if you
// need a working backend locally.
const PROD_BACKEND_URL = 'https://solvox-api.solvox-worker.workers.dev';

const DEV_PORTS = ['5173', '4173'];
const port = typeof location !== 'undefined' ? location.port : '';
const isLocalDev = DEV_PORTS.indexOf(port) !== -1;

window.SOLVOX_CONFIG = {
  backendUrl: isLocalDev ? '' : PROD_BACKEND_URL,
};
