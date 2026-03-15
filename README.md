# PulseBI — WebSocket Edition

Real-time AI BI chat over WebSockets with token streaming.

---

## Quick start

```bash
npm install
cp .env.example .env   # adjust URLs if needed
npm run dev
# → http://localhost:5173
```

---

## How the connection works

```
Browser                          FastAPI (localhost:8000)
  │                                       │
  │── GET /              ────────────────▶│  Health check (REST)
  │◀─ 200 OK             ─────────────────│  green dot in sidebar
  │                                       │
  │── POST /config/rooms/{id} ──────────▶│  Send Gemini key (REST)
  │   body: { gemini_api_key: "AIza…" }  │
  │◀─ 200 OK             ─────────────────│  room is configured
  │                                       │
  │── WS  /ws/{room_id}  ────────────────▶│  Open WebSocket
  │◀─ WS connected       ─────────────────│  green "Connected" pill
  │                                       │
  │── { type:"message", content:"…" } ──▶│  User sends query
  │◀─ { type:"token",   content:"tok" }──│  streaming token  ×N
  │◀─ { type:"done"                   }──│  stream complete
  │                                       │
  │   (on error)                          │
  │◀─ { type:"error",   content:"…"   }──│  error bubble shown
```

---

## Backend: what you need to add to FastAPI

### 1. CORS (allow browser requests)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # your frontend origin
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. WebSocket chat endpoint

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str):
    await websocket.accept()
    try:
        while True:
            # Receive user message
            data = await websocket.receive_json()
            # data = { "type": "message", "content": "user text here" }
            user_text = data.get("content", "")

            # --- STREAMING RESPONSE (recommended) ---
            # Send each token as it arrives from Gemini
            async for token in your_gemini_stream(room_id, user_text):
                await websocket.send_json({
                    "type": "token",
                    "content": token
                })
            # Signal end of stream
            await websocket.send_json({"type": "done"})

            # --- NON-STREAMING (simpler, no live typing effect) ---
            # reply = await your_gemini_call(room_id, user_text)
            # await websocket.send_json({"type": "message", "content": reply})

    except WebSocketDisconnect:
        pass   # client disconnected cleanly
    except Exception as e:
        await websocket.send_json({"type": "error", "content": str(e)})
```

### 3. Message types summary

| Direction | type | Meaning |
|-----------|------|---------|
| client → server | `message` | user query text |
| server → client | `token` | one streamed chunk from Gemini |
| server → client | `done` | stream finished, commit message |
| server → client | `message` | full reply at once (non-streaming) |
| server → client | `error` | show error bubble in UI |

---

## localStorage keys

| Key | Value |
|-----|-------|
| `bi_gemini_api_key` | Gemini API key string |
| `bi_rooms` | JSON array of all chat rooms + messages |
| `bi_last_room_id` | Last active room — restored on page refresh |

---

## File structure

```
src/
  api/
    backend.js          ← REST: GET /, POST+GET /config/rooms/{id}
  components/
    Sidebar.jsx         ← nav, chat list, new chat, user footer
    ChatMessages.jsx    ← bubbles, live streaming, empty state
    PromptBar.jsx       ← textarea, WS status pill, send button
    GeminiKeyModal.jsx  ← API key entry modal
  hooks/
    useDashboard.js     ← all state + room management
    useWebSocket.js     ← WS lifecycle, token streaming → state
  styles/               ← one CSS file per component
  utils/
    socket.js           ← raw WebSocket wrapper (auto-reconnect, queue)
    chatStorage.js      ← localStorage CRUD helpers
  App.jsx
  main.jsx
```

---

## Auto-reconnect behaviour

`socket.js` retries on unexpected close with delays: 1s → 2s → 4s → 8s (capped).  
Messages sent while disconnected are queued and flushed when the socket reopens.  
The status pill in the prompt bar shows: **Connected** / **Connecting…** / **Disconnected** / **WS Error**.
