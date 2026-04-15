import { useState, useRef, useEffect } from "react";
import "../styles/sidebar.css";

const NAV = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "database",
    label: "Database",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

function ChatRow({ r, currentRoomId, onSwitchRoom, onDeleteRoom, onRenameRoom, onPinRoom }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(r.name);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleRename(e) {
    e.preventDefault();
    if (renameVal.trim()) onRenameRoom(r.id, renameVal.trim());
    setRenaming(false);
    setMenuOpen(false);
  }

  return (
    <div
      className={`chat-row ${r.id === currentRoomId ? "active" : ""} ${r.pinned ? "pinned" : ""}`}
      onClick={() => !renaming && onSwitchRoom(r.id)}
    >
      {r.pinned && (
        <svg className="pin-ico" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.4L21 10l-4.8 4.4 1.4 6.6L12 18l-5.6 3 1.4-6.6L3 10l6.6-1.6z" />
        </svg>
      )}
      <svg className="chat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>

      {renaming ? (
        <form onSubmit={handleRename} style={{ flex: 1 }} onClick={(e) => e.stopPropagation()}>
          <input
            className="rename-input"
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={handleRename}
            autoFocus
          />
        </form>
      ) : (
        <span className="chat-name">{r.name?.trim() || "New Dashboard"}</span>
      )}

      <div className="chat-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button className="dots-btn" onClick={() => setMenuOpen((prev) => !prev)} title="Options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
        {menuOpen && (
          <div className="chat-dropdown">
            <button className="dd-item" onClick={() => { setRenaming(true); setMenuOpen(false); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Rename
            </button>
            <button className="dd-item" onClick={() => { onPinRoom(r.id); setMenuOpen(false); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l2.4 6.4L21 10l-4.8 4.4 1.4 6.6L12 18l-5.6 3 1.4-6.6L3 10l6.6-1.6z" />
              </svg>
              {r.pinned ? "Unpin" : "Pin"}
            </button>
            <div className="dd-divider" />
            <button className="dd-item dd-danger" onClick={() => { onDeleteRoom(r.id); setMenuOpen(false); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({
  rooms, currentRoomId, serverStatus,
  activeNav, onNavChange,
  onNewChat, onSwitchRoom, onDeleteRoom, onOpenKeyModal,
  onRenameRoom, onPinRoom, isCreatingRoom,
}) {
  // console.log("Sidebar render, rooms count:", rooms.length);
  const [collapsed, setCollapsed] = useState(false);
  const sortedRooms = [...rooms].reverse().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sb-logo">
        <div className="logo-box">
          <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        {!collapsed && <span className="logo-text">Pulse<em>BI</em></span>}
        {!collapsed && (
          <div className="srv-status" title={`Server: ${serverStatus}`}>
            <span className={`srv-dot srv-${serverStatus}`} />
            <span className="srv-label">
              {serverStatus === "ok" ? "Live" : serverStatus === "error" ? "Offline" : "..."}
            </span>
          </div>
        )}
        <button
          className="drawer-toggle-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            {collapsed ? <polyline points="13 9 17 12 13 15" /> : <polyline points="15 9 11 12 15 15" />}
          </svg>
        </button>
      </div>

      {!collapsed && <div className="sb-label">Workspace</div>}
      <nav className="sb-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-btn ${activeNav === n.id ? "active" : ""} ${collapsed ? "nav-btn-icon-only" : ""}`}
            onClick={() => onNavChange(n.id)}
            title={collapsed ? n.label : ""}
          >
            <span className="nav-ico">{n.icon}</span>
            {!collapsed && n.label}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <>
          <div className="sb-label sb-chats-hd">
            <span>Dashboards</span>
            <button
              className={`new-btn ${isCreatingRoom ? "new-btn-loading" : ""}`}
              onClick={() => {  onNewChat(); }}
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? (
                <><span className="new-btn-spinner" />Creating…</>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Dashboard
                </>
              )}
            </button>
          </div>
          <div className="chat-list">
            {rooms.length === 0 && <p className="chat-empty">No dashboards yet</p>}
            {sortedRooms.map((r) => (
              <ChatRow
                key={r.id} r={r}
                currentRoomId={currentRoomId}
                onSwitchRoom={onSwitchRoom}
                onDeleteRoom={onDeleteRoom}
                onRenameRoom={onRenameRoom}
                onPinRoom={onPinRoom}
              />
            ))}
          </div>
        </>
      )}

      {collapsed && (
        <button className="new-btn-icon" onClick={onNewChat} disabled={isCreatingRoom} title="New Dashboard">
          {isCreatingRoom
            ? <span className="new-btn-spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "var(--accent2)" }} />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
          }
        </button>
      )}

      <div className="sb-footer">
        <div className={`user-chip ${collapsed ? "user-chip-mini" : ""}`}>
          <div className="user-av">CX</div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">CXO View</div>
              <div className="user-role">Executive</div>
            </div>
          )}
          <button className="gear-btn" onClick={onOpenKeyModal} title="API Key">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}