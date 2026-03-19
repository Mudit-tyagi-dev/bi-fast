import { useState, useEffect, useCallback } from "react";
import {
  getAllRooms,
  createRoom,
  upsertRoom,
  deleteRoom,
  getRoomById,
  getLastRoomId,
  setLastRoomId,
  getStoredGeminiKey,
  storeGeminiKey,
} from "../utils/chatStorage";
import { setRoomConfig, healthCheck } from "../api/backend";
import { useWebSocket } from "./useWebSocket";

export function useDashboard() {
  const [rooms, setRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [geminiKey, setGeminiKeyState] = useState("");
  const [serverStatus, setServerStatus] = useState("unknown");
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    const key = getStoredGeminiKey();
    setGeminiKeyState(key);
    if (!key) setShowKeyModal(true);

    const allRooms = getAllRooms();
    setRooms(allRooms);

    const lastId = getLastRoomId();
    const restored =
      lastId && allRooms.find((r) => r.id === lastId)
        ? lastId
        : allRooms.length > 0
          ? allRooms[allRooms.length - 1].id
          : null;

    if (restored) {
      setCurrentRoomId(restored);
      setMessages(getRoomById(restored)?.messages || []);
    }

    healthCheck()
      .then(() => setServerStatus("ok"))
      .catch(() => setServerStatus("error"));
  }, []);

  const refreshRooms = useCallback(() => {
    setRooms(getAllRooms());
  }, []);

  const {
    wsStatus,
    sendMessage: wsSend,
    streamingText,
  } = useWebSocket({
    roomId: currentRoomId,
    onNewMessage: (msgs) => {
      setMessages([...msgs]);
      refreshRooms();
    },
    onRoomNameUpdate: () => {
      refreshRooms();
    },
    onRoomIdReceived: async (backendRoomId) => {
      console.log("backend room id:", backendRoomId); // ← bas ye add karo
      if (geminiKey) {
        try {
          await setRoomConfig(backendRoomId, geminiKey);
        } catch (e) {
          console.warn(e);
        }
      }
    },
  });

  const saveGeminiKey = useCallback(
    async (key) => {
      storeGeminiKey(key);
      setGeminiKeyState(key);
      setShowKeyModal(false);

      const roomId = currentRoomId || createRoom("New Chat").id;
      try {
        await setRoomConfig(roomId, key);
      } catch (e) {
        console.warn(e);
      }

      if (!currentRoomId) {
        refreshRooms();
        setCurrentRoomId(roomId);
        setLastRoomId(roomId);
        setMessages([]);
      }
    },
    [currentRoomId, refreshRooms],
  );

  const switchRoom = useCallback((roomId) => {
    setCurrentRoomId(roomId);
    setLastRoomId(roomId);
    setMessages(getRoomById(roomId)?.messages || []);
  }, []);

  const newChat = useCallback(async () => {
    const room = createRoom("New Dashboard");
    refreshRooms();

    if (geminiKey) {
      try {
        await setRoomConfig(room.id, geminiKey);
      } catch (e) {
        console.warn(e);
      }
    }

    setCurrentRoomId(room.id);
    setLastRoomId(room.id);
    setMessages([]);
    return room;
  }, [geminiKey, refreshRooms]);

  const removeRoom = useCallback(
    (roomId) => {
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
    },
    [currentRoomId, refreshRooms, switchRoom],
  );

  const sendMessage = useCallback(
    async (text, mode = "query") => {
      if (!text.trim()) return;
      if (!geminiKey) {
        setShowKeyModal(true);
        return;
      }
      if (!currentRoomId) {
        await newChat();
      }
      wsSend(text, mode === "chart" ? "chart" : "query");
    },
    [currentRoomId, geminiKey, newChat, wsSend],
  );

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
