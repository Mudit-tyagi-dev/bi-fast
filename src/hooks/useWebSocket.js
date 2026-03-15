// ─────────────────────────────────────────────
//  useWebSocket.js
//
//  Creates a WebSocket per room_id.
//  Reconnects automatically when room changes.
//  Streams AI tokens directly into the message list.
//
//  Returns:
//    wsStatus       WS_STATUS string (open/connecting/closed/error)
//    sendMessage    (text: string) => void
//    streamingText  string | null  — current partial AI token stream
// ─────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import { createSocket, WS_STATUS } from '../utils/socket';
import { addMessage, upsertRoom, getRoomById } from '../utils/chatStorage';

export function useWebSocket({ roomId, onNewMessage, onRoomNameUpdate }) {
  const socketRef = useRef(null);
  const [wsStatus, setWsStatus] = useState(WS_STATUS.CLOSED);
  const [streamingText, setStreamingText] = useState(null); // null = not streaming
  const streamBufferRef = useRef('');                        // accumulates tokens

  // ── Connect / reconnect when roomId changes ─────────────────
  useEffect(() => {
    if (!roomId) return;

    // Tear down old socket
    if (socketRef.current) {
      socketRef.current.destroy();
      socketRef.current = null;
    }

    streamBufferRef.current = '';
    setStreamingText(null);

    const socket = createSocket(roomId);
    socketRef.current = socket;

    // Status changes
    socket.on('status', (status) => {
      setWsStatus(status);
    });

    // Streaming token — append to buffer, push to UI
    socket.on('token', (token) => {
      streamBufferRef.current += token;
      setStreamingText(streamBufferRef.current);
    });

    // Streaming done — commit full message to storage
    socket.on('done', () => {
      const fullText = streamBufferRef.current;
      streamBufferRef.current = '';
      setStreamingText(null);

      if (fullText.trim()) {
        const aiMsg = { role: 'assistant', content: fullText, ts: Date.now() };
        const updatedRoom = addMessage(roomId, aiMsg);
        if (updatedRoom) onNewMessage(updatedRoom.messages);
      }
    });

    // Full message at once (non-streaming backend)
    socket.on('message', (data) => {
      streamBufferRef.current = '';
      setStreamingText(null);
      const content = data.content ?? data.reply ?? data.message ?? JSON.stringify(data);
      const aiMsg = { role: 'assistant', content, ts: Date.now() };
      const updatedRoom = addMessage(roomId, aiMsg);
      if (updatedRoom) onNewMessage(updatedRoom.messages);
    });

    // Error from backend
    socket.on('error', (msg) => {
      streamBufferRef.current = '';
      setStreamingText(null);
      const errMsg = { role: 'error', content: `Backend error: ${msg}`, ts: Date.now() };
      const updatedRoom = addMessage(roomId, errMsg);
      if (updatedRoom) onNewMessage(updatedRoom.messages);
    });

    return () => {
      socket.destroy();
      socketRef.current = null;
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send a message over the socket ──────────────────────────
  const sendMessage = useCallback((text) => {
    if (!socketRef.current) return;

    // Save user message to localStorage first
    const userMsg = { role: 'user', content: text, ts: Date.now() };
    const updatedRoom = addMessage(roomId, userMsg);

    if (updatedRoom) {
      // Auto-name the room from first message
      if (updatedRoom.messages.filter(m => m.role === 'user').length === 1) {
        updatedRoom.name = text.length > 36 ? text.slice(0, 36) + '…' : text;
        upsertRoom(updatedRoom);
        onRoomNameUpdate?.(roomId, updatedRoom.name);
      }
      onNewMessage(updatedRoom.messages);
    }

    // Reset streaming buffer for new response
    streamBufferRef.current = '';
    setStreamingText(null);

    // Send over WebSocket
    socketRef.current.sendMessage(text);
  }, [roomId, onNewMessage, onRoomNameUpdate]);

  return { wsStatus, sendMessage, streamingText };
}
