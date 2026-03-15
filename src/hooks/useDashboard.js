import { useState, useEffect, useCallback } from 'react';
import {
  getAllRooms, createRoom, upsertRoom, deleteRoom,
  getRoomById, getLastRoomId, setLastRoomId,
  getStoredGeminiKey, storeGeminiKey,
} from '../utils/chatStorage';
import { setRoomConfig, healthCheck } from '../api/backend';
import { useWebSocket } from './useWebSocket';

export function useDashboard() {
  const [rooms, setRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [geminiKey, setGeminiKeyState] = useState('');
  const [serverStatus, setServerStatus] = useState('unknown');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // ── Init on mount ────────────────────────────────────────────
  useEffect(() => {
    const key = getStoredGeminiKey();
    setGeminiKeyState(key);
    if (!key) setShowKeyModal(true);

    const allRooms = getAllRooms();
    setRooms(allRooms);

    const lastId = getLastRoomId();
    const restored = lastId && allRooms.find(r => r.id === lastId)
      ? lastId
      : allRooms.length > 0 ? allRooms[allRooms.length - 1].id : null;

    if (restored) {
      setCurrentRoomId(restored);
      setMessages(getRoomById(restored)?.messages || []);
    }

    healthCheck()
      .then(() => setServerStatus('ok'))
      .catch(() => setServerStatus('error'));
  }, []);

  // ── Refresh room list from storage ──────────────────────────
  const refreshRooms = useCallback(() => {
    setRooms(getAllRooms());
  }, []);

  // ── WebSocket — connected per room ───────────────────────────
  const { wsStatus, sendMessage: wsSend, streamingText } = useWebSocket({
    roomId: currentRoomId,
    onNewMessage: (msgs) => {
      setMessages([...msgs]);
      refreshRooms();
    },
    onRoomNameUpdate: (roomId, name) => {
      refreshRooms();
    },
  });

  // ── Gemini key save ──────────────────────────────────────────
  const saveGeminiKey = useCallback(async (key) => {
    storeGeminiKey(key);
    setGeminiKeyState(key);
    setShowKeyModal(false);
    if (currentRoomId) {
      try { await setRoomConfig(currentRoomId, key); } catch (e) { console.warn(e); }
    }
  }, [currentRoomId]);

  // ── Room actions ─────────────────────────────────────────────
  const switchRoom = useCallback((roomId) => {
    setCurrentRoomId(roomId);
    setLastRoomId(roomId);
    setMessages(getRoomById(roomId)?.messages || []);
  }, []);

  const newChat = useCallback(async () => {
    const room = createRoom('New Chat');
    refreshRooms();
    setCurrentRoomId(room.id);
    setLastRoomId(room.id);
    setMessages([]);

    // Register config for new room
    if (geminiKey) {
      try { await setRoomConfig(room.id, geminiKey); } catch (e) { console.warn(e); }
    }

    return room;
  }, [geminiKey, refreshRooms]);

  const removeRoom = useCallback((roomId) => {
    deleteRoom(roomId);
    const remaining = getAllRooms();
    refreshRooms();
    if (currentRoomId === roomId) {
      if (remaining.length > 0) {
        switchRoom(remaining[remaining.length - 1].id);
      } else {
        setCurrentRoomId(null);
        setMessages([]);
      }
    }
  }, [currentRoomId, refreshRooms, switchRoom]);

  // ── Send message via WebSocket ───────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    if (!geminiKey) { setShowKeyModal(true); return; }

    // Auto-create room if needed
    if (!currentRoomId) {
      await newChat();
    }

    wsSend(text);
  }, [currentRoomId, geminiKey, newChat, wsSend]);

  return {
    rooms,
    currentRoomId,
    messages,
    geminiKey,
    serverStatus,
    wsStatus,
    streamingText,
    showKeyModal,
    setShowKeyModal,
    saveGeminiKey,
    switchRoom,
    newChat,
    removeRoom,
    sendMessage,
  };
}
