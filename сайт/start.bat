@echo off
title Obrazovatelnaya platforma - Server
cd /d "%~dp0"

echo ============================================
echo   Obrazovatelnaya platforma
echo   Zapusk servera...
echo ============================================
echo.

echo [1/3] Ostanovka staryh processov...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo [2/3] Proverka Node.js...
node -v > nul 2>&1
if errorlevel 1 (
    echo.
    echo   OSHIBKA: Node.js ne ustanovlen!
    echo   Skachayte s sayta: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo   Ustanavlivayu zavisimosti...
    npm install
    if errorlevel 1 (
        echo.
        echo   OSHIBKA pri npm install.
        pause
        exit /b 1
    )
)

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" > nul
    ) else (
        echo JWT_SECRET=teacher-platform-secret-key-2026> .env
        echo PORT=3000>> .env
    )
)

echo [3/3] Zapusk servera...
start "" cmd /c "node server.js > server.log 2>server-error.log"
timeout /t 4 /nobreak > nul

echo.
echo ============================================
echo   Server zapushchen!
echo.
echo   Adres: http://localhost:3000
echo.
echo   Login prepodavatelya:
echo     Email:  warargoutr@gmail.com
echo     Parol:  123456
echo.
echo   NE ZAKRYVAYTE eto okno!
echo   Dlya ostanovki: stop_server.bat
echo ============================================
echo.

start http://localhost:3000

:wait
timeout /t 30 /nobreak > nul
goto wait
