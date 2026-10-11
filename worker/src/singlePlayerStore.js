// Cloud save untuk Single Player, di atas binding D1 (`env.DB`).
//
// Modul ini TIDAK menyentuh store.js milik multiplayer. Semua fungsi
// mengembalikan objek hasil yang sudah rapi supaya handler di index.js tetap tipis
// dan tidak perlu tahu bentuk baris SQLite.
//
// Aturan penting:
//   - Setiap operasi pada sebuah save WAJIB memverifikasi kepemilikan (guest_id).
//   - completed_levels disimpan sebagai sorted-unique integer dalam [1, MAX_CHAPTER].
//     Store TIDAK memaksa prefix kontigu; frontend (normalizeCompleted) yang
//     me-re-normalize saat memuat. Ini mempertahankan win saat impor legacy bergap.
//   - Token tamu hanya disimpan sebagai hash SHA-256; token mentah sekali pakai.

import { LEVELS } from './game.js';

const TOKEN_BYTES = 24;
const MAX_SAVES = 5;
const MAX_SAVE_NAME = 40;
const MAX_DISPLAY_NAME = 18;
const EXP_PER_CLEAR = 100;
const EXP_PER_ATTEMPT = 10;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;
// Batas aman untuk hitungan yang datang dari klien (correct/answered/hints).
const TOTAL_GUARD = 1000;

export const MAX_CHAPTER = Math.max(
  1,
  ...Object.keys(LEVELS).map((key) => Number(key)).filter((n) => Number.isInteger(n) && n >= 1),
);
export { MAX_SAVES };

// ---------------------------------------------------------------------------
// util
// ---------------------------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function cleanText(v, max, fallback = '') {
  const text = String(v ?? '').trim();
  if (!text) return fallback;
  return text.slice(0, max);
}

function clampChapter(v, fallback = 1) {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_CHAPTER);
}

function isChapterId(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= MAX_CHAPTER;
}

function toCount(v, min, max) {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n) || n < min) return min;
  return Math.min(n, max);
}

function parseCompleted(raw) {
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  const set = new Set();
  for (const item of list) {
    const n = Math.trunc(Number(item));
    if (Number.isInteger(n) && n >= 1 && n <= MAX_CHAPTER) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

function safeJsonParse(raw) {
  if (raw && typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// token & hash
// ---------------------------------------------------------------------------

function randomToken() {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashToken(token) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

// ---------------------------------------------------------------------------
// mappers (row -> camelCase)
// ---------------------------------------------------------------------------

function mapGuest(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    characterId: row.character_id,
    exp: Number(row.exp) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSeenAt: row.last_seen_at,
  };
}

function mapSave(row) {
  if (!row) return null;
  return {
    id: row.id,
    guestId: row.guest_id,
    name: row.name,
    characterId: row.character_id,
    currentChapterId: Number(row.current_chapter_id) || 1,
    completedLevels: parseCompleted(row.completed_levels_json),
    exp: Number(row.exp) || 0,
    revision: Number(row.revision) || 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCheckpoint(row) {
  if (!row) return null;
  return {
    saveId: row.save_id,
    chapterId: Number(row.chapter_id),
    revision: Number(row.revision) || 1,
    payload: safeJsonParse(row.payload_json),
    updatedAt: row.updated_at,
  };
}

function mapRun(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    saveId: row.save_id,
    chapterId: Number(row.chapter_id),
    clientRunId: row.client_run_id,
    outcome: row.outcome,
    correct: Number(row.correct) || 0,
    answered: Number(row.answered) || 0,
    hintsUsed: Number(row.hints_used) || 0,
    durationSec: Number(row.duration_sec) || 0,
    expAwarded: Number(row.exp_awarded) || 0,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// store
// ---------------------------------------------------------------------------

export function createSinglePlayerStore(env) {
  if (!env || !env.DB) {
    throw new Error('D1 binding "DB" is not configured');
  }
  const db = env.DB;

  async function getGuestRowById(id) {
    return db.prepare('SELECT * FROM guest_players WHERE id = ?').bind(id).first();
  }

  async function getSaveRow(guestId, saveId) {
    return db
      .prepare('SELECT * FROM single_player_saves WHERE id = ? AND guest_id = ?')
      .bind(saveId, guestId)
      .first();
  }

  async function listSaves(guestId) {
    const { results } = await db
      .prepare(
        'SELECT * FROM single_player_saves WHERE guest_id = ? ORDER BY updated_at DESC, created_at DESC',
      )
      .bind(guestId)
      .all();
    return (results || []).map(mapSave);
  }

  async function createSession({ displayName } = {}) {
    const token = randomToken();
    const tokenHash = await hashToken(token);
    const id = crypto.randomUUID();
    const ts = nowIso();
    const name = cleanText(displayName, MAX_DISPLAY_NAME, 'Player');
    await db
      .prepare(
        `INSERT INTO guest_players (id, token_hash, display_name, character_id, exp, created_at, updated_at, last_seen_at)
         VALUES (?, ?, ?, 'traveler', 0, ?, ?, ?)`,
      )
      .bind(id, tokenHash, name, ts, ts, ts)
      .run();
    const guest = mapGuest(await getGuestRowById(id));
    return { token, guest };
  }

  async function resolveGuest(token) {
    const raw = String(token || '').trim();
    if (!raw || !TOKEN_RE.test(raw)) return null;
    const tokenHash = await hashToken(raw);
    const row = await db
      .prepare('SELECT * FROM guest_players WHERE token_hash = ?')
      .bind(tokenHash)
      .first();
    if (!row) return null;

    const lastSeen = Date.parse(row.last_seen_at || '') || 0;
    if (Date.now() - lastSeen > LAST_SEEN_THROTTLE_MS) {
      const ts = nowIso();
      await db
        .prepare('UPDATE guest_players SET last_seen_at = ?, updated_at = ? WHERE id = ?')
        .bind(ts, ts, row.id)
        .run();
      row.last_seen_at = ts;
      row.updated_at = ts;
    }
    return mapGuest(row);
  }

  async function updateProfile(guestId, patch = {}) {
    const row = await getGuestRowById(guestId);
    if (!row) return null;
    const fields = [];
    const values = [];
    if (patch.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(cleanText(patch.displayName, MAX_DISPLAY_NAME, row.display_name || 'Player'));
    }
    if (patch.characterId !== undefined) {
      fields.push('character_id = ?');
      values.push(cleanText(patch.characterId, 40, row.character_id || 'traveler'));
    }
    if (patch.exp !== undefined) {
      fields.push('exp = ?');
      values.push(toCount(patch.exp, 0, Number.MAX_SAFE_INTEGER));
    }
    if (!fields.length) return mapGuest(row);

    const ts = nowIso();
    fields.push('updated_at = ?');
    values.push(ts);
    await db
      .prepare(`UPDATE guest_players SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values, guestId)
      .run();
    return mapGuest(await getGuestRowById(guestId));
  }

  async function createSave(guestId, { name, characterId, completedLevels, currentChapterId, exp } = {}) {
    const { results } = await db
      .prepare('SELECT COUNT(*) AS count FROM single_player_saves WHERE guest_id = ?')
      .bind(guestId)
      .all();
    const count = Number(results?.[0]?.count) || 0;
    if (count >= MAX_SAVES) {
      return { limit: true, saves: await listSaves(guestId) };
    }

    const id = crypto.randomUUID();
    const ts = nowIso();
    await db
      .prepare(
        `INSERT INTO single_player_saves
           (id, guest_id, name, character_id, current_chapter_id, completed_levels_json, exp, revision, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      )
      .bind(
        id,
        guestId,
        cleanText(name, MAX_SAVE_NAME, 'Petualangan Baru'),
        cleanText(characterId, 40, 'traveler'),
        clampChapter(currentChapterId, 1),
        JSON.stringify(parseCompleted(completedLevels)),
        toCount(exp, 0, Number.MAX_SAFE_INTEGER),
        ts,
        ts,
      )
      .run();
    return { save: mapSave(await getSaveRow(guestId, id)) };
  }

  async function getSave(guestId, saveId) {
    return mapSave(await getSaveRow(guestId, saveId));
  }

  async function updateSave(guestId, saveId, fields = {}) {
    const row = await getSaveRow(guestId, saveId);
    if (!row) return null;

    const sets = [];
    const values = [];
    if (fields.name !== undefined) {
      sets.push('name = ?');
      values.push(cleanText(fields.name, MAX_SAVE_NAME, row.name));
    }
    if (fields.characterId !== undefined) {
      sets.push('character_id = ?');
      values.push(cleanText(fields.characterId, 40, row.character_id || 'traveler'));
    }
    if (fields.currentChapterId !== undefined) {
      sets.push('current_chapter_id = ?');
      values.push(clampChapter(fields.currentChapterId, Number(row.current_chapter_id) || 1));
    }
    if (fields.completedLevels !== undefined) {
      sets.push('completed_levels_json = ?');
      values.push(JSON.stringify(parseCompleted(fields.completedLevels)));
    }
    if (fields.exp !== undefined) {
      sets.push('exp = ?');
      values.push(toCount(fields.exp, 0, Number.MAX_SAFE_INTEGER));
    }

    const ts = nowIso();
    sets.push('revision = revision + 1', 'updated_at = ?');
    values.push(ts);
    await db
      .prepare(`UPDATE single_player_saves SET ${sets.join(', ')} WHERE id = ? AND guest_id = ?`)
      .bind(...values, saveId, guestId)
      .run();
    return mapSave(await getSaveRow(guestId, saveId));
  }

  async function deleteSave(guestId, saveId) {
    const info = await db
      .prepare('DELETE FROM single_player_saves WHERE id = ? AND guest_id = ?')
      .bind(saveId, guestId)
      .run();
    return (info?.meta?.changes ?? 0) > 0;
  }

  async function getCheckpoint(guestId, saveId, chapterId) {
    if (!isChapterId(chapterId)) return { found: false };
    const save = await getSaveRow(guestId, saveId);
    if (!save) return { found: false };
    const row = await db
      .prepare('SELECT * FROM battle_checkpoints WHERE save_id = ? AND chapter_id = ?')
      .bind(saveId, clampChapter(chapterId))
      .first();
    if (!row) return { found: false };
    return { found: true, checkpoint: mapCheckpoint(row) };
  }

  async function putCheckpoint(guestId, saveId, chapterId, { baseRevision, payload } = {}) {
    if (!isChapterId(chapterId)) return { found: false };
    const save = await getSaveRow(guestId, saveId);
    if (!save) return { found: false };

    const chapter = clampChapter(chapterId);
    const existing = await db
      .prepare('SELECT * FROM battle_checkpoints WHERE save_id = ? AND chapter_id = ?')
      .bind(saveId, chapter)
      .first();
    const currentRevision = existing ? Number(existing.revision) || 0 : 0;
    const base = Number(baseRevision) || 0;

    if (base < currentRevision) {
      return { conflict: true, current: mapCheckpoint(existing) };
    }

    const ts = nowIso();
    const nextRevision = currentRevision + 1;
    await db
      .prepare(
        `INSERT INTO battle_checkpoints (save_id, chapter_id, revision, payload_json, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(save_id, chapter_id) DO UPDATE SET
           revision = excluded.revision,
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`,
      )
      .bind(saveId, chapter, nextRevision, JSON.stringify(payload ?? null), ts)
      .run();
    await db
      .prepare('UPDATE single_player_saves SET updated_at = ? WHERE id = ? AND guest_id = ?')
      .bind(ts, saveId, guestId)
      .run();

    const checkpoint = mapCheckpoint(
      await db
        .prepare('SELECT * FROM battle_checkpoints WHERE save_id = ? AND chapter_id = ?')
        .bind(saveId, chapter)
        .first(),
    );
    return { checkpoint };
  }

  async function deleteCheckpoint(guestId, saveId, chapterId) {
    if (!isChapterId(chapterId)) return false;
    const save = await getSaveRow(guestId, saveId);
    if (!save) return false;
    const info = await db
      .prepare('DELETE FROM battle_checkpoints WHERE save_id = ? AND chapter_id = ?')
      .bind(saveId, clampChapter(chapterId))
      .run();
    return (info?.meta?.changes ?? 0) > 0;
  }

  async function finishRun(guestId, saveId, chapterId, input = {}) {
    if (!isChapterId(chapterId)) return { found: false };
    const save = await getSaveRow(guestId, saveId);
    if (!save) return { found: false };

    const chapter = clampChapter(chapterId);
    const outcome = input.outcome === 'win' ? 'win' : 'lose';
    const clientRunId = cleanText(input.clientRunId, 64, crypto.randomUUID());
    const correct = toCount(input.correct, 0, TOTAL_GUARD);
    const answered = toCount(input.answered, 0, TOTAL_GUARD);
    const hintsUsed = toCount(input.hintsUsed, 0, TOTAL_GUARD);
    const durationSec = toCount(input.durationSec, 0, 24 * 60 * 60);
    const expAwarded = outcome === 'win' ? EXP_PER_CLEAR : EXP_PER_ATTEMPT;

    const existing = await db
      .prepare('SELECT * FROM chapter_runs WHERE save_id = ? AND client_run_id = ?')
      .bind(saveId, clientRunId)
      .first();
    if (existing) {
      return { already: true, run: mapRun(existing), save: mapSave(save) };
    }

    const ts = nowIso();
    const saveCompleted = parseCompleted(save.completed_levels_json);
    const nextCompleted = outcome === 'win'
      ? [...new Set([...saveCompleted, chapter])].sort((a, b) => a - b)
      : saveCompleted;
    const nextChapter = outcome === 'win'
      ? Math.min(MAX_CHAPTER, Math.max(Number(save.current_chapter_id) || 1, chapter + 1))
      : Number(save.current_chapter_id) || 1;
    const nextExp = (Number(save.exp) || 0) + expAwarded;

    const insert = db
      .prepare(
        `INSERT INTO chapter_runs
           (save_id, chapter_id, client_run_id, outcome, correct, answered, hints_used, duration_sec, exp_awarded, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(saveId, chapter, clientRunId, outcome, correct, answered, hintsUsed, durationSec, expAwarded, ts);

    const update = db
      .prepare(
        `UPDATE single_player_saves
            SET exp = ?,
                completed_levels_json = ?,
                current_chapter_id = ?,
                revision = revision + 1,
                updated_at = ?
          WHERE id = ? AND guest_id = ?`,
      )
      .bind(nextExp, JSON.stringify(nextCompleted), nextChapter, ts, saveId, guestId);

    const clear = db
      .prepare('DELETE FROM battle_checkpoints WHERE save_id = ? AND chapter_id = ?')
      .bind(saveId, chapter);

    try {
      await db.batch([insert, update, clear]);
    } catch (err) {
      const raced = await db
        .prepare('SELECT * FROM chapter_runs WHERE save_id = ? AND client_run_id = ?')
        .bind(saveId, clientRunId)
        .first();
      if (raced) {
        return { already: true, run: mapRun(raced), save: mapSave(await getSaveRow(guestId, saveId)) };
      }
      throw err;
    }

    const run = mapRun(
      await db
        .prepare('SELECT * FROM chapter_runs WHERE save_id = ? AND client_run_id = ?')
        .bind(saveId, clientRunId)
        .first(),
    );
    return { run, save: mapSave(await getSaveRow(guestId, saveId)) };
  }

  async function legacyImport(guestId, input = {}) {
    const legacyKey = cleanText(input.legacyImportKey, 120, '');
    if (legacyKey) {
      const existing = await db
        .prepare('SELECT * FROM single_player_saves WHERE guest_id = ? AND legacy_import_key = ?')
        .bind(guestId, legacyKey)
        .first();
      if (existing) return { already: true, save: mapSave(existing) };
    }

    const { results } = await db
      .prepare('SELECT COUNT(*) AS count FROM single_player_saves WHERE guest_id = ?')
      .bind(guestId)
      .all();
    const count = Number(results?.[0]?.count) || 0;
    if (count >= MAX_SAVES) {
      return { limit: true, saves: await listSaves(guestId) };
    }

    const id = crypto.randomUUID();
    const ts = nowIso();
    try {
      await db
        .prepare(
          `INSERT INTO single_player_saves
             (id, guest_id, name, character_id, current_chapter_id, completed_levels_json, exp, revision, legacy_import_key, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        )
        .bind(
          id,
          guestId,
          cleanText(input.name, MAX_SAVE_NAME, 'Petualangan Lama'),
          cleanText(input.characterId, 40, 'traveler'),
          clampChapter(input.currentChapterId, 1),
          JSON.stringify(parseCompleted(input.completedLevels)),
          toCount(input.exp, 0, Number.MAX_SAFE_INTEGER),
          legacyKey || null,
          ts,
          ts,
        )
        .run();
    } catch (err) {
      if (legacyKey) {
        const raced = await db
          .prepare('SELECT * FROM single_player_saves WHERE guest_id = ? AND legacy_import_key = ?')
          .bind(guestId, legacyKey)
          .first();
        if (raced) return { already: true, save: mapSave(raced) };
      }
      throw err;
    }
    return { save: mapSave(await getSaveRow(guestId, id)) };
  }

  return {
    MAX_CHAPTER,
    MAX_SAVES,
    createSession,
    resolveGuest,
    updateProfile,
    listSaves,
    createSave,
    getSave,
    updateSave,
    deleteSave,
    getCheckpoint,
    putCheckpoint,
    deleteCheckpoint,
    finishRun,
    legacyImport,
  };
}
