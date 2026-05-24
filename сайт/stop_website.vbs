' Образовательная платформа - Остановка сервера
' Двойной клик — и сервер выключен!

Dim objShell
Set objShell = CreateObject("WScript.Shell")

' Останавливаем процессы Node.js
objShell.Run "taskkill /F /IM node.exe", 0, True

WScript.Sleep 1000

MsgBox "✅ Сервер остановлен!", _
       vbInformation + vbOKOnly, "Образовательная платформа"

Set objShell = Nothing
