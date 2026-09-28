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

// Build a URL for a same-origin API path, routed to the backend when split.
export function apiUrl(path) {
  if (!path.startsWith('/')) return path;
  return `${BACKEND_URL}${path}`;
}
