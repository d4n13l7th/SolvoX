/**
 * Storage interface for Solvox match history, feedback and evaluation logs.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 * The team is running the "no database" option (b) for now, so this module keeps
 * records in process memory. On Cloudflare Workers process memory is NOT shared
 * between isolates and is discarded on eviction, so in practice the Dashboard and
 * leaderboard come back empty. In-match results are unaffected: those are served
 * from Durable Object room state, not from here.
 *
 * ── SWITCHING TO OPTION (a), LATER, WITHOUT A REWRITE ────────────────────────
 *   1. `wrangler d1 create solvox` and add the [[d1_databases]] binding in
 *      wrangler.toml (the block is already present, commented out).
 *   2. Create the tables with the schema in ./schema.sql.
 *   3. Replace the body of the functions below with the D1 calls. The exported
 *      signatures, and therefore every caller, stay exactly the same.
 * Nothing in room.js, index.js or the frontend needs to change.
 *
 * The Express backend in backend/server.js appends to data/*.jsonl instead, and
 * remains the fallback until this path is verified in production.
 */

// ── option (b): process memory ───────────────────────────────────────────────
const matches = [];
const feedback = [];
const evaluation = [];

const MAX_RECORDS = 500;

function push(list, row) {
  list.push(row);
  if (list.length > MAX_RECORDS) list.splice(0, list.length - MAX_RECORDS);
  return row;
}

export async function recordMatch(row) {
  return push(matches, { ...row, ts: row.ts || new Date().toISOString() });
}

export async function recordFeedback(row) {
  return push(feedback, { type: 'feedback', ts: new Date().toISOString(), ...row });
}

export async function recordEvaluation(row) {
  return push(evaluation, { type: 'evaluation', ts: new Date().toISOString(), ...row });
}

export async function listMatches({ player, limit = 30 } = {}) {
  const key = String(player || '').trim().toLowerCase();
  const rows = key ? matches.filter((m) => String(m.player || '').trim().toLowerCase() === key) : matches;
  return rows.slice(-Math.max(1, Math.min(100, Number(limit) || 30)));
}
