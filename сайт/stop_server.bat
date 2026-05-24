@echo off
echo Остановка сервера образовательной платформы...
taskkill /F /IM node.exe 2>nul
echo Сервер остановлен.
pause
