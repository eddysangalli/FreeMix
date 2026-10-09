@echo off
rem ==============================================================================
rem FreeMix Studio — Executavel Oficial com Identidade e Interface Estilo vMix
rem ==============================================================================

setlocal
set "DIR=%~dp0"
set "BIN_DIR=%DIR%bin\64bit"

if not exist "%BIN_DIR%\obs64.exe" (
    set "BIN_DIR=%DIR%..\obs-vmix\bin\64bit"
)

rem 1. Dispara o injetor oficial de titulo broadcast e icone FreeMix em background
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%DIR%ferramentas\set-freemix-title.ps1"

rem 2. Inicia o motor grafico e interface de producao do FreeMix Studio
cd /d "%BIN_DIR%"
start "" "%BIN_DIR%\obs64.exe" --portable --multi --disable-updater --disable-missing-files-check

exit
