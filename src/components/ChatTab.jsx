import { useState, useCallback, useEffect } from "react";
import PromptBar from "./PromptBar";
import ChatMessages from "./ChatMessages";
import DashboardBlock from "./dashboard";
import '../styles/ChatTab.css'

export default function ChatTab({
  messages,
  streamingText,
  latestDashboard,
  isStreaming,
  wsStatus,
  currentRoomId,
  geminiKey,
  backendRoomId,
  mode,
  onModeToggle,
  onSend,
  onOpenKeyModal,
  uploadFile,
  roomFile,
  chatOpen,
  onToggleChat,
}) {
  const hasMessages = messages.length > 0;

  const [chatWidth, setChatWidth] = useState(360);
  const [dragging, setDragging] = useState(false);

  // 🔥 DASHBOARD STATES
  const [dashboards, setDashboards] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [selectedCharts, setSelectedCharts] = useState([]);

  // 🔥 LOAD PINNED
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("pinned_dashboards") || "[]");
    setPinned(saved);
  }, []);

  // 🔥 ADD NEW DASHBOARD
  useEffect(() => {
    if (latestDashboard) {
      setDashboards((prev) => [...prev, latestDashboard]);
    }
  }, [latestDashboard]);

  // 🔥 HANDLERS
  function handlePin(item) {
    const updated = [...pinned, item];
    setPinned(updated);
    localStorage.setItem("pinned_dashboards", JSON.stringify(updated));
  }

  function handleSelect(chart, checked) {
    if (checked) {
      setSelectedCharts((prev) => [...prev, chart]);
    } else {
      setSelectedCharts((prev) => prev.filter((c) => c !== chart));
    }
  }

  const startDrag = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(true);

      const startX = e.clientX;
      const startWidth = chatWidth;

      function onMove(e) {
        const delta = startX - e.clientX;
        const newWidth = Math.min(700, Math.max(260, startWidth + delta));
        setChatWidth(newWidth);
      }

      function onUp() {
        setDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [chatWidth]
  );

  // ───────── NEW CHAT SCREEN ─────────
  if (!hasMessages) {
    return (
      <div className="new-chat-screen">
        <div className="new-chat-center">
          <h2>New Dashboard</h2>
          <p>Upload your CSV to get started</p>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => uploadFile(e.target.files[0])}
          />

          {roomFile && <p>File ready ✅</p>}
        </div>

        <div className="new-chat-prompt">
          <PromptBar
            onSend={onSend}
            isStreaming={isStreaming}
            wsStatus={wsStatus}
            currentRoomId={currentRoomId}
            geminiKey={geminiKey}
            backendRoomId={backendRoomId}
            onOpenKeyModal={onOpenKeyModal}
            mode={mode}
            onModeToggle={onModeToggle}
          />
        </div>
      </div>
    );
  }

  // ───────── MAIN UI ─────────
  return (
    <div className={`chat-dashboard-split ${dragging ? "dragging" : ""}`}>
      
      {/* LEFT: DASHBOARD */}
      <div className="split-dashboard-col">
        <div className="split-dashboard">

          {/* 📌 PINNED */}
          {pinned.length > 0 && (
            <>
              <h3>Pinned</h3>
              <div className="dashboard-grid">
                {pinned.map((d, i) => (
                  <DashboardBlock key={i} {...d} />
                ))}
              </div>
            </>
          )}

          {/* 🔄 COMPARE */}
          {selectedCharts.length >= 2 && (
            <>
              <h3>Compare</h3>
              <div className="dashboard-grid">
                {selectedCharts.map((c, i) => (
                  <DashboardBlock key={i} data={c} />
                ))}
              </div>
            </>
          )}

          {/* 📊 MAIN DASHBOARD */}
          <div className="dashboard-grid">
            {dashboards.map((d, i) => (
              <DashboardBlock
                key={i}
                data={d.data}
                query={d.query}
                explanation={d.explanation}
                onPin={handlePin}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* 🔥 Prompt when chat CLOSED */}
        {!chatOpen && (
          <div className="split-bottom-prompt">
            <PromptBar
              onSend={onSend}
              isStreaming={isStreaming}
              wsStatus={wsStatus}
              currentRoomId={currentRoomId}
              geminiKey={geminiKey}
              backendRoomId={backendRoomId}
              onOpenKeyModal={onOpenKeyModal}
              mode={mode}
              onModeToggle={onModeToggle}
            />
          </div>
        )}
      </div>

      {/* RIGHT: CHAT */}
      {chatOpen && (
        <>
          <div className="split-resize-handle" onMouseDown={startDrag} />

          <div className="split-chat-drawer" style={{ width: chatWidth }}>

            {/* HEADER */}
            <div className="split-chat-header">
              <span>Conversation</span>
              <button onClick={onToggleChat}>✕</button>
            </div>

            {/* MESSAGES */}
            <div className="split-chat-messages">
              <ChatMessages
                messages={messages}
                streamingText={streamingText}
                onChipClick={onSend}
              />
            </div>

            {/* 🔥 Prompt always inside chat */}
            <div className="split-chat-prompt">
              <PromptBar
                onSend={onSend}
                isStreaming={isStreaming}
                wsStatus={wsStatus}
                currentRoomId={currentRoomId}
                geminiKey={geminiKey}
                backendRoomId={backendRoomId}
                onOpenKeyModal={onOpenKeyModal}
                mode={mode}
                onModeToggle={onModeToggle}
              />
            </div>

          </div>
        </>
      )}
    </div>
  );
}