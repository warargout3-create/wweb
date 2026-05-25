#!/bin/bash
# Образовательная платформа — запуск в интернет (Linux / macOS)

cd "$(dirname "$0")"

echo "============================================"
echo "  Образовательная платформа"
echo "  Запуск в общий доступ через ngrok"
echo "============================================"
echo ""

# ── 1. Останавливаем старые процессы ─────────────────────────────────────────
echo "[1/5] Останавливаю старые процессы..."
pkill -f "node server.js" 2>/dev/null
pkill -f "ngrok" 2>/dev/null
sleep 1

# ── 2. Проверяем Node.js ──────────────────────────────────────────────────────
echo "[2/5] Проверяю Node.js..."
if ! command -v node &>/dev/null; then
  echo ""
  echo "  ОШИБКА: Node.js не установлен!"
  echo "  Скачайте с сайта: https://nodejs.org"
  echo ""
  exit 1
fi
echo "  OK ($(node -v))"

# ── 3. Устанавливаем зависимости если нужно ───────────────────────────────────
echo "[3/5] Проверяю зависимости..."
if [ ! -d "node_modules" ]; then
  echo "  Устанавливаю зависимости (npm install)..."
  npm install || { echo "ОШИБКА при установке зависимостей."; exit 1; }
fi
echo "  OK"

# ── 4. Скачиваем и настраиваем ngrok ─────────────────────────────────────────
echo "[4/5] Проверяю ngrok..."

if ! command -v ngrok &>/dev/null && [ ! -f "./ngrok" ]; then
  echo "  Скачиваю ngrok..."
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)

  if [ "$OS" = "darwin" ]; then
    if [ "$ARCH" = "arm64" ]; then
      NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.tgz"
    else
      NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.tgz"
    fi
  else
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
      NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz"
    else
      NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"
    fi
  fi

  curl -s -L "$NGROK_URL" -o /tmp/ngrok.tgz || { echo "ОШИБКА: не удалось скачать ngrok."; exit 1; }
  tar -xzf /tmp/ngrok.tgz -C . ngrok 2>/dev/null || tar -xzf /tmp/ngrok.tgz -C /tmp && cp /tmp/ngrok .
  chmod +x ./ngrok
  rm -f /tmp/ngrok.tgz
  echo "  ngrok скачан"
fi

NGROK_BIN="ngrok"
if [ -f "./ngrok" ]; then NGROK_BIN="./ngrok"; fi

# Настраиваем токен
$NGROK_BIN config add-authtoken 3EBXw1OyZ84K3AEFJYZzVzwZ8c8_UqcYPynneFQdAbXEPVsq 2>/dev/null
echo "  OK"

# ── 5. Создаём .env если нет ─────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env 2>/dev/null || {
    echo "JWT_SECRET=teacher-platform-secret-key-2026" > .env
    echo "PORT=3000" >> .env
  }
fi

PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2)
PORT=${PORT:-3000}

# ── 6. Запускаем сервер ───────────────────────────────────────────────────────
echo "[5/5] Запускаю сервер..."
rm -f server.log server-error.log
node server.js > server.log 2>server-error.log &
SERVER_PID=$!

echo "  Ожидаю запуска на порту $PORT..."
WAITED=0
while true; do
  sleep 2
  WAITED=$((WAITED + 2))
  # проверяем процесс
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo ""
    echo "  ОШИБКА: сервер упал. Содержимое server-error.log:"
    cat server-error.log 2>/dev/null
    exit 1
  fi
  # проверяем что порт слушается
  if command -v ss &>/dev/null; then
    ss -tln 2>/dev/null | grep -q ":$PORT " && break
  elif command -v netstat &>/dev/null; then
    netstat -tln 2>/dev/null | grep -q ":$PORT " && break
  else
    # fallback: просто ждём
    [ $WAITED -ge 6 ] && break
  fi
  if [ $WAITED -ge 30 ]; then
    echo ""
    echo "  ОШИБКА: сервер не запустился за 30 секунд. Смотрите server-error.log"
    cat server-error.log 2>/dev/null
    exit 1
  fi
done
echo "  Сервер запущен!"

echo ""
echo "============================================"
echo "  Сервер запущен на http://localhost:$PORT"
echo ""
echo "  Войти как преподаватель:"
echo "    Email:  warargoutr@gmail.com"
echo "    Пароль: 123456"
echo ""
echo "  Запускаю ngrok туннель..."
echo "  Дождитесь строки с адресом:"
echo "    Forwarding   https://XXXXX.ngrok-free.app -> ..."
echo ""
echo "  Для остановки: Ctrl+C  затем  ./stop.sh"
echo "============================================"
echo ""

# ── 7. Запускаем ngrok ────────────────────────────────────────────────────────
$NGROK_BIN http "127.0.0.1:$PORT"
