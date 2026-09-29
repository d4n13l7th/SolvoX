/**
 * End to end duel over the HTTP long-poll fallback transport.
 *
 * Exercises the exact path a campus/LAN that blocks WebSocket upgrades would
 * take: every player frame is a POST to /api/room/event and every broadcast is
 * pulled from /api/room/poll. No WebSocket is ever opened here.
 *
 *   node worker/test/poll.js [baseUrl]
 */
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const HTTP = BASE;
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
const waitFor = (fn, ms = 15000) => new Promise((res, rej) => {
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (fn()) {
      clearInterval(iv);
      res();
    } else if (Date.now() - t0 > ms) {
      clearInterval(iv);
      rej(new Error('timeout menunggu kondisi'));
    }
  }, 50);
});

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
  const state = { code: roomCode, token, room: null, answered: new Set(), finished: null, results: [] };
  let stopped = false;

  const strictErr = () => {
    failures += 1;
    console.error('  FAIL  transport mengembalikan status != 2xx (infra seperti withCors rusak)');
  };

  const post = (event, data = {}) => fetch(
    `${HTTP}/api/room/event?room=${encodeURIComponent(state.code || '')}&token=${encodeURIComponent(state.token || '')}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, data: { ...data, token: state.token } }) },
  ).then((r) => {
    if (!r.ok) strictErr();
    return r;
  });

  const tryAnswer = () => {
    const room = state.room;
    if (!room || room.status !== 'battle' || !room.question) return;
    if (state.answered.has(room.questionIndex)) return;
    const me = room.players.find((p) => p.token === state.token);
    if (!me) return;
    if (room.mode === 'turn' && room.currentTurnToken !== me.token) return;
    const right = answers.get(room.question.id);
    if (right === undefined) return;
    state.answered.add(room.questionIndex);
    post('answer:submit', { answer: String(CORRECT ? right : '__salah__') });
  };

  const dispatch = ({ event, data }) => {
    if (process.env.DEBUG === '1') console.log(`  [dbg][${name}] ${event}`, data && data.code, data && data.status);
    if (event === 'room:created' || event === 'room:reconnected' || event === 'room:recode') {
      if (event === 'room:recode') state.code = data.code;
      state.room = data;
    }
    if (event === 'room:update' || event === 'game:start' || event === 'round:next'
      || event === 'turn:next' || event === 'round:resolved' || event === 'score:answer'
      || event === 'game:finished' || event === 'rematch:ready' || event === 'player:disconnected') {
      if (data && data.code) state.room = data;
      if (event === 'game:finished') {
        state.finished = data;
        const me = data.players?.find((p) => p.token === state.token);
        if (me) state.results.push(me);
      }
    }
    for (const fn of handlers.get(event) || []) fn(data);
    if (event !== 'answer:result') tryAnswer();
  };

  const loop = async () => {
    while (!stopped) {
      try {
        const r = await fetch(
          `${HTTP}/api/room/poll?room=${encodeURIComponent(state.code || '')}&token=${encodeURIComponent(state.token || '')}`,
        );
        if (!r.ok) {
          strictErr();
          continue;
        }
        const batch = await r.json();
        for (const frame of batch || []) dispatch(frame);
      } catch (e) {
        log(`  [${name}] poll error: ${e.message}`);
        await sleep(500);
      }
    }
  };

  loop();

  return {
    state,
    on: (ev, fn) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev).add(fn);
    },
    send: (event, data = {}) => post(event, data),
    until: (ev, ms = 90000) => new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`${name}: timeout menunggu ${ev}`)), ms);
      handlers.set(ev, new Set([(d) => { clearTimeout(t); res(d); }]));
    }),
    close: () => { stopped = true; },
  };
}

(async () => {
  const answers = await answerMapFor(LEVEL, 'id');
  log(`\n=== poll test (HTTP long-poll only, NO WebSocket) | chapter ${LEVEL} | mode ${MODE} | jawaban ${CORRECT ? 'benar' : 'salah'} ===`);
  log(`bank soal: ${answers.size} soal\n`);

  const code = `AJM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const A = client('A', answers, code, makeToken());
  A.send('room:create', { name: 'Alfa', character: 'mage', levelId: LEVEL, lang: 'id', mode: MODE, token: A.state.token });
  const created = await A.until('room:created');
  check(created.code === code, `room dibuat via HTTP dengan kode yang diminta (${created.code})`);
  check(created.players.length === 1, 'room starts with 1 pemain (poll host)');

  const B = client('B', answers, code, makeToken());
  B.send('room:join', { code, name: 'Bravo', character: 'ninja', token: B.state.token });
  await waitFor(() => (A.state.room?.players || []).length === 2);
  const waiting = A.state.room;
  check(waiting && waiting.players.length === 2, 'kedua pemain (HTTP) ada di room yang sama');
  log(`        pemain: ${(waiting?.players || []).map((p) => p.name).join(' vs ')}`);

  const startA = A.until('game:start');
  const startB = B.until('game:start');
  A.send('player:ready', { ready: true });
  B.send('player:ready', { ready: true });
  const [gameA, gameB] = await Promise.all([startA, startB]);
  check(gameA.players.every((p) => p.hp === 100), 'HP reset ke 100');
  check(!!gameA.question, 'soal pertama terkirim via poll');
  check(gameB.question?.id === gameA.question?.id, 'kedua pemain dapat soal yang sama');

  const doneA = A.until('game:finished', 120000);
  const doneB = B.until('game:finished', 120000);
  const [finA, finB] = await Promise.all([doneA, doneB]);

  check(finA.status === 'finished', 'status finished');
  check(!!finA.winner, `pemenang ditentukan: ${finA.winner === 'draw' ? 'seri' : 'satu pemain'}`);
  check(finA.round >= 1 && finA.round <= finA.totalQuestions, `${finA.round}/${finA.totalQuestions} ronde dimainkan`);
  check(!!finA.finishSummary && Object.keys(finA.finishSummary).length === 2, 'finishSummary ada untuk kedua pemain HTTP');

  const scoreOK = MODE === 'score'
    ? finA.players.every((p) => p.score === (CORRECT ? 1000 : 0))
    : finA.players.every((p) => p.score === p.correct * 2);
  check(scoreOK, `skor akhir sesuai mode (score=${MODE}, salah=${!CORRECT})`);

  log('\n--- ringkasan duel HTTP ---');
  for (const p of finA.players) {
    log(`  ${p.name.padEnd(6)} score=${p.score} hp=${p.hp} correct=${p.correct} answered=${p.answered} hints=${p.hintsUsed}`);
  }
  log(`  winner=${finA.winner === 'draw' ? 'draw' : finA.players.find((p) => p.token === finA.winner)?.name}`);

  A.close();
  B.close();
  await sleep(200);

  log(`\n=== ${failures ? `${failures} CHECK GAGAL` : 'SEMUA CHECK LULUS'} ===\n`);
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});