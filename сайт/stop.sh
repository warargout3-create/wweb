#!/bin/bash
# Образовательная платформа — остановка сервера

cd "$(dirname "$0")"

PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2)
PORT=${PORT:-3000}

if command -v lsof &>/dev/null; then
  PID=$(lsof -t -i ":$PORT" 2>/dev/null)
elif command -v fuser &>/dev/null; then
  PID=$(fuser "$PORT/tcp" 2>/dev/null)
fi

if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null
  echo "✅ Сервер остановлен (PID $PID, порт $PORT)"
else
  echo "ℹ️  Сервер на порту $PORT не запущен"
fi
