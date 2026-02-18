# NaviAI - AI Assistant for Elderly Users

[Leia em Portugues](README.pt-BR.md)

NaviAI is a voice-first Progressive Web App (PWA) designed to help elderly people interact with AI through voice, camera, and simple touch interfaces.

## Features

- **Voice-first interaction** - Tap the microphone and speak naturally; NaviAI listens and responds with audio
- **Camera analysis** - Point the camera at screens, documents, or objects for AI-powered visual descriptions
- **Accessibility mode** - Adjustable font size, high contrast, voice speed, larger buttons
- **Narrated onboarding** - Step-by-step account creation with voice narration
- **Knowledge base (RAG)** - Curated how-to guides for common tasks (Pix, WhatsApp, etc.)
- **Trusted video suggestions** - Whitelisted YouTube videos from verified channels
- **Multi-language** - Full support for Portuguese (pt-BR) and English (en)
- **Sensitive data detection** - Alerts users when images or conversations contain passwords, card numbers, etc.

## Architecture

```
NaviAI/
├── frontend/          # Next.js 14 + TypeScript + Tailwind CSS + next-intl
├── backend/           # FastAPI + SQLAlchemy + SQLite + JWT auth
├── docker-compose.yml # Docker orchestration
└── setup.sh           # Dev setup & control script
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, next-intl |
| Backend | FastAPI, SQLAlchemy (async), SQLite, Pydantic |
| LLM | Anthropic Claude / OpenAI GPT / Ollama (local) |
| STT/TTS | Web Speech API (primary) + Whisper & edge-tts (server fallback) |
| RAG | SQLite FTS5 full-text search |
| Auth | JWT + bcrypt, Google OAuth, dev session |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) (optional, for local models)

### 1. Clone & configure

```bash
git clone https://github.com/CyberSecurityUP/NaviAI.git
cd NaviAI
cp .env.example .env
# Edit .env with your API keys (or use Ollama for free local models)
```

### 2. Using the setup script

```bash
chmod +x setup.sh

# Install all dependencies
./setup.sh install

# Start backend + frontend
./setup.sh start

# Check status
./setup.sh status

# Stop everything
./setup.sh stop
```

### 3. Manual setup

**Backend:**
```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .
cp ../.env.example .env  # Edit with your settings
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Using Docker

```bash
# Start all services
docker-compose up -d

# Start only the vision model container
docker-compose up -d ollama-vision
```

### 5. Ollama (local models)

```bash
# Install chat model
ollama pull llama3.2

# Install vision model (or use Docker)
ollama pull llava

# Set LLM_PROVIDER=ollama in your .env
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | Refresh token pair |
| GET | `/api/v1/auth/me` | Current user profile |
| PATCH | `/api/v1/auth/me/accessibility` | Update accessibility settings |
| POST | `/api/v1/chat` | Send message to AI |
| POST | `/api/v1/vision/analyze` | Analyze image with AI |
| GET | `/api/v1/knowledge/search?q=` | Search knowledge base |
| GET | `/api/v1/videos/search?q=` | Search trusted videos |
| POST | `/api/v1/stt/transcribe` | Speech-to-text (server fallback) |
| POST | `/api/v1/tts/synthesize` | Text-to-speech (server fallback) |
| POST | `/api/v1/auth/dev-session` | Dev quick-login (DEV_MODE only) |
| GET | `/api/v1/auth/oauth/google` | Google OAuth URL |
| POST | `/api/v1/auth/oauth/google/callback` | Google OAuth callback |

## Environment Variables

See [`.env.example`](.env.example) for all available configuration options.

Key settings:
- `LLM_PROVIDER` - `anthropic`, `openai`, or `ollama`
- `OLLAMA_BASE_URL` - Ollama server for chat (default: `http://localhost:11434`)
- `OLLAMA_VISION_BASE_URL` - Ollama server for vision (default: `http://localhost:11435`)
- `DEV_MODE` - Enable dev session endpoint for testing
- `SECRET_KEY` - JWT signing key (change in production!)

## Internationalization

NaviAI supports **Portuguese (pt-BR)** and **English (en)**:

- Frontend: `next-intl` with locale in URL path (`/en/...` or default `/...` for pt-BR)
- Backend: `locale` parameter in chat/vision API requests selects the LLM system prompt language
- Access English UI at: `http://localhost:3000/en`

## License

MIT
