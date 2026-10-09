@echo off
setlocal
chcp 65001 >nul
set "FM_NODE=%~dp0..\..\obs-vmix\runtime\node.exe"
if exist "%~dp0..\..\node24\node.exe" set "FM_NODE=%~dp0..\..\node24\node.exe"
"%FM_NODE%" "%~dp0..\inicializacao\abrir-freemix-atualizado.mjs" --apply-only
if errorlevel 1 (
  echo.
  echo A atualizacao nao foi aplicada. A mesa aberta permanece preservada.
)
pause
