@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\restaurar-layout.ps1"
pause
