/**
 * Reconnect grace test: a player drops mid-duel and comes back with the same
 * mpToken inside the 30s grace window. The room must not duplicate the player,
 * must let the returning socket rejoin via room:reconnected, and the duel must
 * still run to its end without double-answering.
 *
 *   node worker/test/reconnect.js
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

async function answerMap() {
  const res = await fetch(`${HTTP}/api/questions/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId: 1, lang: 'id' }),
  });
  const data = await res.json();
  return new Map(data.questions.map((q) => [q.id, q.answer]));
}

function client(that) {
  that.ws = new WebSocket(`${BASE}/ws?room=${that.code}`);
  that.ws._token = that.token;
  that.ws.onmessage = (e) => {
    const { event, data } = JSON.parse(e.data);
    if (that.onAny) that.onAny(event, data);
    if (data && data.code) that.room = data;
    if (event === 'game:finished') that.finished = data;
    for (const fn of (that._handlers.get(event) || [])) fn(data);
    that.tryAnswer();
  };
  return {
    send: (ev, data = {}) => that.ws.send(JSON.stringify({ event: ev, data })),
    on: (ev, fn) => {
      if (!that._handlers.has(ev)) that._handlers.set(ev, new Set());
      that._handlers.get(ev).add(fn);
    },
    until: (ev, ms = 20000) => new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`${that.name}: timeout menunggu ${ev}`)), ms);
      that._handlers.set(ev, new Set([(d) => { clearTimeout(t); res(d); }]));
    }),
    open: () => new Promise((res, rej) => {
      if (that.ws.readyState === 1) return res();
      that.ws.onopen = () => res();
      that.ws.onerror = () => rej(new Error(`${that.name}: gagal konek`));
    }),
    close: () => that.ws.close(),
  };
}

function make(name, code, token, ans) {
  const that = {
    name, code, token, ans, room: null, finished: null, answered: new Set(),
    _handlers: new Map(), onAny: null, ws: null,
    tryAnswer() {
      const room = this.room;
      if (!room || room.status !== 'battle' || !room.question) return;
      if (this.answered.has(room.questionIndex)) return;
      // Resolve the answer BEFORE claiming the question. Marking it answered
      // first and then bailing out would silently skip the submit, stall the
      // duel, and make the run depend on 45s turn timeouts.
      const right = this.ans.get(room.question.id);
      if (right === undefined) return;
      this.answered.add(room.questionIndex);
      setTimeout(() => {
        if (this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify({ event: 'answer:submit', data: { answer: String(right) } }));
        }
      }, 60);
    },
  };
  return { that, ...client(that) };
}

(async () => {
  const ans = await answerMap();
  const code = `AJM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const A = make('A', code, makeToken(), ans);
  const B = make('B', code, makeToken(), ans);

  log(`\n=== reconnect test | room ${code} ===\n`);
  await A.open();
  A.send('room:create', { name: 'Alfa', character: 'mage', levelId: 1, lang: 'id', mode: 'score', token: A.that.token });
  await A.until('room:created');

  await B.open();
  B.send('room:join', { code, name: 'Bravo', character: 'ninja', token: B.that.token });

  const sa = A.until('game:start');
  const sb = B.until('game:start');
  A.send('player:ready', { ready: true });
  B.send('player:ready', { ready: true });
  await Promise.all([sa, sb]);
  log('duel dimulai, kedua pemain menjawab otomatis');

  // Selesaikan 3 ronde pertama bersama-sama.
  for (let i = 0; i < 20; i += 1) {
    if ((A.that.room?.round || 0) >= 3) break;
    await sleep(250);
  }
  const midRound = A.that.room?.round;
  check(midRound >= 3, `setidaknya 3 ronde sebelum drop (mencapai ronde ${midRound})`);

  const sawDrop = new Promise((res) => { B.that.onAny = (ev) => { if (ev === 'player:disconnected') res(); }; });
  A.close();
  await sawDrop;
  log('A drop: socket ditutup tanpa room:leave');

  // Kembali dengan token sama — membuat socket baru di object yang sama.
  const afterDrop = B.that.room;
  check(afterDrop.status === 'battle', 'duel tetap berjalan saat A pergi (tidak batal)');
  check(afterDrop.players.length === 2, 'kursi A masih dipertahankan (grace period)');
  check(afterDrop.players.find((p) => p.token === A.that.token)?.connected === false, 'server menandai A disconnected');

  A.that._handlers.clear();
  const rc = A.until('room:reconnected', 15000);
  const reconnectSock = new WebSocket(`${BASE}/ws?room=${code}`);
  reconnectSock._token = A.that.token;
  const oldOnMessage = reconnectSock.onmessage;
  reconnectSock.onmessage = (e) => {
    const { event, data } = JSON.parse(e.data);
    if (event === 'room:recode') { /* not in this test */ }
    if (data && data.code) A.that.room = data;
    if (event === 'game:finished') A.that.finished = data;
    for (const fn of (A.that._handlers.get(event) || [])) fn(data);
    A.that.tryAnswer();
  };
  A.that.ws = reconnectSock;
  await new Promise((res, rej) => {
    reconnectSock.onopen = res;
    reconnectSock.onerror = () => rej(new Error('sambung ulang A gagal'));
  });
  reconnectSock.send(JSON.stringify({ event: 'room:join', data: { code, name: 'Alfa', token: A.that.token } }));

  const rejoined = await rc;
  check(rejoined.status === 'battle', 'room:reconnected dikirim, duel masih battle');
  check(rejoined.players.length === 2, 'tidak ada duplikat pemain setelah reconnect');
  check(rejoined.players.filter((p) => p.token === A.that.token).length === 1, 'token A dipakai tepat satu kursi');

  const doneB = B.until('game:finished', 60000);
  const doneA = A.until('game:finished', 60000);
  const [finA, finB] = await Promise.all([doneA, doneB]);
  check(finA.status === 'finished' && finB.status === 'finished', 'duel selesai normal setelah reconnect');
  check(finA.round === 10, `semua 10 ronde setelah reconnect (round=${finA.round})`);
  check(finA.winner === 'draw', 'kedua pemain menjawab benar -> seri');
  check(A.that.answered.size === 10 && B.that.answered.size === 10, 'tidak ada jawaban rangkap (masing-masing 10)');

  log(`\n=== ${failures ? `${failures} CHECK GAGAL` : 'SEMUA CHECK LULUS'} ===\n`);
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});