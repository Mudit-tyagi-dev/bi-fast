import { useState, useEffect } from "react";
import "./styles/global.css";
import "./styles/app.css";
import { useDashboard } from "./hooks/useDashboard";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal.jsx";
import HomeTab from "./components/HomeTab";
import ChatTab from "./components/ChatTab";
import { getUsage, incrementUsage } from "./utils/chatStorage";

export default function App() {
  const {
    rooms,
    currentRoomId,
    messages,
    geminiKey,
    serverStatus,
    wsStatus,
    streamingText,
    isWaiting,
    showKeyModal,
    setShowKeyModal,
    saveGeminiKey,
    switchRoom,
    newChat,
    removeRoom,
    sendMessage,
    uploadFile,
    roomFile,
    backendRoomId,
    isCreatingRoom,
    deleteChart,
  } = useDashboard();

  const [activeNav, setActiveNav] = useState("home");
  const [mode, setMode] = useState("query");
  const [usage, setUsage] = useState(getUsage());
  const [chatOpen, setChatOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false); // ← ADD

  const [theme, setTheme] = useState(
    () => localStorage.getItem("pb_theme") || "dark",
  );

  const isStreaming = streamingText !== null || isWaiting;

  // ── Theme effect ──
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.setAttribute("data-theme", mq.matches ? "dark" : "light");
      const handler = (e) =>
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  function handleThemeChange(t) {
    setTheme(t);
    localStorage.setItem("pb_theme", t);
  }

  function handleSend(text) {
    if (!text?.trim()) return;
    setUsage(incrementUsage());
    sendMessage(text, mode === "chart" ? "chart" : "query");
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

  function renderContent() {
    if (activeNav === "database")
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            color: "var(--t3)",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.4"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          <p style={{ fontSize: "14px" }}>Database — coming soon</p>
        </div>
      );

    if (activeNav === "home")
      return (
        <HomeTab
          rooms={rooms}
          currentRoomId={currentRoomId}
          usage={usage}
          switchRoom={(id) => {
            switchRoom(id);
            setActiveNav("chat");
          }}
          newChat={async () => {
            await newChat();
            setActiveNav("chat");
          }}
          uploadFile={uploadFile}
          roomFile={roomFile}
          onTryDemo={() => {
            handleSend("Show me top 5 categories by total views");
            setActiveNav("chat");
          }}
        />
      );

    return (
      <ChatTab
        messages={messages}
        deleteChart={deleteChart}
        streamingText={streamingText}
        isStreaming={isStreaming}
        wsStatus={wsStatus}
        currentRoomId={currentRoomId}
        geminiKey={geminiKey}
        backendRoomId={backendRoomId}
        mode={mode}
        onModeToggle={() => setMode((p) => (p === "query" ? "chart" : "query"))}
        onSend={handleSend}
        onOpenKeyModal={() => setShowKeyModal(true)}
        uploadFile={uploadFile}
        roomFile={roomFile}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((p) => !p)}
        compareOpen={compareOpen}
        onOpenCompare={() => setCompareOpen(true)}
        onCloseCompare={() => setCompareOpen(false)}
      />
    );
  }

  return (
    <div className="app">
      <Sidebar
        key={`sidebar-${rooms.length}-${currentRoomId}`}
        rooms={rooms}
        currentRoomId={currentRoomId}
        geminiKey={geminiKey}
        serverStatus={serverStatus}
        activeNav={activeNav}
        onNavChange={(nav) => {
          setActiveNav(nav);
          if (nav === "chat" && !currentRoomId && rooms.length > 0)
            switchRoom(rooms[rooms.length - 1].id);
        }}
        onNewChat={async () => {
          await newChat();
          setActiveNav("chat");
        }}
        onSwitchRoom={(id) => {
          switchRoom(id);
          setActiveNav("chat");
        }}
        onDeleteRoom={removeRoom}
        onOpenKeyModal={() => setShowKeyModal(true)}
        onRenameRoom={(id, name) => {
          const r = rooms.find((r) => r.id === id);
          if (r) r.name = name;
        }}
        onPinRoom={(id) => {
          const r = rooms.find((r) => r.id === id);
          if (r) r.pinned = !r.pinned;
        }}
        isCreatingRoom={isCreatingRoom}
      />

      <div className="main">
        <div className="topbar">
          <div className="tb-left">
            {/* Sirf chat tab pe dikhao */}
            {activeNav === "chat" && (
              <div className="tb-dashboard-title">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Dashboard
              </div>
            )}
          </div>
          <div className="tb-right">
            {activeNav === "chat" && (
              <>
                <button
                  className={`tb-btn chat-toggle-btn ${chatOpen ? "active" : ""}`}
                  onClick={() => setChatOpen((p) => !p)}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  {chatOpen ? "Hide AI Chat" : "AI Chat"}
                </button>

                {/* Compare btn */}
                <button
                  className={`tb-btn compare-btn ${compareOpen ? "active" : ""}`}
                  onClick={() => setCompareOpen((p) => !p)}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="7" height="18" rx="1" />
                    <rect x="14" y="3" width="7" height="18" rx="1" />
                  </svg>
                  {compareOpen ? "Dashboard" : "Compare"}
                </button>
              </>
            )}

            <button className="tb-btn" onClick={handleExport}>
              Export
            </button>
            <button
              className="tb-btn key"
              onClick={() => setShowKeyModal(true)}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="content-area">{renderContent()}</div>
      </div>

      {showKeyModal && (
        <SettingsModal
          currentKey={geminiKey}
          onSave={saveGeminiKey}
          onClose={() => setShowKeyModal(false)}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
      )}
    </div>
  );
}
