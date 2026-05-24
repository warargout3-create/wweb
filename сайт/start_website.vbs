' Образовательная платформа - Запуск сервера
' Двойной клик — и сайт работает!

Dim objShell, objFSO, strPath
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Останавливаем старые процессы Node.js (чтобы не было ошибки EADDRINUSE)
objShell.Run "cmd /c taskkill /F /IM node.exe >nul 2>&1", 0, True
WScript.Sleep 1500

' Запускаем сервер скрыто
objShell.Run "cmd /c cd /d """ & strPath & """ && node server.js", 0, False

' Ждём загрузки
WScript.Sleep 4000

' Открываем браузер
objShell.Run "http://localhost:3000"

' Показываем окно с адресом
MsgBox "✅ Сайт запущен!" & vbCrLf & vbCrLf & _
       "Откройте в браузере:" & vbCrLf & _
       "http://localhost:3000" & vbCrLf & vbCrLf & _
       "Чтобы остановить сервер:" & vbCrLf & _
       "запустите stop_website.vbs", _
       vbInformation + vbOKOnly, "Образовательная платформа"

Set objShell = Nothing
Set objFSO = Nothing
