import { apiUrl } from '../config.js';

function getToken() {
  return localStorage.getItem('solvox.sp.token') || '';
}

function setToken(token) {
  if (token) localStorage.setItem('solvox.sp.token', token);
}

function clearToken() {
  localStorage.removeItem('solvox.sp.token');
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token !== undefined ? token : getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
    credentials: 'omit',
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
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
