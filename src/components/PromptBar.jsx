import { useState, useRef } from 'react';
import { WS_STATUS } from '../utils/socket';
import '../styles/promptBar.css';

const STATUS_LABEL = {
  [WS_STATUS.OPEN]:       { label: 'Connected',   cls: 'ws-open'       },
  [WS_STATUS.CONNECTING]: { label: 'Connecting…', cls: 'ws-connecting'  },
  [WS_STATUS.CLOSED]:     { label: 'Disconnected', cls: 'ws-closed'     },
  [WS_STATUS.ERROR]:      { label: 'WS Error',    cls: 'ws-error'       },
};

export default function PromptBar({
  onSend,
  isStreaming,
  wsStatus,
  currentRoomId,
  geminiKey,
  onOpenKeyModal,
}) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  const canSend = text.trim().length > 0 && !isStreaming && wsStatus === WS_STATUS.OPEN;

  function autoResize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  function handleSend() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    if (ref.current) ref.current.style.height = '';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const ws = STATUS_LABEL[wsStatus] || STATUS_LABEL[WS_STATUS.CLOSED];

  return (
    <div className="prompt-bar">
      <div className="prompt-row">
        {/* WS status pill */}
        <div className={`ws-pill ${ws.cls}`}>
          <span className="ws-dot" />
          {ws.label}
        </div>

        <div className={`prompt-wrap ${isStreaming ? 'streaming' : ''} ${wsStatus !== WS_STATUS.OPEN ? 'disconnected' : ''}`}>
          <textarea
            ref={ref}
            className="prompt-input"
            placeholder={
              wsStatus === WS_STATUS.OPEN
                ? 'Ask anything about your data…'
                : 'Waiting for connection…'
            }
            value={text}
            rows={1}
            disabled={isStreaming || wsStatus !== WS_STATUS.OPEN}
            onChange={e => { setText(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
          />
          <div className="prompt-actions">
            <div className="csv-tag" title="CSV loaded by backend">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              CSV
            </div>
          </div>
        </div>

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!canSend}
          title="Send (Enter)"
        >
          {isStreaming
            ? <span className="spin" />
            : (
              <svg viewBox="0 0 24 24" fill="white" width="17" height="17">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            )
          }
        </button>
      </div>

      <div className="prompt-footer">
        <span className="room-label">
          {currentRoomId
            ? <>Room: <span className="room-id">{currentRoomId}</span></>
            : 'No active room'
          }
        </span>
        {!geminiKey && (
          <button className="key-warn" onClick={onOpenKeyModal}>
            ⚠ Set Gemini API key
          </button>
        )}
      </div>
    </div>
  );
}
