const BASE = 'ws://127.0.0.1:8787';
const HTTP = 'http://127.0.0.1:8787';

async function answerMapFor(level, lang) {
  const res = await fetch(`${HTTP}/api/questions/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId: level, lang }),
  });
  const data = await res.json();
  return new Map(data.questions.map((q) => [q.id, q.answer]));
}

async function main() {
  const answers = await answerMapFor(1, 'id');
  const code = `AJM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  console.log('code:', code);

  const mk = (name) => {
    const ws = new WebSocket(`${BASE}/ws?room=${code}`);
    ws.onopen = () => console.log(`[${name}] OPEN`);
    ws.onmessage = (e) => {
      const { event, data } = JSON.parse(e.data);
      console.log(`[${name}] ${event}`, event === 'room:created' || event === 'room:update' || event === 'game:start' || event === 'round:next'
        ? JSON.stringify({ players: data.players?.map((p) => `${p.name}(ready=${p.ready},conn=${p.connected},hp=${p.hp})`), status: data.status, qIdx: data.questionIndex, round: data.round, qid: data.question?.id })
        : JSON.stringify(data).slice(0, 140));
    };
    ws.onerror = (e) => console.log(`[${name}] ERROR`, e.message);
    ws.onclose = (e) => console.log(`[${name}] CLOSE`, e.code, e.reason);
    return {
      ws,
      send: (ev, d = {}) => ws.send(JSON.stringify({ event: ev, data: d })),
    };
  };

  const A = mk('A');
  await new Promise((r) => (A.ws.readyState === 1 ? r() : (A.ws.onopen = r)));
  A.send('room:create', { name: 'Alfa', character: 'mage', levelId: 1, lang: 'id', mode: 'score' });

  await new Promise((r) => setTimeout(r, 300));
  const B = mk('B');
  await new Promise((r) => (B.ws.readyState === 1 ? r() : (B.ws.onopen = r)));
  B.send('room:join', { code, name: 'Bravo', character: 'ninja' });

  await new Promise((r) => setTimeout(r, 300));
  console.log('--- kedua pemain siap dikirim ---');
  A.send('player:ready', { ready: true });
  B.send('player:ready', { ready: true });

  await new Promise((r) => setTimeout(r, 15000));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });