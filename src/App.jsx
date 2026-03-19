import { useState, useEffect } from "react";
import "./styles/global.css";
import "./styles/app.css";
import { useDashboard } from "./hooks/useDashboard";
import Sidebar from "./components/Sidebar";
import ChatMessages from "./components/ChatMessages";
import DashboardBlock from "./components/dashboard";
import PromptBar from "./components/PromptBar";
import GeminiKeyModal from "./components/GeminiKeyModal";

const DUMMY_DASHBOARD = {
  data: {
    labels: ["Vlogs", "Tech Reviews", "Music", "Education", "Gaming"],
    values: [2988200, 2973890, 2979371, 1854320, 1632100],
    x_axis: "Category",
    y_axis: "Total Views",
  },
  query: "Sample: Top 5 categories by total views",
  explanation:
    "This is a preview dashboard. Ask a question below to generate your own insights from the data.",
};

export default function App() {
  const {
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
  } = useDashboard();

  const [activeNav, setActiveNav] = useState("overview");
  const [mode, setMode] = useState("query");
  const [chatOpen, setChatOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [chartMessages, setChartMessages] = useState([]);
  const isStreaming = streamingText !== null;

  useEffect(() => {
    if (messages.length > 0) setChatOpen(true);
  }, [messages.length]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    if (
      lastMsg.type === "dashboard" ||
      lastMsg.type === "chart" ||
      lastMsg.role === "assistant" ||
      lastMsg.role === "error"
    ) {
      setChartMessages((prev) => {
        const already = prev.find((m) => m.ts === lastMsg.ts);
        if (already) return prev;
        return [...prev, lastMsg];
      });
    }
  }, [messages]);

  function handleSend(text) {
    if (mode === "chart") {
      setChartMessages((prev) => [
        ...prev,
        { role: "user", content: text, ts: Date.now() },
      ]);
      sendMessage(text, "chart");
    } else {
      sendMessage(text, "query");
    }
  }

  function handleExport() {
    if (!messages.length) {
      alert("No messages to export.");
      return;
    }
    const txt = messages
      .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
      .join("\n\n---\n\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = `pulsebi-${currentRoomId || "chat"}.txt`;
    a.click();
  }

  const latestDashboard = [...messages]
    .reverse()
    .find((m) => m.type === "dashboard");
  const displayDashboard = latestDashboard || DUMMY_DASHBOARD;

  return (
    <div className="app">
      <Sidebar
        rooms={rooms}
        currentRoomId={currentRoomId}
        geminiKey={geminiKey}
        serverStatus={serverStatus}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onNewChat={newChat}
        onSwitchRoom={switchRoom}
        onDeleteRoom={removeRoom}
        onOpenKeyModal={() => setShowKeyModal(true)}
        onRenameRoom={(id, name) => {
          const room = rooms.find((r) => r.id === id);
          if (room) {
            room.name = name;
          }
        }}
        onPinRoom={(id) => {
          const room = rooms.find((r) => r.id === id);
          if (room) {
            room.pinned = !room.pinned;
          }
        }}
      />

      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="tb-left">
            {/* <span className="tb-tag">AI-Powered Insights</span>
            <div className="live-pill">
              <span className="live-dot" />
              LIVE
            </div> */}
          </div>
          <div className="tb-right">
            <button
              className={`tb-btn chat-toggle-btn ${chatOpen ? "active" : ""}`}
              onClick={() => setChatOpen((prev) => !prev)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {chatOpen ? "Close Chat" : "Chat"}
            </button>
            <button className="tb-btn" onClick={handleExport}>
              Export
            </button>
            <button
              className="tb-btn key"
              onClick={() => setShowKeyModal(true)}
            >
              API Key
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="content-area">
          {/* Chart panel — left se slide in */}
          {chartOpen && (
            <>
              <div
                className="drawer-overlay"
                onClick={() => {
                  setChartOpen(false);
                  setMode("query");
                }}
              />
              <div className="left-drawer">
                <div className="left-drawer-head">
                  <span className="left-drawer-title">Chart Mode</span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      className="chart-clear-btn"
                      onClick={() => setChartMessages([])}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                      </svg>
                      Clear
                    </button>
                    <button
                      className="left-drawer-close"
                      onClick={() => {
                        setChartOpen(false);
                        setMode("query");
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="left-drawer-body">
                  {chartMessages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--t3)",
                        fontSize: "14px",
                        textAlign: "center",
                        minHeight: "200px",
                      }}
                    >
                      Ask a chart question in the prompt bar below
                    </div>
                  ) : (
                    chartMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`chart-msg ${m.role === "user" ? "chart-msg-user" : "chart-msg-ai"}`}
                      >
                        {m.type === "dashboard" ? (
                          <DashboardBlock
                            data={m.data}
                            query={m.query}
                            explanation={m.explanation}
                          />
                        ) : (
                          <p style={{ color: "var(--t2)", fontSize: "13.5px" }}>
                            {m.content ?? m.data}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Dashboard panel */}
          <div className={`dashboard-panel ${chatOpen ? "with-chat" : ""}`}>
            <div className="dashboard-scroll">
              <div className="mode-bar">
                <div className="mode-bar-left">
                  <span className="mode-bar-title">
                    {latestDashboard ? "Dashboard" : "Preview Dashboard"}
                  </span>
                  {/* <span className="mode-bar-sub">
                    {latestDashboard
                      ? "Latest result"
                      : "Ask a question to generate your own"}
                  </span> */}
                </div>
              </div>
              <DashboardBlock
                data={displayDashboard.data}
                query={displayDashboard.query}
                explanation={displayDashboard.explanation}
              />
            </div>
            <PromptBar
              onSend={handleSend}
              isStreaming={isStreaming}
              wsStatus={wsStatus}
              currentRoomId={currentRoomId}
              geminiKey={geminiKey}
              onOpenKeyModal={() => setShowKeyModal(true)}
              mode={mode}
              onModeToggle={() =>
                setMode((prev) => (prev === "query" ? "chart" : "query"))
              }
            />
          </div>

          {/* Chat drawer — right side */}
          {chatOpen && (
            <div className="chat-drawer">
              <div className="chat-drawer-head">
                <span className="chat-drawer-title">Conversation</span>
                <button
                  className="chat-drawer-close"
                  onClick={() => setChatOpen(false)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="chat-drawer-body">
                <ChatMessages
                  messages={messages}
                  streamingText={streamingText}
                  onChipClick={handleSend}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showKeyModal && (
        <GeminiKeyModal
          currentKey={geminiKey}
          onSave={saveGeminiKey}
          onClose={() => setShowKeyModal(false)}
        />
      )}
    </div>
  );
}
