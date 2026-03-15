// ─────────────────────────────────────────────
//  socket.js  —  low-level WebSocket wrapper
//
//  WebSocket URL pattern expected by FastAPI:
//    ws://localhost:8000/ws/{room_id}
//
//  Messages sent:   JSON  { type: "message", content: "..." }
//  Messages received: JSON { type: "message"|"token"|"done"|"error", content: "..." }
//
//  Streaming support:
//    type "token"   → partial AI token, append to current bubble
//    type "done"    → AI turn complete
//    type "message" → full message at once (non-streaming)
//    type "error"   → backend error string
// ─────────────────────────────────────────────

const WS_BASE = (import.meta.env.VITE_WS_URL || 'wss://biz-dash-backend.onrender.com').replace(/\/$/, '');


const RECONNECT_DELAYS = [1000, 2000, 4000, 8000]; // ms, capped at last

export const WS_STATUS = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSED: 'closed',
  ERROR: 'error',
};

export function createSocket(roomId) {
  let ws = null;
  let reconnectAttempt = 0;
  let destroyed = false;
  let messageQueue = []; // queue messages while connecting

  // Event listeners map
  const listeners = {
    status: [],   // (status: WS_STATUS) => void
    message: [],  // (data: object) => void
    token: [],    // (token: string) => void
    done: [],     // () => void
    error: [],    // (msg: string) => void
  };

  function emit(event, ...args) {
    (listeners[event] || []).forEach(fn => fn(...args));
  }

  function on(event, fn) {
    if (listeners[event]) listeners[event].push(fn);
    return () => off(event, fn);
  }

  function off(event, fn) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(f => f !== fn);
    }
  }

  function connect() {
    if (destroyed) return;
    const url = `${WS_BASE}/ws/${roomId}`;
    emit('status', WS_STATUS.CONNECTING);

    try {
     ws = new WebSocket(`${WS_BASE}/ws/chat?room_id=${roomId}`);
    } catch (e) {
      emit('status', WS_STATUS.ERROR);
      emit('error', `Cannot open WebSocket: ${e.message}`);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      reconnectAttempt = 0;
      emit('status', WS_STATUS.OPEN);
      // Flush queued messages
      while (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        ws.send(JSON.stringify(msg));
      }
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        // plain text fallback — treat as full message
        data = { type: 'message', content: event.data };
      }

      switch (data.type) {
        case 'token':
          emit('token', data.content ?? data.token ?? '');
          break;
        case 'done':
          emit('done');
          break;
        case 'error':
          emit('error', data.content ?? data.message ?? 'Unknown error');
          break;
        case 'message':
        default:
          emit('message', data);
          break;
      }
    };

    ws.onerror = () => {
      emit('status', WS_STATUS.ERROR);
    };

    ws.onclose = (e) => {
      emit('status', WS_STATUS.CLOSED);
      if (!destroyed && e.code !== 1000) {
        scheduleReconnect();
      }
    };
  }

  function scheduleReconnect() {
    if (destroyed) return;
    const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    reconnectAttempt++;
    setTimeout(connect, delay);
  }

  function send(type, content) {
    const msg = { type, content };
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      messageQueue.push(msg);
    }
  }

  function sendMessage(text) {
    send('message', text);
  }

  function destroy() {
    destroyed = true;
    messageQueue = [];
    if (ws) {
      ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Component unmounted');
      }
      ws = null;
    }
    Object.keys(listeners).forEach(k => (listeners[k] = []));
  }

  function getStatus() {
    if (!ws) return WS_STATUS.CLOSED;
    switch (ws.readyState) {
      case WebSocket.CONNECTING: return WS_STATUS.CONNECTING;
      case WebSocket.OPEN:       return WS_STATUS.OPEN;
      default:                   return WS_STATUS.CLOSED;
    }
  }

  // Start connection immediately
  connect();

  return { on, off, sendMessage, destroy, getStatus };
}
