@echo off
setlocal
chcp 65001 >nul
echo Isto desfaz a ULTIMA atualizacao aplicada na mesa do FreeMix e volta para a versao anterior.
echo Feche a janela do FreeMix antes de continuar. Configuracoes, gravacoes e projetos nao sao alterados.
echo.
choice /C SN /M "Desfazer a ultima atualizacao agora"
if errorlevel 2 exit /b 0
set "FM_NODE=%~dp0obs-vmix\runtime\node.exe"
if exist "%~dp0node24\node.exe" set "FM_NODE=%~dp0node24\node.exe"
"%FM_NODE%" "%~dp0scripts\inicializacao\desfazer-ultima-atualizacao.mjs"
echo.
pause
