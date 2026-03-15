// REST calls — only used for health check + room config
// Chat messages go over WebSocket (see socket.js)

const BASE_URL = (import.meta.env.VITE_API_URL || 'https://biz-dash-backend.onrender.com').replace(/\/$/, '');

// GET /  — Health Check
export async function healthCheck() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error('Server unreachable');
  return res.json();
}

// POST /config/rooms/{room_id}  — Setconfig (send Gemini key)
export async function setRoomConfig(roomId, geminiApiKey) {
  const res = await fetch(`${BASE_URL}/config/rooms/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gemini_api_key: geminiApiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Config failed: ${res.status}`);
  }
  return res.json();
}

// GET /config/rooms/{room_id}  — Getroomconfig
export async function getRoomConfig(roomId) {
  const res = await fetch(`${BASE_URL}/config/rooms/${roomId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Get config failed: ${res.status}`);
  }
  return res.json();
}
