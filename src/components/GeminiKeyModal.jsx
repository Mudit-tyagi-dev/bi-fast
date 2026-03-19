import { useState } from 'react';
import '../styles/gemni.css';

export default function GeminiKeyModal({ currentKey, onSave, onClose }) {
  const [val, setVal] = useState(currentKey || '');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const k = val.trim();
    if (!k) { setErr('Please enter your Gemini API key.'); return; }
    if (!k.startsWith('AIza')) { setErr('Key should start with "AIza…"'); return; }
    setSaving(true); setErr('');
    try { await onSave(k); }
    catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && currentKey && onClose()}>
      <div className="modal-box">
        <div className="modal-hd">
          <div className="modal-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
          </div>
          <div>
            <h2 className="modal-title">Connect Gemini API</h2>
            <p className="modal-sub">Your key is saved locally and sent to the backend to configure your chat room.</p>
          </div>
        </div>

        <label className="modal-label">Gemini API Key</label>
        <input
          type="password"
          className={`modal-input ${err ? 'has-err' : ''}`}
          placeholder="AIzaSy…"
          value={val}
          onChange={e => { setVal(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
          autoComplete="off"
        />
        {err && <p className="modal-err">{err}</p>}

        

        <div className="modal-actions">
          {currentKey && (
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
