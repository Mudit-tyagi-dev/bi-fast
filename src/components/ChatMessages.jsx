import { useEffect, useRef } from "react";
import "../styles/chatmessages.css";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// ── Message formatter ─────────────────────
function formatContent(content) {
  if (!content) return null;

  return content.split("\n").map((line, i) => (
    <p key={i}>{line}</p>
  ));
}

// ── Chart renderer inside chat ────────────
function ChartBlock({ data }) {
  if (!data || !data.labels || !data.datasets) return null;

  const chartData = {
    labels: data.labels,
    datasets: data.datasets,
  };

  switch (data.chart_type) {
    case "line":
      return <Line data={chartData} />;
    case "pie":
      return <Pie data={chartData} />;
    case "doughnut":
      return <Doughnut data={chartData} />;
    default:
      return <Bar data={chartData} />;
  }
}

// ── Message bubble ────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  const isChart = msg.type === "dashboard";

  return (
    <div className={`msg-row ${isUser ? "user" : "ai"}`}>
      <div className="msg-avatar">{isUser ? "You" : "AI"}</div>

      <div className={`msg-bubble ${isUser ? "user" : "ai"}`}>
        {isChart ? (
          <div className="chart-wrap">
            <ChartBlock data={msg.data} />
            {msg.explanation && (
              <p className="chart-expl">{msg.explanation}</p>
            )}
          </div>
        ) : (
          <div className="msg-body">{formatContent(msg.content)}</div>
        )}

        {msg.ts && (
          <div className="msg-ts">
            {new Date(msg.ts).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Streaming bubble ──────────────────────
function StreamingBubble({ text }) {
  return (
    <div className="msg-row ai">
      <div className="msg-avatar">AI</div>
      <div className="msg-bubble ai streaming">
        {text || "Thinking..."}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────
export default function ChatMessages({ messages, streamingText }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div className="messages-wrap">
      {messages.map((m, i) => (
        <Message key={i} msg={m} />
      ))}

      {streamingText && <StreamingBubble text={streamingText} />}

      <div ref={bottomRef} />
    </div>
  );
}