@echo off
title Образовательная платформа — Запуск в интернет
cd /d "%~dp0"
chcp 65001 > nul 2>&1

echo ============================================
echo   Образовательная платформа
echo   Запуск в общий доступ через ngrok
echo ============================================
echo.

:: ── 1. Останавливаем старые процессы ────────────────────────────────────────
echo [1/5] Останавливаю старые процессы...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM ngrok.exe 2>nul
timeout /t 2 /nobreak > nul

:: ── 2. Проверяем Node.js ─────────────────────────────────────────────────────
echo [2/5] Проверяю Node.js...
node -v > nul 2>&1
if errorlevel 1 (
    echo.
    echo   ОШИБКА: Node.js не установлен!
    echo   Скачайте с сайта: https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo     OK

:: ── 3. Устанавливаем зависимости если нужно ──────────────────────────────────
if not exist "node_modules" (
    echo [3/5] Устанавливаю зависимости...
    npm install
    if errorlevel 1 (
        echo   ОШИБКА при установке зависимостей.
        pause
        exit /b 1
    )
) else (
    echo [3/5] Зависимости OK
)

:: ── 4. Скачиваем ngrok если его нет ──────────────────────────────────────────
echo [4/5] Проверяю ngrok...
if not exist "ngrok.exe" (
    echo     Скачиваю ngrok для Windows...
    curl -s -L -o ngrok.zip "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    if errorlevel 1 (
        echo     ОШИБКА: не удалось скачать ngrok. Проверьте интернет.
        pause
        exit /b 1
    )
    powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force" > nul 2>&1
    del ngrok.zip 2>nul
    echo     ngrok скачан
)
echo     OK

:: ── 5. Настраиваем ngrok ─────────────────────────────────────────────────────
ngrok.exe config add-authtoken 3EBXw1OyZ84K3AEFJYZzVzwZ8c8_UqcYPynneFQdAbXEPVsq > nul 2>&1

:: ── 6. Создаём .env если его нет ─────────────────────────────────────────────
if not exist ".env" (
    copy ".env.example" ".env" > nul 2>&1
    if errorlevel 1 (
        echo JWT_SECRET=teacher-platform-secret-key-2026> .env
        echo PORT=3000>> .env
    )
)

:: ── 7. Запускаем сервер ───────────────────────────────────────────────────────
echo [5/5] Запускаю сервер...
start /B node server.js > server.log 2>server-error.log
timeout /t 4 /nobreak > nul

:: ── 8. Запускаем ngrok в отдельном окне ─────────────────────────────────────
echo.
echo ============================================
echo   Сервер запущен. Запускаю ngrok...
echo   Дождитесь появления публичного адреса!
echo ============================================
echo.
echo   Локальный адрес:   http://localhost:3000
echo.
echo   Войти как преподаватель:
echo     Email:    warargoutr@gmail.com
echo     Пароль:   123456
echo.
echo   Для остановки — запустите stop_server.bat
echo ============================================
echo.

ngrok.exe http 3000
