@echo off
rem ==============================================================================
rem FreeMix Studio — Executável Nativo Oficial
rem Inicia a aplicação própria FreeMix.exe compilada a partir do projeto
rem ==============================================================================

setlocal
set "DIR=%~dp0"
set "BIN_DIR=%DIR%..\obs-vmix\bin\64bit"

if not exist "%BIN_DIR%\FreeMix.exe" (
    set "BIN_DIR=%DIR%bin\64bit"
)

if not exist "%BIN_DIR%\FreeMix.exe" (
    echo ERRO: Executavel FreeMix.exe nao encontrado em %BIN_DIR%.
    echo Compile o projeto antes de executar.
    pause
    exit /b 1
)

cd /d "%BIN_DIR%"
start "" "%BIN_DIR%\FreeMix.exe"

exit /b 0
