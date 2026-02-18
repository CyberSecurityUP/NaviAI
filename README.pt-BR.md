# NaviAI - Assistente de IA para Idosos

[Read in English](README.md)

NaviAI e um Progressive Web App (PWA) com foco em voz, projetado para ajudar pessoas idosas a interagir com IA atraves de voz, camera e interfaces simples de toque.

## Funcionalidades

- **Interacao por voz** - Toque no microfone e fale naturalmente; o NaviAI ouve e responde com audio
- **Analise por camera** - Aponte a camera para telas, documentos ou objetos para descricoes visuais com IA
- **Modo acessibilidade** - Tamanho de fonte ajustavel, alto contraste, velocidade da voz, botoes maiores
- **Onboarding narrado** - Criacao de conta passo a passo com narracao por voz
- **Base de conhecimento (RAG)** - Guias como-fazer curados para tarefas comuns (Pix, WhatsApp, etc.)
- **Sugestoes de videos confiaveis** - Videos do YouTube de canais verificados
- **Multi-idioma** - Suporte completo para Portugues (pt-BR) e Ingles (en)
- **Deteccao de dados sensiveis** - Alerta os usuarios quando imagens ou conversas contem senhas, numeros de cartao, etc.

## Arquitetura

```
NaviAI/
├── frontend/          # Next.js 14 + TypeScript + Tailwind CSS + next-intl
├── backend/           # FastAPI + SQLAlchemy + SQLite + JWT auth
├── docker-compose.yml # Orquestracao Docker
└── setup.sh           # Script de setup e controle
```

### Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, next-intl |
| Backend | FastAPI, SQLAlchemy (async), SQLite, Pydantic |
| LLM | Anthropic Claude / OpenAI GPT / Ollama (local) |
| STT/TTS | Web Speech API (primario) + Whisper & edge-tts (fallback servidor) |
| RAG | SQLite FTS5 busca full-text |
| Auth | JWT + bcrypt, Google OAuth, sessao de desenvolvimento |

## Inicio Rapido

### Pre-requisitos

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) (opcional, para modelos locais)

### 1. Clonar e configurar

```bash
git clone https://github.com/CyberSecurityUP/NaviAI.git
cd NaviAI
cp .env.example .env
# Edite o .env com suas chaves de API (ou use Ollama para modelos locais gratuitos)
```

### 2. Usando o script de setup

```bash
chmod +x setup.sh

# Instalar todas as dependencias
./setup.sh install

# Iniciar backend + frontend
./setup.sh start

# Verificar status
./setup.sh status

# Parar tudo
./setup.sh stop
```

### 3. Setup manual

**Backend:**
```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .
cp ../.env.example .env  # Edite com suas configuracoes
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Usando Docker

```bash
# Iniciar todos os servicos
docker-compose up -d

# Iniciar apenas o container de modelo de visao
docker-compose up -d ollama-vision
```

### 5. Ollama (modelos locais)

```bash
# Instalar modelo de chat
ollama pull llama3.2

# Instalar modelo de visao (ou usar Docker)
ollama pull llava

# Defina LLM_PROVIDER=ollama no seu .env
```

## Endpoints da API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/auth/register` | Criar conta |
| POST | `/api/v1/auth/login` | Login (retorna JWT) |
| POST | `/api/v1/auth/refresh` | Renovar par de tokens |
| GET | `/api/v1/auth/me` | Perfil do usuario atual |
| PATCH | `/api/v1/auth/me/accessibility` | Atualizar config. de acessibilidade |
| POST | `/api/v1/chat` | Enviar mensagem para IA |
| POST | `/api/v1/vision/analyze` | Analisar imagem com IA |
| GET | `/api/v1/knowledge/search?q=` | Buscar na base de conhecimento |
| GET | `/api/v1/videos/search?q=` | Buscar videos confiaveis |
| POST | `/api/v1/stt/transcribe` | Fala-para-texto (fallback servidor) |
| POST | `/api/v1/tts/synthesize` | Texto-para-fala (fallback servidor) |
| POST | `/api/v1/auth/dev-session` | Login rapido dev (somente DEV_MODE) |
| GET | `/api/v1/auth/oauth/google` | URL do Google OAuth |
| POST | `/api/v1/auth/oauth/google/callback` | Callback do Google OAuth |

## Variaveis de Ambiente

Veja [`.env.example`](.env.example) para todas as opcoes de configuracao.

Configuracoes principais:
- `LLM_PROVIDER` - `anthropic`, `openai` ou `ollama`
- `OLLAMA_BASE_URL` - Servidor Ollama para chat (padrao: `http://localhost:11434`)
- `OLLAMA_VISION_BASE_URL` - Servidor Ollama para visao (padrao: `http://localhost:11435`)
- `DEV_MODE` - Habilitar endpoint de sessao dev para testes
- `SECRET_KEY` - Chave de assinatura JWT (altere em producao!)

## Internacionalizacao

NaviAI suporta **Portugues (pt-BR)** e **Ingles (en)**:

- Frontend: `next-intl` com locale no caminho da URL (`/en/...` ou padrao `/...` para pt-BR)
- Backend: parametro `locale` nas requisicoes de chat/visao seleciona o idioma do prompt do LLM
- Acessar UI em ingles: `http://localhost:3000/en`

## Licenca

MIT
