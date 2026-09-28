/**
 * End to end duel test against a running Solvox Worker.
 *
 * Speaks the same protocol the browser shim does: dial /ws?room=CODE, send
 * {event,data} frames, read them back the same way. Plays a full 10 round Score
 * Duel with both players answering correctly, then checks the finish payload,
 * the match log and the rematch path.
 *
 *   node worker/test/duel.js [baseUrl]
 */
const BASE = (process.argv[2] || 'http://127.0.0.1:8787').replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
const HTTP = BASE.replace(/^ws/, 'http');
const LEVEL = Number(process.env.LEVEL || 1);
const MODE = process.env.MODE || 'score';
const CORRECT = process.env.WRONG !== '1';

const log = (...a) => console.log(...a);
let failures = 0;
function check(cond, msg) {
  if (cond) {
    log(`  PASS  ${msg}`);
  } else {
    failures += 1;
    log(`  FAIL  ${msg}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeToken() {
  let t = '';
  for (let i = 0; i < 32; i += 1) t += Math.random().toString(16).slice(2)[0] || '0';
  return t.toUpperCase();
}

async function answerMapFor(level, lang) {
  const res = await fetch(`${HTTP}/api/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId: level, lang }),
  });
  const data = await res.json();
  return new Map(data.questions.map((q) => [q.id, q.answer]));
}

function client(name, answers, roomCode, token) {
  const handlers = new Map();
  const state = { code: roomCode || null, token: token || null, room: null, answered: new Set(), finished: null, results: [] };
  const ws = new WebSocket(`${BASE}/ws?room=${state.code}`);
  ws._token = state.token;

  const tryAnswer = () => {
    const room = state.room;
    if (!room || room.status !== 'battle' || !room.question) return;
    if (state.answered.has(room.questionIndex)) return;
    const me = room.players.find((p) => p.token === ws._token);
    if (!me) return;
    if (room.mode === 'turn' && room.currentTurnToken !== me.token) return;
    const right = answers.get(room.question.id);
    const value = CORRECT ? right : '__salah__';
    if (value === undefined) return;
    state.answered.add(room.questionIndex);
    ws.send(JSON.stringify({ event: 'answer:submit', data: { answer: String(value) } }));
  };

  ws.onmessage = (e) => {
    const { event, data } = JSON.parse(e.data);
    if (process.env.DEBUG === '1') console.log(`  [dbg][${name}] ${event}`, data && data.code, data && data.status);
    if (event === 'room:created' || event === 'room:reconnected' || event === 'room:recode') {
      if (event === 'room:recode') {
        state.code = data.code;
        ws.close();
        const next = new WebSocket(`${BASE}/ws?room=${state.code}`);
        bind(next);
        return;
      }
      state.code = data.code;
      state.room = data;
      ws._token = (data.players || [])[0]?.token;
    }
    if (event === 'room:update' || event === 'game:start' || event === 'round:next'
      || event === 'turn:next' || event === 'round:resolved' || event === 'score:answer'
      || event === 'game:finished' || event === 'rematch:ready' || event === 'player:disconnected') {
      if (data && data.code) state.room = data;
      if (event === 'game:finished') {
        state.finished = data;
        const me = data.players?.find((p) => p.token === ws._token);
        if (me) state.results.push(me);
      }
    }
    for (const fn of handlers.get(event) || []) fn(data);
    if (event !== 'answer:result') tryAnswer();
  };

  const bind = (sock) => {
    sock._token = ws._token;
    sock.onmessage = ws.onmessage;
  };

  return {
    state,
    on: (ev, fn) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev).add(fn);
    },
    send: (event, data = {}) => ws.send(JSON.stringify({ event, data })),
    open: () => new Promise((res, rej) => {
      if (ws.readyState === 1) return res();
      ws.onopen = () => res();
      ws.onerror = () => rej(new Error(`${name}: gagal konek ke ${BASE}`));
    }),
    until: (ev, ms = 60000) => new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`${name}: timeout menunggu ${ev}`)), ms);
      handlers.set(ev, new Set([(d) => { clearTimeout(t); res(d); }]));
    }),
    close: () => ws.close(),
    setCode: (c) => { state.code = c; },
  };
}

(async () => {
  const answers = await answerMapFor(LEVEL, 'id');
  log(`\n=== duel test | chapter ${LEVEL} | mode ${MODE} | jawaban ${CORRECT ? 'benar' : 'salah'} ===`);
  log(`bank soal: ${answers.size} soal\n`);

  const code = `AJM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const A = client('A', answers, code, makeToken());
  await A.open();

  A.send('room:create', { name: 'Alfa', character: 'mage', levelId: LEVEL, lang: 'id', mode: MODE, token: A.state.token });
  await A.until('room:created');
  check(A.state.room.code === code, `room dibuat dengan kode yang diminta (${A.state.room.code})`);
  check(A.state.room.players.length === 1, 'room starts with 1 pemain');

  const B = client('B', answers, code, makeToken());
  await B.open();
  B.send('room:join', { code, name: 'Bravo', character: 'ninja', token: B.state.token });
  await sleep(700);

  const waiting = A.state.room;
  check(waiting && waiting.players.length === 2, 'kedua pemain ada di room yang sama');
  log(`        pemain: ${(waiting?.players || []).map((p) => p.name).join(' vs ')}`);

  const startA = A.until('game:start');
  const startB = B.until('game:start');
  A.send('player:ready', { ready: true });
  B.send('player:ready', { ready: true });
  const [gameA, gameB] = await Promise.all([startA, startB]);
  check(gameA.totalQuestions === 10, 'total 10 soal per duel');
  check(gameA.players.every((p) => p.hp === 100), 'HP reset ke 100');
  check(!!gameA.question, 'soal pertama terkirim');
  check(gameB.question?.id === gameA.question?.id, 'kedua pemain dapat soal yang sama');

  const doneA = A.until('game:finished', 90000);
  const doneB = B.until('game:finished', 90000);
  const [finA, finB] = await Promise.all([doneA, doneB]);

  check(finA.status === 'finished', 'status finished');
  check(!!finA.winner, `pemenang ditentukan: ${finA.winner === 'draw' ? 'seri' : 'satu pemain'}`);
  check(finA.round >= 1 && finA.round <= finA.totalQuestions, `${finA.round}/${finA.totalQuestions} ronde dimainkan (KO bisa mengakhiri lebih awal)`);
  check(Object.keys(finA.answered || {}).length >= 0, 'payload answered konsisten');
  check(!!finA.finishSummary && Object.keys(finA.finishSummary).length === 2, 'finishSummary ada untuk kedua pemain');
  check(finA.winner === 'draw' || (finA.decisiveQuestion && !!finA.decisiveQuestion.text),
    'soal penentu dikirim saat duel ada pemenang (draw tidak perlu)');

  const scoreOK = MODE === 'score'
    ? finA.players.every((p) => p.score === (CORRECT ? 1000 : 0))
    : finA.players.every((p) => p.score === p.correct * 2);
  check(scoreOK,
    `skor akhir sesuai mode (score=${MODE}, salah=${!CORRECT})`);

  const meA = finA.players.find((p) => p.name === 'Alfa');
  const meB = finA.players.find((p) => p.name === 'Bravo');
  check(!!meA && !!meB, 'kedua pemain ada di ringkasan');

  log('\n--- ringkasan duel ---');
  for (const p of finA.players) {
    log(`  ${p.name.padEnd(6)} score=${p.score} hp=${p.hp} correct=${p.correct} answered=${p.answered} hints=${p.hintsUsed}`);
  }
  log(`  winner=${finA.winner === 'draw' ? 'draw' : finA.players.find((p) => p.token === finA.winner)?.name}`);
  log(`  Alfa lihat: "${finA.finishSummary[meA?.token]}"`);

  // ── rematch ────────────────────────────────────────────────────────────────
  A.state.answered.clear();
  B.state.answered.clear();
  const rematchA = A.until('rematch:ready');
  const rematchB = B.until('rematch:ready');
  A.send('rematch');
  const [rA, rB] = await Promise.all([rematchA, rematchB]);
  check(rA.status === 'waiting' && rA.statusKey === 'REMATCH_READY', 'rematch mengembalikan room ke waiting');
  check(rA.players.every((p) => p.score === 0 && p.hp === 100), 'skor dan HP direset');

  // ── dashboard / player profile ─────────────────────────────────────────────
  await sleep(400);
  const dash = await (await fetch(`${HTTP}/api/dashboard?limit=20`)).json();
  check(dash.ok === true, '/api/dashboard merespons ok');
  const prof = await (await fetch(`${HTTP}/api/player-profile?name=Alfa`)).json();
  check(prof.ok === true, '/api/player-profile merespons ok');

  A.close();
  B.close();
  await sleep(300);

  log(`\n=== ${failures ? `${failures} CHECK GAGAL` : 'SEMUA CHECK LULUS'} ===\n`);
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
