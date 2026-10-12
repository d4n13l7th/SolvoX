import { apiUrl, BACKEND_URL } from '../config.js';

const REQUEST_TIMEOUT_MS = 12000;

function getToken() {
  return localStorage.getItem('solvox.sp.token') || '';
}

function setToken(token) {
  if (token) localStorage.setItem('solvox.sp.token', token);
}

function clearToken() {
  localStorage.removeItem('solvox.sp.token');
}

async function request(path, { method = 'GET', body, token, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token !== undefined ? token : getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const res = await fetch(apiUrl(path), {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      credentials: 'omit',
      signal: controller.signal,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (error) {
      if (timedOut) throw error;
      if (res.ok) {
        return { ok: false, status: res.status, data: null, error: { kind: 'invalid_response' } };
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: { kind: timedOut ? 'timeout' : 'network', cause: error },
    };
  } finally {
    clearTimeout(timer);
  }
}

export function singlePlayerRequestError(result, lang = 'id', fallback = 'Permintaan gagal.') {
  const english = lang === 'en';
  const status = Number(result?.status) || 0;
  if (result?.error?.kind === 'timeout') return english ? 'The request timed out. Check the backend and try again.' : 'Permintaan melewati batas waktu. Periksa backend lalu coba lagi.';
  if (result?.error?.kind === 'network') {
    if (!BACKEND_URL && typeof window !== 'undefined' && ['5173', '5174', '4173'].includes(window.location.port)) {
      return english
        ? `No development backend is configured. The request went to Vite at ${window.location.origin}. Start the local Cloudflare Worker and set VITE_BACKEND_URL to its URL, then restart Vite.`
        : `Backend development belum dikonfigurasi. Request tadi menuju Vite (${window.location.origin}). Jalankan Cloudflare Worker lokal, isi VITE_BACKEND_URL dengan URL Worker itu, lalu restart Vite.`;
    }
    return english ? 'Could not reach the backend (network or CORS error). Check the Worker URL and CORS settings, then retry.' : 'Backend tidak dapat dijangkau (gangguan jaringan atau CORS). Periksa URL Worker dan pengaturan CORS, lalu coba lagi.';
  }
  if (result?.error?.kind === 'invalid_response') {
    if (!BACKEND_URL && typeof window !== 'undefined' && ['5173', '5174', '4173'].includes(window.location.port)) {
      return english
        ? `No development backend is configured. The request went to Vite at ${window.location.origin}, which returned a non-JSON page. Start the local Cloudflare Worker and set VITE_BACKEND_URL to its URL, then restart Vite.`
        : `Backend development belum dikonfigurasi. Request menuju Vite (${window.location.origin}) dan menerima halaman non-JSON. Jalankan Cloudflare Worker lokal, isi VITE_BACKEND_URL dengan URL Worker itu, lalu restart Vite.`;
    }
    return english ? 'The backend returned an invalid response instead of JSON. Check the Worker URL.' : 'Respons backend tidak valid (bukan JSON). Periksa URL Cloudflare Worker.';
  }
  if (status === 401) return english ? 'The guest session is invalid or expired. Retry to create a new session.' : 'Sesi tamu tidak valid atau kedaluwarsa. Coba lagi untuk membuat sesi baru.';
  if (status === 503) return english ? 'The Cloudflare Worker is unavailable or its D1 database is not configured.' : 'Cloudflare Worker tidak tersedia atau database D1 belum dikonfigurasi.';
  if (status === 404 && typeof window !== 'undefined' && ['5173', '5174', '4173'].includes(window.location.port) && !BACKEND_URL) {
    return english ? `The request reached Vite at ${window.location.origin}, not a Worker. Configure a local development Worker URL and restart Vite.` : `Request mengarah ke Vite (${window.location.origin}), bukan Worker. Konfigurasikan URL Worker lokal lalu restart Vite.`;
  }
  const serverMessage = result?.data?.message;
  if (serverMessage) return String(serverMessage);
  if (status) return english ? `Backend request failed (HTTP ${status}).` : `Permintaan backend gagal (HTTP ${status}).`;
  return fallback;
}

export const singlePlayerSaves = {
  async createGuestSession(displayName) {
    const r = await request('/api/guest/session', { method: 'POST', body: { displayName } });
    if (r.ok && r.data?.token) setToken(r.data.token);
    return r;
  },
  async getGuestSession() {
    const r = await request('/api/guest/session', { method: 'GET' });
    return r;
  },
  async getProfile() {
    const r = await request('/api/guest/profile', { method: 'GET' });
    return r;
  },
  async updateProfile(patch) {
    const r = await request('/api/guest/profile', { method: 'PATCH', body: patch });
    return r;
  },
  async legacyImport(input) {
    const r = await request('/api/single-player/legacy-import', { method: 'POST', body: input });
    return r;
  },
  async listSaves() {
    const r = await request('/api/single-player/saves', { method: 'GET' });
    return r;
  },
  async createSave(input) {
    const r = await request('/api/single-player/saves', { method: 'POST', body: input });
    return r;
  },
  async getSave(saveId) {
    const r = await request(`/api/single-player/saves/${encodeURIComponent(saveId)}`, { method: 'GET' });
    return r;
  },
  async updateSave(saveId, patch) {
    const r = await request(`/api/single-player/saves/${encodeURIComponent(saveId)}`, { method: 'PATCH', body: patch });
    return r;
  },
  async deleteSave(saveId) {
    const r = await request(`/api/single-player/saves/${encodeURIComponent(saveId)}`, { method: 'DELETE' });
    return r;
  },
  async getCheckpoint(saveId, chapterId) {
    const r = await request(
      `/api/single-player/saves/${encodeURIComponent(saveId)}/checkpoints/${encodeURIComponent(String(chapterId))}`,
      { method: 'GET' },
    );
    return r;
  },
  async putCheckpoint(saveId, chapterId, payload, baseRevision) {
    const body = { payload };
    if (baseRevision != null) body.baseRevision = baseRevision;
    const r = await request(
      `/api/single-player/saves/${encodeURIComponent(saveId)}/checkpoints/${encodeURIComponent(String(chapterId))}`,
      { method: 'PUT', body },
    );
    return r;
  },
  async deleteCheckpoint(saveId, chapterId) {
    const r = await request(
      `/api/single-player/saves/${encodeURIComponent(saveId)}/checkpoints/${encodeURIComponent(String(chapterId))}`,
      { method: 'DELETE' },
    );
    return r;
  },
  async finishRun(saveId, chapterId, input = {}) {
    const body = { chapterId, ...input };
    const r = await request(`/api/single-player/saves/${encodeURIComponent(saveId)}/runs`, { method: 'POST', body });
    return r;
  },
  getToken,
  setToken,
  clearToken,
};
