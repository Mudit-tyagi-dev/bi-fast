const ROOMS_KEY   = 'bi_rooms';
const LAST_ROOM_KEY = 'bi_last_room_id';
const GEMINI_KEY  = 'bi_gemini_api_key';

// ── Gemini Key ──────────────────────────────────────────────
export function getStoredGeminiKey() {
  return localStorage.getItem(GEMINI_KEY) || '';
}
export function storeGeminiKey(key) {
  localStorage.setItem(GEMINI_KEY, key);
}

// ── Rooms ────────────────────────────────────────────────────
export function getAllRooms() {
  try { return JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]'); }
  catch { return []; }
}
export function saveAllRooms(rooms) {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}
export function getRoomById(roomId) {
  return getAllRooms().find(r => r.id === roomId) || null;
}
export function upsertRoom(room) {
  const rooms = getAllRooms();
  const idx = rooms.findIndex(r => r.id === room.id);
  if (idx >= 0) rooms[idx] = room; else rooms.push(room);
  saveAllRooms(rooms);
}
export function deleteRoom(roomId) {
  saveAllRooms(getAllRooms().filter(r => r.id !== roomId));
}
export function generateRoomId() {
  return 'room_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
export function createRoom(name = 'New Chat') {
  const room = { id: generateRoomId(), name, messages: [], createdAt: Date.now() };
  upsertRoom(room);
  return room;
}

// ── Messages ─────────────────────────────────────────────────
export function addMessage(roomId, message) {
  const room = getRoomById(roomId);
  if (!room) return null;
  room.messages = [...(room.messages || []), message];
  upsertRoom(room);
  return room;
}
export function getRoomMessages(roomId) {
  return getRoomById(roomId)?.messages || [];
}

// ── Last active room ─────────────────────────────────────────
export function getLastRoomId() {
  return localStorage.getItem(LAST_ROOM_KEY) || null;
}
export function setLastRoomId(roomId) {
  localStorage.setItem(LAST_ROOM_KEY, roomId);
}
