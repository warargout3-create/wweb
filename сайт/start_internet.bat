@echo off
title Obrazovatelnaya platforma - Internet
cd /d "%~dp0"

echo ============================================
echo   Obrazovatelnaya platforma
echo   Zapusk v internet cherez ngrok
echo ============================================
echo.

echo [1/5] Ostanovka staryh processov...
taskkill /F /IM node.exe 2>/dev/null
taskkill /F /IM ngrok.exe 2>/dev/null
timeout /t 2 /nobreak > /dev/null

echo [2/5] Proverka Node.js...
node -v > /dev/null 2>&1
if errorlevel 1 (
    echo.
    echo   OSHIBKA: Node.js ne ustanovlen!
    echo   Skachayte s sayta: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo   OK ^(%%v^)

echo [3/5] Proverka zavisimostey...
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
echo   OK

echo [4/5] Proverka ngrok...
if not exist "ngrok.exe" (
    echo   Skachivayu ngrok dlya Windows...
    curl -L -o ngrok.zip "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    if errorlevel 1 (
        echo.
        echo   OSHIBKA: ne udalos skachat ngrok.
        echo   Proverte internet-soedinenie.
        pause
        exit /b 1
    )
    powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force"
    del ngrok.zip 2>/dev/null
    if not exist "ngrok.exe" (
        echo.
        echo   OSHIBKA: ngrok.exe ne naydeno posle raspakovki.
        pause
        exit /b 1
    )
    echo   ngrok skachan
)
echo   OK

echo [5/5] Nastroyka i zapusk...
ngrok.exe config add-authtoken 3EBXw1OyZ84K3AEFJYZzVzwZ8c8_UqcYPynneFQdAbXEPVsq > /dev/null 2>&1

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" > /dev/null
    ) else (
        echo JWT_SECRET=teacher-platform-secret-key-2026> .env
        echo PORT=3000>> .env
    )
)

echo   Zapusk servera Node.js...
start "" cmd /c "node server.js > server.log 2>server-error.log"
timeout /t 4 /nobreak > /dev/null

echo.
echo ============================================
echo   Server zapushchen!
echo.
echo   Lokalnyy adres: http://localhost:3000
echo.
echo   Login prepodavatelya:
echo     Email:  warargoutr@gmail.com
echo     Parol:  123456
echo.
echo   Zapuskayu ngrok tunnel...
echo   Dozhdites stroki: Forwarding https://...
echo.
echo   Dlya ostanovki: Ctrl+C, zatem stop_server.bat
echo ============================================
echo.

ngrok.exe http 3000

echo.
echo   ngrok ostanovlen.
pause
