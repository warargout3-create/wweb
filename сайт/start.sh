#!/bin/bash
# Образовательная платформа — запуск сервера (Linux / macOS)

# Переходим в папку скрипта (чтобы работало из любого места)
cd "$(dirname "$0")"

# ── 1. Проверяем Node.js ──────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌ Node.js не установлен!"
  echo "   Скачайте с сайта: https://nodejs.org"
  exit 1
fi

echo "✅ Node.js $(node -v)"

# ── 2. Создаём .env если его нет ─────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Создан .env из .env.example"
  else
    echo "JWT_SECRET=teacher-platform-secret-key-2026" > .env
    echo "PORT=3000" >> .env
    echo "✅ Создан .env с настройками по умолчанию"
  fi
fi

# ── 3. Устанавливаем зависимости если нужно ───────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "📦 Устанавливаю зависимости (npm install)..."
  npm install
  echo ""
fi

# ── 4. Освобождаем порт если занят ───────────────────────────────────────────
PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2)
PORT=${PORT:-3000}

if command -v lsof &>/dev/null; then
  OLD_PID=$(lsof -t -i ":$PORT" 2>/dev/null)
  if [ -n "$OLD_PID" ]; then
    echo "⚠️  Порт $PORT занят (PID $OLD_PID). Останавливаю..."
    kill "$OLD_PID" 2>/dev/null
    sleep 1
  fi
elif command -v fuser &>/dev/null; then
  fuser -k "$PORT/tcp" 2>/dev/null && sleep 1
fi

# ── 5. Запускаем сервер ───────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  🚀 Запуск образовательной платформы"
echo "  🌐 Адрес: http://localhost:$PORT"
echo "  ⛔  Остановить: Ctrl+C или ./stop.sh"
echo "================================================"
echo ""

node server.js
