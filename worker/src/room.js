/**
 * Solvox room — one Durable Object instance per room code.
 *
 * A Durable Object is single threaded and long lived, which makes it a natural
 * home for the state that used to live in the `rooms` Map in backend/server.js.
 * Everything a client can see about a duel (players, hp, score, turn order, the
 * finish summary) lives on `this.room` and is serialised by `publicRoom()`.
 *
 * Differences from the Express version, and why:
 *
 * - `io.to(room).emit(ev, payload)` became `broadcast()`, which walks the
 *   Durable Object's own socket set. Socket.IO rooms have no equivalent here.
 * - Turn deadlines use `state.storage.setAlarm()` instead of `setTimeout`, so a
 *   45 second turn cannot drift or be dropped while the runtime is busy.
 * - The short 700ms/1000ms delays that pace the "wrong answer -> next round"
 *   animation stay on setTimeout; they are cosmetic and losing one is harmless.
 * - Sockets are accepted with ws.accept() rather than the Hibernation API on
 *   purpose: an open socket keeps this object in memory, so the room survives a
 *   burst of activity without writing state to SQLite on every message. It also
 *   means an abandoned room disappears when its last player leaves. A duel is
 *   minutes long, so the extra duration cost stays well inside the free tier.
 */
import {
  CHARACTERS,
  DAMAGE_PER_CORRECT,
  ROOM_GRACE_MS,
  TOTAL_QUESTIONS,
  TURN_MS,
  cleanLevel,
  cleanName,
  cleanToken,
  freshQuestions,
  isCorrect,
  sanitizeQuestion,
  sanitizeReviewQuestion,
} from './game.js';
import { recordMatch } from './store.js';

const MAX_NAME = 18;
const ROOM_KEY = 'room:v1';

export class SolvoxRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    /** @type {any} */
    this.room = null;
    this.sockets = new Map(); // WebSocket -> playerToken
    this.graceTimers = new Map(); // playerToken -> timeout
    this._loaded = false;
    this._tag = Math.random().toString(36).slice(2, 7);
  }

  /**
   * Durable Objects are evicted while idle, and the alarm handler runs on a
   * fresh instance that has never seen fetch(). The whole room therefore lives
   * in SQLite-backed storage and is loaded here on every entry point.
   */
  async ensureLoaded() {
    if (this._loaded) return;
    this._loaded = true;
    try {
      const blob = await this.state.storage.get(ROOM_KEY);
      if (blob) this.room = typeof blob === 'string' ? JSON.parse(blob) : blob;
    } catch {
      /* fresh room */
    }
  }

  saveRoom() {
    if (!this.room) return;
    try {
      this.state.storage.put(ROOM_KEY, JSON.stringify(this.room)).catch(() => {});
    } catch {
      /* storage disabled in tests */
    }
  }

  dropRoom() {
    this.room = null;
    try {
      this.state.storage.delete(ROOM_KEY).catch(() => {});
    } catch {
      /* ignore */
    }
  }

  // ── plumbing ──────────────────────────────────────────────────────────────

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket upgrade', { status: 426 });
    }
    await this.ensureLoaded();
    // The Worker tells us which room code this object is responsible for.
    this.code = (request.headers.get('X-Solvox-Room') || '').trim().toUpperCase();
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    const token = cleanToken(new URL(request.url).searchParams.get('token'));
    if (token) this.sockets.set(server, token);
    server.send(JSON.stringify({
      event: 'server:info',
      data: {
        turnMs: TURN_MS,
        roomGraceMs: ROOM_GRACE_MS,
        questionsPerChapter: TOTAL_QUESTIONS,
        protocol: 'turn-based',
      },
    }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    await this.ensureLoaded();
    let frame;
    try {
      frame = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch {
      return;
    }
    const event = frame && frame.event;
    const data = (frame && frame.data) || {};
    if (!event) return;
    console.log(`[dbg] msg ${event} inst=${this._tag} has=${this.sockets.has(ws) ? 1 : 0} n=${this.sockets.size} code=${this.code}`);
    if (event === 'room:create') return this.onCreate(ws, data);
    if (event === 'room:join') return this.onJoin(ws, data);
    if (event === 'player:ready') return this.onReady(ws, data);
    if (event === 'ping') return this.emitTo(ws, 'pong', { on: Date.now() });
    if (event === 'player:update') return this.onPlayerUpdate(ws, data);
    if (event === 'turn:hint') return this.onHint(ws);
    if (event === 'answer:submit') return this.onAnswer(ws, data);
    if (event === 'rematch') return this.onRematch(ws);
    if (event === 'room:leave') return this.onLeave(ws, true);
    console.log(`[dbg] ws event tak dikenal: ${event}`);
  }

  async webSocketClose(ws) {
    await this.ensureLoaded();
    this.onLeave(ws, false);
  }

  async webSocketError(ws) {
    await this.ensureLoaded();
    this.onLeave(ws, false);
  }

  /** The 45s turn deadline. Survives eviction because it is an alarm, not a timer. */
  async alarm() {
    await this.ensureLoaded();
    const room = this.room;
    console.log(`[dbg] alarm status=${room ? room.status : 'NULL-ROOM'} mode=${room ? room.mode : '?'} code=${room ? room.code : '?'}`);
    if (!room || room.status !== 'battle') return;
    if (room.mode === 'turn') return this.advanceTurn(room, true);
    return this.advanceScoreRound(room, true);
  }

  // ── socket helpers ─────────────────────────────────────────────────────────

  send(ws, event, data) {
    try {
      ws.send(JSON.stringify({ event, data }));
    } catch {
      /* socket already gone */
    }
  }

  emitTo(ws, event, data) {
    this.send(ws, event, data);
  }

  broadcast(event = 'room:update', room = this.room) {
    if (!room) return;
    const payload = this.publicRoom(room);
    for (const ws of this.state.getWebSockets()) {
      this.send(ws, event, payload);
    }
    this.saveRoom();
  }

  setTurnDeadline(room) {
    this.state.storage.setAlarm(Date.now() + TURN_MS + 250);
  }

  clearTurnDeadline() {
    this.state.storage.deleteAlarm();
  }

  // ── room lifecycle ─────────────────────────────────────────────────────────

  onCreate(ws, { name, character = 'mage', levelId = 1, token, lang = 'id', mode = 'turn' } = {}) {
    const code = this.code;
    // The code is chosen by the client so that both players can reach the same
    // Durable Object from the WebSocket URL alone. If a different, still active
    // room already owns it, hand back a fresh code and ask the client to move.
    if (this.room && this.room.players.length) {
      // The host replays room:create on every reconnect. If the token already
      // owns a seat in THIS room, that is a reconnect, not a collision: rebind
      // the seat so the host stays in the same room as the second player.
      // Only hand out a fresh code for a genuinely foreign room.
      const who = cleanToken(token);
      const existing = who ? this.room.players.find((p) => p.token === who) : null;
      if (existing) {
        this.rebind(ws, existing);
        this.broadcast('room:update');
        return this.emitTo(ws, 'room:reconnected', this.publicRoom(this.room));
      }
      this.emitTo(ws, 'room:recode', { code: makeCode(code) });
      return;
    }
    const playerToken = cleanToken(token) || makeToken();
    const level = cleanLevel(levelId);
    this.room = {
      code,
      hostToken: playerToken,
      mode: mode === 'score' ? 'score' : 'turn',
      status: 'waiting',
      statusKey: 'WAITING_PLAYER',
      levelId: level,
      lang: lang === 'en' ? 'en' : 'id',
      questions: [],
      questionIndex: 0,
      totalQuestions: TOTAL_QUESTIONS,
      round: 0,
      turnAnswers: {},
      turnToken: null,
      turnStartedAt: null,
      winner: null,
      started: false,
      generating: false,
      questionSource: 'fallback',
      startedAt: null,
      recorded: false,
      players: [{
        id: crypto.randomUUID(),
        token: playerToken,
        name: cleanName(name, 'Player 1'),
        character: CHARACTERS[character] ? character : 'mage',
        ready: false,
        hp: 100,
        connected: true,
        score: 0,
        correct: 0,
        answered: 0,
        hintsUsed: 0,
        hintLevels: [],
        lastMistake: null,
      }],
    };
    this.sockets.set(ws, playerToken);
    this.saveRoom();
    console.log(`[dbg] create ${name} inst=${this._tag} n=${this.sockets.size} code=${code}`);
    this.emitTo(ws, 'room:created', this.publicRoom(this.room));
  }

  onJoin(ws, { code, name, character = 'ninja', token } = {}) {
    const room = this.room;
    if (!room) return this.emitTo(ws, 'room:error', { code: 'ROOM_NOT_FOUND' });
    if (room.code !== String(code || '').trim().toUpperCase()) {
      return this.emitTo(ws, 'room:error', { code: 'ROOM_NOT_FOUND' });
    }
    const playerToken = cleanToken(token);
    const existing = playerToken ? room.players.find((p) => p.token === playerToken) : null;
    if (existing) {
      this.rebind(ws, existing);
      this.broadcast('room:update', room);
      return this.emitTo(ws, 'room:reconnected', this.publicRoom(room));
    }
    if (room.players.length >= 2) return this.emitTo(ws, 'room:error', { code: 'ROOM_FULL' });
    if (room.status !== 'waiting') return this.emitTo(ws, 'room:error', { code: 'ROOM_STARTED' });
    const newToken = playerToken || makeToken();
    room.players.push({
      id: crypto.randomUUID(),
      token: newToken,
      name: cleanName(name, 'Player 2'),
      character: CHARACTERS[character] ? character : 'ninja',
      ready: false,
      hp: 100,
      connected: true,
      score: 0,
      correct: 0,
      answered: 0,
      hintsUsed: 0,
      hintLevels: [],
      lastMistake: null,
    });
    this.sockets.set(ws, newToken);
    this.broadcast('room:update', room);
  }

  rebind(ws, player) {
    this.sockets.set(ws, player.token);
    player.connected = true;
    const timer = this.graceTimers.get(player.token);
    if (timer) clearTimeout(timer);
    this.graceTimers.delete(player.token);
    const room = this.room;
    if (room && room.status === 'waiting' && room.players.length === 2 && room.players.every((x) => x.ready && x.connected)) {
      this.startBattle(room);
    }
  }

  findPlayer(ws) {
    const token = this.sockets.get(ws);
    if (!token || !this.room) return null;
    return this.room.players.find((p) => p.token === token) || null;
  }

  onReady(ws, { ready = true } = {}) {
    const room = this.room;
    if (!room) return;
    const player = this.findPlayer(ws);
    if (!player) {
      console.log(`[dbg] onReady NULL inst=${this._tag} has=${this.sockets.has(ws) ? 1 : 0} n=${this.sockets.size}`);
      return;
    }
    player.ready = !!ready;
    const allReady = room.players.length === 2 && room.players.every((x) => x.ready && x.connected);
    console.log(`[dbg] onReady ${player.name} ready=${!!ready} allReady=${allReady} players=${room.players.map((x) => `${x.name}:r${x.ready ? 1 : 0}c${x.connected ? 1 : 0}`).join(' ')}`);
    if (allReady) {
      return this.startBattle(room);
    }
    return this.broadcast('room:update', room);
  }

  onPlayerUpdate(ws, { name, character } = {}) {
    const room = this.room;
    if (!room || room.status !== 'waiting') return;
    const player = this.findPlayer(ws);
    if (!player) return;
    if (name !== undefined) player.name = cleanName(name, player.name).slice(0, MAX_NAME);
    if (character && CHARACTERS[character]) player.character = character;
    this.broadcast('room:update', room);
  }

  onHint(ws) {
    const room = this.room;
    if (!room || room.status !== 'battle' || room.mode !== 'turn') return;
    const player = this.findPlayer(ws);
    if (!player || player.token !== room.turnToken) return;
    if ((player.hintsUsed || 0) >= 2) return this.emitTo(ws, 'hint:result', { ok: false, code: 'HINT_LIMIT' });
    const q = room.questions[room.questionIndex];
    if (!q || !q.hints || !q.hints.length) return;
    const level = Math.min((player.hintsUsed || 0) + 1, q.hints.length);
    player.hintsUsed = (player.hintsUsed || 0) + 1;
    player.hintLevels = player.hintLevels || [];
    player.hintLevels.push(level);
    this.emitTo(ws, 'hint:result', {
      ok: true,
      level,
      text: q.hints[level - 1],
      remaining: Math.max(0, 2 - player.hintsUsed),
    });
    this.broadcast('turn:hint-used', room);
  }

  onAnswer(ws, { answer } = {}) {
    const room = this.room;
    if (!room || room.status !== 'battle') return;
    const player = this.findPlayer(ws);
    if (!player || !player.connected) return;
    const q = room.questions[room.questionIndex];
    if (!q) return;
    const value = String(answer || '').trim();
    if (!value) return;
    console.log(`[dbg] onAnswer ${player.name} ${value} mode=${room.mode} already=${room.turnAnswers[player.token]?.submitted ? 1 : 0}`);

    if (room.mode === 'turn') {
      if (player.token !== room.turnToken) return this.emitTo(ws, 'answer:result', { correct: false, code: 'NOT_YOUR_TURN' });
      if (room.turnAnswers[player.token]?.submitted) return;
      const correct = isCorrect(q, value);
      player.answered = (player.answered || 0) + 1;
      if (!correct) {
        player.lastMistake = { questionIndex: room.questionIndex, concept: q.concept || '—', answer: value, correctAnswer: q.answer, explanation: q.explanation };
      }
      if (correct) player.score = (player.score || 0) + 1;
      room.turnAnswers[player.token] = { submitted: true, correct, answer: value, timeout: false };
      if (correct) {
        room.combatEvent = {
          token: player.token,
          target: room.players.find((x) => x.token !== player.token)?.token,
          damage: DAMAGE_PER_CORRECT,
          seq: Date.now(),
          kind: 'hit',
        };
      }
      room.statusKey = correct ? 'TURN_CORRECT' : 'TURN_WRONG';
      room.statusName = player.name;
      this.emitTo(ws, 'answer:result', { correct, explanation: q.explanation, correctAnswer: q.answer });
      this.broadcast('turn:answer', room);
      setTimeout(() => {
        if (this.room === room && room.status === 'battle') this.advanceTurn(room, false);
      }, 700);
      return;
    }

    // Score Duel: both players get the same question and the full timer
    // independently, so answering faster is never an advantage.
    if (room.turnAnswers[player.token]?.submitted) return;
    const correct = isCorrect(q, value);
    player.answered = (player.answered || 0) + 1;
    if (!correct) {
      player.lastMistake = { questionIndex: room.questionIndex, concept: q.concept || '—', answer: value, correctAnswer: q.answer, explanation: q.explanation };
    }
    room.turnAnswers[player.token] = { submitted: true, correct, answer: value, timeout: false };
    if (correct) {
      player.score += 100;
      player.correct += 1;
      room.combatEvent = {
        token: player.token,
        target: room.players.find((x) => x.token !== player.token)?.token,
        damage: 10,
        seq: Date.now(),
        kind: 'hit',
      };
    }
    room.statusKey = correct ? 'SCORE_CORRECT' : 'SCORE_WRONG';
    room.statusName = player.name;
    this.emitTo(ws, 'answer:result', { correct, explanation: q.explanation, correctAnswer: q.answer });
    this.broadcast('score:answer', room);
    if (room.turnAnswers[room.players[0].token]?.submitted && room.turnAnswers[room.players[1].token]?.submitted) {
      this.advanceScoreRound(room, false);
    }
  }

  onRematch(ws) {
    const room = this.room;
    if (!room || room.players.length !== 2) return;
    this.clearTurnDeadline();
    room.status = 'waiting';
    room.started = false;
    room.startedAt = null;
    room.questions = [];
    room.questionIndex = 0;
    room.round = 0;
    room.turnAnswers = {};
    room.turnToken = null;
    room.turnStartedAt = null;
    room.winner = null;
    room.recorded = false;
    room.statusKey = 'REMATCH_READY';
    room.combatEvent = null;
    room.decisiveQuestion = null;
    room.finishSummary = null;
    room.players.forEach((p) => {
      p.ready = false;
      p.hp = 100;
      p.score = 0;
      p.correct = 0;
      p.answered = 0;
      p.hintsUsed = 0;
      p.hintLevels = [];
      p.lastMistake = null;
    });
    this.broadcast('rematch:ready', room);
  }

  onLeave(ws, explicit) {
    const token = this.sockets.get(ws);
    this.sockets.delete(ws);
    const room = this.room;
    if (!room || !token) return;
    const player = room.players.find((p) => p.token === token);
    if (!player) return;

    if (explicit) {
      this.clearGrace(player.token);
      room.players = room.players.filter((x) => x.token !== player.token);
      if (!room.players.length) {
        this.clearTurnDeadline();
        this.dropRoom();
        return;
      }
      if (room.status === 'battle') return this.finishRoom(room, room.players[0].token);
      room.players[0].ready = false;
      return this.broadcast('player:left', room);
    }

    // Unexpected drop: hold the seat for the reconnect grace period so the
    // mpToken can bring the player back mid-duel. `ready` is kept so a brief
    // hiccup does not silently un-ready a player who already pressed Siap.
    player.connected = false;
    room.statusKey = 'DISCONNECTED';
    this.broadcast('player:disconnected', room);
    this.clearGrace(player.token);
    const timer = setTimeout(() => {
      this.graceTimers.delete(player.token);
      const current = this.room;
      if (current !== room) return;
      const idx = current.players.findIndex((x) => x.token === player.token);
      if (idx >= 0) current.players.splice(idx, 1);
      if (!current.players.length) {
        this.clearTurnDeadline();
        this.dropRoom();
      } else {
        current.status = 'waiting';
        current.started = false;
        current.players[0].ready = false;
        current.statusKey = 'WAITING_PLAYER';
        this.broadcast('player:left', current);
      }
    }, ROOM_GRACE_MS);
    this.graceTimers.set(player.token, timer);
  }

  clearGrace(token) {
    const timer = this.graceTimers.get(token);
    if (timer) clearTimeout(timer);
    this.graceTimers.delete(token);
  }

  // ── battle flow ────────────────────────────────────────────────────────────

  async startBattle(room) {
    if (room.generating || room.started) return;
    room.generating = true;
    room.status = 'generating';
    room.statusKey = 'GENERATING_QUESTIONS';
    room.statusName = null;
    this.broadcast('game:generating', room);
    const pack = freshQuestions(room.levelId, room.lang);
    room.questions = pack.questions;
    room.questionSource = pack.source;
    room.generating = false;
    room.status = 'battle';
    room.started = true;
    room.startedAt = Date.now();
    room.recorded = false;
    room.questionIndex = 0;
    room.round = 1;
    room.turnAnswers = {};
    room.turnToken = room.mode === 'score' ? null : room.players[0].token;
    room.turnStartedAt = Date.now();
    room.winner = null;
    room.combatEvent = null;
    room.decisiveQuestion = null;
    room.finishSummary = null;
    room.players.forEach((p) => {
      p.hp = 100;
      p.score = 0;
      p.correct = 0;
      p.answered = 0;
      p.hintsUsed = 0;
      p.ready = true;
      p.lastMistake = null;
      p.hintLevels = [];
    });
    this.setTurnDeadline(room);
    this.broadcast('game:start', room);
  }

  advanceTurn(room, timeout = false) {
    if (this.room !== room || room.status !== 'battle') return;
    this.clearTurnDeadline();
    const player = room.players.find((x) => x.token === room.turnToken);
    if (timeout && player && !room.turnAnswers[player.token]) {
      room.turnAnswers[player.token] = { submitted: true, correct: false, timeout: true, answer: '' };
      room.statusKey = 'TURN_TIMEOUT';
      room.statusName = player.name;
    }
    const idx = room.players.findIndex((x) => x.token === room.turnToken);
    if (idx < room.players.length - 1) {
      room.turnToken = room.players[idx + 1].token;
      room.turnStartedAt = Date.now();
      room.statusKey = 'TURN_CHANGED';
      room.statusName = room.players[idx + 1].name;
      room.combatEvent = null;
      this.broadcast('turn:next', room);
      this.setTurnDeadline(room);
      return;
    }
    return this.resolveRound(room);
  }

  advanceScoreRound(room, timeout = false) {
    if (this.room !== room || room.status !== 'battle' || room.mode !== 'score') return;
    if (timeout) {
      for (const p of room.players) {
        if (!room.turnAnswers[p.token]) {
          room.turnAnswers[p.token] = { submitted: true, correct: false, timeout: true, answer: '' };
        }
      }
      room.statusKey = 'TIME_UP';
    }
    const [p1, p2] = room.players;
    const both = room.turnAnswers[p1.token]?.submitted && room.turnAnswers[p2.token]?.submitted;
    // A lone answer keeps the round alive: the 45s alarm must stay armed so a
    // silent opponent cannot freeze the duel forever.
    if (!timeout && !both) return;
    this.clearTurnDeadline();
    room.statusName = null;
    setTimeout(() => {
      if (this.room !== room || room.status !== 'battle') return;
      if (room.questionIndex >= room.questions.length - 1) return this.finishRoom(room);
      room.questionIndex += 1;
      room.round += 1;
      room.turnAnswers = {};
      room.turnStartedAt = Date.now();
      room.statusKey = 'NEW_ROUND';
      this.broadcast('round:next', room);
      this.setTurnDeadline(room);
    }, 700);
  }

  resolveRound(room) {
    const [p1, p2] = room.players;
    const a1 = room.turnAnswers[p1.token];
    const a2 = room.turnAnswers[p2.token];
    const q = room.questions[room.questionIndex];
    if (a1?.correct) {
      p1.score = (p1.score || 0) + 1;
      p1.correct += 1;
      p2.hp = Math.max(0, p2.hp - DAMAGE_PER_CORRECT);
      room.decisiveQuestion = sanitizeReviewQuestion(q);
      room.combatEvent = { token: p1.token, target: p2.token, damage: DAMAGE_PER_CORRECT, seq: Date.now(), kind: 'hit' };
    }
    if (a2?.correct) {
      p2.score = (p2.score || 0) + 1;
      p2.correct += 1;
      p1.hp = Math.max(0, p1.hp - DAMAGE_PER_CORRECT);
      room.decisiveQuestion = sanitizeReviewQuestion(q);
      room.combatEvent = { token: p2.token, target: p1.token, damage: DAMAGE_PER_CORRECT, seq: Date.now() + 1, kind: 'hit' };
    }
    if (a1 && !a1.correct && a1.submitted) this.noteMistake(p1, room, q, a1.answer);
    if (a2 && !a2.correct && a2.submitted) this.noteMistake(p2, room, q, a2.answer);
    room.statusKey = !a1?.correct && !a2?.correct ? 'BOTH_WRONG' : 'ROUND_RESOLVED';
    this.broadcast('round:resolved', room);
    setTimeout(() => {
      if (this.room !== room || room.status !== 'battle') return;
      if (room.questionIndex >= room.questions.length - 1 || p1.hp <= 0 || p2.hp <= 0) {
        return this.finishRoom(room);
      }
      room.questionIndex += 1;
      room.round += 1;
      room.turnAnswers = {};
      room.turnToken = p1.token;
      room.turnStartedAt = Date.now();
      room.statusKey = 'NEW_ROUND';
      room.combatEvent = null;
      this.broadcast('round:next', room);
      this.setTurnDeadline(room);
    }, 1000);
  }

  noteMistake(player, room, q, answer) {
    player.lastMistake = {
      questionIndex: room.questionIndex,
      concept: q?.concept || '—',
      answer,
      correctAnswer: q?.answer,
      explanation: q?.explanation,
    };
  }

  finishRoom(room, winnerOverride = null) {
    this.clearTurnDeadline();
    room.status = 'finished';
    room.turnStartedAt = null;
    if (winnerOverride) {
      room.winner = winnerOverride;
    } else if (room.mode === 'score') {
      if (room.players[0].score !== room.players[1].score) {
        room.winner = room.players[0].score > room.players[1].score ? room.players[0].token : room.players[1].token;
      } else if ((room.players[0].hintsUsed || 0) !== (room.players[1].hintsUsed || 0)) {
        room.winner = (room.players[0].hintsUsed || 0) < (room.players[1].hintsUsed || 0) ? room.players[0].token : room.players[1].token;
      } else {
        room.winner = 'draw';
      }
    } else if (room.players[0].hp !== room.players[1].hp) {
      room.winner = room.players[0].hp > room.players[1].hp ? room.players[0].token : room.players[1].token;
    } else if ((room.players[0].hintsUsed || 0) !== (room.players[1].hintsUsed || 0)) {
      room.winner = (room.players[0].hintsUsed || 0) < (room.players[1].hintsUsed || 0) ? room.players[0].token : room.players[1].token;
    } else if ((room.players[0].score || 0) !== (room.players[1].score || 0)) {
      room.winner = room.players[0].score > room.players[1].score ? room.players[0].token : room.players[1].token;
    } else {
      room.winner = 'draw';
    }

    const winner = room.players.find((p) => p.token === room.winner);
    const tieBreak = room.winner !== 'draw'
      && room.players[0].hintsUsed !== room.players[1].hintsUsed
      && ((room.mode === 'score' && room.players[0].score === room.players[1].score)
        || (room.mode === 'turn' && room.players[0].hp === room.players[1].hp));
    const en = room.lang === 'en';

    room.finishSummary = {};
    for (const player of room.players) {
      const opponent = room.players.find((x) => x.token !== player.token);
      if (room.winner === 'draw') {
        room.finishSummary[player.token] = en
          ? `Match finished! It is a draw. Final results and hint usage are equal (${player.hintsUsed || 0}).`
          : `Pertandingan Selesai! Seri. Hasil akhir dan jumlah hint sama (${player.hintsUsed || 0}).`;
      } else if (player.token === room.winner) {
        room.finishSummary[player.token] = tieBreak
          ? (en
            ? `Match finished! You win the tie-break by using fewer hints (${player.hintsUsed || 0} vs ${opponent?.hintsUsed || 0}). Review the explanation below.`
            : `Pertandingan Selesai! Kamu menang pada tie-break karena menggunakan hint lebih sedikit (${player.hintsUsed || 0} vs ${opponent?.hintsUsed || 0}). Lihat pembahasan di bawah.`)
          : (en
            ? `Match finished! You win ${room.mode === 'score' ? `${player.score || 0} points` : `with ${player.hp || 0} HP remaining`}. Review the deciding question below.`
            : `Pertandingan Selesai! Kamu menang ${room.mode === 'score' ? `${player.score || 0} poin` : `dengan ${player.hp || 0} HP tersisa`}. Lihat soal penentunya di bawah.`);
      } else {
        const diff = room.mode === 'score'
          ? Math.abs((winner?.score || 0) - (player.score || 0))
          : Math.abs((winner?.hp || 0) - (player.hp || 0));
        const q = player.lastMistake
          ? {
            id: player.lastMistake.questionIndex + 1,
            text: room.questions[player.lastMistake.questionIndex]?.text,
            concept: player.lastMistake.concept,
            answer: player.lastMistake.correctAnswer,
            explanation: player.lastMistake.explanation,
          }
          : room.decisiveQuestion;
        room.finishSummary[player.token] = q
          ? (en
            ? `Match finished! You lost by ${room.mode === 'score' ? `${diff} point${diff === 1 ? '' : 's'}` : `${diff} HP`} because of a mistake on Question ${q.id} (${q.concept}). Click View Solution to review the key and steps.`
            : `Pertandingan Selesai! Kamu kalah ${room.mode === 'score' ? `${diff} poin` : `${diff} HP`} dari lawan karena keliru di Soal No. ${q.id} (${q.concept}). Klik Lihat Pembahasan untuk melihat kunci dan langkahnya.`)
          : (en
            ? 'Match finished! Your opponent had the stronger final result. Review the explanation to reinforce the concepts you need most.'
            : 'Pertandingan Selesai! Lawan memiliki hasil akhir lebih tinggi. Lihat pembahasan untuk memperkuat konsep yang perlu kamu latih.');
      }
    }

    room.statusKey = room.winner === 'draw' ? 'DRAW' : 'MATCH_FINISHED';
    room.combatEvent = null;
    this.recordMatch(room);
    this.broadcast('game:finished', room);
  }

  recordMatch(room) {
    if (room.recorded || !room.startedAt || room.players.length < 2) return;
    room.recorded = true;
    const finishedAt = Date.now();
    for (const player of room.players) {
      const opponent = room.players.find((p) => p.token !== player.token);
      const answered = Math.max(0, Number(player.answered) || 0);
      const correct = Math.max(0, Number(player.correct) || 0);
      const isWinner = room.winner === player.token;
      const isDraw = room.winner === 'draw';
      recordMatch({
        type: 'multiplayer_match',
        ts: new Date(finishedAt).toISOString(),
        matchId: room.code,
        levelId: room.levelId,
        mode: room.mode,
        player: player.name,
        opponent: opponent?.name || '\u2014',
        answered,
        correct,
        accuracy: answered ? Math.round((correct / answered) * 100) : 0,
        score: Number(player.score) || 0,
        hpRemaining: Number(player.hp) || 0,
        wins: isWinner ? 1 : 0,
        draw: isDraw ? 1 : 0,
        losses: !isWinner && !isDraw ? 1 : 0,
        durationSec: Math.max(0, Math.round((finishedAt - room.startedAt) / 1000)),
        totalQuestions: room.totalQuestions,
        hintsUsed: Number(player.hintsUsed) || 0,
        decisiveQuestion: room.decisiveQuestion?.id || null,
        decisiveConcept: room.decisiveQuestion?.concept || null,
      });
    }
  }

  publicRoom(room) {
    const currentTurn = room.turnToken ? room.players.find((p) => p.token === room.turnToken) : null;
    return {
      code: room.code,
      status: room.status,
      mode: room.mode,
      levelId: room.levelId,
      questionIndex: room.questionIndex,
      totalQuestions: room.totalQuestions,
      round: room.round,
      startedAt: room.startedAt || null,
      turnStartedAt: room.turnStartedAt,
      turnDuration: TURN_MS,
      currentTurnToken: room.turnToken || null,
      currentTurnName: currentTurn?.name || null,
      players: room.players.map((p) => ({
        id: p.id,
        token: p.token,
        name: p.name,
        character: p.character,
        ready: p.ready,
        hp: p.hp,
        connected: p.connected,
        score: p.score,
        correct: p.correct,
        answered: p.answered || 0,
        hintsUsed: p.hintsUsed || 0,
        turnAnswer: room.turnAnswers?.[p.token]?.submitted || false,
      })),
      question: room.started ? sanitizeQuestion(room.questions[room.questionIndex]) : null,
      answered: Object.fromEntries(
        Object.entries(room.turnAnswers || {}).map(([id, v]) => [id, { correct: v.correct, submitted: v.submitted, timeout: !!v.timeout }]),
      ),
      winner: room.winner,
      lang: room.lang || 'id',
      questionSource: room.questionSource || 'fallback',
      statusKey: room.statusKey || 'WAITING',
      statusName: room.statusName || null,
      finishSummary: room.finishSummary || null,
      decisiveQuestion: room.status === 'finished' ? room.decisiveQuestion : null,
      combatEvent: room.combatEvent || null,
    };
  }
}

function makeToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
}

/** Client generated codes are AJM-XXXX; nudge to a different one on collision. */
function makeCode(current) {
  let code;
  do {
    code = `AJM-${Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X')}`;
  } while (code === current);
  return code;
}
