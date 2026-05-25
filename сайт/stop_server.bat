@echo off
echo Ostanovka servera...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM ngrok.exe 2>nul
echo Server ostanovlen.
pause
