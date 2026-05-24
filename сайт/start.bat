@echo off
title Образовательная платформа - Сервер
cd /d "%~dp0"

echo ============================================
echo   Образовательная платформа
echo   Запуск сервера...
echo ============================================
echo.

:: Останавливаем старые процессы
 echo [0/1] Останавливаю старые процессы...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo [1/1] Запускаю сервер...
start /B node server.js > server.log 2>&1
timeout /t 4 /nobreak > nul

echo   [+] Сервер запущен!
echo   [+] Откройте в браузере: http://localhost:3000
echo.
echo ============================================
echo   Не закрывайте это окно — сервер работает!
echo   Чтобы остановить: нажмите Ctrl+C
echo   или запустите stop_server.bat
echo ============================================
echo.

:: Открываем браузер
start http://localhost:3000

:wait
timeout /t 30 /nobreak > nul
goto wait
