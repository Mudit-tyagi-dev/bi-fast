import { useEffect, useRef, useState, useCallback } from "react";
import { createSocket, WS_STATUS } from "../utils/socket";
import { addMessage, upsertRoom } from "../utils/chatStorage";

function tryParseChart(text) {
  if (!text || typeof text !== "string") return null;

  let chartType = "bar";
  if (/pie/i.test(text)) chartType = "pie";
  else if (/donut|doughnut/i.test(text)) chartType = "doughnut";
  else if (/line|trend|monthly|over time/i.test(text)) chartType = "line";

  // Pattern 1: "1. Vlogs: 1,013,998,121 views"
  const numberedList = text.match(/\d+\.\s+\*?([\w\s]+)\*?:\s*([\d,]+)/g);
  if (numberedList && numberedList.length >= 2) {
    const labels = [];
    const values = [];
    numberedList.forEach((item) => {
      const match = item.match(/\d+\.\s+\*?([\w\s]+)\*?:\s*([\d,]+)/);
      if (match) {
        labels.push(match[1].trim());
        values.push(parseInt(match[2].replace(/,/g, ""), 10));
      }
    });
    if (labels.length >= 2) {
      return {
        labels,
        values,
        x_axis: "Category",
        y_axis: "Value",
        chartType,
      };
    }
  }

  // Pattern 2: "are Vlogs, Music and Tech Reviews with numbers"
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
    const raw = andPattern[1];
    labels = raw
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
  const pendingChartRef = useRef(null);
  const lastQueryRef = useRef("");

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.destroy();
      socketRef.current = null;
    }

    streamBufferRef.current = "";
    setStreamingText(null);

    const socket = createSocket(roomId);
    socketRef.current = socket;

    socket.on("status", setWsStatus);

    socket.on("token", (token) => {
      streamBufferRef.current += token;
      setStreamingText(streamBufferRef.current);
    });

    socket.on("done", () => {
      const fullText = streamBufferRef.current;
      streamBufferRef.current = "";
      setStreamingText(null);
      if (fullText.trim()) {
        const room = addMessage(roomId, {
          role: "assistant",
          content: fullText,
          ts: Date.now(),
        });
        if (room) onNewMessage(room.messages);
      }
    });

    socket.on("message", (data) => {
      streamBufferRef.current = "";
      setStreamingText(null);
      console.log("raw data:", data);
      console.log(
        "parsedChart:",
        tryParseChart(data.data ?? data.content ?? ""),
      );

      if (data.room_id) {
        onRoomIdReceived?.(data.room_id);
        return;
      }

      // Chart type — store karo
      if (data.type === "chart") {
        // Seedha dashboard banao — explanation ka wait mat karo
        const dashMsg = {
          role: "assistant",
          type: "dashboard",
          data: data.data,
          explanation: null,
          query: lastQueryRef.current,
          ts: Date.now(),
        };
        const room = addMessage(roomId, dashMsg);
        if (room) onNewMessage(room.messages);
        return;
      }

      // Explanation aaya — dashboard banao
      if (data.type === "explanation" || data.type === "reply") {
        const content = data.data ?? "";

        if (pendingChartRef.current) {
          const dashMsg = {
            role: "assistant",
            type: "dashboard",
            data: pendingChartRef.current,
            explanation: content,
            query: lastQueryRef.current,
            ts: Date.now(),
          };
          pendingChartRef.current = null;
          const room = addMessage(roomId, dashMsg);
          if (room) onNewMessage(room.messages);
        } else {
          const room = addMessage(roomId, {
            role: "assistant",
            content,
            ts: Date.now(),
          });
          if (room) onNewMessage(room.messages);
        }
        return;
      }

      // Fallback — text se chart parse karo
      let content = data.data ?? data.content ?? JSON.stringify(data);
      const parsedChart = tryParseChart(content);

      if (parsedChart) {
        const dashMsg = {
          role: "assistant",
          type: "dashboard",
          data: parsedChart,
          explanation: null,
          query: lastQueryRef.current,
          ts: Date.now(),
        };
        const room = addMessage(roomId, dashMsg);
        if (room) onNewMessage(room.messages);
        return;
      }

      const room = addMessage(roomId, {
        role: "assistant",
        content,
        ts: Date.now(),
      });
      if (room) onNewMessage(room.messages);
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
