#!/usr/bin/env bash
# ============================================================
# NaviAI — Script de Setup & Controle
# ============================================================
# Uso:
#   ./setup.sh              Instala tudo e sobe o projeto
#   ./setup.sh start        Sobe backend + frontend (local)
#   ./setup.sh stop         Para tudo (local + docker)
#   ./setup.sh docker       Sobe via Docker Compose
#   ./setup.sh docker-stop  Para e remove containers/volumes
#   ./setup.sh install      Apenas instala dependencias
#   ./setup.sh clean        Para tudo e limpa dados/cache
#   ./setup.sh status       Mostra o que esta rodando
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
ENV_FILE="$ROOT_DIR/.env"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[NaviAI]${NC} $1"; }
warn()  { echo -e "${YELLOW}[NaviAI]${NC} $1"; }
error() { echo -e "${RED}[NaviAI]${NC} $1"; }
info()  { echo -e "${BLUE}[NaviAI]${NC} $1"; }

# ── Helpers ─────────────────────────────────────────────────

check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    warn "Arquivo .env nao encontrado. Criando a partir do .env.example..."
    if [ -f "$ROOT_DIR/.env.example" ]; then
      cp "$ROOT_DIR/.env.example" "$ENV_FILE"
      warn "Edite o arquivo .env com suas chaves de API antes de usar!"
      warn "  $ENV_FILE"
    else
      error "Arquivo .env.example nao encontrado!"
      exit 1
    fi
  fi
}

find_python() {
  # Tenta encontrar Python 3.11+
  for cmd in python3.11 python3.12 python3 python; do
    if command -v "$cmd" &>/dev/null; then
      local ver
      ver=$("$cmd" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
      local major minor
      major=$(echo "$ver" | cut -d. -f1)
      minor=$(echo "$ver" | cut -d. -f2)
      if [ "$major" -ge 3 ] && [ "$minor" -ge 11 ]; then
        echo "$cmd"
        return 0
      fi
    fi
  done

  # Tenta homebrew
  if [ -x "/opt/homebrew/bin/python3.11" ]; then
    echo "/opt/homebrew/bin/python3.11"
    return 0
  fi

  error "Python 3.11+ nao encontrado! Instale antes de continuar."
  exit 1
}

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    warn "Matando processos na porta $port (PIDs: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

# ── Comandos ────────────────────────────────────────────────

do_install() {
  log "Instalando dependencias..."

  # Backend
  info "Configurando backend Python..."
  local py
  py=$(find_python)
  log "Usando Python: $py"

  if [ ! -d "$BACKEND_DIR/.venv" ]; then
    "$py" -m venv "$BACKEND_DIR/.venv"
    log "Virtualenv criado em $BACKEND_DIR/.venv"
  fi

  "$BACKEND_DIR/.venv/bin/pip" install --upgrade pip -q
  "$BACKEND_DIR/.venv/bin/pip" install -e "$BACKEND_DIR" -q
  log "Dependencias backend instaladas!"

  # Frontend
  info "Configurando frontend Node.js..."
  if ! command -v node &>/dev/null; then
    error "Node.js nao encontrado! Instale o Node.js 18+ antes."
    exit 1
  fi

  cd "$FRONTEND_DIR"
  npm install --silent 2>/dev/null
  cd "$ROOT_DIR"
  log "Dependencias frontend instaladas!"

  log "Instalacao concluida!"
}

do_start() {
  check_env
  log "Iniciando NaviAI..."

  # Mata processos antigos nas portas
  kill_port 8000
  kill_port 3000

  # Mata containers docker se estiverem rodando
  if command -v docker &>/dev/null; then
    docker compose -f "$ROOT_DIR/docker-compose.yml" down 2>/dev/null || true
  fi

  # Backend
  info "Iniciando backend na porta 8000..."
  cd "$BACKEND_DIR"
  .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
  BACKEND_PID=$!
  cd "$ROOT_DIR"

  # Frontend
  info "Iniciando frontend na porta 3000..."
  cd "$FRONTEND_DIR"
  npm run dev &
  FRONTEND_PID=$!
  cd "$ROOT_DIR"

  # Salva PIDs pra poder parar depois
  echo "$BACKEND_PID" > "$ROOT_DIR/.backend.pid"
  echo "$FRONTEND_PID" > "$ROOT_DIR/.frontend.pid"

  sleep 2
  echo ""
  log "============================================"
  log "  NaviAI rodando!"
  log "  Frontend: http://localhost:3000"
  log "  Backend:  http://localhost:8000"
  log "  API Docs: http://localhost:8000/docs"
  log "============================================"
  log "Use './setup.sh stop' para parar tudo."
  echo ""

  # Espera os processos
  wait
}

do_stop() {
  log "Parando NaviAI..."

  # Para processos locais via PID files
  for pidfile in "$ROOT_DIR/.backend.pid" "$ROOT_DIR/.frontend.pid"; do
    if [ -f "$pidfile" ]; then
      local pid
      pid=$(cat "$pidfile")
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        info "Processo $pid parado."
      fi
      rm -f "$pidfile"
    fi
  done

  # Mata qualquer coisa nas portas 8000 e 3000
  kill_port 8000
  kill_port 3000

  # Para containers Docker se existirem
  if command -v docker &>/dev/null; then
    docker compose -f "$ROOT_DIR/docker-compose.yml" down 2>/dev/null || true
  fi

  log "Tudo parado!"
}

do_docker() {
  check_env

  if ! command -v docker &>/dev/null; then
    error "Docker nao encontrado! Instale o Docker antes."
    exit 1
  fi

  log "Parando processos locais..."
  kill_port 8000
  kill_port 3000

  log "Subindo via Docker Compose..."
  cd "$ROOT_DIR"
  docker compose up --build -d

  sleep 3
  echo ""
  log "============================================"
  log "  NaviAI rodando via Docker!"
  log "  Frontend: http://localhost:3000"
  log "  Backend:  http://localhost:8000"
  log "  API Docs: http://localhost:8000/docs"
  log "============================================"
  log "Use './setup.sh docker-stop' para parar."
  echo ""
}

do_docker_stop() {
  log "Parando containers Docker..."

  if ! command -v docker &>/dev/null; then
    error "Docker nao encontrado!"
    exit 1
  fi

  cd "$ROOT_DIR"
  docker compose down -v --remove-orphans
  log "Containers e volumes removidos!"
}

do_clean() {
  log "Limpando tudo..."

  do_stop

  # Remove dados e cache
  rm -rf "$BACKEND_DIR/data/naviai.db" 2>/dev/null || true
  rm -rf "$FRONTEND_DIR/.next" 2>/dev/null || true
  rm -rf "$FRONTEND_DIR/node_modules/.cache" 2>/dev/null || true
  rm -f "$ROOT_DIR/.backend.pid" "$ROOT_DIR/.frontend.pid" 2>/dev/null || true

  # Remove containers e volumes docker
  if command -v docker &>/dev/null; then
    docker compose -f "$ROOT_DIR/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
  fi

  log "Tudo limpo! Use './setup.sh' para reinstalar."
}

do_status() {
  echo ""
  info "=== Status do NaviAI ==="
  echo ""

  # Portas
  for port in 8000 3000; do
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      log "Porta $port: ${GREEN}ativa${NC} (PIDs: $pids)"
    else
      warn "Porta $port: parada"
    fi
  done

  # Docker
  if command -v docker &>/dev/null; then
    local containers
    containers=$(docker compose -f "$ROOT_DIR/docker-compose.yml" ps -q 2>/dev/null || true)
    if [ -n "$containers" ]; then
      log "Docker: ${GREEN}rodando${NC}"
      docker compose -f "$ROOT_DIR/docker-compose.yml" ps 2>/dev/null
    else
      info "Docker: nenhum container NaviAI"
    fi
  fi

  # .env
  if [ -f "$ENV_FILE" ]; then
    log ".env: encontrado"
  else
    warn ".env: NAO encontrado"
  fi

  # venv
  if [ -d "$BACKEND_DIR/.venv" ]; then
    log "Backend venv: encontrado"
  else
    warn "Backend venv: NAO encontrado"
  fi

  # node_modules
  if [ -d "$FRONTEND_DIR/node_modules" ]; then
    log "Frontend node_modules: encontrado"
  else
    warn "Frontend node_modules: NAO encontrado"
  fi

  echo ""
}

# ── Main ────────────────────────────────────────────────────

case "${1:-}" in
  start)
    do_start
    ;;
  stop)
    do_stop
    ;;
  docker)
    do_docker
    ;;
  docker-stop)
    do_docker_stop
    ;;
  install)
    check_env
    do_install
    ;;
  clean)
    do_clean
    ;;
  status)
    do_status
    ;;
  "")
    # Default: instala e sobe
    check_env
    do_install
    do_start
    ;;
  *)
    echo ""
    echo "Uso: ./setup.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  (nenhum)     Instala tudo e inicia o projeto"
    echo "  start        Inicia backend + frontend (local)"
    echo "  stop         Para tudo (local + docker)"
    echo "  docker       Sobe via Docker Compose"
    echo "  docker-stop  Para e remove containers/volumes"
    echo "  install      Apenas instala dependencias"
    echo "  clean        Para tudo e limpa dados/cache"
    echo "  status       Mostra o que esta rodando"
    echo ""
    exit 1
    ;;
esac
