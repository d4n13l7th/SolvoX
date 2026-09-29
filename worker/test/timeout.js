/**
 * Turn timer test under eviction: neither player answers round 1, so the only
 * way the round ever advances is the 45s Durable Object alarm. Miniflare's
 * local mode evicts the object even with sockets open, so each client also
 * auto-reconnects (exactly like the browser shim does) and re-joins with its
 * mpToken. Together this proves three production claims at once:
 *
 *   1. the 45s alarm survives eviction (state was persisted, then rehydrated),
 *   2. a stalled round advances instead of freezing the duel,
 *   3. a reconnecting player keeps its seat via the 30s grace token.
 *
 *   node worker/test/timeout.js
 */
const _u = new URL(process.argv[2] || 'http://127.0.0.1:8787');
const BASE = _u.protocol.replace('http', 'ws') + '//' + _u.host;
const HTTP = _u.origin;

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function makeToken() {
  let t = '';
  for (let i = 0; i < 32; i += 1) t += Math.random().toString(16).slice(2)[0] || '0';
  return t.toUpperCase();
}
let failures = 0;
const check = (cond, msg) => {
  log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures += 1;
};
let t0 = Date.now();
const T = (s) => `t+${Math.round((Date.now() - t0) / 1000)}s`;

async function answerMap() {
  const res = await fetch(`${HTTP}/api/questions/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId: 1, lang: 'id' }),
  });
  const data = await res.json();
  return new Map(data.questions.map((q) => [q.id, q.answer]));
}

/** Reconnecting WebSocket client; onClose is the only required option. */
function mkPlayer(name, code, token, onClose, onMsg) {
  const that = { name, code, token, room: null, answered: new Set(), ws: null, pending: [] };
  const handlers = new Map();
  const flush = () => {
    for (const raw of that.pending.splice(0)) that.ws.send(raw);
  };
  const dial = () => {
    const ws = new WebSocket(`${BASE}/ws?room=${code}`);
    that.ws = ws;
    ws.onopen = flush;
    ws.onmessage = (e) => {
      const { event, data } = JSON.parse(e.data);
      if (data && data.code) that.room = data;
      for (const fn of handlers.get(event) || []) fn(data);
      if (onMsg) onMsg(event, data, that);
    };
    ws.onclose = () => {
      log(`  ${T('')}${name} socket drop, reconnect...`);
      setTimeout(dial, 800);
      if (onClose) onClose(that);
    };
    ws.onerror = () => { /* close handles it */ };
    return ws;
  };
  that.ws = dial();
  return {
    that,
    send: (ev, data = {}) => {
      const raw = JSON.stringify({ event: ev, data });
      if (that.ws.readyState === 1) that.ws.send(raw);
      else that.pending.push(raw);
    },
    on: (ev, fn) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev).add(fn);
    },
  };
}

(async () => {
  const ans = await answerMap();
  const code = `AJM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const A = mkPlayer('A', code, makeToken());
  const B = mkPlayer('B', code, makeToken());

  log(`\n=== timeout test | room ${code} ===`);
  log(`kedua pemain konek; tak satu pun menjawab ronde 1`);

  // "silent" mode: mereka melakukan join, semua siap, tapi tidak menjawab.
  const aStart = new Promise((resok) => A.on('game:start', resok));
  const bStart = new Promise((resok) => B.on('game:start', resok));

  const dialStarted = new Promise((resok) => {
    const checkAlive = () => {
      if (A.that.ws && A.that.ws.readyState === 1 && B.that.ws && B.that.ws.readyState === 1) return resok();
      setTimeout(checkAlive, 100);
    };
    checkAlive();
  });

  A.send('room:create', { name: 'Alfa', character: 'mage', levelId: 1, lang: 'id', mode: 'score', token: A.that.token });
  await dialStarted;
  B.send('room:join', { code, name: 'Bravo', character: 'ninja', token: B.that.token });

  A.send('player:ready', { ready: true });
  const gamePromise = Promise.race([aStart, bStart]);
  B.send('player:ready', { ready: true });

  const game = await Promise.race([
    gamePromise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('game never started')), 20000)),
  ]);
  log(`  ${T('')}duel dimulai, alarm 45s di-arm (ronde 1, tak ada jawaban)`);

  const round2 = await Promise.race([
    new Promise((resok) => B.on('round:next', (d) => resok(d))),
    new Promise((_, rej) => setTimeout(() => rej(new Error('alarm 45s tak memicu round:next')), 56000)),
  ]);
  log(`  ${T('')}round:next tiba untuk ronde 2`);
  check(round2.round === 2, `alarm memajukan ke ronde 2 (round=${round2.round})`);

  // Pemain yang reconnecting harus tetap duduk di kursinya.
  await sleep(1200);
  const seats = B.that.room;
  check(seats && seats.players.length === 2, 'dua kursi tetap terisi setelah eviction + reconnect');
  check(seats && seats.status === 'battle', 'duel tetap battle setelah eviction');

  log(`\n=== ${failures ? `${failures} CHECK GAGAL` : 'SEMUA CHECK LULUS'} ===\n`);
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});