import { useEffect, useRef, useState, useCallback } from "react";
import { createSocket, WS_STATUS } from "../utils/socket";
import { addMessage, upsertRoom } from "../utils/chatStorage";

function tryParseChart(text) {
  if (!text || typeof text !== "string") return null;

  let chartType = "bar";
  if (/pie/i.test(text)) chartType = "pie";
  else if (/donut|doughnut/i.test(text)) chartType = "doughnut";
  else if (/line|trend|monthly|over time/i.test(text)) chartType = "line";

  const numberedList = text.match(/\d+\.\s+\*?([\w\s]+)\*?:\s*([\d,]+)/g);
  if (numberedList && numberedList.length >= 2) {
    const labels = [],
      values = [];
    numberedList.forEach((item) => {
      const match = item.match(/\d+\.\s+\*?([\w\s]+)\*?:\s*([\d,]+)/);
      if (match) {
        labels.push(match[1].trim());
        values.push(parseInt(match[2].replace(/,/g, ""), 10));
      }
    });
    if (labels.length >= 2)
      return { labels, values, x_axis: "Category", y_axis: "Value", chartType };
  }

  const numbers = text.match(/[\d,£$]+/g);
  if (!numbers || numbers.length < 2) return null;

  const values = numbers
    .map((n) => parseInt(n.replace(/[,£$]/g, ""), 10))
    .filter((n) => n > 1000 && n < 10_000_000_000);

  if (values.length < 2) return null;

  const monthPattern = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{0,4}/gi,
  );
  const andPattern = text.match(
    /are\s+([\w\s,]+(?:\s+and\s+[\w\s]+)?),?\s+with/i,
  );
  const boldLabels = text.match(/\*\*(.*?)\*\*/g);

  let labels = [];
  if (monthPattern && monthPattern.length >= 2) {
    labels = monthPattern.map((m) => m.trim());
  } else if (andPattern) {
    labels = andPattern[1]
      .split(/,\s*|\s+and\s+/i)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } else if (boldLabels) {
    labels = boldLabels.map((l) => l.replace(/\*\*/g, "").split(":")[0].trim());
  }

  if (labels.length < 2 || values.length < 2) return null;
  const count = Math.min(labels.length, values.length);
  return {
    labels: labels.slice(0, count),
    values: values.slice(0, count),
    x_axis: monthPattern ? "Month" : "Category",
    y_axis: "Value",
    chartType,
  };
}

export function useWebSocket({
  roomId,
  onNewMessage,
  onRoomNameUpdate,
  onRoomIdReceived,
}) {
  const socketRef = useRef(null);
  const [wsStatus, setWsStatus] = useState(WS_STATUS.CLOSED);
  const [streamingText, setStreamingText] = useState(null);
  const streamBufferRef = useRef("");
  const lastQueryRef = useRef("");

  useEffect(() => {
    if (!roomId) return;
    if (socketRef.current) {
      socketRef.current.destroy();
      socketRef.current = null;
    }

    streamBufferRef.current = "";
    setStreamingText(null);

    const socket = createSocket(roomId);
    socketRef.current = socket;

    socket.on("status", (status) => {
      setWsStatus(status);
    });

    socket.on("token", (token) => {
      streamBufferRef.current += token;
      setStreamingText(streamBufferRef.current);
    });

    socket.on("done", () => {
      const fullText = streamBufferRef.current;
      streamBufferRef.current = "";
      setStreamingText(null);
      if (!fullText.trim()) return;

      const chartData = tryParseChart(fullText);
      const room = addMessage(
        roomId,
        chartData
          ? {
              role: "assistant",
              type: "dashboard",
              data: chartData,
              query: lastQueryRef.current,
              explanation: fullText,
              content: fullText,
              ts: Date.now(),
            }
          : {
              role: "assistant",
              content: fullText,
              ts: Date.now(),
            },
      );
      if (room) onNewMessage(room.messages);
    });

    socket.on("message", (data) => {
      streamBufferRef.current = "";
      setStreamingText(null);

      console.log("WS message received:", JSON.stringify(data));

      // room_id — backend ka room assign
      if (data?.room_id) {
        const storageKey = `ws_room_${roomId}`;
        const alreadySaved = localStorage.getItem(storageKey);

        // ✅ If already exists → IGNORE backend new id
        if (alreadySaved) {
          // console.log("🛑 Ignored new backend room_id:", data.room_id);
          return;
        }

        // ✅ Only first time save
        onRoomIdReceived?.(data.room_id);
        return;
      }

      // Backend error
      if (data?.type === "error") {
        const room = addMessage(roomId, {
          role: "error",
          content: data.data || data.message || "Something went wrong",
          ts: Date.now(),
        });
        if (room) onNewMessage(room.messages);
        return;
      }

      // Dashboard/chart
      if (data?.type === "chart" || data?.data?.chart_type) {
        const chart = data.data;

        const room = addMessage(roomId, {
          role: "assistant",
          type: "dashboard",
          data: chart,
          query: lastQueryRef.current,
          explanation: data.explanation || "",
          ts: Date.now(),
        });

        if (room) onNewMessage(room.messages);
        return;
      }

      // Normal text
      const text =
        data?.text ||
        data?.content ||
        data?.message ||
        data?.answer ||
        data?.data;
      if (text && typeof text === "string") {
        const chartData = tryParseChart(text);
        const room = addMessage(
          roomId,
          chartData
            ? {
                role: "assistant",
                type: "dashboard",
                data: chartData,
                query: lastQueryRef.current,
                explanation: text,
                content: text,
                ts: Date.now(),
              }
            : {
                role: "assistant",
                content: text,
                ts: Date.now(),
              },
        );
        if (room) onNewMessage(room.messages);
        return;
      }

      console.warn("Unhandled WS message:", data);
    });

    socket.on("error", (msg) => {
      streamBufferRef.current = "";
      setStreamingText(null);
      const room = addMessage(roomId, {
        role: "error",
        content: `Error: ${msg}`,
        ts: Date.now(),
      });
      if (room) onNewMessage(room.messages);
    });

    return () => {
      socket.destroy();
      socketRef.current = null;
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (text, type = "query") => {
      if (!socketRef.current) return;
      lastQueryRef.current = text;

      const userMsg = { role: "user", content: text, ts: Date.now() };
      const updatedRoom = addMessage(roomId, userMsg);

      if (updatedRoom) {
        if (
          updatedRoom.messages.filter((m) => m.role === "user").length === 1
        ) {
          updatedRoom.name = text.length > 36 ? text.slice(0, 36) + "…" : text;
          upsertRoom(updatedRoom);
          onRoomNameUpdate?.(roomId, updatedRoom.name);
        }
        onNewMessage(updatedRoom.messages);
      }

      streamBufferRef.current = "";
      setStreamingText(null);
      socketRef.current.sendMessage(text, type);
    },
    [roomId, onNewMessage, onRoomNameUpdate],
  );

  return { wsStatus, sendMessage, streamingText };
}
