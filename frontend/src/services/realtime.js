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
 * is what makes the 30 second reconnect grace period in room.js useful: the
 * mpToken in localStorage identifies the returning player.
 */

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const HEARTBEAT_MS = 25000;
const RECONNECT_MS = 1500;

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

  const ensureToken = (given) => {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('solvox.mpToken')
      : null;
    if (given && given.trim()) {
      myToken = given.trim();
      if (!stored) setStoredToken(myToken);
      return myToken;
    }
    if (stored && stored.trim()) {
      myToken = stored.trim();
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
      localStorage.setItem('solvox.mpToken', token);
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
    heartbeatTimer = null;
    reconnectTimer = null;
  };

  const send = (event, data) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ event, data: data || {} }));
    return true;
  };

  const closeSocket = () => {
    stopTimers();
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
    closeSocket();
    closedByUser = false;
    code = targetCode;
    try {
      socket = new WebSocket(`${base}/ws?room=${encodeURIComponent(targetCode)}`);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      heartbeatTimer = setInterval(() => {
        // Keeps the connection warm through idle periods; the server ignores it.
        try {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: 'ping', data: {} }));
          }
        } catch {
          /* closed mid-write */
        }
      }, HEARTBEAT_MS);
      if (intent) send(intent.event, intent.data);
    };
    socket.onmessage = (event) => handleMessage(event.data);
    socket.onerror = () => { /* onclose does the recovery */ };
    socket.onclose = () => {
      socket = null;
      stopTimers();
      scheduleReconnect();
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
        if (!socket || code !== target) dial(target, intent);
        else send(event, payload);
        return client;
      }
      if (event === 'room:leave') {
        lastIntent = null;
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
      closeSocket();
      return client;
    },
    get connected() {
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
