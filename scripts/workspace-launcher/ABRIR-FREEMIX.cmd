@echo off
setlocal
chcp 65001 >nul
set "FM_NODE=%~dp0obs-vmix\runtime\node.exe"
if exist "%~dp0node24\node.exe" set "FM_NODE=%~dp0node24\node.exe"
"%FM_NODE%" "%~dp0abrir-freemix-atualizado.mjs" %*
if errorlevel 1 (
  echo.
  echo A abertura foi interrompida para preservar a instalacao. Leia a mensagem acima.
  pause
  exit /b 1
)
exit /b 0
