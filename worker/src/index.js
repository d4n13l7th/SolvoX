/**
 * Solvox Worker — REST edge in front of the room Durable Objects.
 *
 * The React frontend stays on Vercel and reaches this Worker for both fetch()
 * calls and the realtime socket. Durable Object routing is the only new idea:
 * a socket upgrade at /ws?room=AJM-XXXX is forwarded to the single object that
 * owns that code, which is what makes both players share one room.
 */
import { CHARACTERS, TOTAL_QUESTIONS, TURN_MS, cleanLevel, freshQuestions, listLevels } from './game.js';
import { listMatches, recordEvaluation, recordFeedback } from './store.js';
import { SolvoxRoom } from './room.js';

export { SolvoxRoom };

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function withCors(request, response) {
  // Durable Object stubs hand back responses with immutable headers and the
  // Response constructor can alias them; copy into a fresh Headers object so
  // attaching CORS never trips "Can't modify immutable headers".
  const headers = new Headers(response.headers);
  const origin = request.headers.get('Origin');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(request, data, status = 200) {
  return withCors(request, new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  }));
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return withCors(request, new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // ── realtime: hand the upgrade to the Durable Object that owns the code ──
    if (path === '/ws') {
      const code = (url.searchParams.get('room') || '').trim().toUpperCase();
      if (!/^AJM-[A-Z0-9]{4}$/.test(code)) {
        return new Response('bad room code', { status: 400 });
      }
      const stub = env.SOLVOX_ROOM.get(env.SOLVOX_ROOM.idFromName(code));
      return stub.fetch(roomRequest(request, code));
    }

    // ── realtime fallback: same room Durable Object over plain HTTP ─────────
    // Networks that drop WebSocket upgrades (campus firewalls, some ISPs) still
    // allow fetch() calls, so the client can play on a long-poll transport. Both
    // routes resolve the object by the same idFromName(code), so HTTP players
    // land on exactly the same instance as WebSocket players in the room.
    if (path === '/api/room/event' && request.method === 'POST') {
      const code = (url.searchParams.get('room') || '').trim().toUpperCase();
      if (!/^AJM-[A-Z0-9]{4}$/.test(code)) return json(request, { ok: false, message: 'bad room code' }, 400);
      const stub = env.SOLVOX_ROOM.get(env.SOLVOX_ROOM.idFromName(code));
      const body = await request.text();
      const fwd = new Request(
        `https://room.local/event?token=${encodeURIComponent(url.searchParams.get('token') || '')}`,
        { method: 'POST', headers: { 'X-Solvox-Room': code, 'Content-Type': 'application/json' }, body },
      );
      return withCors(request, await stub.fetch(fwd));
    }
    if (path === '/api/room/poll' && request.method === 'GET') {
      const code = (url.searchParams.get('room') || '').trim().toUpperCase();
      if (!/^AJM-[A-Z0-9]{4}$/.test(code)) return json(request, { ok: false, message: 'bad room code' }, 400);
      const stub = env.SOLVOX_ROOM.get(env.SOLVOX_ROOM.idFromName(code));
      const fwd = new Request(
        `https://room.local/poll?token=${encodeURIComponent(url.searchParams.get('token') || '')}`,
        { method: 'GET', headers: { 'X-Solvox-Room': code } },
      );
      return withCors(request, await stub.fetch(fwd));
    }

    // ── read-only endpoints ─────────────────────────────────────────────────
    if (path === '/health') {
      const started = Date.now();
      try {
        // Probe a dedicated object id, never a real AJM-* room, so monitoring
        // can never join, disturb or evict somebody's live match.
        const stub = env.SOLVOX_ROOM.get(env.SOLVOX_ROOM.idFromName('health-probe'));
        const res = await stub.fetch('https://do/health', {
          headers: { 'X-Solvox-Room': 'health-probe' },
        });
        const probe = await res.json();
        return json(request, {
          ok: true,
          durableObject: probe,
          latencyMs: Date.now() - started,
          transport: 'websocket',
          roomPattern: 'AJM-XXXX',
          turnDuration: TURN_MS,
          questionsPerChapter: TOTAL_QUESTIONS,
          questionEngine: 'local',
          storage: 'durable-object-sqlite',
        });
      } catch (e) {
        return json(request, { ok: false, error: String((e && e.message) || e) }, 503);
      }
    }
    if (path === '/api/characters') return json(request, Object.values(CHARACTERS));
    if (path === '/api/levels') return json(request, listLevels());

    if (path === '/api/questions/generate' && request.method === 'POST') {
      const body = await readJson(request);
      const chapterId = cleanLevel(body?.chapterId);
      const lang = body?.lang === 'en' ? 'en' : 'id';
      try {
        const pack = freshQuestions(chapterId, lang);
        return json(request, {
          ok: true,
          chapterId,
          lang,
          totalQuestions: pack.questions.length,
          source: pack.source,
          questions: pack.questions,
        });
      } catch {
        return json(request, { ok: false, message: 'Question generation failed' }, 500);
      }
    }

    if (path === '/api/feedback' && request.method === 'POST') {
      try {
        await recordFeedback(await readJson(request));
        return json(request, { ok: true });
      } catch {
        return json(request, { ok: false, message: 'Feedback gagal disimpan' }, 500);
      }
    }

    if (path === '/api/evaluation' && request.method === 'POST') {
      try {
        await recordEvaluation(await readJson(request));
        return json(request, { ok: true });
      } catch {
        return json(request, { ok: false, message: 'Evaluasi gagal disimpan' }, 500);
      }
    }

    if (path === '/api/player-profile') {
      const name = (url.searchParams.get('name') || '').trim().toLowerCase();
      if (!name) return json(request, { ok: true, player: null });
      const rows = await listMatches({ player: name, limit: 100 });
      if (!rows.length) return json(request, { ok: true, player: null });
      const matches = rows.length;
      const sum = (key) => rows.reduce((total, r) => total + (Number(r[key]) || 0), 0);
      const answered = sum('answered');
      const correct = sum('correct');
      return json(request, {
        ok: true,
        player: {
          name: rows[rows.length - 1].player,
          matches,
          wins: sum('wins'),
          draws: sum('draw'),
          losses: sum('losses'),
          answered,
          correct,
          accuracy: answered ? Math.round((correct / answered) * 100) : 0,
          avgScore: matches ? Math.round(sum('score') / matches) : 0,
          avgDuration: matches ? Math.round(sum('durationSec') / matches) : 0,
          totalHints: sum('hintsUsed'),
          avgHints: matches ? Math.round((sum('hintsUsed') / matches) * 10) / 10 : 0,
          lastPlayed: rows.map((r) => r.ts).sort().slice(-1)[0],
        },
      });
    }

    if (path === '/api/dashboard') {
      const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 30));
      const rows = await listMatches({ limit: 100 });
      const players = new Map();
      for (const row of rows) {
        const key = String(row.player || 'Player').trim().toLowerCase() || 'player';
        const item = players.get(key) || {
          name: row.player, matches: 0, wins: 0, draws: 0, losses: 0, totalCorrect: 0,
          totalAnswered: 0, totalScore: 0, totalAccuracy: 0, totalHints: 0, lastPlayed: row.ts,
        };
        item.matches += 1;
        item.wins += row.wins || 0;
        item.draws += row.draw || 0;
        item.losses += row.losses || 0;
        item.totalCorrect += row.correct || 0;
        item.totalAnswered += row.answered || 0;
        item.totalScore += row.score || 0;
        item.totalAccuracy += row.accuracy || 0;
        item.totalHints += row.hintsUsed || 0;
        if (new Date(row.ts) > new Date(item.lastPlayed)) item.lastPlayed = row.ts;
        players.set(key, item);
      }
      const leaderboard = [...players.values()]
        .map((item) => ({
          ...item,
          accuracy: item.matches ? Math.round(item.totalAccuracy / item.matches) : 0,
          avgScore: item.matches ? Math.round(item.totalScore / item.matches) : 0,
          answerRate: item.totalAnswered ? Math.round((item.totalCorrect / item.totalAnswered) * 100) : 0,
          avgHints: item.matches ? Math.round((item.totalHints / item.matches) * 10) / 10 : 0,
        }))
        .sort((a, b) => (b.matches - a.matches) || (b.accuracy - a.accuracy))
        .slice(0, limit);
      return json(request, {
        ok: true,
        summary: {
          matches: Math.floor(rows.length / 2),
          playerEntries: rows.length,
          uniquePlayers: players.size,
          totalAnswered: rows.reduce((n, x) => n + (x.answered || 0), 0),
          avgAccuracy: rows.length ? Math.round(rows.reduce((n, x) => n + (x.accuracy || 0), 0) / rows.length) : 0,
          totalHints: rows.reduce((n, x) => n + (x.hintsUsed || 0), 0),
        },
        players: leaderboard,
        recent: rows.slice(-limit).reverse(),
      });
    }

    return json(request, { ok: false, message: 'Not found' }, 404);
  },
};

/**
 * The object learns which code it is responsible for from a header rather than
 * from a global, so room.js can echo the code back in room:created and can hand
 * out a replacement on collision.
 */
function roomRequest(request, code) {
  const url = new URL(request.url);
  url.searchParams.set('code', code);
  const headers = new Headers(request.headers);
  headers.set('X-Solvox-Room', code);
  return new Request(url.toString(), { method: request.method, headers });
}
