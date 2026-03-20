import { useState, useCallback, useRef } from "react";
import PromptBar from "./PromptBar";
import ChatMessages from "./ChatMessages";
import DashboardBlock from "./dashboard";
import "../styles/chatTAb.css";

// ── Upload Modal ──
function UploadModal({ onClose, uploadFile }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
    return bytes + " B";
  }

  function formatTime(sec) {
    if (sec < 60) return `${Math.round(sec)}s`;
    return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
  }

  function estimateRemaining() {
    if (!progress || !elapsed) return "—";
    const total = (elapsed / progress) * 100;
    return formatTime(total - elapsed);
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) setFile(f);
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setElapsed(0);
    const start = Date.now();
    setStartTime(start);

    // Fake progress animation while real upload happens
    timerRef.current = setInterval(() => {
      const secs = (Date.now() - start) / 1000;
      setElapsed(secs);
      setProgress(prev => {
        if (prev >= 90) return prev; // hold at 90 until done
        return Math.min(90, prev + Math.random() * 8);
      });
    }, 400);

    try {
      const result = await uploadFile(file);
      clearInterval(timerRef.current);
      if (result?.success !== false) {
        setProgress(100);
        setStatus("done");
        setTimeout(() => onClose(), 1200);
      } else {
        setStatus("error");
      }
    } catch {
      clearInterval(timerRef.current);
      setStatus("error");
    }
  }

  return (
    <div className="upload-modal-overlay" onClick={(e) => e.target === e.currentTarget && status !== "uploading" && onClose()}>
      <div className="upload-modal">

        {/* Header */}
        <div className="upload-modal-head">
          <div className="upload-modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload CSV
          </div>
          {status !== "uploading" && (
            <button className="upload-modal-close" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Drop zone */}
        {status === "idle" && (
          <>
            <div
              className={`upload-drop-zone ${file ? "has-file" : ""}`}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileChange} />
              {file ? (
                <>
                  <div className="upload-file-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="upload-file-name">{file.name}</div>
                  <div className="upload-file-size">{formatSize(file.size)}</div>
                </>
              ) : (
                <>
                  <div className="upload-drop-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div className="upload-drop-text">Drop your CSV here</div>
                  <div className="upload-drop-sub">or click to browse</div>
                </>
              )}
            </div>

            <button
              className="upload-confirm-btn"
              onClick={handleUpload}
              disabled={!file}
            >
              {file ? `Upload ${file.name}` : "Select a file first"}
            </button>
          </>
        )}

        {/* Uploading state */}
        {status === "uploading" && (
          <div className="upload-progress-wrap">
            <div className="upload-progress-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="upload-progress-name">{file?.name}</div>
            <div className="upload-progress-size">{formatSize(file?.size || 0)}</div>

            {/* Bar */}
            <div className="upload-bar-track">
              <div className="upload-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Stats */}
            <div className="upload-progress-stats">
              <span>{Math.round(progress)}% complete</span>
              <span>~{estimateRemaining()} remaining</span>
            </div>

            <div className="upload-progress-label">Uploading to server…</div>
          </div>
        )}

        {/* Done state */}
        {status === "done" && (
          <div className="upload-done-wrap">
            <div className="upload-done-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10d9a0" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div className="upload-done-text">Upload complete!</div>
            <div className="upload-done-sub">{file?.name} is ready</div>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="upload-error-wrap">
            <div className="upload-error-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="upload-error-text">Upload failed</div>
            <button className="upload-retry-btn" onClick={() => setStatus("idle")}>Try again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ChatTab ──
export default function ChatTab({
  messages, streamingText, isStreaming,
  wsStatus, currentRoomId, geminiKey, backendRoomId,
  mode, onModeToggle, onSend, onOpenKeyModal,
  uploadFile, roomFile, chatOpen, onToggleChat,
}) {
  const hasCharts = messages.some(m => m.type === "dashboard" && m.data?.chart_type);
  const [chatWidth, setChatWidth] = useState(340);
  const [dragging, setDragging] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const startDrag = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startW = chatWidth;
    function onMove(e) {
      setChatWidth(Math.min(680, Math.max(260, startW + (startX - e.clientX))));
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [chatWidth]);

  return (
    <>
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          uploadFile={uploadFile}
        />
      )}

      <div className={`chat-dashboard-split ${dragging ? "no-select" : ""}`}>

        {/* LEFT — Dashboard */}
        <div className="split-dashboard-col">
          <div className="split-dashboard">
            {hasCharts ? (
              <DashboardBlock messages={messages} />
            ) : (
              <div className="split-no-charts">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                <p>No charts yet</p>
                <span>Ask a question in AI Chat to generate charts</span>

                {/* Upload CSV shortcut */}
                {!roomFile && (
                  <button className="no-charts-upload-btn" onClick={() => setShowUpload(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload CSV
                  </button>
                )}
                {roomFile && (
                  <div className="no-charts-file-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {roomFile} ready
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Chat drawer */}
        {chatOpen && (
          <>
            <div className="split-resize-handle" onMouseDown={startDrag} />

            <div className="split-chat-drawer" style={{ width: chatWidth, minWidth: chatWidth }}>

              <div className="split-chat-header">
                <div className="split-chat-header-left">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <span>AI Chat</span>
                </div>
                <div className="split-chat-header-right">
                  {/* Upload btn in chat header */}
                  <button
                    className="chat-upload-btn"
                    onClick={() => setShowUpload(true)}
                    title={roomFile ? `File: ${roomFile}` : "Upload CSV"}
                  >
                    {roomFile ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {roomFile.length > 14 ? roomFile.slice(0, 14) + "…" : roomFile}
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Upload CSV
                      </>
                    )}
                  </button>
                  <button className="split-chat-close-btn" onClick={onToggleChat}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="split-chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.25">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <p>Ask anything about your data</p>
                    <div className="chat-chips">
                      {["Show top 5 by revenue", "Monthly trend analysis", "Compare categories"].map(q => (
                        <button key={q} className="chat-chip" onClick={() => onSend(q)}>{q}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ChatMessages messages={messages} streamingText={streamingText} onChipClick={onSend} />
                )}
              </div>

              <div className="split-chat-prompt">
                <PromptBar
                  onSend={onSend} isStreaming={isStreaming} wsStatus={wsStatus}
                  currentRoomId={currentRoomId} geminiKey={geminiKey}
                  backendRoomId={backendRoomId} onOpenKeyModal={onOpenKeyModal}
                  mode={mode} onModeToggle={onModeToggle}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}