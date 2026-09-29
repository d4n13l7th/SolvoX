// Resolve the backend origin at runtime.
//
// Order: window.SOLVOX_CONFIG.backendUrl (editable on a live deploy) -> build-time
// VITE_BACKEND_URL -> same origin as the page.
//
// The runtime file wins on purpose: a quick-tunnel hostname changes whenever the
// server restarts, and a URL baked into the bundle would break with it.
const rawConfig =
  (typeof window !== 'undefined' && window.SOLVOX_CONFIG && window.SOLVOX_CONFIG.backendUrl) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) ||
  '';

export const BACKEND_URL = String(rawConfig).replace(/\/+$/, '');

export const isSplitDeployment = BACKEND_URL !== '' && typeof window !== 'undefined'
  && BACKEND_URL !== window.location.origin;

// On a Vite dev server there is no proxy, so an empty backendUrl means every
// API call lands on the Vite origin and fails. Say so once, with the fix, rather
// than letting it surface later as an unexplained 404.
if (typeof window !== 'undefined' && BACKEND_URL === '' && window.location.port === '5173') {
  console.warn(
    '[solvox] No backendUrl configured, so API calls will hit the Vite dev server and fail.\n'
    + '  Local Worker:  cd worker && npm install && npm run dev\n'
    + '  Then:          VITE_BACKEND_URL=http://127.0.0.1:8787 npm run dev\n'
    + '  See public/config.js for the dev guard that keeps dev off production.',
  );
}

// Build a URL for a same-origin API path, routed to the backend when split.
export function apiUrl(path) {
  if (!path.startsWith('/')) return path;
  return `${BACKEND_URL}${path}`;
}
