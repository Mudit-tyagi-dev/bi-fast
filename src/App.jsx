import { useState } from 'react';
import './styles/global.css';
import './styles/app.css';
import { useDashboard } from './hooks/useDashboard';
import { WS_STATUS } from './utils/socket';
import Sidebar from './components/Sidebar';
import ChatMessages from './components/ChatMessages';
import PromptBar from './components/PromptBar';
import GeminiKeyModal from './components/GeminiKeyModal';

export default function App() {
  const {
    rooms, currentRoomId, messages,
    geminiKey, serverStatus, wsStatus, streamingText,
    showKeyModal, setShowKeyModal,
    saveGeminiKey, switchRoom, newChat, removeRoom, sendMessage,
  } = useDashboard();

  const [activeNav, setActiveNav] = useState('overview');
  const isStreaming = streamingText !== null;

  function handleExport() {
    if (!messages.length) { alert('No messages to export.'); return; }
    const txt = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = `pulsebi-${currentRoomId || 'chat'}.txt`;
    a.click();
  }

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
      />

      <div className="main">
        <div className="topbar">
          <div className="tb-left">
            <span className="tb-tag">AI-Powered Insights</span>
            <div className="live-pill">
              <span className="live-dot" />
              LIVE
            </div>
          </div>
          <div className="tb-right">
            <button className="tb-btn" onClick={handleExport}>Export</button>
            <button className="tb-btn key" onClick={() => setShowKeyModal(true)}>API Key</button>
          </div>
        </div>

        <div className="chat-panel">
          <ChatMessages
            messages={messages}
            streamingText={streamingText}
            onChipClick={sendMessage}
          />
          <PromptBar
            onSend={sendMessage}
            isStreaming={isStreaming}
            wsStatus={wsStatus}
            currentRoomId={currentRoomId}
            geminiKey={geminiKey}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
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
