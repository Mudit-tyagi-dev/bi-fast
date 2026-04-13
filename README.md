# PulseBI

PulseBI is an AI-powered business intelligence dashboard that transforms raw CSV data into interactive charts and insights — using plain English. No SQL, no complex configuration. Just upload your data, ask a question, and get a visual answer in real time.

Built with React 18 and powered by the Google Gemini API over a live WebSocket connection, PulseBI is designed for analysts, founders, and teams who need fast answers from their data without writing a single query.

🔗 Live Demo: [bi-fast.vercel.app](https://bi-fast.vercel.app/)
📦 Repository: [github.com/Mudit-tyagi-dev/bi-fast](https://github.com/Mudit-tyagi-dev/bi-fast)

---

## Features

- Natural Language Querying — Ask questions like *"top 5 categories by total views"* and get instant visual results
- Live Chart Generation — Automatically renders Bar, Line, Pie, and Donut charts from your queries
- Dual Prompt Modes — Switch between `Query` mode for data insights and `Chart` mode for focused visualizations
- KPI Summary Cards — Top ranked metrics are surfaced as numbered cards above every chart
- Share Distribution View — Every chart includes a proportional donut chart for at-a-glance breakdowns
- Real-time Streaming — AI responses stream live over WebSocket for a fast, interactive feel
- Conversation History — Sessions are saved as named rooms; switch between past chats from the sidebar
- CSV Upload — Upload your own dataset directly from the prompt bar
- Export — Download the full conversation as a `.txt` file
- Gemini API Key Management — Add or update your key anytime via the in-app modal

---

## Tech Stack
Framework :React 18 + Vite 5 
Charts : Chart.js 4 + react-chartjs-2 
Icons : Lucide React 
Styling : Plain CSS (global + component-level) 
AI Model : Google Gemini API
Realtime : WebSocket 
Deployment : Vercel 

---

## Project Structure

```
bi-fast-ws/
├── public/
│   └── fav.png
├── src/
│   ├── api/
│   │   └── backend.js           # API calls to backend server
│   ├── components/
│   │   ├── ChatMessages.jsx     # Right drawer — full conversation with AI
│   │   ├── ChatTab.jsx          # Chat tab view
│   │   ├── dashboard.jsx        # KPI cards + Bar/Line/Pie/Donut chart renderer
│   │   ├── HomeTab.jsx          # Home/landing tab view
│   │   ├── PromptBar.jsx        # Input bar with mode toggle and CSV upload
│   │   ├── SettingsModal.jsx    # Settings configuration modal
│   │   ├── Sidebar.jsx          # Workspace nav, saved rooms, new chat
│   │   └── WelcomeScreen.jsx    # Onboarding / empty state screen
│   ├── hooks/
│   │   ├── useDashboard.js      # Core logic — rooms, messages, streaming
│   │   └── useWebSocket.js      # WebSocket connection management
│   ├── styles/
│   │   ├── app.css
│   │   ├── chatmessages.css
│   │   ├── chatTab.css
│   │   ├── dashboard.css
│   │   ├── gemini.css
│   │   ├── global.css
│   │   ├── promptBar.css
│   │   ├── sidebar.css
│   │   └── welcomeScreen.css
│   ├── utils/
│   │   ├── chatStorage.js       # Local storage helpers for chat history
│   │   └── socket.js            # WebSocket instance / config
│   ├── App.jsx                  # Root layout — panels, drawers, state wiring
│   └── main.jsx                 # React entry point
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A running **PulseBI backend** server (WebSocket + Gemini query handler)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Mudit-tyagi-dev/bi-fast.git
cd bi-fast

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Start the development server
npm run dev
```

The app will be running at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

### Environment Variables

```env
# .env
VITE_WS_URL=your_websocket_server_url
```

---

## Usage

1. Open the app and click **API Key** in the top-right to add your Gemini key
2. Upload a CSV file using the 📄 icon in the prompt bar
3. Type a question — e.g. *"show top 5 categories by total views"*
4. Toggle to **Chart Mode** for chart-specific queries
5. Switch chart types using the **Bar / Line / Pie / Donut** buttons
6. Open the **Conversation** drawer to view full AI responses and session history
7. Click **Export** to download the session as a `.txt` file

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.
