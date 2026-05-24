' Образовательная платформа - Скрытый запуск сервера
' Этот скрипт запускает сервер без отображения окна терминала

Dim objShell, objFSO, strPath
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Получаем путь к папке, где лежит этот скрипт
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Останавливаем старые процессы Node.js (чтобы не было ошибки EADDRINUSE)
objShell.Run "cmd /c taskkill /F /IM node.exe >nul 2>&1", 0, True
WScript.Sleep 1500

' Запускаем сервер скрыто (0 = скрытое окно)
objShell.Run "cmd /c cd /d """ & strPath & """ && node server.js", 0, False

' Создаём уведомление
Set objShell = Nothing
Set objFSO = Nothing
