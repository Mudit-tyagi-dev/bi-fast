import '../styles/sidebar.css';

const NAV = [
  { id: 'overview', label: 'Overview',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'revenue', label: 'Revenue',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { id: 'segments', label: 'Segments',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
  { id: 'forecasts', label: 'Forecasts',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
];

export default function Sidebar({
  rooms, currentRoomId, geminiKey, serverStatus,
  activeNav, onNavChange,
  onNewChat, onSwitchRoom, onDeleteRoom, onOpenKeyModal,
}) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <div className="logo-box">
          <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        <span className="logo-text">Pulse<em>BI</em></span>
        <span className={`srv-dot srv-${serverStatus}`} title={`Server: ${serverStatus}`} />
      </div>

      {/* Nav */}
      <div className="sb-label">Workspace</div>
      <nav className="sb-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-btn ${activeNav === n.id ? 'active' : ''}`}
            onClick={() => onNavChange(n.id)}
          >
            <span className="nav-ico">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {/* Chat list */}
      <div className="sb-label sb-chats-hd">
        <span>Saved</span>
        <button className="new-btn" onClick={onNewChat}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>
      </div>

      <div className="chat-list">
        {rooms.length === 0 && (
          <p className="chat-empty">No chats yet</p>
        )}
        {[...rooms].reverse().map(r => (
          <div
            key={r.id}
            className={`chat-row ${r.id === currentRoomId ? 'active' : ''}`}
            onClick={() => onSwitchRoom(r.id)}
          >
            <svg className="chat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span className="chat-name">{r.name}</span>
            <button
              className="del-btn"
              title="Delete"
              onClick={e => { e.stopPropagation(); onDeleteRoom(r.id); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sb-footer">
        <div className="user-chip">
          <div className="user-av">CX</div>
          <div className="user-info">
            <div className="user-name">CXO View</div>
            <div className="user-role">Executive</div>
          </div>
          <button className="gear-btn" onClick={onOpenKeyModal} title="API Key">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>
        <div className="key-row">
          <span className={`key-dot ${geminiKey ? 'key-set' : 'key-unset'}`} />
          <span className="key-text">{geminiKey ? 'Gemini key active' : 'No API key set'}</span>
        </div>
      </div>
    </aside>
  );
}
