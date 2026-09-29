/**
 * Socket.IO compatible realtime client on top of the platform WebSocket.
 *
 * Multiplayer.jsx only uses io(), socket.on/emit/connect/disconnect, so this shim
 * keeps that surface and drops the dependency. Two behaviours differ from the
 * library and both are deliberate:
 *
 * 1. The socket is opened lazily. The app calls connect() on mount and only
 *    decides afterwards whether the player is hosting (room:create, no code yet)
 *    or joining (room:join, code already typed). Socket.IO connects immediately
 *    and negotiates a session id; the Solvox Worker instead routes a socket
 *    straight to the Durable Object that owns a room code, so we wait until the
 *    code is known before dialing.
 *
 * 2. The client picks the room code when hosting, because both players have to
 *    reach the same Durable Object from the URL alone. If that code is already
 *    taken by a live room the server replies room:recode and this shim redials
 *    transparently. The player never sees a code change.
 *
 * Reconnect is automatic and re-sends the last room:create / room:join, which
 * is what makes the reconnect grace period in room.js useful: the per-tab
 * mpToken (sessionStorage) identifies the returning player. Because an evicted
 * Durable Object drops its WebSockets silently (no onclose on the stuck side),
 * the shim also treats a dead server (no pong for PONG_TIMEOUT_MS) as a
 * disconnect and redials itself.
 */

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// The liveness interval must be SHORTER than PONG_TIMEOUT_MS: a quiet waiting
// room emits no broadcasts, so judging liveness by silence alone would flag
// every healthy room as dead. With 10s < 15s the staleness check only trips
// when the server genuinely stopped answering (including a silently evicted
// Durable Object), giving ~20s worst-case death detection.
const HEARTBEAT_MS = 10000;
const RECONNECT_MS = 1500;
const PONG_TIMEOUT_MS = 15000;
/** Give the WebSocket dial this long to open before falling back to HTTP. */
const WS_FALLBACK_MS = 5000;
const POLL_RETRY_MS = 1200;

function makeRoomCode() {
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `AJM-${suffix}`;
}

function toWebSocketBase(base) {
  if (!base) return '';
  return base.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:').replace(/\/+$/, '');
}

export function io(baseUrl, options = {}) {
  const handlers = new Map();
  const base = toWebSocketBase(baseUrl);
  const autoConnect = options.autoConnect !== false;

  let socket = null;
  let closedByUser = false;
  let reconnectTimer = null;
  let heartbeatTimer = null;
  /** The last create/join we sent, replayed on reconnect. */
  let lastIntent = null;
  let code = null;
  /** The player identity we asked the server to use; its id comes back in room payloads. */
  let myToken = '';
  let myId = null;
  /** Time since the server answered any frame; staleness drives reconnect. */
  let lastKnownAlive = 0;
  /** 'ws' over a WebSocket; 'poll' over HTTP long-poll when WS is blocked. */
  let mode = 'ws';
  let fallbackActive = false;
  let pollClosed = true;
  let dialTimer = null;

  // Identity is per-tab (sessionStorage): two tabs in the same browser must be
  // able to host and join each other, which a shared localStorage token would
  // silently collapse into a single player. The token still survives reloads of
  // the same tab, which is all the 30s reconnect grace needs.
  const ensureToken = (given) => {
    const store = typeof sessionStorage !== 'undefined' ? sessionStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
    const stored = store ? store.getItem('solvox.mpToken') : null;
    if (stored && stored.trim()) {
      myToken = stored.trim();
      return myToken;
    }
    if (given && given.trim() && !store) {
      myToken = given.trim();
      return myToken;
    }
    let t = '';
    while (t.length < 32) t += Math.random().toString(16).slice(2);
    myToken = t.slice(0, 32).toUpperCase();
    setStoredToken(myToken);
    return myToken;
  };

  const setStoredToken = (token) => {
    try {
      (typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage).setItem('solvox.mpToken', token);
    } catch {
      /* private mode */
    }
  };

  const emitToClient = (event, data) => {
    const list = handlers.get(event);
    if (list) for (const fn of [...list]) fn(data);
  };

  const stopTimers = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (dialTimer) clearTimeout(dialTimer);
    heartbeatTimer = null;
    reconnectTimer = null;
    dialTimer = null;
  };

  const stopPoll = () => {
    pollClosed = true;
  };

  /**
   * Frames written while the transport was down. player:ready and answer:submit
   * are one-shot clicks with no intent to replay, so before this existed a click
   * landing inside a reconnect window vanished with no trace: the server never
   * saw it and the player had to click again. Holding the frame until the socket
   * is back makes a single click enough.
   */
  const pending = [];
  const PENDING_MAX = 32;
  /** These replay themselves via lastIntent, or are liveness probes. */
  const NO_QUEUE = new Set(['ping', 'room:create', 'room:join', 'room:leave']);
  let flushing = false;

  const flushPending = () => {
    if (flushing || !pending.length) return;
    flushing = true;
    try {
      while (pending.length) {
        const frame = pending[0];
        if (!send(frame.event, frame.data)) {
          pending.unshift(frame);
          break;
        }
        pending.shift();
      }
    } finally {
      flushing = false;
    }
  };

  /** Outbound event over whichever transport is active. */
  const send = (event, data) => {
    // The token rides every frame so the Durable Object can identify the sender
    // from the payload alone, even if its in-memory socket->player binding was
    // lost while the instance was evicted.
    const body = { ...(data || {}), token: myToken };
    if (mode === 'poll') {
      fetch(`${base}/api/room/event?room=${encodeURIComponent(code || '')}&token=${encodeURIComponent(myToken || '')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data: body }),
      }).catch(() => {});
      return true;
    }
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      if (!NO_QUEUE.has(event) && pending.length < PENDING_MAX) {
        pending.push({ event, data: body });
        // A queued frame is worthless without a transport, so guarantee one is
        // on the way instead of waiting for the user's next action.
        if (lastIntent) scheduleReconnect();
      }
      return false;
    }
    socket.send(JSON.stringify({ event, data: body }));
    return true;
  };

  /**
   * HTTP long-poll fallback: pull broadcasts off /api/room/poll and push
   * player events through /api/room/event. Both hit the same Durable Object
   * as a WebSocket would, so a room can mix a WS player and an HTTP player.
   */
  const startPoll = (targetCode) => {
    pollClosed = false;
    lastKnownAlive = Date.now();
    code = targetCode;
    const loop = async () => {
      if (pollClosed || closedByUser || mode !== 'poll' || !base) return;
      try {
        const resp = await fetch(`${base}/api/room/poll?room=${encodeURIComponent(code)}&token=${encodeURIComponent(myToken || '')}`);
        if (!resp.ok) {
          await new Promise((r) => setTimeout(r, POLL_RETRY_MS));
          loop();
          return;
        }
        const batch = await resp.json();
        for (const frame of batch || []) {
          if (pollClosed || mode !== 'poll') return;
          lastKnownAlive = Date.now();
          try {
            handleMessage(JSON.stringify(frame));
          } catch {
            /* one bad frame must not kill the loop */
          }
        }
        loop();
      } catch {
        await new Promise((r) => setTimeout(r, POLL_RETRY_MS));
        loop();
      }
    };
    loop();
    if (lastIntent) send(lastIntent.event, lastIntent.data);
    flushPending();
  };

  const tryPollFallback = () => {
    if (fallbackActive || closedByUser || !code || mode === 'poll') return;
    fallbackActive = true;
    mode = 'poll';
    stopPoll();
    closeSocket();
    lastKnownAlive = Date.now();
    startPoll(code);
  };

  const closeSocket = () => {
    stopTimers();
    lastKnownAlive = 0;
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.onopen = null;
      try {
        socket.close();
      } catch {
        /* already closing */
      }
      socket = null;
    }
  };

  const scheduleReconnect = () => {
    if (closedByUser || !lastIntent) return;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!closedByUser && lastIntent) dial(lastIntent.code, lastIntent);
    }, RECONNECT_MS);
  };

  const handleMessage = (raw) => {
    lastKnownAlive = Date.now();
    let frame;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }
    if (!frame || !frame.event) return;

    // Room payloads carry the player list; match our own token to learn the id
    // socket.io used to hand out for free via socket.id.
    const players = frame.data && frame.data.players;
    if (Array.isArray(players) && myToken) {
      const me = players.find((p) => p.token === myToken);
      if (me) myId = me.id;
    }

    if (frame.event === 'room:recode') {
      // Another live room already owns this code. Redial the new one and replay
      // the create so the player keeps a valid code to share.
      const next = frame.data && frame.data.code;
      if (!next) return;
      const intent = lastIntent;
      closeSocket();
      if (intent) {
        intent.code = next;
        dial(next, intent);
      }
      return;
    }

    emitToClient(frame.event, frame.data);
  };

  const dial = (targetCode, intent) => {
    if (!base) return;
    // De-dupe: redialing the same code while the current socket is still alive
    // is never useful (it only tears down a healthy binding), so replay the
    // frame on the existing socket instead of rebuilding it. This keeps rapid
    // re-emits/self-reconnects from creating a dial churn.
    if (socket && socket.readyState === WebSocket.OPEN && code === targetCode) {
      if (intent) send(intent.event, intent.data);
      return;
    }
    stopPoll();
    closeSocket();
    closedByUser = false;
    mode = 'ws';
    fallbackActive = false;
    code = targetCode;
    let opened = false;
    // The token rides the dial URL so the Durable Object can bind the socket to
    // the player at upgrade time; surviving an instance re-creation depends on
    // this, never on in-memory state from an earlier connection.
    const dialUrl = `${base}/ws?room=${encodeURIComponent(targetCode)}&token=${encodeURIComponent(myToken || '')}`;
    try {
      socket = new WebSocket(dialUrl);
    } catch {
      tryPollFallback();
      return;
    }
    // Some networks swallow the upgrade: the socket hangs in CONNECTING with no
    // error or close. A timebox forces the switch to the HTTP transport.
    dialTimer = setTimeout(() => {
      if (!opened) tryPollFallback();
    }, WS_FALLBACK_MS);

    socket.onopen = () => {
      opened = true;
      if (dialTimer) clearTimeout(dialTimer);
      dialTimer = null;
      lastKnownAlive = Date.now();
      heartbeatTimer = setInterval(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        // Probe first, then judge: the ping lets the server prove it is alive
        // (it answers with pong), so a silent-but-healthy room is never
        // mistaken for a dead one.
        try {
          socket.send(JSON.stringify({ event: 'ping', data: {} }));
        } catch {
          /* closed mid-write */
        }
        // A half-open socket never fires onclose: the server-side object can be
        // evicted and drop the TCP silently, so sending into it heals nothing.
        // If the server has answered no frame for a while, assume it is dead and
        // reconnect in the player's name. The DO answers our ping with pong,
        // which counts as liveness.
        if (Date.now() - lastKnownAlive > PONG_TIMEOUT_MS) {
          closeSocket();
          scheduleReconnect();
          return;
        }
      }, HEARTBEAT_MS);
      if (intent) send(intent.event, intent.data);
      flushPending();
    };
    socket.onmessage = (event) => handleMessage(event.data);
    socket.onerror = () => {
      if (!opened) tryPollFallback();
    };
    socket.onclose = () => {
      socket = null;
      stopTimers();
      if (!opened) return tryPollFallback();
      if (!closedByUser) scheduleReconnect();
    };
  };

  const client = {
    on(event, handler) {
      if (typeof handler !== 'function') return client;
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(handler);
      return client;
    },
    off(event, handler) {
      const list = handlers.get(event);
      if (list) list.delete(handler);
      return client;
    },
    emit(event, data) {
      if (event === 'room:create') {
        // Hosting: we own the code from here on. Guarantee a stable player token
        // so reconnect (and `me` in the UI) works even for first-time players.
        const payload = { ...(data || {}), token: ensureToken((data && data.token) || '') };
        const intent = { event, data: payload, code: makeRoomCode() };
        lastIntent = intent;
        dial(intent.code, intent);
        return client;
      }
      if (event === 'room:join') {
        const target = String((data && data.code) || '').trim().toUpperCase();
        const payload = { ...(data || {}), code: target, token: ensureToken((data && data.token) || '') };
        const intent = { event, data: payload, code: target };
        lastIntent = intent;
        if (mode === 'poll') {
          if (code !== target) startPoll(target);
          send(event, payload);
        } else if (!socket || code !== target) dial(target, intent);
        else send(event, payload);
        return client;
      }
      if (event === 'room:leave') {
        lastIntent = null;
        pending.length = 0;
        send(event, data);
        return client;
      }
      send(event, data);
      return client;
    },
    connect() {
      closedByUser = false;
      // Nothing to dial yet: the room code only exists once the player hosts or
      // joins. Harmless no-op that keeps the socket.io call site valid.
      return client;
    },
    disconnect() {
      closedByUser = true;
      lastIntent = null;
      pending.length = 0;
      stopPoll();
      closeSocket();
      mode = 'ws';
      fallbackActive = false;
      return client;
    },
    get connected() {
      if (mode === 'poll') return !pollClosed;
      return !!socket && socket.readyState === WebSocket.OPEN;
    },
    /** Id of the local player inside a room, learned from room payloads. */
    get id() {
      return myId;
    },
  };

  if (autoConnect) client.connect();
  return client;
}

export default io;
