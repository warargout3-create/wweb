@echo off
echo Ostanovka servera...
taskkill /F /IM node.exe 2>/dev/null
taskkill /F /IM ngrok.exe 2>/dev/null
echo Server ostanovlen.
pause
